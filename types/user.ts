export type Plan = "free" | "pro" | "ultra";

export type UserSex = "masculino" | "feminino";
export type UserGoal = "perder_gordura" | "ganhar_massa" | "manter";
export type UserActivity =
  | "sedentario"
  | "levemente_ativo"
  | "moderado"
  | "muito_ativo";

export interface User {
  id: string;
  name: string;
  email: string;
  sex: UserSex;
  birth_date: string; // ISO date YYYY-MM-DD
  weight_kg: number;
  height_cm: number;
  goal: UserGoal;
  activity: UserActivity;
  target_weight: number;
  weekly_pace: number;
  plan: Plan;
  tmb: number;
  tdee: number;
  daily_kcal: number;
  protein_g: number;
  carbo_g: number;
  fat_g: number;
  target_date: string; // ISO date
  /** Quantas refeições o usuário costuma fazer por dia (onboarding). Padrão 4. */
  meals_per_day?: number;
  created_at?: string;
}
