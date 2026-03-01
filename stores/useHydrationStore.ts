import { create } from "zustand";

/** Meta diária de água em litros (padrão 3 L). */
const DEFAULT_WATER_GOAL_L = 3;

/** Total de ml por data (YYYY-MM-DD). */
interface HydrationState {
  /** ml por data */
  waterByDate: Record<string, number>;
  /** Meta diária em litros */
  waterGoalL: number;

  addWater: (date: string, ml: number) => void;
  getTotalMlForDate: (date: string) => number;
  setWaterGoalL: (liters: number) => void;
  reset: () => void;
}

export const useHydrationStore = create<HydrationState>((set, get) => ({
  waterByDate: {},
  waterGoalL: DEFAULT_WATER_GOAL_L,

  addWater: (date, ml) =>
    set((state) => {
      const current = state.waterByDate[date] ?? 0;
      const next = Math.max(0, current + ml);
      return {
        waterByDate: { ...state.waterByDate, [date]: next },
      };
    }),

  getTotalMlForDate: (date) => get().waterByDate[date] ?? 0,

  setWaterGoalL: (liters) =>
    set({ waterGoalL: Math.max(0.5, Math.min(10, liters)) }),

  reset: () => set({ waterByDate: {}, waterGoalL: DEFAULT_WATER_GOAL_L }),
}));
