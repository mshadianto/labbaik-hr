import React, { useEffect, useState } from "react";
import {
  Fingerprint,
  Calendar,
  Wallet,
  Sparkles,
  Bell,
  MapPin,
} from "lucide-react";
import { theme } from "../theme";
import { GoldOrnament, IslamicPattern } from "../components/Ornaments";
import { StatCard, ServiceTile } from "../components/ui";

export default function HomeScreen({ profile, onClockInOpen, todayAttendance, setTab }) {
  const [prayerTimes, setPrayerTimes] = useState([]);
  const [, setNextPrayer] = useState(null);
  const today = new Date();

  useEffect(() => {
    fetch("https://api.aladhan.com/v1/timingsByCity?city=Jakarta&country=Indonesia&method=20")
      .then((r) => r.json())
      .then((data) => {
        if (!data?.data?.timings) return;
        const t = data.data.timings;
        const prayers = [
          { name: "Subuh", time: t.Fajr },
          { name: "Dzuhur", time: t.Dhuhr },
          { name: "Ashar", time: t.Asr },
          { name: "Maghrib", time: t.Maghrib },
          { name: "Isya", time: t.Isha },
        ];

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        let upcoming = null;
        const withMeta = prayers.map((p) => {
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
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(today);
    } catch {
      return "30 Syawwal 1447 H";
    }
  };

  const clockInTime = todayAttendance?.clock_in_at
    ? new Date(todayAttendance.clock_in_at).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    : null;

  const initials =
    profile?.full_name
      ?.split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("") || "?";

  return (
    <div>
      <div
        style={{
          position: "relative",
          background: `linear-gradient(135deg, ${theme.primaryDeep} 0%, ${theme.primary} 100%)`,
          color: "white",
          padding: "20px 24px 32px",
          borderRadius: "0 0 28px 28px",
          overflow: "hidden",
        }}
      >
        <IslamicPattern opacity={0.08} />
        <div style={{ position: "absolute", top: 12, right: 12 }}>
          <GoldOrnament size={70} opacity={0.22} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: theme.accent,
                color: theme.primaryDeep,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: 14,
                fontFamily: "'Fraunces', serif",
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.85, letterSpacing: 0.5 }}>
                ASSALAMU'ALAIKUM
              </div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>
                {profile?.full_name?.split(" ").slice(0, 2).join(" ") || "Pegawai"}
              </div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{profile?.position_title || "—"}</div>
            </div>
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bell size={16} />
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
            borderRadius: 14,
            padding: "12px 16px",
            border: "1px solid rgba(201,168,92,0.3)",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 10, opacity: 0.8 }}>JADWAL SHOLAT · JAKARTA</span>
            <span style={{ fontSize: 10, opacity: 0.8 }}>{hijriDate()}</span>
          </div>
          {prayerTimes.length > 0 ? (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              {prayerTimes.map((p) => (
                <div
                  key={p.name}
                  style={{
                    textAlign: "center",
                    color: p.next
                      ? theme.accent
                      : p.passed
                      ? "rgba(255,255,255,0.5)"
                      : "white",
                    fontWeight: p.next ? 600 : 400,
                  }}
                >
                  <div style={{ fontSize: 10, opacity: 0.85 }}>{p.name}</div>
                  <div style={{ fontSize: 13, fontWeight: p.next ? 600 : 500 }}>{p.time}</div>
                  {p.next && (
                    <div
                      style={{
                        width: 4,
                        height: 4,
                        background: theme.accent,
                        borderRadius: "50%",
                        margin: "3px auto 0",
                      }}
                    />
                  )}
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

      <div style={{ padding: "20px 20px 0" }}>
        <div
          style={{
            background: theme.surface,
            borderRadius: 18,
            padding: 18,
            border: `1px solid ${theme.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: theme.inkSoft,
                marginBottom: 3,
                letterSpacing: 0.4,
              }}
            >
              {clockInTime ? "ANDA SEDANG BERTUGAS" : "BELUM CLOCK-IN"}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 500,
                color: theme.primaryDeep,
                fontFamily: "'Fraunces', serif",
              }}
            >
              {clockInTime || "— : —"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: theme.inkSoft,
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginTop: 2,
              }}
            >
              <MapPin size={10} /> Muamalat Tower · On-site
            </div>
          </div>
          <button
            onClick={onClockInOpen}
            style={{
              background: clockInTime ? "transparent" : theme.primary,
              color: clockInTime ? theme.primary : "white",
              border: `1.5px solid ${theme.primary}`,
              padding: "10px 18px",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Fingerprint size={14} /> {clockInTime ? "Clock Out" : "Clock In"}
          </button>
        </div>
      </div>

      <div
        style={{
          padding: "14px 20px 0",
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 10,
        }}
      >
        <StatCard label="Sisa Cuti" value={profile?.leave_balance_annual || 0} tone="primary" />
        <StatCard label="Kehadiran" value="96" unit="%" tone="gold" />
        <StatCard label="Lembur" value="4" unit="jam" tone="neutral" />
      </div>

      <div style={{ padding: "20px 20px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <GoldOrnament size={18} opacity={0.5} />
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>LAYANAN UTAMA</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          <ServiceTile icon={<Fingerprint />} label="Absensi" onClick={onClockInOpen} />
          <ServiceTile icon={<Calendar />} label="Cuti" onClick={() => setTab("cuti")} />
          <ServiceTile icon={<Wallet />} label="Slip Gaji" onClick={() => setTab("payroll")} />
          <ServiceTile icon={<Sparkles />} label="Tanya HR" onClick={() => setTab("ai")} featured />
        </div>
      </div>
    </div>
  );
}
