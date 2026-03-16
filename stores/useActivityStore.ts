import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ActivityType = "caminhada" | "corrida" | "academia";
export type ActivityIntensity = "baixa" | "media" | "alta";

export interface ExerciseEntry {
  id: string;
  type: ActivityType;
  name: string;
  duration_min: number;
  intensity: ActivityIntensity;
  kcal_burned: number; // calorias queimadas calculadas via MET
  date: string; // YYYY-MM-DD
}

/** Tabela de METs por tipo × intensidade (referência ACSM/Compendium of Physical Activities) */
const MET_TABLE: Record<ActivityType, Record<ActivityIntensity, number>> = {
  caminhada: { baixa: 2.5, media: 3.5, alta: 4.5 },
  corrida:   { baixa: 6.0, media: 8.5, alta: 11.0 },
  academia:  { baixa: 3.5, media: 5.0, alta: 7.0  },
};

/**
 * Calcula kcal queimadas usando a fórmula padrão MET:
 * kcal = MET × peso_kg × (duração_min / 60)
 */
export function calcKcalBurned(
  type: ActivityType,
  intensity: ActivityIntensity,
  duration_min: number,
  weight_kg: number
): number {
  const met = MET_TABLE[type][intensity];
  return Math.round(met * weight_kg * (duration_min / 60));
}

const DEFAULT_GOAL_MIN = 30;

interface ActivityState {
  entriesByDate: Record<string, ExerciseEntry[]>;
  goalMinutesPerDay: number;

  addEntry: (entry: Omit<ExerciseEntry, "id">) => void;
  getEntriesForDate: (date: string) => ExerciseEntry[];
  getTotalMinutesForDate: (date: string) => number;
  getTotalKcalBurnedForDate: (date: string) => number;
  setGoalMinutes: (min: number) => void;
  reset: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      entriesByDate: {},
      goalMinutesPerDay: DEFAULT_GOAL_MIN,

      addEntry: (entry) => {
        const id = generateId();
        const full: ExerciseEntry = { ...entry, id };
        set((state) => {
          const list = state.entriesByDate[entry.date] ?? [];
          return {
            entriesByDate: {
              ...state.entriesByDate,
              [entry.date]: [...list, full],
            },
          };
        });
      },

      getEntriesForDate: (date) => get().entriesByDate[date] ?? [],

      getTotalMinutesForDate: (date) => {
        const entries = get().entriesByDate[date] ?? [];
        return entries.reduce((sum, e) => sum + e.duration_min, 0);
      },

      getTotalKcalBurnedForDate: (date) => {
        const entries = get().entriesByDate[date] ?? [];
        return entries.reduce((sum, e) => sum + (e.kcal_burned ?? 0), 0);
      },

      setGoalMinutes: (min) =>
        set({ goalMinutesPerDay: Math.max(5, Math.min(300, min)) }),

      reset: () =>
        set({ entriesByDate: {}, goalMinutesPerDay: DEFAULT_GOAL_MIN }),
    }),
    {
      name: "nutrift-activity",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ goalMinutesPerDay: state.goalMinutesPerDay }),
    }
  )
);
