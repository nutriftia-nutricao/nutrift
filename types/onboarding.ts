export type Sex = "masculino" | "feminino";

export type Goal = "perder_gordura" | "ganhar_massa" | "manter" | "so_acompanhar";

export type Activity =
  | "sedentario"
  | "levemente_ativo"
  | "moderado"
  | "muito_ativo";

export type WeeklyPace = 0.25 | 0.5 | 0.75 | 1.0;

export type DietType = "onivoro" | "vegetariano" | "vegano" | "low_carb";

export type Restriction = "sem_gluten" | "sem_lactose";

export type WorkoutType = "nao_pratico" | "casa" | "academia";

export type MealType =
  | "breakfast"
  | "morning_snack"
  | "lunch"
  | "afternoon_snack"
  | "extra_snack"
  | "dinner"
  | "supper";

export interface OnboardingMealEntry {
  type: MealType;
  label: string;
  emoji: string;
  default_time: string;
}

export interface OnboardingData {
  name: string;
  sex: Sex | null;
  birthDate: Date | null;
  age: number;
  weight_kg: number;
  height_cm: number;
  body_fat_pct: number | null;
  target_weight: number;
  /** Meta de % gordura corporal (só para objetivo perder gordura). Opcional. */
  target_body_fat_pct: number | null;
  goal: Goal | null;
  weekly_pace: WeeklyPace;
  activity: Activity | null;
  workout_type: WorkoutType | null;
  workout_time: string | null;
  diet_type: DietType | null;
  restrictions: Restriction[];
  meals_per_day: number;
  /** Lista de refeições definidas no onboarding (step 6). */
  meals: OnboardingMealEntry[];
  liked_foods: string[];
}

export const DEFAULT_ONBOARDING: OnboardingData = {
  name: "",
  sex: null,
  birthDate: null,
  age: 28,
  weight_kg: 75.5,
  height_cm: 178,
  body_fat_pct: null,
  target_weight: 69.5,
  target_body_fat_pct: null,
  goal: null,
  weekly_pace: 0.5,
  activity: "moderado",
  workout_type: null,
  workout_time: null,
  diet_type: "onivoro",
  restrictions: [],
  meals_per_day: 5,
  meals: [],
  liked_foods: [],
};
