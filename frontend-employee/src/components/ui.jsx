import React from "react";
import { ChevronRight } from "lucide-react";
import { theme, inputStyle } from "../theme";
import { GoldOrnament } from "./Ornaments";

export function ScreenHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
      <GoldOrnament size={24} opacity={0.45} />
      <div>
        <h1 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500 }}>
          {title}
        </h1>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: theme.inkSoft }}>{subtitle}</p>
      </div>
    </div>
  );
}

export function Field({ label, type = "text", ...rest }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          fontSize: 11,
          color: theme.inkSoft,
          display: "block",
          marginBottom: 6,
          letterSpacing: 0.3,
        }}
      >
        {label.toUpperCase()}
      </label>
      {type === "textarea" ? (
        <textarea
          rows={3}
          {...rest}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      ) : (
        <input type={type} {...rest} style={inputStyle} />
      )}
    </div>
  );
}

export function Badge({ children, tone }) {
  const tones = {
    success: { bg: "rgba(15,110,86,0.12)", fg: theme.primaryDeep },
    danger: { bg: "rgba(184,65,65,0.12)", fg: "#7A1F1F" },
    warning: { bg: "rgba(198,139,42,0.14)", fg: "#6F4A12" },
  };
  const t = tones[tone] || tones.warning;
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 500,
        background: t.bg,
        color: t.fg,
      }}
    >
      {children}
    </span>
  );
}

export function StatCard({ label, value, unit, tone }) {
  const bg =
    tone === "primary"
      ? "rgba(15,110,86,0.08)"
      : tone === "gold"
      ? theme.accentSoft
      : "rgba(10,42,35,0.04)";
  const fg = tone === "primary" ? theme.primaryDeep : tone === "gold" ? "#6F5016" : theme.ink;
  return (
    <div style={{ background: bg, borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
      <div
        style={{ fontSize: 20, fontWeight: 600, color: fg, fontFamily: "'Fraunces', serif" }}
      >
        {value}
        {unit && <span style={{ fontSize: 12, marginLeft: 2 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 9, color: fg, opacity: 0.75, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </div>
    </div>
  );
}

export function ServiceTile({ icon, label, onClick, featured }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: featured ? theme.accentSoft : theme.surface,
        border: `1px solid ${featured ? theme.accent + "60" : theme.border}`,
        borderRadius: 14,
        padding: "12px 6px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: featured ? theme.accent : "rgba(15,110,86,0.08)",
          color: featured ? "white" : theme.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {React.cloneElement(icon, { size: 16 })}
      </div>
      <span style={{ fontSize: 10, color: theme.ink, fontWeight: 500 }}>{label}</span>
    </button>
  );
}

export function MenuRow({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "14px 12px",
        background: "transparent",
        border: "none",
        borderBottom: `1px solid ${theme.border}`,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: theme.accentSoft,
          color: theme.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <span style={{ flex: 1, fontSize: 13 }}>{label}</span>
      <ChevronRight size={14} style={{ color: theme.inkSoft }} />
    </button>
  );
}
