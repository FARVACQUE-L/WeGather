// Couleurs reprises de client/src/App.css pour garder le design du site.
export const colors = {
  background: "#fff8f5",
  neutral: "#ffffff",
  title: "#a53b22",
  text: "#1f1b18",
  textMuted: "#8b716b",
  border: "#dec0b9",
  accent: "#ff7e5f",
  accentDark: "#a53b22",
  positive: "#059669",
  negative: "#e11d48",
} as const;

export const fonts = {
  regular: "BeVietnamPro_400Regular",
  semiBold: "BeVietnamPro_600SemiBold",
  bold: "BeVietnamPro_700Bold",
  boldItalic: "BeVietnamPro_700Bold_Italic",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
