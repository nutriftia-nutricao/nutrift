export type Sex = "masculino" | "feminino";

export type Goal = "perder_gordura" | "ganhar_massa" | "manter";

export type Activity =
  | "sedentario"
  | "levemente_ativo"
  | "moderado"
  | "muito_ativo";

export type WeeklyPace = 0.25 | 0.5 | 0.75 | 1.0;

export type DietStyle = "equilibrada" | "vegetariana" | "high_protein" | "keto" | "low_carb";

export interface OnboardingData {
  name: string;
  sex: Sex | null;
  birthDate: Date | null;
  age: number;
  weight_kg: number;
  height_cm: number;
  target_weight: number;
  /** Meta de % gordura corporal (só para objetivo perder gordura). Opcional. */
  target_body_fat_pct: number | null;
  goal: Goal | null;
  weekly_pace: WeeklyPace;
  activity: Activity | null;
  diet_style: DietStyle | null;
  meals_per_day: number;
  liked_foods: string[];
}

export const DEFAULT_ONBOARDING: OnboardingData = {
  name: "",
  sex: null,
  birthDate: null,
  age: 28,
  weight_kg: 75.5,
  height_cm: 178,
  target_weight: 69.5,
  target_body_fat_pct: null,
  goal: null,
  weekly_pace: 0.5,
  activity: "moderado",
  diet_style: null,
  meals_per_day: 3,
  liked_foods: [],
};
