import React from "react";
import { Camera, Shield, FileText, Bell, LogOut } from "lucide-react";
import { theme } from "../theme";
import { MenuRow } from "../components/ui";

export default function ProfileScreen({ profile, onLogout, onEnrollFace }) {
  const initials =
    profile?.full_name
      ?.split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("") || "?";

  return (
    <div style={{ padding: "40px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: theme.primary,
            color: "white",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontFamily: "'Fraunces', serif",
            fontWeight: 500,
          }}
        >
          {initials}
        </div>
        <h2 style={{ fontFamily: "'Fraunces', serif", margin: "0 0 4px", fontSize: 20 }}>
          {profile?.full_name}
        </h2>
        <p style={{ fontSize: 12, color: theme.inkSoft, margin: 0 }}>{profile?.position_title}</p>
        <p style={{ fontSize: 11, color: theme.inkSoft, margin: "2px 0 0" }}>NIP {profile?.nip}</p>
      </div>

      <div
        style={{
          background: theme.surface,
          borderRadius: 14,
          border: `1px solid ${theme.border}`,
          padding: 4,
          marginBottom: 14,
        }}
      >
        <MenuRow icon={<Camera size={16} />} label="Enroll / Perbarui Wajah" onClick={onEnrollFace} />
        <MenuRow icon={<Shield size={16} />} label="Keamanan & Privasi" />
        <MenuRow icon={<FileText size={16} />} label="Kontrak & Dokumen" />
        <MenuRow icon={<Bell size={16} />} label="Notifikasi" />
      </div>

      <button
        onClick={onLogout}
        style={{
          width: "100%",
          padding: 14,
          background: "transparent",
          color: theme.danger,
          border: `1px solid ${theme.danger}40`,
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <LogOut size={14} /> Keluar
      </button>
    </div>
  );
}
