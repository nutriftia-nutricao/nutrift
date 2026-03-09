export type MealType =
  | "cafe"
  | "lanche_manha"
  | "almoco"
  | "lanche"
  | "jantar"
  | "pre_treino"
  | "pos_treino"
  | "extra";

export interface FoodLogEntry {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  meal_type: MealType;
  food_id: string | null;
  food_name: string;
  quantity_g: number;
  kcal: number;
  protein_g: number;
  carbo_g: number;
  fat_g: number;
  confirmed: boolean;
  created_at: string;
}

export interface DayTotals {
  kcal: number;
  protein_g: number;
  carbo_g: number;
  fat_g: number;
}

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  cafe: "Café da Manhã",
  lanche_manha: "Lanche da Manhã",
  almoco: "Almoço",
  lanche: "Lanche da Tarde",
  jantar: "Jantar",
  pre_treino: "Pré-treino",
  pos_treino: "Pós-treino",
  extra: "Extra",
};

export const MEAL_TYPE_ORDER: MealType[] = [
  "cafe",
  "lanche_manha",
  "almoco",
  "lanche",
  "jantar",
  "pre_treino",
  "pos_treino",
  "extra",
];

/**
 * Retorna os tipos de refeição a exibir na tela Hoje conforme a preferência
 * do usuário (onboarding).
 *
 * 3  → café, almoço, jantar
 * 4  → + lanche da tarde
 * 5  → + lanche da manhã
 * 6  → + pós-treino
 * 7+ → + pré-treino
 */
export function getMealTypesForDisplay(mealsPerDay: number): MealType[] {
  if (mealsPerDay <= 3) return ["cafe", "almoco", "jantar"];
  if (mealsPerDay === 4) return ["cafe", "almoco", "lanche", "jantar"];
  if (mealsPerDay === 5) return ["cafe", "lanche_manha", "almoco", "lanche", "jantar"];
  if (mealsPerDay === 6) return ["cafe", "lanche_manha", "almoco", "lanche", "jantar", "pos_treino"];
  // 7 ou mais: inclui pré-treino
  return ["cafe", "lanche_manha", "almoco", "lanche", "pre_treino", "jantar", "pos_treino"];
}
