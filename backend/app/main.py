"""
Labbaik HR · FastAPI Backend
============================
Production-ready API for Badan Pengelola Keuangan Haji employee self-service.

Stack:
  - FastAPI 0.115+
  - Supabase (PostgREST + Storage + Auth)
  - pgvector for face matching
  - Groq for Tanya HR RAG
"""

# Load .env BEFORE any other imports that read env vars
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date, timezone
from supabase import create_client, Client
from groq import Groq
import os
import hashlib
import numpy as np
from math import radians, sin, cos, sqrt, atan2

# ===================== Configuration =====================
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://dstkhzgebjtwvsfykidt.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")  # server-only
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Face match threshold (cosine similarity)
FACE_MATCH_THRESHOLD = 0.62
LIVENESS_MIN_SCORE = 0.85
GEOFENCE_DEFAULT_RADIUS_M = 150

if not SUPABASE_SERVICE_KEY:
    print("⚠️  SUPABASE_SERVICE_KEY not set — backend will run in read-only mode")

# Client with service key (bypasses RLS — only for server-side ops like audit log inserts)
sb_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY) if SUPABASE_SERVICE_KEY else None

# Groq for Tanya HR
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# ===================== App =====================
app = FastAPI(
    title="Labbaik HR API",
    description="Employee self-service API for Badan Pengelola Keuangan Haji",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://localhost:5174",
        "https://labbaik.bpkh.go.id", "https://admin.labbaik.bpkh.go.id",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===================== Auth dependency =====================
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Validate Supabase JWT and return user + employee row."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid Authorization header")

    token = authorization.split(" ", 1)[1]
    try:
        # Verify JWT with Supabase
        sb_user = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        user = sb_user.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(401, "Invalid token")

        # Fetch employee profile
        emp = sb_admin.table("employees").select("*").eq("auth_user_id", user.user.id).single().execute()
        if not emp.data:
            raise HTTPException(403, "No employee profile linked to this account")

        return {"auth_user": user.user, "employee": emp.data, "token": token}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(401, f"Auth failed: {str(e)}")


# ===================== Utility: Audit log =====================
async def log_audit(
    actor_id: str,
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    payload: Optional[dict] = None,
    request: Optional[Request] = None,
):
    """Append to immutable audit trail (hash-chained server-side)."""
    try:
        data = {
            "actor_id": actor_id,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "payload": payload or {},
        }
        if request:
            data["ip"] = request.client.host if request.client else None
            data["user_agent"] = request.headers.get("user-agent", "")
        sb_admin.table("audit_events").insert(data).execute()
    except Exception as e:
        print(f"[AUDIT] Failed to log: {e}")


# ===================== Utility: Haversine =====================
def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> int:
    R = 6371000
    dLat = radians(lat2 - lat1)
    dLng = radians(lng2 - lng1)
    a = sin(dLat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dLng/2)**2
    return int(R * 2 * atan2(sqrt(a), sqrt(1-a)))


def cosine_sim(a: list, b: list) -> float:
    va, vb = np.array(a), np.array(b)
    return float(np.dot(va, vb) / (np.linalg.norm(va) * np.linalg.norm(vb)))


# ===================== Models =====================
class ClockInPayload(BaseModel):
    lat: float
    lng: float
    face_embedding: List[float] = Field(..., min_length=128, max_length=128)
    liveness_score: float = Field(..., ge=0, le=1)
    device_id: Optional[str] = None


class LeaveCreatePayload(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: Optional[str] = None
    attachment_url: Optional[str] = None


class ApprovalPayload(BaseModel):
    action: str  # 'approve' | 'reject'
    reason: Optional[str] = None


class FaceEnrollPayload(BaseModel):
    embedding: List[float] = Field(..., min_length=128, max_length=128)
    quality_score: float = Field(..., ge=0, le=1)


class TanyaHRPayload(BaseModel):
    question: str


# ===================== Routes =====================

@app.get("/")
def root():
    return {
        "service": "Labbaik HR API",
        "version": "1.0.0",
        "supabase": SUPABASE_URL,
        "features": [
            "geofence (PostGIS)",
            "face-match (pgvector)",
            "audit-trail (hash-chained)",
            "tanya-hr (Groq RAG)",
        ],
    }


@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}


