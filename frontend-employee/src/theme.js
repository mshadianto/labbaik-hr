/**
 * theme.js — HCMS design tokens & shared styles.
 */

export const theme = {
  bg: "#F7F5EE",
  surface: "#FFFFFF",
  ink: "#0A2A23",
  inkSoft: "#3D5A50",
  primary: "#0F6E56",
  primaryDeep: "#085041",
  accent: "#C9A85C",
  accentSoft: "#F5EBD3",
  border: "rgba(10,42,35,0.12)",
  danger: "#B84141",
  warning: "#C68B2A",
};

export const labelStyle = {
  fontSize: 10,
  color: theme.inkSoft,
  letterSpacing: 0.5,
  display: "block",
  marginBottom: 6,
};

export const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: `1px solid ${theme.border}`,
  fontSize: 14,
  background: theme.surface,
  color: theme.ink,
  boxSizing: "border-box",
};

export const primaryBtn = {
  width: "100%",
  padding: 14,
  background: theme.primary,
  color: "white",
  border: "none",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pop { 0% { transform: scale(0); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #E8E3D4; }
  input:focus, textarea:focus { outline: none; border-color: ${theme.primary} !important; }
  button { font-family: inherit; }
`;
