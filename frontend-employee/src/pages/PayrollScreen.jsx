import React, { useEffect, useState } from "react";
import { Wallet, ChevronRight, Loader2 } from "lucide-react";
import { payroll } from "../api";
import { theme } from "../theme";
import { IslamicPattern } from "../components/Ornaments";
import { ScreenHeader } from "../components/ui";

export default function PayrollScreen() {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    payroll
      .current()
      .then(setPayslip)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => "Rp " + Math.abs(n || 0).toLocaleString("id-ID");

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Loader2
          size={30}
          style={{ color: theme.primary, animation: "spin 1s linear infinite" }}
        />
      </div>
    );
  }

  if (!payslip) {
    return (
      <div style={{ padding: "20px 20px 100px" }}>
        <ScreenHeader title="Slip Gaji" subtitle="Periode saat ini" />
        <div
          style={{
            padding: 40,
            textAlign: "center",
            background: theme.surface,
            borderRadius: 14,
          }}
        >
          <Wallet size={40} style={{ color: theme.inkSoft, marginBottom: 12 }} />
          <p style={{ fontSize: 13, color: theme.inkSoft }}>
            Slip gaji bulan ini belum dirilis.
            <br />
            Cek kembali pada H-1 tanggal transfer (25).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <ScreenHeader
        title="Slip Gaji"
        subtitle={`Periode: ${payslip.payroll_runs?.period_month}/${payslip.payroll_runs?.period_year}`}
      />

      <div
        style={{
          background: `linear-gradient(135deg, ${theme.primaryDeep}, ${theme.primary})`,
          borderRadius: 20,
          padding: 22,
          color: "white",
          position: "relative",
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <IslamicPattern opacity={0.08} />
        <div style={{ fontSize: 10, opacity: 0.8, letterSpacing: 0.5 }}>TAKE HOME PAY</div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 500,
            fontFamily: "'Fraunces', serif",
            marginTop: 4,
          }}
        >
          {fmt(payslip.net_amount)}
        </div>
        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
          Ditransfer {payslip.payroll_runs?.payment_date}
        </div>
      </div>

      <button
        onClick={() => setShowDetail(!showDetail)}
        style={{
          width: "100%",
          padding: 12,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Rincian komponen</span>
        <ChevronRight
          size={14}
          style={{
            transform: showDetail ? "rotate(90deg)" : "none",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {showDetail && payslip.components && (
        <div
          style={{
            background: theme.surface,
            borderRadius: 12,
            marginTop: 8,
            padding: "4px 16px",
            border: `1px solid ${theme.border}`,
          }}
        >
          {payslip.components.map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom:
                  i < payslip.components.length - 1 ? `1px solid ${theme.border}` : "none",
                fontSize: 12,
              }}
            >
              <span>{c.label}</span>
              <span style={{ fontWeight: 500, fontFamily: "'Fraunces', serif" }}>
                {fmt(c.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
