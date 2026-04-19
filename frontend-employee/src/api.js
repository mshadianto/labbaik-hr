/**
 * api.js — Thin wrapper around Supabase + FastAPI backend.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

/** Get current JWT token for backend calls. */
async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token;
}

async function apiCall(path, options = {}) {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail));
  }
  return res.json();
}

// ========== Auth ==========
export const auth = {
  signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
  getUser: () => supabase.auth.getUser(),
  onAuthChange: (cb) => supabase.auth.onAuthStateChange(cb),
};

// ========== Me ==========
export const me = {
  get: () => apiCall("/api/me"),
};

// ========== Attendance ==========
export const attendance = {
  clockIn: (data) => apiCall("/api/attendance/clock-in", {
    method: "POST", body: JSON.stringify(data),
  }),
  clockOut: (data) => apiCall("/api/attendance/clock-out", {
    method: "POST", body: JSON.stringify(data),
  }),
  today: () => apiCall("/api/attendance/today"),
  history: (days = 30) => apiCall(`/api/attendance/history?days=${days}`),
};

// ========== Face ==========
export const face = {
  enroll: (embedding, quality_score) => apiCall("/api/face/enroll", {
    method: "POST", body: JSON.stringify({ embedding, quality_score }),
  }),
};

// ========== Leave ==========
export const leave = {
  submit: (data) => apiCall("/api/leave/submit", {
    method: "POST", body: JSON.stringify(data),
  }),
  myRequests: () => apiCall("/api/leave/my-requests"),
  pendingApprovals: () => apiCall("/api/leave/pending-approvals"),
  decide: (id, action, reason) => apiCall(`/api/leave/${id}/decide`, {
    method: "POST", body: JSON.stringify({ action, reason }),
  }),
};

// ========== Payroll ==========
export const payroll = {
  current: () => apiCall("/api/payroll/current"),
};

// ========== Tanya HR ==========
export const tanyaHR = {
  ask: (question) => apiCall("/api/tanya-hr", {
    method: "POST", body: JSON.stringify({ question }),
  }),
};

// ========== Admin ==========
export const admin = {
  dashboardStats: () => apiCall("/api/admin/dashboard/stats"),
  auditTrail: (limit = 100) => apiCall(`/api/admin/audit-trail?limit=${limit}`),
};

// ========== Geolocation helper ==========
export function getPosition(options = { enableHighAccuracy: true, timeout: 10000 }) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation unsupported"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => reject(err),
      options,
    );
  });
}