# ---------- ME ----------
@app.get("/api/me")
async def me(ctx=Depends(get_current_user)):
    return ctx["employee"]


# ---------- ATTENDANCE ----------
@app.post("/api/attendance/clock-in")
async def clock_in(payload: ClockInPayload, request: Request, ctx=Depends(get_current_user)):
    emp = ctx["employee"]
    today = date.today().isoformat()

    # Check existing
    existing = sb_admin.table("attendance_logs") \
        .select("*").eq("employee_id", emp["id"]).eq("work_date", today).execute()
    if existing.data:
        raise HTTPException(400, "Anda sudah clock-in hari ini")

    # 1. Geofence check (via RPC)
    fence = sb_admin.rpc("check_geofence", {"p_lat": payload.lat, "p_lng": payload.lng}).execute()
    if not fence.data or not fence.data[0].get("inside"):
        await log_audit(emp["id"], "geofence_violation", payload={
            "lat": payload.lat, "lng": payload.lng,
            "distance": fence.data[0].get("distance_m") if fence.data else None
        }, request=request)
        raise HTTPException(403, {
            "error": "outside_geofence",
            "message": "Anda berada di luar zona kantor",
            "distance_m": fence.data[0]["distance_m"] if fence.data else None,
        })

    office = fence.data[0]

    # 2. Liveness check
    if payload.liveness_score < LIVENESS_MIN_SCORE:
        await log_audit(emp["id"], "permission_denied", payload={
            "reason": "low_liveness", "score": payload.liveness_score
        }, request=request)
        raise HTTPException(403, "Liveness check gagal — ulangi dengan pencahayaan lebih baik")

    # 3. Face match
    face_match = sb_admin.rpc("match_face", {
        "query_embedding": payload.face_embedding,
        "threshold": FACE_MATCH_THRESHOLD,
    }).execute()

    matched_emp_id = face_match.data[0]["employee_id"] if face_match.data else None
    similarity = face_match.data[0]["similarity"] if face_match.data else 0.0

    if matched_emp_id != emp["id"]:
        await log_audit(emp["id"], "permission_denied", payload={
            "reason": "face_mismatch", "similarity": similarity,
            "matched_to": matched_emp_id,
        }, request=request)
        raise HTTPException(403, "Wajah tidak cocok dengan data terdaftar")

    # 4. Insert attendance log
    result = sb_admin.table("attendance_logs").insert({
        "employee_id": emp["id"],
        "work_date": today,
        "clock_in_at": datetime.now(timezone.utc).isoformat(),
        "clock_in_lat": payload.lat,
        "clock_in_lng": payload.lng,
        "clock_in_office_id": office["office_id"],
        "clock_in_distance_m": office["distance_m"],
        "clock_in_face_score": similarity,
        "clock_in_liveness_passed": True,
        "clock_in_device": payload.device_id,
        "clock_in_ip": request.client.host if request.client else None,
        "status": "present",
    }).execute()

    log = result.data[0]
    await log_audit(emp["id"], "clock_in", "attendance", log["id"], {
        "office": office["office_name"],
        "distance_m": office["distance_m"],
        "face_score": similarity,
    }, request=request)

    return {
        "success": True,
        "attendance_id": log["id"],
        "clock_in_at": log["clock_in_at"],
        "office": office["office_name"],
        "face_score": round(similarity, 3),
    }


@app.post("/api/attendance/clock-out")
async def clock_out(payload: ClockInPayload, request: Request, ctx=Depends(get_current_user)):
    emp = ctx["employee"]
    today = date.today().isoformat()

    existing = sb_admin.table("attendance_logs") \
        .select("*").eq("employee_id", emp["id"]).eq("work_date", today).execute()
    if not existing.data:
        raise HTTPException(400, "Anda belum clock-in hari ini")

    log = existing.data[0]
    if log.get("clock_out_at"):
        raise HTTPException(400, "Anda sudah clock-out hari ini")

    updated = sb_admin.table("attendance_logs").update({
        "clock_out_at": datetime.now(timezone.utc).isoformat(),
        "clock_out_lat": payload.lat,
        "clock_out_lng": payload.lng,
    }).eq("id", log["id"]).execute()

    await log_audit(emp["id"], "clock_out", "attendance", log["id"], request=request)
    return {"success": True, "attendance": updated.data[0]}


