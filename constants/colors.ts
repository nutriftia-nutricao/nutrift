export const Colors = {
  // Primária
  primary: "#CAFF66",
  primaryDark: "#A8D94A",
  primaryLight: "#EDFFC0",

  // Fundos (Dark Mode padrão)
  background: "#111111", // bg-base
  surface: "#1C1C1C",    // bg-card
  surfaceElevated: "#252525", // bg-elevated

  // Textos
  text: "#FFFFFF",          // text-primary
  textSecondary: "#B3B3B3", // text-secondary
  textDisabled: "#4D4D4D",  // text-disabled
  textInverse: "#111111",   // Texto sobre cor primária (SEMPRE PRETO)
  textMuted: "#777777",     // texto secundário mais sutil

  // Bordas
  border: "#333333",
  borderSubtle: "#2A2A2A",

  // Semânticas
  success: "#45C588",
  error: "#FF6F43",
  warning: "#F59E0B",
  errorBg: "#3D1F14",

  // Macros (consistentes em todo o app)
  protein: "#FF6F43",
  proteinBg: "#3D1F14",
  carbo: "#F59E0B",
  carboBg: "#3D2E0A",
  fat: "#45C588",
  fatBg: "#1A3D2E",

  // Legado (manter compatibilidade se necessário, mas evitar uso)
  green: "#CAFF66",
  greenDark: "#A8D94A",
  greenLight: "rgba(202,255,102,0.12)",
  blue: "#3B82F6",
  blueDark: "#1D4ED8",
  blueBg: "#10233D",
} as const;
