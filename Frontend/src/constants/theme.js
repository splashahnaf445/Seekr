export const FONT = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');`;

const DARK_THEME = {
  bg: "#0A0E1A",
  surface: "#111827",
  card: "#161D2E",
  border: "#1E2A40",
  borderLight: "#243044",
  accent: "#3B82F6",
  accentGlow: "#60A5FA",
  teal: "#14B8A6",
  amber: "#F59E0B",
  red: "#EF4444",
  green: "#10B981",
  purple: "#8B5CF6",
  text: "#F1F5F9",
  textMuted: "#64748B",
  textSub: "#94A3B8",
};

const LIGHT_THEME = {
  bg: "#F8FAFC",
  surface: "#F1F5F9",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderLight: "#CBD5E1",
  accent: "#3B82F6",
  accentGlow: "#1E40AF",
  teal: "#0D9488",
  amber: "#D97706",
  red: "#DC2626",
  green: "#059669",
  purple: "#7C3AED",
  text: "#1E293B",
  textMuted: "#64748B",
  textSub: "#475569",
};

export const C = DARK_THEME;
export const THEMES = { dark: DARK_THEME, light: LIGHT_THEME };

export const getStatusConfig = (themeName) => {
  const isDark = themeName === "dark";
  const theme = themeName === "dark" ? DARK_THEME : LIGHT_THEME;
  return {
    lost: { color: theme.red, bg: isDark ? "#1A0A0A" : "#FEE2E2", label: "Lost", icon: "🔴" },
    found: { color: theme.green, bg: isDark ? "#0A1A10" : "#ECFDF5", label: "Found", icon: "🟢" },
    claimed: { color: theme.amber, bg: isDark ? "#1A140A" : "#FFFBEB", label: "Claimed", icon: "🟡" },
  };
};

export const STATUS_CONFIG = getStatusConfig("dark");
