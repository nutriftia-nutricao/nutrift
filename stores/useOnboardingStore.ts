import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  OnboardingData,
  OnboardingMealEntry,
  Sex,
  Goal,
  Activity,
  WeeklyPace,
  DietType,
  Restriction,
  WorkoutType,
} from "../types/onboarding";
import { DEFAULT_ONBOARDING } from "../types/onboarding";

interface OnboardingState extends OnboardingData {
  setData: (data: Partial<OnboardingData>) => void;
  setName: (name: string) => void;
  setSex: (sex: Sex) => void;
  setAge: (age: number) => void;
  setWeight: (weight_kg: number) => void;
  setHeight: (height_cm: number) => void;
  setBodyFatPct: (body_fat_pct: number | null) => void;
  setGoal: (goal: Goal) => void;
  setTargetWeight: (target_weight: number) => void;
  setTargetBodyFatPct: (pct: number | null) => void;
  setWeeklyPace: (pace: WeeklyPace) => void;
  setActivity: (activity: Activity) => void;
  setWorkoutType: (type: WorkoutType) => void;
  setWorkoutTime: (time: string | null) => void;
  setDietType: (type: DietType) => void;
  toggleRestriction: (restriction: Restriction) => void;
  setMealsPerDay: (meals: number) => void;
  setMeals: (meals: OnboardingMealEntry[]) => void;
  toggleLikedFood: (food: string) => void;
  reset: () => void;
}

type OnboardingPersistedSlice = Pick<
  OnboardingData,
  | "name"
  | "sex"
  | "age"
  | "weight_kg"
  | "height_cm"
  | "body_fat_pct"
  | "target_weight"
  | "target_body_fat_pct"
  | "goal"
  | "weekly_pace"
  | "activity"
  | "workout_type"
  | "workout_time"
  | "diet_type"
  | "restrictions"
  | "meals_per_day"
  | "meals"
  | "liked_foods"
>;

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
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
                : s.goal === "definir_corpo"
                  ? Math.max(30, weight_kg - 3)
                  : weight_kg, // recomposicao: peso neutro
        })),
      setHeight: (height_cm) => set({ height_cm }),
      setBodyFatPct: (body_fat_pct) => set({ body_fat_pct }),
      setGoal: (goal) =>
        set((s) => ({
          goal,
          target_weight:
            goal === "perder_gordura"
              ? Math.max(30, Math.round((s.weight_kg - 6) * 10) / 10)
              : goal === "ganhar_massa"
                ? Math.round((s.weight_kg + 4) * 10) / 10
                : goal === "definir_corpo"
                  ? Math.max(30, Math.round((s.weight_kg - 3) * 10) / 10)
                  : s.weight_kg, // recomposicao: peso neutro
          target_body_fat_pct:
            goal === "perder_gordura" || goal === "definir_corpo"
              ? s.target_body_fat_pct
              : null,
        })),
      setTargetWeight: (target_weight) => set({ target_weight }),
      setTargetBodyFatPct: (target_body_fat_pct) => set({ target_body_fat_pct }),
      setWeeklyPace: (weekly_pace) => set({ weekly_pace }),
      setActivity: (activity) => set({ activity }),
      setWorkoutType: (workout_type) => set({ workout_type }),
      setWorkoutTime: (workout_time) => set({ workout_time }),
      setDietType: (diet_type) => set({ diet_type }),
      toggleRestriction: (restriction) =>
        set((state) => {
          const exists = state.restrictions.includes(restriction);
          return {
            restrictions: exists
              ? state.restrictions.filter((r) => r !== restriction)
              : [...state.restrictions, restriction],
          };
        }),
      setMealsPerDay: (meals_per_day) => set({ meals_per_day }),
      setMeals: (meals) => set({ meals }),
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
    }),
    {
      name: "nutrift-onboarding",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): OnboardingPersistedSlice => ({
        name: state.name,
        sex: state.sex,
        age: state.age,
        weight_kg: state.weight_kg,
        height_cm: state.height_cm,
        body_fat_pct: state.body_fat_pct,
        target_weight: state.target_weight,
        target_body_fat_pct: state.target_body_fat_pct,
        goal: state.goal,
        weekly_pace: state.weekly_pace,
        activity: state.activity,
        workout_type: state.workout_type,
        workout_time: state.workout_time,
        diet_type: state.diet_type,
        restrictions: state.restrictions,
        meals_per_day: state.meals_per_day,
        meals: state.meals,
        liked_foods: state.liked_foods,
      }),
    }
  )
);
