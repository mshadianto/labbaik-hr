import React, { useState } from "react";
import { Sparkles, Send, Loader2, FileText } from "lucide-react";
import { tanyaHR } from "../api";
import { theme, inputStyle } from "../theme";
import { IslamicPattern } from "../components/Ornaments";

export default function AIScreen() {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Assalamu'alaikum, saya asisten HR BPKH. Apa yang ingin ditanyakan seputar Perka Kepegawaian, SOP Cuti, Remunerasi, atau aturan Komite Audit?",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const ask = async (text) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setThinking(true);
    try {
      const result = await tanyaHR.ask(text);
      setMessages((m) => [
        ...m,
        { role: "ai", text: result.answer, sources: result.sources || [] },
      ]);
    } catch (err) {
      setMessages((m) => [...m, { role: "ai", text: `Maaf, terjadi kendala: ${err.message}` }]);
    } finally {
      setThinking(false);
    }
  };

  const suggestions = [
    "Berapa hari cuti haji saya?",
    "Aturan SPPD dinas ke KSA?",
    "Cara klaim reimburse pelatihan?",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          padding: "20px 20px 14px",
          background: `linear-gradient(135deg, ${theme.primaryDeep}, ${theme.primary})`,
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <IslamicPattern opacity={0.08} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: theme.accent,
              color: theme.primaryDeep,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                fontFamily: "'Fraunces', serif",
              }}
            >
              Tanya HR
            </div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>AI · RAG atas Perka BPKH & SOP</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", background: theme.bg }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                maxWidth: "82%",
                background: m.role === "user" ? theme.primary : theme.surface,
                color: m.role === "user" ? "white" : theme.ink,
                padding: "10px 14px",
                borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                fontSize: 13,
                lineHeight: 1.55,
                border: m.role === "ai" ? `1px solid ${theme.border}` : "none",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
              {m.sources && m.sources.length > 0 && (
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: `1px solid ${theme.border}`,
                  }}
                >
                  <div style={{ fontSize: 10, color: theme.inkSoft, marginBottom: 6 }}>SUMBER</div>
                  {m.sources.map((s, j) => (
                    <div
                      key={j}
                      style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}
                    >
                      <FileText size={10} style={{ color: theme.accent }} />
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
            <div
              style={{
                background: theme.surface,
                padding: "10px 14px",
                borderRadius: "16px 16px 16px 4px",
                border: `1px solid ${theme.border}`,
                display: "flex",
                gap: 4,
              }}
            >
              <Loader2
                size={14}
                style={{ color: theme.primary, animation: "spin 1s linear infinite" }}
              />
              <span style={{ fontSize: 12, color: theme.inkSoft }}>Mencari jawaban…</span>
            </div>
          </div>
        )}
      </div>

      {messages.length === 1 && (
        <div style={{ padding: "0 16px 8px", background: theme.bg }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: 14, background: theme.surface, borderTop: `1px solid ${theme.border}` }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(input)}
            placeholder="Tanyakan sesuatu..."
            style={{ ...inputStyle, borderRadius: 999, flex: 1 }}
          />
          <button
            onClick={() => ask(input)}
            disabled={!input.trim()}
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: input.trim() ? theme.primary : theme.border,
              color: "white",
              border: "none",
              cursor: input.trim() ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
