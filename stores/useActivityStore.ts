import { create } from "zustand";

export type ActivityType = "caminhada" | "corrida" | "academia";
export type ActivityIntensity = "baixa" | "media" | "alta";

export interface ExerciseEntry {
  id: string;
  type: ActivityType;
  name: string;
  duration_min: number;
  intensity: ActivityIntensity;
  date: string; // YYYY-MM-DD
}

const DEFAULT_GOAL_MIN = 30;

interface ActivityState {
  entriesByDate: Record<string, ExerciseEntry[]>;
  goalMinutesPerDay: number;

  addEntry: (entry: Omit<ExerciseEntry, "id">) => void;
  getEntriesForDate: (date: string) => ExerciseEntry[];
  getTotalMinutesForDate: (date: string) => number;
  setGoalMinutes: (min: number) => void;
  reset: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
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

  setGoalMinutes: (min) =>
    set({ goalMinutesPerDay: Math.max(5, Math.min(300, min)) }),

  reset: () =>
    set({ entriesByDate: {}, goalMinutesPerDay: DEFAULT_GOAL_MIN }),
}));
