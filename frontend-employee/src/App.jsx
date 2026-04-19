/**
 * App.jsx — Labbaik HR Employee PWA
 * ===================================
 * Fully connected to Supabase + FastAPI backend.
 * Flow: Login → Home → (Clock-in | Cuti | Tanya HR | Payroll | Profil)
 */
import React, { useEffect, useState } from "react";
import {
  Home, Fingerprint, Calendar, Wallet, Sparkles, User, Bell,
  MapPin, Clock, ChevronRight, Camera, X, Check, AlertCircle,
  LogOut, Send, Shield, Loader2, FileText
} from "lucide-react";

import { supabase, auth, me, leave, payroll, tanyaHR, attendance, face } from "./api";
import ClockInScreen from "./ClockInScreen";
import FaceEnrollScreen from "./FaceEnrollScreen";

// =====================================================================
// THEME
// =====================================================================
const theme = {
  bg: "#F7F5EE", surface: "#FFFFFF", ink: "#0A2A23", inkSoft: "#3D5A50",
  primary: "#0F6E56", primaryDeep: "#085041", accent: "#C9A85C",
  accentSoft: "#F5EBD3", border: "rgba(10,42,35,0.12)",
  danger: "#B84141", warning: "#C68B2A",
};

// =====================================================================
// ORNAMENTS & PATTERNS
// =====================================================================
const GoldOrnament = ({ size = 40, opacity = 0.14 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ opacity }}>
    <g fill="none" stroke={theme.accent} strokeWidth="0.7">
      <circle cx="20" cy="20" r="18" />
      <path d="M20 2 L22 20 L20 38 L18 20 Z" />
      <path d="M2 20 L20 18 L38 20 L20 22 Z" />
      <path d="M7.3 7.3 L20 20 L32.7 32.7 M7.3 32.7 L20 20 L32.7 7.3" />
    </g>
  </svg>
);

const IslamicPattern = ({ opacity = 0.05 }) => (
  <svg width="100%" height="100%"
    style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity }}
    xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="zellige" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M30 0 L60 30 L30 60 L0 30 Z M30 15 L45 30 L30 45 L15 30 Z"
              fill="none" stroke={theme.accent} strokeWidth="0.5"/>
        <circle cx="30" cy="30" r="4" fill="none" stroke={theme.accent} strokeWidth="0.5"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#zellige)"/>
  </svg>
);

