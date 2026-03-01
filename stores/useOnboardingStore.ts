import { create } from "zustand";
import type {
  OnboardingData,
  Sex,
  Goal,
  Activity,
  WeeklyPace,
  DietStyle,
} from "../types/onboarding";
import { DEFAULT_ONBOARDING } from "../types/onboarding";

interface OnboardingState extends OnboardingData {
  setData: (data: Partial<OnboardingData>) => void;
  setName: (name: string) => void;
  setSex: (sex: Sex) => void;
  setAge: (age: number) => void;
  setWeight: (weight_kg: number) => void;
  setHeight: (height_cm: number) => void;
  setGoal: (goal: Goal) => void;
  setTargetWeight: (target_weight: number) => void;
  setTargetBodyFatPct: (pct: number | null) => void;
  setWeeklyPace: (pace: WeeklyPace) => void;
  setActivity: (activity: Activity) => void;
  setDietStyle: (style: DietStyle) => void;
  setMealsPerDay: (meals: number) => void;
  toggleLikedFood: (food: string) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...DEFAULT_ONBOARDING,
  setData: (data) => set((state) => ({ ...state, ...data })),
  setName: (name) => set({ name }),
  setSex: (sex) => set({ sex }),
  setAge: (age) => set({ age }),
  setWeight: (weight_kg) =>
    set((s) => ({
      weight_kg,
      target_weight:
        s.goal === "perder_gordura"
          ? Math.max(30, weight_kg - 6)
          : s.goal === "ganhar_massa"
            ? weight_kg + 4
            : weight_kg,
    })),
  setHeight: (height_cm) => set({ height_cm }),
  setGoal: (goal) =>
    set((s) => ({
      goal,
      target_weight:
        goal === "perder_gordura"
          ? Math.max(30, Math.round((s.weight_kg - 6) * 10) / 10)
          : goal === "ganhar_massa"
            ? Math.round((s.weight_kg + 4) * 10) / 10
            : s.weight_kg,
      target_body_fat_pct: goal === "perder_gordura" ? s.target_body_fat_pct : null,
    })),
  setTargetWeight: (target_weight) => set({ target_weight }),
  setTargetBodyFatPct: (target_body_fat_pct) => set({ target_body_fat_pct }),
  setWeeklyPace: (weekly_pace) => set({ weekly_pace }),
  setActivity: (activity) => set({ activity }),
  setDietStyle: (diet_style) => set({ diet_style }),
  setMealsPerDay: (meals_per_day) => set({ meals_per_day }),
  toggleLikedFood: (food) =>
    set((state) => {
      const exists = state.liked_foods.includes(food);
      return {
        liked_foods: exists
          ? state.liked_foods.filter((f) => f !== food)
          : [...state.liked_foods, food],
      };
    }),
  reset: () => set(DEFAULT_ONBOARDING),
}));
