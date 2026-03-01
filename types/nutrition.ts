export type MealType = "cafe" | "almoco" | "lanche" | "jantar" | "extra";

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
  almoco: "Almoço",
  lanche: "Lanche da Tarde",
  jantar: "Jantar",
  extra: "Extra",
};

export const MEAL_TYPE_ORDER: MealType[] = [
  "cafe",
  "almoco",
  "lanche",
  "jantar",
  "extra",
];

/**
 * Retorna os tipos de refeição a exibir na tela Hoje conforme a preferência
 * do usuário (onboarding). 3 = café, almoço, jantar; 4 = + lanche; 5+ = + extra.
 */
export function getMealTypesForDisplay(mealsPerDay: number): MealType[] {
  if (mealsPerDay <= 3) return ["cafe", "almoco", "jantar"];
  if (mealsPerDay === 4) return ["cafe", "almoco", "lanche", "jantar"];
  return ["cafe", "almoco", "lanche", "jantar", "extra"];
}