// =====================================================================
// LOGIN SCREEN
// =====================================================================
function LoginScreen({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await auth.signIn(email, password);
      if (error) throw error;
      onSuccess();
    } catch (err) {
      setError(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(135deg, ${theme.primaryDeep} 0%, ${theme.primary} 100%)`,
      padding: 20, position: "relative", overflow: "hidden",
    }}>
      <IslamicPattern opacity={0.08}/>

      <div style={{
        maxWidth: 400, width: "100%", background: theme.bg,
        borderRadius: 24, padding: 32, position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <GoldOrnament size={48} opacity={0.6}/>
          <h1 style={{
            margin: "12px 0 4px", fontFamily: "'Fraunces', serif",
            fontSize: 26, fontWeight: 500, color: theme.primaryDeep,
          }}>Labbaik HR</h1>
          <p style={{ margin: 0, fontSize: 12, color: theme.inkSoft, letterSpacing: 0.5 }}>
            BPKH · Employee Self-Service
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="nama@bpkh.go.id" style={inputStyle}/>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>PASSWORD</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              required placeholder="••••••••" style={inputStyle}/>
          </div>

          {error && (
            <div style={{
              padding: 12, background: "rgba(184,65,65,0.1)", borderRadius: 10,
              fontSize: 12, color: theme.danger, marginBottom: 16,
              display: "flex", gap: 8, alignItems: "flex-start",
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }}/>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: 14, background: theme.primary, color: "white",
            border: "none", borderRadius: 12, fontSize: 14, fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }}/> Masuk…</>
                     : "Masuk"}
          </button>
        </form>

        <div style={{
          marginTop: 24, padding: 12, background: theme.accentSoft,
          borderRadius: 10, fontSize: 11, color: "#6F5016", lineHeight: 1.6,
        }}>
          <b>Demo credentials:</b><br/>
          ahmad.fauzi@bpkh.go.id / TesterLabbaik2026!
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: 10, color: theme.inkSoft, letterSpacing: 0.5,
  display: "block", marginBottom: 6,
};
const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: `1px solid ${theme.border}`, fontSize: 14,
  background: theme.surface, color: theme.ink, boxSizing: "border-box",
};

// =====================================================================
// HOME SCREEN
// =====================================================================
function HomeScreen({ profile, onClockInOpen, todayAttendance, setTab }) {
  const [prayerTimes, setPrayerTimes] = useState([]);
  const [nextPrayer, setNextPrayer] = useState(null);
  const today = new Date();

  // Fetch prayer times (Aladhan API)
  useEffect(() => {
    fetch("https://api.aladhan.com/v1/timingsByCity?city=Jakarta&country=Indonesia&method=20")
      .then(r => r.json())
      .then(data => {
        if (!data?.data?.timings) return;
        const t = data.data.timings;
        const prayers = [
          { name: "Subuh", time: t.Fajr },
          { name: "Dzuhur", time: t.Dhuhr },
          { name: "Ashar", time: t.Asr },
          { name: "Maghrib", time: t.Maghrib },
          { name: "Isya", time: t.Isha },
        ];

        // Determine next prayer
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        let upcoming = null;
        const withMeta = prayers.map(p => {
          const [h, m] = p.time.split(":").map(Number);
          const mins = h * 60 + m;
          const isPast = mins < currentMinutes;
          const isNext = !isPast && !upcoming;
          if (isNext) upcoming = p.name;
          return { ...p, passed: isPast, next: isNext };
        });
        setPrayerTimes(withMeta);
        setNextPrayer(upcoming);
      })
      .catch(() => {
        setPrayerTimes([
          { name: "Subuh", time: "04:38", passed: true },
          { name: "Dzuhur", time: "11:52", passed: false, next: true },
          { name: "Ashar", time: "15:14", passed: false },
          { name: "Maghrib", time: "17:56", passed: false },
          { name: "Isya", time: "19:06", passed: false },
        ]);
      });
  }, []);

  const hijriDate = () => {
    try {
      return new Intl.DateTimeFormat("id-u-ca-islamic-umalqura", {
        day: "numeric", month: "long", year: "numeric",
      }).format(today);
    } catch { return "30 Syawwal 1447 H"; }
  };

  const clockInTime = todayAttendance?.clock_in_at
    ? new Date(todayAttendance.clock_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
    : null;

  const initials = profile?.full_name?.split(" ").slice(0, 2).map(w => w[0]).join("") || "?";

  return (
    <div>
      {/* Hero header */}
      <div style={{
        position: "relative",
        background: `linear-gradient(135deg, ${theme.primaryDeep} 0%, ${theme.primary} 100%)`,
        color: "white", padding: "20px 24px 32px",
        borderRadius: "0 0 28px 28px", overflow: "hidden",
      }}>
        <IslamicPattern opacity={0.08}/>
        <div style={{ position: "absolute", top: 12, right: 12 }}>
          <GoldOrnament size={70} opacity={0.22}/>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                       marginBottom: 20, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: theme.accent, color: theme.primaryDeep,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 600, fontSize: 14, fontFamily: "'Fraunces', serif",
            }}>{initials}</div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.85, letterSpacing: 0.5 }}>ASSALAMU'ALAIKUM</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>
                {profile?.full_name?.split(" ").slice(0, 2).join(" ") || "Pegawai"}
              </div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{profile?.position_title || "—"}</div>
            </div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: "50%",
                         background: "rgba(255,255,255,0.14)",
                         display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={16}/>
          </div>
        </div>

        {/* Prayer card */}
        <div style={{
          background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)",
          borderRadius: 14, padding: "12px 16px",
          border: "1px solid rgba(201,168,92,0.3)", position: "relative",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                         marginBottom: 8 }}>
            <span style={{ fontSize: 10, opacity: 0.8 }}>JADWAL SHOLAT · JAKARTA</span>
            <span style={{ fontSize: 10, opacity: 0.8 }}>{hijriDate()}</span>
          </div>
          {prayerTimes.length > 0 ? (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              {prayerTimes.map(p => (
                <div key={p.name} style={{
                  textAlign: "center",
                  color: p.next ? theme.accent : p.passed ? "rgba(255,255,255,0.5)" : "white",
                  fontWeight: p.next ? 600 : 400,
                }}>
                  <div style={{ fontSize: 10, opacity: 0.85 }}>{p.name}</div>
                  <div style={{ fontSize: 13, fontWeight: p.next ? 600 : 500 }}>{p.time}</div>
                  {p.next && <div style={{ width: 4, height: 4, background: theme.accent,
                                            borderRadius: "50%", margin: "3px auto 0" }}/>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11, opacity: 0.7, textAlign: "center", padding: 8 }}>
              Memuat jadwal sholat…
            </div>
          )}
        </div>
      </div>

      {/* Clock-in card */}
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{
          background: theme.surface, borderRadius: 18, padding: 18,
          border: `1px solid ${theme.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 11, color: theme.inkSoft, marginBottom: 3, letterSpacing: 0.4 }}>
              {clockInTime ? "ANDA SEDANG BERTUGAS" : "BELUM CLOCK-IN"}
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, color: theme.primaryDeep,
                           fontFamily: "'Fraunces', serif" }}>
              {clockInTime || "— : —"}
            </div>
            <div style={{ fontSize: 11, color: theme.inkSoft, display: "flex",
                           alignItems: "center", gap: 4, marginTop: 2 }}>
              <MapPin size={10}/> Muamalat Tower · On-site
            </div>
          </div>
          <button onClick={onClockInOpen} style={{
            background: clockInTime ? "transparent" : theme.primary,
            color: clockInTime ? theme.primary : "white",
            border: `1.5px solid ${theme.primary}`,
            padding: "10px 18px", borderRadius: 12,
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Fingerprint size={14}/> {clockInTime ? "Clock Out" : "Clock In"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: "14px 20px 0", display: "grid",
                     gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        <StatCard label="Sisa Cuti" value={profile?.leave_balance_annual || 0} tone="primary"/>
        <StatCard label="Kehadiran" value="96" unit="%" tone="gold"/>
        <StatCard label="Lembur" value="4" unit="jam" tone="neutral"/>
      </div>

      {/* Quick services */}
      <div style={{ padding: "20px 20px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <GoldOrnament size={18} opacity={0.5}/>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>LAYANAN UTAMA</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          <ServiceTile icon={<Fingerprint/>} label="Absensi" onClick={onClockInOpen}/>
          <ServiceTile icon={<Calendar/>} label="Cuti" onClick={() => setTab("cuti")}/>
          <ServiceTile icon={<Wallet/>} label="Slip Gaji" onClick={() => setTab("payroll")}/>
          <ServiceTile icon={<Sparkles/>} label="Tanya HR" onClick={() => setTab("ai")} featured/>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, tone }) {
  const bg = tone === "primary" ? "rgba(15,110,86,0.08)"
           : tone === "gold" ? theme.accentSoft
           : "rgba(10,42,35,0.04)";
  const fg = tone === "primary" ? theme.primaryDeep
           : tone === "gold" ? "#6F5016"
           : theme.ink;
  return (
    <div style={{ background: bg, borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: fg, fontFamily: "'Fraunces', serif" }}>
        {value}{unit && <span style={{ fontSize: 12, marginLeft: 2 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 9, color: fg, opacity: 0.75, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </div>
    </div>
  );
}

function ServiceTile({ icon, label, onClick, featured }) {
  return (
    <button onClick={onClick} style={{
      background: featured ? theme.accentSoft : theme.surface,
      border: `1px solid ${featured ? theme.accent + "60" : theme.border}`,
      borderRadius: 14, padding: "12px 6px", cursor: "pointer",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: featured ? theme.accent : "rgba(15,110,86,0.08)",
        color: featured ? "white" : theme.primary,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {React.cloneElement(icon, { size: 16 })}
      </div>
      <span style={{ fontSize: 10, color: theme.ink, fontWeight: 500 }}>{label}</span>
    </button>
  );
}

// =====================================================================
// CUTI SCREEN (connected)
// =====================================================================
function CutiScreen({ profile }) {
  const [jenis, setJenis] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    leave.myRequests().then(setMyRequests).catch(() => {});
  }, [submitted]);

  const leaveTypes = [
    { id: "tahunan", label: "Cuti Tahunan", balance: profile?.leave_balance_annual || 0, icon: "🌿" },
    { id: "sakit",   label: "Sakit",        balance: "-", icon: "⚕" },
    { id: "haji",    label: "Cuti Haji",    balance: profile?.leave_balance_hajj_used ? "Terpakai" : "1× karir", icon: "🕋" },
    { id: "umrah",   label: "Cuti Umrah",   balance: 14, icon: "☪" },
    { id: "melahirkan", label: "Melahirkan", balance: 90, icon: "◯" },
    { id: "ibadah_lain", label: "Ibadah Lainnya", balance: 3, icon: "✦" },
  ];

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await leave.submit({
        leave_type: jenis,
        start_date: startDate,
        end_date: endDate,
        reason,
      });
      setSubmitted(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center" }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: theme.accentSoft, color: theme.accent,
          margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center",
        }}><Check size={40}/></div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: theme.primaryDeep, margin: "0 0 6px" }}>
          Pengajuan terkirim
        </h2>
        <p style={{ fontSize: 13, color: theme.inkSoft }}>
          <b>{submitted.request_no}</b><br/>
          Persetujuan atasan akan diproses 1×24 jam.
        </p>
        <button onClick={() => { setSubmitted(null); setJenis(""); setStartDate(""); setEndDate(""); setReason(""); }}
          style={{ ...primaryBtn, marginTop: 24, width: "auto", padding: "10px 22px" }}>
          Ajukan Lagi
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <ScreenHeader title="Pengajuan Cuti" subtitle="Pilih jenis cuti sesuai kebutuhan"/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 20 }}>
        {leaveTypes.map(lt => (
          <button key={lt.id} onClick={() => setJenis(lt.id)} style={{
            background: jenis === lt.id ? theme.accentSoft : theme.surface,
            border: `1.5px solid ${jenis === lt.id ? theme.accent : theme.border}`,
            borderRadius: 14, padding: 14, cursor: "pointer", textAlign: "left",
          }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{lt.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{lt.label}</div>
            <div style={{ fontSize: 10, color: theme.inkSoft, marginTop: 2 }}>
              Saldo: {lt.balance}{typeof lt.balance === "number" ? " hari" : ""}
            </div>
          </button>
        ))}
      </div>

      {jenis && (
        <div style={{ background: theme.surface, borderRadius: 16, padding: 18, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Detail pengajuan</div>

          <Field label="Tanggal mulai" type="date" value={startDate} onChange={e => setStartDate(e.target.value)}/>
          <Field label="Tanggal selesai" type="date" value={endDate} onChange={e => setEndDate(e.target.value)}/>
          <Field label="Alasan" type="textarea" value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Jelaskan keperluan..."/>

          {error && (
            <div style={{
              padding: 10, background: "rgba(184,65,65,0.1)", borderRadius: 8,
              fontSize: 11, color: theme.danger, marginBottom: 12,
            }}>{error}</div>
          )}

          <div style={{
            background: theme.accentSoft, borderRadius: 10, padding: 12,
            display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14,
          }}>
            <Shield size={14} style={{ color: theme.accent, marginTop: 2, flexShrink: 0 }}/>
            <div style={{ fontSize: 11, color: "#6F5016", lineHeight: 1.5 }}>
              Pengajuan akan otomatis tercatat di audit trail ISO 27001 dan dikirim ke atasan langsung.
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading || !startDate || !endDate}
            style={{ ...primaryBtn, opacity: (!startDate || !endDate) ? 0.5 : 1 }}>
            {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }}/> : <Send size={14}/>}
            Ajukan Cuti
          </button>
        </div>
      )}

      {/* History */}
      {myRequests.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Riwayat pengajuan</h3>
          {myRequests.slice(0, 5).map(r => (
            <div key={r.id} style={{
              background: theme.surface, padding: 12, borderRadius: 10,
              border: `1px solid ${theme.border}`, marginBottom: 8,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{r.request_no}</div>
                <div style={{ fontSize: 10, color: theme.inkSoft }}>
                  {r.leave_type} · {r.start_date} → {r.end_date} ({r.days} hari)
                </div>
              </div>
              <Badge tone={
                r.status === "approved" ? "success" :
                r.status === "rejected" ? "danger" :
                "warning"
              }>{r.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, type = "text", ...rest }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, color: theme.inkSoft, display: "block", marginBottom: 6, letterSpacing: 0.3 }}>
        {label.toUpperCase()}
      </label>
      {type === "textarea" ? (
        <textarea rows={3} {...rest} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}/>
      ) : (
        <input type={type} {...rest} style={inputStyle}/>
      )}
    </div>
  );
}

function Badge({ children, tone }) {
  const tones = {
    success: { bg: "rgba(15,110,86,0.12)", fg: theme.primaryDeep },
    danger:  { bg: "rgba(184,65,65,0.12)", fg: "#7A1F1F" },
    warning: { bg: "rgba(198,139,42,0.14)", fg: "#6F4A12" },
  };
  const t = tones[tone] || tones.warning;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 500,
      background: t.bg, color: t.fg,
    }}>{children}</span>
  );
}

// =====================================================================
// AI SCREEN (connected to /api/tanya-hr)
// =====================================================================
function AIScreen() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Assalamu'alaikum, saya asisten HR BPKH. Apa yang ingin ditanyakan seputar Perka Kepegawaian, SOP Cuti, Remunerasi, atau aturan Komite Audit?" }
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const ask = async (text) => {
    if (!text.trim()) return;
    setMessages(m => [...m, { role: "user", text }]);
    setInput("");
    setThinking(true);
    try {
      const result = await tanyaHR.ask(text);
      setMessages(m => [...m, { role: "ai", text: result.answer, sources: result.sources || [] }]);
    } catch (err) {
      setMessages(m => [...m, { role: "ai", text: `Maaf, terjadi kendala: ${err.message}` }]);
    } finally {
      setThinking(false);
    }
  };

  const suggestions = ["Berapa hari cuti haji saya?", "Aturan SPPD dinas ke KSA?", "Cara klaim reimburse pelatihan?"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        padding: "20px 20px 14px",
        background: `linear-gradient(135deg, ${theme.primaryDeep}, ${theme.primary})`,
        color: "white", position: "relative", overflow: "hidden",
      }}>
        <IslamicPattern opacity={0.08}/>
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: theme.accent, color: theme.primaryDeep,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Sparkles size={18}/></div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, fontFamily: "'Fraunces', serif" }}>Tanya HR</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>AI · RAG atas Perka BPKH & SOP</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", background: theme.bg }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12,
          }}>
            <div style={{
              maxWidth: "82%",
              background: m.role === "user" ? theme.primary : theme.surface,
              color: m.role === "user" ? "white" : theme.ink,
              padding: "10px 14px",
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              fontSize: 13, lineHeight: 1.55,
              border: m.role === "ai" ? `1px solid ${theme.border}` : "none",
              whiteSpace: "pre-wrap",
            }}>
              {m.text}
              {m.sources && m.sources.length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${theme.border}` }}>
                  <div style={{ fontSize: 10, color: theme.inkSoft, marginBottom: 6 }}>SUMBER</div>
                  {m.sources.map((s, j) => (
                    <div key={j} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <FileText size={10} style={{ color: theme.accent }}/>
                      <span style={{ fontSize: 11 }}>{s.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {thinking && (
          <div style={{ display: "flex", marginBottom: 12 }}>
            <div style={{
              background: theme.surface, padding: "10px 14px",
              borderRadius: "16px 16px 16px 4px", border: `1px solid ${theme.border}`,
              display: "flex", gap: 4,
            }}>
              <Loader2 size={14} style={{ color: theme.primary, animation: "spin 1s linear infinite" }}/>
              <span style={{ fontSize: 12, color: theme.inkSoft }}>Mencari jawaban…</span>
            </div>
          </div>
        )}
      </div>

      {messages.length === 1 && (
        <div style={{ padding: "0 16px 8px", background: theme.bg }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => ask(s)} style={{
                background: theme.surface, border: `1px solid ${theme.border}`,
                borderRadius: 999, padding: "6px 12px", fontSize: 11, cursor: "pointer",
              }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: 14, background: theme.surface, borderTop: `1px solid ${theme.border}` }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && ask(input)}
            placeholder="Tanyakan sesuatu..."
            style={{ ...inputStyle, borderRadius: 999, flex: 1 }}/>
          <button onClick={() => ask(input)} disabled={!input.trim()} style={{
            width: 42, height: 42, borderRadius: "50%",
            background: input.trim() ? theme.primary : theme.border,
            color: "white", border: "none", cursor: input.trim() ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Send size={16}/></button>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// PAYROLL SCREEN (connected)
// =====================================================================
function PayrollScreen() {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    payroll.current().then(setPayslip).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const fmt = (n) => "Rp " + Math.abs(n || 0).toLocaleString("id-ID");

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>
      <Loader2 size={30} style={{ color: theme.primary, animation: "spin 1s linear infinite" }}/>
    </div>;
  }

  if (!payslip) {
    return (
      <div style={{ padding: "20px 20px 100px" }}>
        <ScreenHeader title="Slip Gaji" subtitle="Periode saat ini"/>
        <div style={{ padding: 40, textAlign: "center", background: theme.surface, borderRadius: 14 }}>
          <Wallet size={40} style={{ color: theme.inkSoft, marginBottom: 12 }}/>
          <p style={{ fontSize: 13, color: theme.inkSoft }}>Slip gaji bulan ini belum dirilis.<br/>Cek kembali pada H-1 tanggal transfer (25).</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <ScreenHeader title="Slip Gaji" subtitle={`Periode: ${payslip.payroll_runs?.period_month}/${payslip.payroll_runs?.period_year}`}/>

      <div style={{
        background: `linear-gradient(135deg, ${theme.primaryDeep}, ${theme.primary})`,
        borderRadius: 20, padding: 22, color: "white", position: "relative", overflow: "hidden",
        marginBottom: 16,
      }}>
        <IslamicPattern opacity={0.08}/>
        <div style={{ fontSize: 10, opacity: 0.8, letterSpacing: 0.5 }}>TAKE HOME PAY</div>
        <div style={{ fontSize: 32, fontWeight: 500, fontFamily: "'Fraunces', serif", marginTop: 4 }}>
          {fmt(payslip.net_amount)}
        </div>
        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
          Ditransfer {payslip.payroll_runs?.payment_date}
        </div>
      </div>

      <button onClick={() => setShowDetail(!showDetail)} style={{
        width: "100%", padding: 12, background: theme.surface,
        border: `1px solid ${theme.border}`, borderRadius: 12,
        fontSize: 13, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span>Rincian komponen</span>
        <ChevronRight size={14} style={{ transform: showDetail ? "rotate(90deg)" : "none",
                                          transition: "transform 0.2s" }}/>
      </button>

      {showDetail && payslip.components && (
        <div style={{ background: theme.surface, borderRadius: 12, marginTop: 8,
                       padding: "4px 16px", border: `1px solid ${theme.border}` }}>
          {payslip.components.map((c, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", padding: "10px 0",
              borderBottom: i < payslip.components.length - 1 ? `1px solid ${theme.border}` : "none",
              fontSize: 12,
            }}>
              <span>{c.label}</span>
              <span style={{ fontWeight: 500, fontFamily: "'Fraunces', serif" }}>{fmt(c.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================================
// PROFILE SCREEN (with face enrollment shortcut)
// =====================================================================
function ProfileScreen({ profile, onLogout, onEnrollFace }) {
  const initials = profile?.full_name?.split(" ").slice(0, 2).map(w => w[0]).join("") || "?";
  return (
    <div style={{ padding: "40px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: theme.primary, color: "white",
          margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontFamily: "'Fraunces', serif", fontWeight: 500,
        }}>{initials}</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", margin: "0 0 4px", fontSize: 20 }}>{profile?.full_name}</h2>
        <p style={{ fontSize: 12, color: theme.inkSoft, margin: 0 }}>{profile?.position_title}</p>
        <p style={{ fontSize: 11, color: theme.inkSoft, margin: "2px 0 0" }}>
          NIP {profile?.nip}
        </p>
      </div>

      <div style={{ background: theme.surface, borderRadius: 14, border: `1px solid ${theme.border}`, padding: 4, marginBottom: 14 }}>
        <MenuRow icon={<Camera size={16}/>} label="Enroll / Perbarui Wajah" onClick={onEnrollFace}/>
        <MenuRow icon={<Shield size={16}/>} label="Keamanan & Privasi"/>
        <MenuRow icon={<FileText size={16}/>} label="Kontrak & Dokumen"/>
        <MenuRow icon={<Bell size={16}/>} label="Notifikasi"/>
      </div>

      <button onClick={onLogout} style={{
        width: "100%", padding: 14, background: "transparent",
        color: theme.danger, border: `1px solid ${theme.danger}40`,
        borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <LogOut size={14}/> Keluar
      </button>
    </div>
  );
}

function MenuRow({ icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "14px 12px", background: "transparent",
      border: "none", borderBottom: `1px solid ${theme.border}`,
      cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
      textAlign: "left",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: theme.accentSoft, color: theme.accent,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</div>
      <span style={{ flex: 1, fontSize: 13 }}>{label}</span>
      <ChevronRight size={14} style={{ color: theme.inkSoft }}/>
    </button>
  );
}

// =====================================================================
// SHARED HELPERS
// =====================================================================
function ScreenHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
      <GoldOrnament size={24} opacity={0.45}/>
      <div>
        <h1 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500 }}>{title}</h1>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: theme.inkSoft }}>{subtitle}</p>
      </div>
    </div>
  );
}

const primaryBtn = {
  width: "100%", padding: 14, background: theme.primary, color: "white",
  border: "none", borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
};

// =====================================================================
// BOTTOM NAV
// =====================================================================
function BottomNav({ tab, setTab }) {
  const items = [
    { id: "home", label: "Beranda", icon: Home },
    { id: "cuti", label: "Cuti", icon: Calendar },
    { id: "ai", label: "Tanya HR", icon: Sparkles, featured: true },
    { id: "payroll", label: "Gaji", icon: Wallet },
    { id: "profil", label: "Profil", icon: User },
  ];

  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: theme.surface, borderTop: `1px solid ${theme.border}`,
      padding: "10px 8px 16px", display: "grid", gridTemplateColumns: "repeat(5,1fr)",
    }}>
      {items.map(it => {
        const Icon = it.icon;
        const active = tab === it.id;
        if (it.featured) {
          return (
            <button key={it.id} onClick={() => setTab(it.id)} style={{
              background: "transparent", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", marginTop: -18,
                background: active ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDeep})` : theme.accent,
                color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(15,110,86,0.3)",
              }}>
                <Icon size={18}/>
              </div>
              <span style={{ fontSize: 9, color: active ? theme.primary : theme.inkSoft, fontWeight: 500 }}>
                {it.label}
              </span>
            </button>
          );
        }
        return (
          <button key={it.id} onClick={() => setTab(it.id)} style={{
            background: "transparent", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          }}>
            <Icon size={18} style={{ color: active ? theme.primary : theme.inkSoft }}/>
            <span style={{ fontSize: 9, color: active ? theme.primary : theme.inkSoft, fontWeight: active ? 500 : 400 }}>
              {it.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// =====================================================================
// MAIN APP
// =====================================================================
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("home");
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [clockInOpen, setClockInOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Load profile when session ready
  useEffect(() => {
    if (!session) { setProfile(null); return; }
    me.get().then(setProfile).catch(err => console.error("Load profile failed:", err));
    attendance.today().then(setTodayAttendance).catch(() => {});
  }, [session]);

  const handleLogout = async () => {
    await auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const handleClockInSuccess = (result) => {
    setClockInOpen(false);
    attendance.today().then(setTodayAttendance).catch(() => {});
  };

  const handleEnrollSuccess = () => {
    setEnrollOpen(false);
    alert("Wajah berhasil didaftarkan. Anda sekarang bisa clock-in.");
  };

  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pop { 0% { transform: scale(0); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #E8E3D4; }
    input:focus, textarea:focus { outline: none; border-color: ${theme.primary} !important; }
    button { font-family: inherit; }
  `;

  if (loading) {
    return (
      <>
        <style>{globalStyles}</style>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 size={30} style={{ color: theme.primary, animation: "spin 1s linear infinite" }}/>
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <style>{globalStyles}</style>
        <LoginScreen onSuccess={() => {}}/>
      </>
    );
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{
        minHeight: "100vh", background: "#E8E3D4", padding: 20,
        display: "flex", justifyContent: "center", alignItems: "flex-start",
      }}>
        <div style={{
          width: "100%", maxWidth: 420, minHeight: 800,
          background: theme.bg, borderRadius: 32,
          boxShadow: "0 20px 60px rgba(10,42,35,0.18)",
          overflow: "hidden", position: "relative",
        }}>
          <div style={{
            height: "calc(100vh - 40px)", maxHeight: 820,
            overflowY: "auto", paddingBottom: tab === "ai" ? 0 : 80,
          }}>
            {tab === "home" && profile && (
              <HomeScreen
                profile={profile}
                todayAttendance={todayAttendance}
                onClockInOpen={() => setClockInOpen(true)}
                setTab={setTab}
              />
            )}
            {tab === "cuti" && <CutiScreen profile={profile}/>}
            {tab === "payroll" && <PayrollScreen/>}
            {tab === "ai" && <AIScreen/>}
            {tab === "profil" && (
              <ProfileScreen
                profile={profile}
                onLogout={handleLogout}
                onEnrollFace={() => setEnrollOpen(true)}
              />
            )}
          </div>

          {tab !== "ai" && <BottomNav tab={tab} setTab={setTab}/>}

          {clockInOpen && (
            <ClockInScreen
              mode={todayAttendance?.clock_in_at && !todayAttendance?.clock_out_at ? "out" : "in"}
              onClose={() => setClockInOpen(false)}
              onSuccess={handleClockInSuccess}
            />
          )}

          {enrollOpen && (
            <FaceEnrollScreen
              onClose={() => setEnrollOpen(false)}
              onSuccess={handleEnrollSuccess}
            />
          )}
        </div>
      </div>
    </>
  );
}
