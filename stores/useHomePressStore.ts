import { create } from "zustand";

/**
 * Store minimalista para sinalizar ao HomeScreen que o tab "Hoje"
 * foi pressionado (mesmo já estando nele), disparando reset para hoje.
 */
interface HomePressState {
  pressCount: number;
  triggerHomePress: () => void;
}

export const useHomePressStore = create<HomePressState>((set) => ({
  pressCount: 0,
  triggerHomePress: () => set((s) => ({ pressCount: s.pressCount + 1 })),
}));
