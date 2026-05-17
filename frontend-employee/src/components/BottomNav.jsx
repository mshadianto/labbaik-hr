import React from "react";
import { Home, Calendar, Sparkles, Wallet, User } from "lucide-react";
import { theme } from "../theme";

export default function BottomNav({ tab, setTab }) {
  const items = [
    { id: "home", label: "Beranda", icon: Home },
    { id: "cuti", label: "Cuti", icon: Calendar },
    { id: "ai", label: "Tanya HR", icon: Sparkles, featured: true },
    { id: "payroll", label: "Gaji", icon: Wallet },
    { id: "profil", label: "Profil", icon: User },
  ];

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: theme.surface,
        borderTop: `1px solid ${theme.border}`,
        padding: "10px 8px 16px",
        display: "grid",
        gridTemplateColumns: "repeat(5,1fr)",
      }}
    >
      {items.map((it) => {
        const Icon = it.icon;
        const active = tab === it.id;
        if (it.featured) {
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  marginTop: -18,
                  background: active
                    ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDeep})`
                    : theme.accent,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(15,110,86,0.3)",
                }}
              >
                <Icon size={18} />
              </div>
              <span
                style={{
                  fontSize: 9,
                  color: active ? theme.primary : theme.inkSoft,
                  fontWeight: 500,
                }}
              >
                {it.label}
              </span>
            </button>
          );
        }
        return (
          <button
            key={it.id}
            onClick={() => setTab(it.id)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Icon size={18} style={{ color: active ? theme.primary : theme.inkSoft }} />
            <span
              style={{
                fontSize: 9,
                color: active ? theme.primary : theme.inkSoft,
                fontWeight: active ? 500 : 400,
              }}
            >
              {it.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
