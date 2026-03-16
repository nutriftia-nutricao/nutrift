export type Plan = "free" | "trial" | "pro" | "ultra";

export type UserSex = "masculino" | "feminino";
export type UserGoal = "perder_gordura" | "ganhar_massa" | "definir_corpo" | "recomposicao";
export type UserActivity =
  | "sedentario"
  | "levemente_ativo"
  | "moderado"
  | "muito_ativo";

export type UserWorkoutType = "nao_pratico" | "casa" | "academia";
export type UserDietType = "onivoro" | "vegetariano" | "vegano" | "low_carb";
export type UserRestriction = "sem_gluten" | "sem_lactose";

export interface User {
  id: string;
  name: string;
  email: string;
  sex: UserSex;
  birth_date: string; // ISO date YYYY-MM-DD
  weight_kg: number;
  height_cm: number;
  body_fat_pct?: number | null;
  goal: UserGoal;
  activity: UserActivity;
  workout_type?: UserWorkoutType | null;
  workout_time?: string | null;
  target_weight: number;
  target_body_fat_pct?: number | null;
  weekly_pace: number;
  diet_type?: UserDietType | null;
  restrictions?: UserRestriction[];
  plan: Plan;
  is_pro?: boolean;
  trial_ends_at?: string | null;
  last_plan_generated_at?: string | null;
  tmb: number;
  tdee: number;
  daily_kcal: number;
  protein_g: number;
  carbo_g: number;
  fat_g: number;
  hydration_ml: number;
  /** Percentuais customizados pelo usuário (0-100). Null = usa defaults do objetivo. */
  protein_pct?: number | null;
  carbo_pct?: number | null;
  fat_pct?: number | null;
  target_date: string; // ISO date
  /** Quantas refeições o usuário costuma fazer por dia (onboarding). Padrão 4. */
  meals_per_day?: number;
  meals?: Array<{
    type: string;
    label: string;
    emoji: string;
    default_time: string;
  }>;
  /** Alimentos preferidos selecionados no onboarding (para personalizar plano). */
  liked_foods?: string[];
  /** Se o usuário completou o onboarding (obrigatório para novos usuários OAuth). */
  onboarding_completed?: boolean;
  avatar_url?: string | null;
  created_at?: string;
}
