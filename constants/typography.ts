// Usa fontes do sistema para evitar tela branca (Syne/DM Sans exigem carregamento)
// "sans-serif" funciona em web; em native usa fallback do sistema
const fontFamily = "sans-serif";

export const Typography = {
  // Títulos
  h1: { fontFamily, fontSize: 32, letterSpacing: -1, fontWeight: "700" as const },
  h2: { fontFamily, fontSize: 24, letterSpacing: -0.5, fontWeight: "600" as const },
  h3: { fontFamily, fontSize: 20, fontWeight: "600" as const },
  h4: { fontFamily, fontSize: 17, fontWeight: "500" as const },

  // Corpo
  body: { fontFamily, fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
  bodySmall: { fontFamily, fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  label: {
    fontFamily,
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    fontWeight: "500" as const,
  },
  caption: { fontFamily, fontSize: 12, fontWeight: "400" as const },
} as const;

