import { C } from "./theme";

export const S = {
  app: { fontFamily: "'Sora', sans-serif", background: C.bg, minHeight: "100vh", color: C.text },
  // Sidebar
  sidebar: { width: 240, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 },
  logo: { padding: "24px 20px 20px", borderBottom: `1px solid ${C.border}` },
  logoText: { fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "-0.5px" },
  logoSub: { fontSize: 11, color: C.textMuted, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" },
  navItem: (active) => ({ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", cursor: "pointer", borderRadius: 8, margin: "2px 10px", background: active ? `${C.accent}18` : "transparent", color: active ? C.accentGlow : C.textSub, fontWeight: active ? 600 : 400, fontSize: 14, transition: "all 0.15s", borderLeft: active ? `2px solid ${C.accent}` : "2px solid transparent" }),
  // Main
  main: { marginLeft: 240, padding: "28px 32px", minHeight: "100vh" },
  pageTitle: { fontSize: 24, fontWeight: 700, marginBottom: 4, color: C.text },
  pageSub: { fontSize: 13, color: C.textMuted, marginBottom: 28 },
  // Cards
  card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px" },
  // Buttons
  btn: (variant = "primary") => ({
    padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "'Sora', sans-serif",
    fontWeight: 600, fontSize: 13, transition: "all 0.15s",
    ...(variant === "primary" ? { background: C.accent, color: "#fff" }
      : variant === "ghost" ? { background: "transparent", color: C.textSub, border: `1px solid ${C.border}` }
      : variant === "danger" ? { background: "#1A0A0A", color: C.red, border: `1px solid ${C.red}30` }
      : variant === "success" ? { background: "#0A1A10", color: C.green, border: `1px solid ${C.green}30` }
      : { background: C.surface, color: C.text, border: `1px solid ${C.border}` })
  }),
  // Form
  input: { background: "#0D1421", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontFamily: "'Sora', sans-serif", fontSize: 14, width: "100%", outline: "none" },
  label: { fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6, display: "block", letterSpacing: "0.5px", textTransform: "uppercase" },
  // Stat card
  stat: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px" },
  statNum: { fontSize: 28, fontWeight: 700, color: C.text },
  statLabel: { fontSize: 12, color: C.textMuted, marginTop: 4 },
  // Item card
  itemCard: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", transition: "border-color 0.15s" },
  badge: (color, bg) => ({ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, color, background: bg, border: `1px solid ${color}30` }),
  tag: { fontSize: 11, color: C.textMuted, background: "#0D1421", padding: "2px 8px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace" },
  // Notif dot
  dot: { width: 8, height: 8, borderRadius: "50%", background: C.red, display: "inline-block" },
  // Auth
  authWrap: { minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" },
  authCard: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "40px 36px", width: 400 },
};
