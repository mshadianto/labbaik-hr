/**
 * AdminDashboard.jsx — Labbaik HR · HR/Approver Console
 * Full-featured web dashboard: stats, approvals queue, audit trail, employee management.
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Fingerprint, Calendar, Wallet, Users, Shield,
  FileText, Bell, Search, Check, X, ChevronDown, Download,
  TrendingUp, AlertCircle, Clock, Filter, ChevronRight,
} from "lucide-react";
import { admin, leave, auth } from "./api";

const theme = {
  bg: "#F7F5EE", surface: "#FFFFFF", ink: "#0A2A23", inkSoft: "#3D5A50",
  primary: "#0F6E56", primaryDeep: "#085041", accent: "#C9A85C",
  accentSoft: "#F5EBD3", border: "rgba(10,42,35,0.10)",
  danger: "#B84141", warning: "#C68B2A",
};

// ============================================================
// MAIN
// ============================================================
export default function AdminDashboard() {
  const [section, setSection] = useState("dashboard");
  const [me, setMe] = useState(null);

  useEffect(() => {
    // In production, fetch /api/me
    setMe({
      full_name: "M. Sopian Hadianto",
      role: "hr_admin",
      position_title: "Anggota Komite Audit",
      initials: "MSH",
    });
  }, []);

  return (
    <div style={{
      minHeight: "100vh", background: theme.bg,
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      color: theme.ink,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        button { font-family: inherit; }
        input:focus { outline: 2px solid ${theme.primary}40; }
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
        <Sidebar section={section} setSection={setSection}/>
        <Main section={section} me={me}/>
      </div>
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================
function Sidebar({ section, setSection }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "attendance", label: "Absensi", icon: Fingerprint },
    { id: "approvals", label: "Approval Queue", icon: Check, badge: 5 },
    { id: "leaves", label: "Cuti & Izin", icon: Calendar },
    { id: "payroll", label: "Payroll", icon: Wallet },
    { id: "employees", label: "Karyawan", icon: Users },
    { id: "audit", label: "Audit Trail", icon: Shield, accent: true },
    { id: "reports", label: "Laporan", icon: FileText },
  ];

  return (
    <aside style={{
      background: "#04342C", color: "white", padding: "24px 0",
      position: "sticky", top: 0, height: "100vh",
    }}>
      <div style={{ padding: "0 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 4,
        }}>
          <svg width="28" height="28" viewBox="0 0 40 40">
            <g fill="none" stroke={theme.accent} strokeWidth="1.2">
              <circle cx="20" cy="20" r="17"/>
              <path d="M20 3 L22 20 L20 37 L18 20 Z"/>
              <path d="M3 20 L20 18 L37 20 L20 22 Z"/>
              <path d="M8 8 L20 20 L32 32 M8 32 L20 20 L32 8"/>
            </g>
          </svg>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, fontFamily: "'Fraunces', serif" }}>Labbaik HR</div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>BPKH · Admin Console</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: "16px 12px" }}>
        {items.map(it => {
          const Icon = it.icon;
          const active = section === it.id;
          return (
            <button key={it.id} onClick={() => setSection(it.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "10px 14px", marginBottom: 4, borderRadius: 10,
              background: active ? "rgba(15,110,86,0.8)" : "transparent",
              color: active ? "white" : "rgba(255,255,255,0.75)",
              border: "none", cursor: "pointer", textAlign: "left",
              fontSize: 13, fontWeight: active ? 500 : 400,
              borderLeft: active ? `2px solid ${theme.accent}` : "2px solid transparent",
            }}>
              <Icon size={16}/>
              <span style={{ flex: 1 }}>{it.label}</span>
              {it.badge && (
                <span style={{
                  background: theme.accent, color: theme.primaryDeep,
                  fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 10,
                }}>{it.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{
        position: "absolute", bottom: 20, left: 20, right: 20,
        padding: 12, background: "rgba(201,168,92,0.1)",
        border: `1px solid rgba(201,168,92,0.3)`, borderRadius: 10,
        fontSize: 10, color: "rgba(255,255,255,0.8)", lineHeight: 1.5,
      }}>
        <div style={{ fontWeight: 500, color: theme.accent, marginBottom: 4 }}>⚘ GRC Compliant</div>
        ISO 27001 audit trail aktif · hash-chained append-only
      </div>
    </aside>
  );
}

// ============================================================
// MAIN CONTENT ROUTER
// ============================================================
function Main({ section, me }) {
  return (
    <main>
      <TopBar me={me} section={section}/>
      <div style={{ padding: "20px 28px 40px" }}>
        {section === "dashboard" && <DashboardView/>}
        {section === "approvals" && <ApprovalsView/>}
        {section === "attendance" && <AttendanceView/>}
        {section === "audit" && <AuditTrailView/>}
        {section === "employees" && <EmployeesView/>}
        {section === "leaves" && <LeavesView/>}
        {section === "payroll" && <PayrollView/>}
        {section === "reports" && <ReportsView/>}
      </div>
    </main>
  );
}

function TopBar({ me, section }) {
  const titles = {
    dashboard: "Dashboard", approvals: "Approval Queue", attendance: "Absensi",
    audit: "Audit Trail", employees: "Karyawan", leaves: "Cuti & Izin",
    payroll: "Payroll", reports: "Laporan",
  };
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 28px", background: theme.surface,
      borderBottom: `1px solid ${theme.border}`, position: "sticky", top: 0, zIndex: 10,
    }}>
      <div>
        <h1 style={{
          margin: 0, fontSize: 20, fontFamily: "'Fraunces', serif", fontWeight: 500,
        }}>{titles[section] || section}</h1>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: theme.inkSoft }}>
          {today} · 30 Syawwal 1447 H
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: theme.bg, padding: "8px 14px", borderRadius: 10,
          border: `1px solid ${theme.border}`, minWidth: 280,
        }}>
          <Search size={14} style={{ color: theme.inkSoft }}/>
          <input placeholder="Cari pegawai, pengajuan…" style={{
            border: "none", background: "transparent", fontSize: 13, flex: 1, color: theme.ink,
          }}/>
        </div>
        <button style={{
          width: 36, height: 36, borderRadius: 10, border: `1px solid ${theme.border}`,
          background: theme.surface, cursor: "pointer", position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Bell size={16} style={{ color: theme.ink }}/>
          <span style={{
            position: "absolute", top: 4, right: 4, width: 7, height: 7,
            background: theme.accent, borderRadius: "50%",
          }}/>
        </button>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 12px 6px 6px", background: theme.bg, borderRadius: 20,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%", background: theme.primary, color: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 500,
          }}>{me?.initials || "?"}</div>
          <div style={{ fontSize: 12 }}>
            <div style={{ fontWeight: 500 }}>{me?.full_name?.split(" ").slice(0, 2).join(" ")}</div>
            <div style={{ fontSize: 10, color: theme.inkSoft }}>{me?.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD VIEW
// ============================================================
function DashboardView() {
  const [stats] = useState({
    total_employees: 247, present_today: 218,
    attendance_rate: 88.3, pending_leaves: 24,
  });

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Pegawai" value={stats.total_employees} icon={<Users size={14}/>} trend="+3 bulan ini"/>
        <StatCard label="Hadir Hari Ini" value={`${stats.present_today} / ${stats.total_employees}`} icon={<Fingerprint size={14}/>} trend={`${stats.attendance_rate}% kehadiran`} trendColor={theme.primary}/>
        <StatCard label="Approval Pending" value={stats.pending_leaves} icon={<Clock size={14}/>} trend="12 cuti · 8 reimburse · 4 lembur" trendColor={theme.warning}/>
        <StatCard label="Payroll April" value="Rp 4.82 M" icon={<Wallet size={14}/>} trend="Draft · cut-off 25 Apr" trendColor="#185FA5"/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, marginBottom: 20 }}>
        <AttendanceChart/>
        <ActivityFeed/>
      </div>

      <ApprovalsTable embedded/>
    </>
  );
}

function StatCard({ label, value, icon, trend, trendColor = theme.inkSoft }) {
  return (
    <div style={{
      background: theme.surface, padding: 16, borderRadius: 14,
      border: `1px solid ${theme.border}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: theme.inkSoft, letterSpacing: 0.5 }}>{label.toUpperCase()}</span>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "rgba(15,110,86,0.08)", color: theme.primary,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{icon}</div>
      </div>
      <div style={{
        fontSize: 24, fontWeight: 500, color: theme.ink,
        fontFamily: "'Fraunces', serif", marginBottom: 4,
      }}>{value}</div>
      <div style={{ fontSize: 10, color: trendColor }}>{trend}</div>
    </div>
  );
}

function AttendanceChart() {
  const data = [
    { day: "Sen", hadir: 80, telat: 14, absen: 6 },
    { day: "Sel", hadir: 86, telat: 10, absen: 4 },
    { day: "Rab", hadir: 89, telat: 8,  absen: 3 },
    { day: "Kam", hadir: 83, telat: 12, absen: 5 },
    { day: "Jum", hadir: 75, telat: 18, absen: 7 },
    { day: "Sab", off: true },
    { day: "Min", off: true },
  ];
  return (
    <div style={{
      background: theme.surface, padding: 18, borderRadius: 14, border: `1px solid ${theme.border}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Tren Kehadiran</div>
          <div style={{ fontSize: 11, color: theme.inkSoft }}>7 hari terakhir · semua direktorat</div>
        </div>
        <div style={{ display: "flex", gap: 10, fontSize: 10 }}>
          {[
            { color: theme.primary, label: "Hadir" },
            { color: theme.warning, label: "Telat" },
            { color: theme.danger, label: "Absen" },
          ].map(l => (
            <span key={l.label} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }}/>{l.label}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 160, padding: "0 8px" }}>
        {data.map(d => (
          <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 2, height: 140, justifyContent: "flex-end" }}>
              {d.off ? (
                <div style={{ background: "#D3D1C7", height: "100%", borderRadius: 3 }}/>
              ) : (
                <>
                  <div style={{ background: theme.danger, height: `${d.absen}%`, borderRadius: "3px 3px 0 0" }}/>
                  <div style={{ background: theme.warning, height: `${d.telat}%` }}/>
                  <div style={{ background: theme.primary, height: `${d.hadir}%`, borderRadius: "0 0 3px 3px" }}/>
                </>
              )}
            </div>
            <span style={{ fontSize: 10, color: theme.inkSoft }}>{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityFeed() {
  const items = [
    { dot: theme.primary, name: "Rahma Aulia", text: "clock-in via face recognition", meta: "Muamalat Tower · 2m lalu" },
    { dot: "#534AB7", name: "Budi Santoso", text: "ajukan cuti 3 hari", meta: "Dir. Investasi · 8m lalu" },
    { dot: "#185FA5", name: "Siti Nurhaliza", text: "upload bukti reimburse", meta: "Rp 1.2 jt · 15m lalu" },
    { dot: theme.warning, name: "Dewas BPKH", text: "approve memo Q1", meta: "22m lalu" },
    { dot: theme.primary, name: "Ahmad Fauzi", text: "clock-in Muamalat Tower", meta: "45m lalu" },
  ];
  return (
    <div style={{
      background: theme.surface, padding: 18, borderRadius: 14, border: `1px solid ${theme.border}`,
    }}>
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Aktivitas Langsung</div>
      <div style={{ fontSize: 11, color: theme.inkSoft, marginBottom: 14 }}>Real-time feed · audit trail</div>
      {items.map((it, i) => (
        <div key={i} style={{
          display: "flex", gap: 10, paddingBottom: 12, marginBottom: 12,
          borderBottom: i < items.length - 1 ? `1px solid ${theme.border}` : "none",
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: it.dot, marginTop: 5, flexShrink: 0 }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12 }}>
              <b style={{ fontWeight: 500 }}>{it.name}</b> {it.text}
            </div>
            <div style={{ fontSize: 10, color: theme.inkSoft, marginTop: 2 }}>{it.meta}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// APPROVALS (full view + embedded)
// ============================================================
function ApprovalsView() {
  return <ApprovalsTable/>;
}

function ApprovalsTable({ embedded = false }) {
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState([
    { id: 1, name: "Ahmad Fauzi", dir: "Dir. Keuangan", type: "Cuti tahunan", period: "20–22 Apr 2026", days: 3, typeColor: "#EEEDFE", typeText: "#3C3489" },
    { id: 2, name: "Dewi Kartika", dir: "Dir. Investasi · KSA", type: "Reimburse dinas", period: "Rp 2.450.000", days: "-", typeColor: "#FAEEDA", typeText: "#854F0B" },
    { id: 3, name: "Rizky Pratama", dir: "IT & Sistem", type: "Lembur", period: "17 Apr · 4 jam", days: "-", typeColor: "#FAECE7", typeText: "#993C1D" },
    { id: 4, name: "Nurul Fitri", dir: "Satuan Audit Internal", type: "Dinas luar", period: "Jeddah · 5 hari", days: 5, typeColor: "#FBEAF0", typeText: "#72243E" },
    { id: 5, name: "Hendra Gunawan", dir: "Dir. Operasional Haji", type: "Cuti umrah", period: "1–14 Mei 2026", days: 14, typeColor: "#F5EBD3", typeText: "#6F5016" },
  ]);

  const decide = (id, action) => {
    setItems(x => x.filter(i => i.id !== id));
    // In production: await leave.decide(id, action)
  };

  return (
    <div style={{
      background: theme.surface, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Pengajuan menunggu persetujuan</div>
          <div style={{ fontSize: 11, color: theme.inkSoft }}>{items.length} item butuh tindakan Anda</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "cuti", "reimburse", "lembur", "dinas"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: filter === f ? theme.primary : theme.bg,
              color: filter === f ? "white" : theme.inkSoft,
              fontSize: 11, textTransform: "capitalize",
            }}>{f}</button>
          ))}
        </div>
      </div>

      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.inkSoft, fontWeight: 500, fontSize: 11, textAlign: "left" }}>
            <th style={{ padding: "10px 8px" }}>Karyawan</th>
            <th style={{ padding: "10px 8px" }}>Jenis</th>
            <th style={{ padding: "10px 8px" }}>Periode / Nilai</th>
            <th style={{ padding: "10px 8px" }}>Status</th>
            <th style={{ padding: "10px 8px", textAlign: "right" }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
              <td style={{ padding: "12px 8px" }}>
                <div style={{ fontWeight: 500 }}>{it.name}</div>
                <div style={{ fontSize: 10, color: theme.inkSoft }}>{it.dir}</div>
              </td>
              <td style={{ padding: "12px 8px" }}>
                <span style={{
                  background: it.typeColor, color: it.typeText,
                  padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 500,
                }}>{it.type}</span>
              </td>
              <td style={{ padding: "12px 8px", color: theme.ink }}>{it.period}</td>
              <td style={{ padding: "12px 8px" }}>
                <span style={{
                  background: "#FAEEDA", color: "#854F0B",
                  padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 500,
                }}>⏱ Pending</span>
              </td>
              <td style={{ padding: "12px 8px", textAlign: "right" }}>
                <button onClick={() => decide(it.id, "approve")} style={{
                  background: theme.primary, color: "white", border: "none",
                  padding: "6px 12px", borderRadius: 8, fontSize: 11, cursor: "pointer", marginRight: 6,
                }}><Check size={11} style={{ verticalAlign: "text-top", marginRight: 2 }}/>Setuju</button>
                <button onClick={() => decide(it.id, "reject")} style={{
                  background: "rgba(184,65,65,0.1)", color: theme.danger, border: "none",
                  padding: "6px 12px", borderRadius: 8, fontSize: 11, cursor: "pointer",
                }}><X size={11} style={{ verticalAlign: "text-top", marginRight: 2 }}/>Tolak</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// AUDIT TRAIL
// ============================================================
function AuditTrailView() {
  const events = [
    { time: "09:42:15", actor: "Rahma Aulia", action: "clock_in", target: "attendance", meta: "Muamalat Tower · face_score 0.94", hash: "a3f7...c2d1" },
    { time: "09:38:02", actor: "Budi Santoso", action: "leave_submit", target: "CUTI-2026-0047", meta: "Tahunan · 3 hari", hash: "b2e8...f901" },
    { time: "09:22:41", actor: "M. Sopian Hadianto", action: "leave_approve", target: "CUTI-2026-0045", meta: "approved", hash: "c1d9...0a2b" },
    { time: "08:15:33", actor: "Sistem", action: "permission_denied", target: "—", meta: "face_mismatch · similarity 0.42", hash: "d0ca...3e4f" },
    { time: "08:02:11", actor: "Dewi Kartika", action: "data_export", target: "payroll_april", meta: "CSV · 12 records", hash: "e9fb...5c6d" },
  ];

  const actionColors = {
    clock_in: { bg: "rgba(15,110,86,0.1)", fg: theme.primaryDeep },
    leave_submit: { bg: "#EEEDFE", fg: "#3C3489" },
    leave_approve: { bg: "#F5EBD3", fg: "#6F5016" },
    permission_denied: { bg: "rgba(184,65,65,0.1)", fg: theme.danger },
    data_export: { bg: "#E6F1FB", fg: "#185FA5" },
  };

  return (
    <div style={{
      background: theme.surface, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Audit Events · append-only hash chain</div>
          <div style={{ fontSize: 11, color: theme.inkSoft }}>ISO 27001 · non-repudiation guaranteed</div>
        </div>
        <button style={{
          background: theme.primary, color: "white", border: "none",
          padding: "8px 14px", borderRadius: 8, fontSize: 11, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}><Download size={12}/> Export CSV</button>
      </div>

      <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.inkSoft, fontWeight: 500, textAlign: "left" }}>
            <th style={{ padding: "10px 8px" }}>Waktu</th>
            <th style={{ padding: "10px 8px" }}>Aktor</th>
            <th style={{ padding: "10px 8px" }}>Action</th>
            <th style={{ padding: "10px 8px" }}>Target</th>
            <th style={{ padding: "10px 8px" }}>Detail</th>
            <th style={{ padding: "10px 8px" }}>Hash</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, i) => {
            const color = actionColors[e.action] || { bg: theme.bg, fg: theme.ink };
            return (
              <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                <td style={{ padding: "10px 8px", fontFamily: "monospace", color: theme.inkSoft }}>{e.time}</td>
                <td style={{ padding: "10px 8px", fontWeight: 500 }}>{e.actor}</td>
                <td style={{ padding: "10px 8px" }}>
                  <span style={{
                    background: color.bg, color: color.fg,
                    padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 500, fontFamily: "monospace",
                  }}>{e.action}</span>
                </td>
                <td style={{ padding: "10px 8px" }}>{e.target}</td>
                <td style={{ padding: "10px 8px", color: theme.inkSoft }}>{e.meta}</td>
                <td style={{ padding: "10px 8px", fontFamily: "monospace", color: theme.inkSoft, fontSize: 10 }}>{e.hash}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// Placeholder views
// ============================================================
function AttendanceView() { return <Placeholder icon={<Fingerprint size={28}/>} title="Absensi" text="View untuk monitor absensi realtime, filter per direktorat, export laporan bulanan."/>; }
function EmployeesView() { return <Placeholder icon={<Users size={28}/>} title="Direktori Karyawan" text="CRUD pegawai, struktur organisasi, bulk import NIP, face enrollment."/>; }
function LeavesView() { return <Placeholder icon={<Calendar size={28}/>} title="Cuti & Izin" text="Kalender cuti agregat, saldo cuti per pegawai, laporan THR."/>; }
function PayrollView() { return <Placeholder icon={<Wallet size={28}/>} title="Payroll" text="Payroll run bulanan, komponen gaji, PPh 21 TER, zakat profesi, ekspor BSI bank file."/>; }
function ReportsView() { return <Placeholder icon={<FileText size={28}/>} title="Laporan" text="Export laporan kehadiran, cuti, payroll, audit untuk Dewas BPKH & internal auditor."/>; }

function Placeholder({ icon, title, text }) {
  return (
    <div style={{
      background: theme.surface, padding: 60, borderRadius: 14, border: `1px solid ${theme.border}`,
      textAlign: "center", color: theme.inkSoft,
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: 16, background: theme.accentSoft, color: theme.accent,
        margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</div>
      <h2 style={{ margin: "0 0 8px", fontFamily: "'Fraunces', serif", fontSize: 20, color: theme.ink }}>{title}</h2>
      <p style={{ fontSize: 13, maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>{text}</p>
      <div style={{ marginTop: 20, fontSize: 11, color: theme.accent }}>Siap dibangun di sprint berikutnya</div>
    </div>
  );
}