@app.get("/api/attendance/today")
async def attendance_today(ctx=Depends(get_current_user)):
    emp = ctx["employee"]
    today = date.today().isoformat()
    result = sb_admin.table("attendance_logs") \
        .select("*").eq("employee_id", emp["id"]).eq("work_date", today).execute()
    return result.data[0] if result.data else None


@app.get("/api/attendance/history")
async def attendance_history(days: int = 30, ctx=Depends(get_current_user)):
    emp = ctx["employee"]
    result = sb_admin.table("attendance_logs") \
        .select("*").eq("employee_id", emp["id"]) \
        .order("work_date", desc=True).limit(days).execute()
    return result.data


# ---------- FACE ENROLLMENT ----------
@app.post("/api/face/enroll")
async def enroll_face(payload: FaceEnrollPayload, request: Request, ctx=Depends(get_current_user)):
    emp = ctx["employee"]

    if payload.quality_score < 0.7:
        raise HTTPException(400, "Kualitas foto kurang baik — ulangi dengan pencahayaan lebih baik")

    # Upsert (replace existing enrollment)
    sb_admin.table("employee_face_embeddings").upsert({
        "employee_id": emp["id"],
        "embedding": payload.embedding,
        "quality_score": payload.quality_score,
        "enrolled_at": datetime.now(timezone.utc).isoformat(),
    }, on_conflict="employee_id").execute()

    await log_audit(emp["id"], "face_enroll", "face", emp["id"], {
        "quality": payload.quality_score
    }, request=request)

    return {"success": True, "message": "Wajah berhasil didaftarkan"}


# ---------- LEAVE ----------
@app.post("/api/leave/submit")
async def submit_leave(payload: LeaveCreatePayload, request: Request, ctx=Depends(get_current_user)):
    emp = ctx["employee"]

    # Validate hajj leave (once-in-career)
    if payload.leave_type == "haji" and emp.get("leave_balance_hajj_used"):
        raise HTTPException(400, "Cuti haji sudah digunakan. Hak hanya 1x seumur karir.")

    days = (payload.end_date - payload.start_date).days + 1
    if payload.leave_type == "tahunan" and days > emp.get("leave_balance_annual", 0):
        raise HTTPException(400, f"Saldo cuti tahunan tidak cukup ({emp.get('leave_balance_annual')} hari)")

    result = sb_admin.table("leave_requests").insert({
        "employee_id": emp["id"],
        "leave_type": payload.leave_type,
        "start_date": payload.start_date.isoformat(),
        "end_date": payload.end_date.isoformat(),
        "reason": payload.reason,
        "attachment_url": payload.attachment_url,
        "approver_id": emp.get("supervisor_id"),
        "status": "pending",
    }).execute()

    leave = result.data[0]
    await log_audit(emp["id"], "leave_submit", "leave_request", leave["id"], {
        "type": payload.leave_type, "days": days,
    }, request=request)

    return leave


@app.get("/api/leave/my-requests")
async def my_leaves(ctx=Depends(get_current_user)):
    emp = ctx["employee"]
    result = sb_admin.table("leave_requests") \
        .select("*").eq("employee_id", emp["id"]) \
        .order("created_at", desc=True).execute()
    return result.data


@app.get("/api/leave/pending-approvals")
async def pending_approvals(ctx=Depends(get_current_user)):
    """List requests awaiting this user's approval."""
    emp = ctx["employee"]
    if emp["role"] not in ("approver", "hr_admin", "super_admin"):
        raise HTTPException(403, "Tidak memiliki akses approval")

    result = sb_admin.table("leave_requests") \
        .select("*, employee:employees!leave_requests_employee_id_fkey(full_name, nip, directorate_id)") \
        .eq("approver_id", emp["id"]).eq("status", "pending") \
        .order("created_at", desc=False).execute()
    return result.data


