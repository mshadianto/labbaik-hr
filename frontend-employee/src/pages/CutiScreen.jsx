import React, { useEffect, useState } from "react";
import { Check, Shield, Send, Loader2 } from "lucide-react";
import { leave } from "../api";
import { theme, primaryBtn } from "../theme";
import { ScreenHeader, Field, Badge } from "../components/ui";

export default function CutiScreen({ profile }) {
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
    { id: "sakit", label: "Sakit", balance: "-", icon: "⚕" },
    {
      id: "haji",
      label: "Cuti Haji",
      balance: profile?.leave_balance_hajj_used ? "Terpakai" : "1× karir",
      icon: "🕋",
    },
    { id: "umrah", label: "Cuti Umrah", balance: 14, icon: "☪" },
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
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: theme.accentSoft,
            color: theme.accent,
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={40} />
        </div>
        <h2
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 22,
            color: theme.primaryDeep,
            margin: "0 0 6px",
          }}
        >
          Pengajuan terkirim
        </h2>
        <p style={{ fontSize: 13, color: theme.inkSoft }}>
          <b>{submitted.request_no}</b>
          <br />
          Persetujuan atasan akan diproses 1×24 jam.
        </p>
        <button
          onClick={() => {
            setSubmitted(null);
            setJenis("");
            setStartDate("");
            setEndDate("");
            setReason("");
          }}
          style={{ ...primaryBtn, marginTop: 24, width: "auto", padding: "10px 22px" }}
        >
          Ajukan Lagi
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <ScreenHeader title="Pengajuan Cuti" subtitle="Pilih jenis cuti sesuai kebutuhan" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {leaveTypes.map((lt) => (
          <button
            key={lt.id}
            onClick={() => setJenis(lt.id)}
            style={{
              background: jenis === lt.id ? theme.accentSoft : theme.surface,
              border: `1.5px solid ${jenis === lt.id ? theme.accent : theme.border}`,
              borderRadius: 14,
              padding: 14,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 6 }}>{lt.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{lt.label}</div>
            <div style={{ fontSize: 10, color: theme.inkSoft, marginTop: 2 }}>
              Saldo: {lt.balance}
              {typeof lt.balance === "number" ? " hari" : ""}
            </div>
          </button>
        ))}
      </div>

      {jenis && (
        <div
          style={{
            background: theme.surface,
            borderRadius: 16,
            padding: 18,
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Detail pengajuan</div>

          <Field
            label="Tanggal mulai"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Field
            label="Tanggal selesai"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Field
            label="Alasan"
            type="textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Jelaskan keperluan..."
          />

          {error && (
            <div
              style={{
                padding: 10,
                background: "rgba(184,65,65,0.1)",
                borderRadius: 8,
                fontSize: 11,
                color: theme.danger,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              background: theme.accentSoft,
              borderRadius: 10,
              padding: 12,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              marginBottom: 14,
            }}
          >
            <Shield size={14} style={{ color: theme.accent, marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: "#6F5016", lineHeight: 1.5 }}>
              Pengajuan akan otomatis tercatat di audit trail ISO 27001 dan dikirim ke atasan
              langsung.
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !startDate || !endDate}
            style={{ ...primaryBtn, opacity: !startDate || !endDate ? 0.5 : 1 }}
          >
            {loading ? (
              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Send size={14} />
            )}
            Ajukan Cuti
          </button>
        </div>
      )}

      {myRequests.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Riwayat pengajuan</h3>
          {myRequests.slice(0, 5).map((r) => (
            <div
              key={r.id}
              style={{
                background: theme.surface,
                padding: 12,
                borderRadius: 10,
                border: `1px solid ${theme.border}`,
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{r.request_no}</div>
                <div style={{ fontSize: 10, color: theme.inkSoft }}>
                  {r.leave_type} · {r.start_date} → {r.end_date} ({r.days} hari)
                </div>
              </div>
              <Badge
                tone={
                  r.status === "approved"
                    ? "success"
                    : r.status === "rejected"
                    ? "danger"
                    : "warning"
                }
              >
                {r.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
