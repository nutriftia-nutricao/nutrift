import { create } from "zustand";
import type { MealType } from "../types/nutrition";

export interface PlannedFood {
  id: string;
  name: string;
  quantity_g: number;
  kcal: number;
  protein_g: number;
  carbo_g: number;
  fat_g: number;
  checked: boolean;
}

export interface PlannedMeal {
  type: MealType;
  date: string; // YYYY-MM-DD
  time: string;
  kcalRange: string;
  foods: PlannedFood[];
}

interface WeeklyPlanState {
  plans: PlannedMeal[];
  setPlans: (plans: PlannedMeal[]) => void;
  toggleFoodCheck: (date: string, mealType: MealType, foodId: string) => void;
  replaceFood: (date: string, mealType: MealType, foodId: string, newFood: Omit<PlannedFood, "checked">) => void;
  getPlansForDate: (date: string) => PlannedMeal[];
  isMealComplete: (date: string, mealType: MealType) => boolean;
}

export const useWeeklyPlanStore = create<WeeklyPlanState>((set, get) => ({
  plans: generateMockWeeklyPlan(),
  
  setPlans: (plans) => set({ plans }),
  
  toggleFoodCheck: (date, mealType, foodId) =>
    set((state) => ({
      plans: state.plans.map((plan) => {
        if (plan.date === date && plan.type === mealType) {
          return {
            ...plan,
            foods: plan.foods.map((food) =>
              food.id === foodId ? { ...food, checked: !food.checked } : food
            ),
          };
        }
        return plan;
      }),
    })),
  
  replaceFood: (date, mealType, foodId, newFood) =>
    set((state) => ({
      plans: state.plans.map((plan) => {
        if (plan.date === date && plan.type === mealType) {
          return {
            ...plan,
            foods: plan.foods.map((food) =>
              food.id === foodId
                ? { ...newFood, checked: false }
                : food
            ),
          };
        }
        return plan;
      }),
    })),
  
  getPlansForDate: (date) => {
    return get().plans.filter((p) => p.date === date);
  },
  
  isMealComplete: (date, mealType) => {
    const meal = get().plans.find((p) => p.date === date && p.type === mealType);
    if (!meal || meal.foods.length === 0) return false;
    return meal.foods.every((f) => f.checked);
  },
}));

/** Gera plano mock para a semana atual (será substituído por geração IA). */
function generateMockWeeklyPlan(): PlannedMeal[] {
  const today = new Date();
  const todayISO = today.toISOString().split("T")[0];
  
  // Plano apenas para hoje (pode expandir para a semana toda)
  return [
    {
      type: "cafe",
      date: todayISO,
      time: "08:30",
      kcalRange: "488 - 536 kcal",
      foods: [
        { id: "c1", name: "Ovos Mexidos", quantity_g: 100, kcal: 140, protein_g: 12, carbo_g: 1, fat_g: 10, checked: false },
        { id: "c2", name: "Abacate", quantity_g: 100, kcal: 160, protein_g: 2, carbo_g: 8, fat_g: 15, checked: false },
        { id: "c3", name: "Pão Integral", quantity_g: 50, kcal: 120, protein_g: 4, carbo_g: 22, fat_g: 2, checked: false },
      ],
    },
    {
      type: "almoco",
      date: todayISO,
      time: "12:30",
      kcalRange: "650 - 720 kcal",
      foods: [
        { id: "a1", name: "Arroz Integral", quantity_g: 150, kcal: 215, protein_g: 5, carbo_g: 45, fat_g: 2, checked: false },
        { id: "a2", name: "Frango Grelhado", quantity_g: 120, kcal: 165, protein_g: 31, carbo_g: 0, fat_g: 4, checked: false },
        { id: "a3", name: "Feijão Preto", quantity_g: 100, kcal: 130, protein_g: 8, carbo_g: 23, fat_g: 1, checked: false },
        { id: "a4", name: "Salada Verde", quantity_g: 80, kcal: 40, protein_g: 2, carbo_g: 8, fat_g: 0, checked: false },
        { id: "a5", name: "Azeite (1 colher)", quantity_g: 10, kcal: 100, protein_g: 0, carbo_g: 0, fat_g: 11, checked: false },
      ],
    },
    {
      type: "lanche",
      date: todayISO,
      time: "16:00",
      kcalRange: "180 - 220 kcal",
      foods: [
        { id: "l1", name: "Iogurte Natural", quantity_g: 170, kcal: 120, protein_g: 10, carbo_g: 12, fat_g: 3, checked: false },
        { id: "l2", name: "Granola", quantity_g: 30, kcal: 80, protein_g: 2, carbo_g: 15, fat_g: 2, checked: false },
      ],
    },
    {
      type: "jantar",
      date: todayISO,
      time: "20:00",
      kcalRange: "520 - 580 kcal",
      foods: [
        { id: "j1", name: "Salmão Assado", quantity_g: 120, kcal: 200, protein_g: 20, carbo_g: 0, fat_g: 13, checked: false },
        { id: "j2", name: "Batata Doce", quantity_g: 100, kcal: 86, protein_g: 2, carbo_g: 20, fat_g: 0, checked: false },
        { id: "j3", name: "Brócolis no Vapor", quantity_g: 100, kcal: 55, protein_g: 4, carbo_g: 11, fat_g: 1, checked: false },
        { id: "j4", name: "Salada de Tomate", quantity_g: 80, kcal: 30, protein_g: 1, carbo_g: 7, fat_g: 0, checked: false },
        { id: "j5", name: "Azeite (1 colher)", quantity_g: 10, kcal: 100, protein_g: 0, carbo_g: 0, fat_g: 11, checked: false },
      ],
    },
  ];
}
