import { create } from "zustand";
import type { FoodLogEntry, MealType } from "../types/nutrition";
import type { DayTotals } from "../types/nutrition";
import {
  fetchFoodLogsForDate,
  fetchStreak,
  aggregateTotals,
  confirmMealLogs as confirmMealService,
} from "../services/nutrition";

interface NutritionState {
  /** Data que está sendo exibida (YYYY-MM-DD). */
  date: string;
  logs: FoodLogEntry[];
  totals: DayTotals;
  /** Dias seguidos com pelo menos uma refeição confirmada (0 se não houver registros). */
  streak: number;
  isLoading: boolean;
  error: string | null;

  setDate: (date: string) => void;
  setLogs: (logs: FoodLogEntry[]) => void;
  loadForDate: (userId: string, date: string) => Promise<void>;
  confirmMeal: (userId: string, mealType: MealType) => Promise<boolean>;
  reset: () => void;
}

const emptyTotals: DayTotals = {
  kcal: 0,
  protein_g: 0,
  carbo_g: 0,
  fat_g: 0,
};

export const useNutritionStore = create<NutritionState>((set, get) => ({
  date: "",
  logs: [],
  totals: emptyTotals,
  streak: 0,
  isLoading: false,
  error: null,

  setDate: (date) => set({ date }),

  setLogs: (logs) => {
    set({ logs, totals: aggregateTotals(logs) });
  },

  loadForDate: async (userId, date) => {
    set({ isLoading: true, error: null });
    try {
      const [logs, streak] = await Promise.all([
        fetchFoodLogsForDate(userId, date),
        fetchStreak(userId),
      ]);
      set({
        date,
        logs,
        totals: aggregateTotals(logs),
        streak,
        isLoading: false,
        error: null,
      });
    } catch (e) {
      console.error("loadForDate:", e);
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : "Erro ao carregar dados",
      });
    }
  },

  confirmMeal: async (userId, mealType) => {
    const { date, logs } = get();
    if (!date) return false;
    const { error } = await confirmMealService(userId, date, mealType);
    if (error) return false;
    const updated = logs.map((log) =>
      log.meal_type === mealType ? { ...log, confirmed: true } : log
    );
    const newStreak = await fetchStreak(userId);
    set({ logs: updated, totals: aggregateTotals(updated), streak: newStreak });
    return true;
  },

  reset: () =>
    set({
      date: "",
      logs: [],
      totals: emptyTotals,
      streak: 0,
      isLoading: false,
      error: null,
    }),
}));