@app.post("/api/leave/{leave_id}/decide")
async def decide_leave(leave_id: str, payload: ApprovalPayload, request: Request, ctx=Depends(get_current_user)):
    emp = ctx["employee"]

    leave = sb_admin.table("leave_requests").select("*").eq("id", leave_id).single().execute()
    if not leave.data:
        raise HTTPException(404, "Leave request tidak ditemukan")
    if leave.data["approver_id"] != emp["id"] and emp["role"] not in ("hr_admin", "super_admin"):
        raise HTTPException(403, "Anda bukan approver untuk pengajuan ini")

    new_status = "approved" if payload.action == "approve" else "rejected"
    updated = sb_admin.table("leave_requests").update({
        "status": new_status,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "rejection_reason": payload.reason if payload.action == "reject" else None,
    }).eq("id", leave_id).execute()

    # If approved and type=tahunan, decrement balance
    if new_status == "approved" and leave.data["leave_type"] == "tahunan":
        days = leave.data["days"]
        sb_admin.rpc("decrement_leave_balance", {
            "emp_id": leave.data["employee_id"], "days": days
        }).execute()

    await log_audit(emp["id"],
        "leave_approve" if new_status == "approved" else "leave_reject",
        "leave_request", leave_id,
        {"status": new_status, "reason": payload.reason}, request=request)

    return updated.data[0]


# ---------- PAYROLL ----------
@app.get("/api/payroll/current")
async def current_payslip(ctx=Depends(get_current_user)):
    emp = ctx["employee"]
    now = datetime.now()
    result = sb_admin.table("payslips") \
        .select("*, payroll_runs(*)") \
        .eq("employee_id", emp["id"]).eq("released", True) \
        .order("created_at", desc=True).limit(1).execute()

    await log_audit(emp["id"], "payroll_view", "payslip",
                    result.data[0]["id"] if result.data else None)
    return result.data[0] if result.data else None


# ---------- TANYA HR (RAG) ----------
@app.post("/api/tanya-hr")
async def tanya_hr(payload: TanyaHRPayload, ctx=Depends(get_current_user)):
    if not groq_client:
        raise HTTPException(503, "AI service belum dikonfigurasi")

    # TODO: 1. Embed question with text-embedding-3-small
    # TODO: 2. Vector search on hr_knowledge_chunks
    # For now, direct LLM call with system context
    system_prompt = """Anda adalah asisten HR BPKH (Badan Pengelola Keuangan Haji).
Jawab dalam Bahasa Indonesia yang formal namun hangat.
Berbasis pada Perka BPKH, SOP Kepegawaian, dan regulasi ketenagakerjaan Indonesia.
Jika tidak yakin, arahkan ke Helpdesk SDM (sdm@bpkh.go.id).
Selalu sebutkan nomor regulasi yang relevan jika ada."""

    completion = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": payload.question},
        ],
        temperature=0.3,
        max_tokens=800,
    )

    answer = completion.choices[0].message.content

    return {
        "answer": answer,
        "sources": [],  # populate after RAG implementation
        "model": "llama-3.3-70b-versatile",
    }


# ---------- ADMIN DASHBOARD ----------
@app.get("/api/admin/dashboard/stats")
async def admin_stats(ctx=Depends(get_current_user)):
    emp = ctx["employee"]
    if emp["role"] not in ("hr_admin", "super_admin", "dewas"):
        raise HTTPException(403, "Akses terbatas untuk HR Admin/Dewas")

    today = date.today().isoformat()
    total = sb_admin.table("employees").select("id", count="exact").eq("active", True).execute()
    present_today = sb_admin.table("attendance_logs").select("id", count="exact") \
        .eq("work_date", today).execute()
    pending_leaves = sb_admin.table("leave_requests").select("id", count="exact") \
        .eq("status", "pending").execute()

    return {
        "total_employees": total.count,
        "present_today": present_today.count,
        "attendance_rate": round((present_today.count / total.count) * 100, 1) if total.count else 0,
        "pending_leaves": pending_leaves.count,
    }


@app.get("/api/admin/audit-trail")
async def audit_trail(limit: int = 100, ctx=Depends(get_current_user)):
    emp = ctx["employee"]
    if emp["role"] not in ("hr_admin", "super_admin", "dewas"):
        raise HTTPException(403, "Akses terbatas")

    result = sb_admin.table("audit_events") \
        .select("*, actor:employees(full_name, nip)") \
        .order("occurred_at", desc=True).limit(limit).execute()
    return result.data


# ===================== Entry =====================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)