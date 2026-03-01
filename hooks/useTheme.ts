import { useThemeStore } from "../stores/useThemeStore";
import { Colors } from "../constants/colors";

export const DarkColors = {
  // Verdes — mantidos
  green: Colors.green,
  greenDark: Colors.greenDark,
  greenLight: "#1A2E1A",
  greenMid: Colors.greenMid,

  // Azuis
  blue: Colors.blue,
  blueDark: Colors.blueDark,
  blueBg: "#0F1E33",

  // Fundos
  background: "#0F0F0F",
  surface: "#1C1C1E",
  surfaceMuted: "#1C1C1E",
  surfaceDark: "#000000",

  // Textos
  text: "#F2F2F7",
  textSecondary: "#AEAEB2",
  textMuted: "#636366",

  // Bordas
  border: "#2C2C2E",

  // Macros
  protein: "#FF6B6B",
  proteinBg: "#2D1515",
  carbo: "#FFB347",
  carboBg: "#2D2010",
  fat: "#5CB85C",
  fatBg: "#152D15",

  // Estados
  error: "#FF453A",
  errorBg: "#2D1515",
  warning: "#FFD60A",
  success: "#32D74B",
} as const;

export type ThemeColors = typeof Colors;

export function useTheme() {
  const isDark = useThemeStore((s) => s.isDark);
  const C: ThemeColors = isDark ? (DarkColors as unknown as ThemeColors) : Colors;
  return { isDark, C };
}
