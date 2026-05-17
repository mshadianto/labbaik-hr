import React, { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { auth } from "../api";
import { theme, labelStyle, inputStyle } from "../theme";
import { GoldOrnament, IslamicPattern } from "../components/Ornaments";

export default function LoginScreen({ onSuccess }) {
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${theme.primaryDeep} 0%, ${theme.primary} 100%)`,
        padding: 20,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <IslamicPattern opacity={0.08} />

      <div
        style={{
          maxWidth: 400,
          width: "100%",
          background: theme.bg,
          borderRadius: 24,
          padding: 32,
          position: "relative",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <GoldOrnament size={48} opacity={0.6} />
          <h1
            style={{
              margin: "12px 0 4px",
              fontFamily: "'Fraunces', serif",
              fontSize: 26,
              fontWeight: 500,
              color: theme.primaryDeep,
            }}
          >
            Labbaik HR
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: theme.inkSoft, letterSpacing: 0.5 }}>
            BPKH · Employee Self-Service
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nama@bpkh.go.id"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {error && (
            <div
              style={{
                padding: 12,
                background: "rgba(184,65,65,0.1)",
                borderRadius: 10,
                fontSize: 12,
                color: theme.danger,
                marginBottom: 16,
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              background: theme.primary,
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Masuk…
              </>
            ) : (
              "Masuk"
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            padding: 12,
            background: theme.accentSoft,
            borderRadius: 10,
            fontSize: 11,
            color: "#6F5016",
            lineHeight: 1.6,
          }}
        >
          <b>Demo credentials:</b>
          <br />
          ahmad.fauzi@bpkh.go.id / TesterLabbaik2026!
        </div>
      </div>
    </div>
  );
}
