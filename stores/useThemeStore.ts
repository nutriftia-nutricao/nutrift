import { create } from "zustand";

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setDark: (v: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,
  toggle: () => set((s) => ({ isDark: !s.isDark })),
  setDark: (isDark) => set({ isDark }),
}));
