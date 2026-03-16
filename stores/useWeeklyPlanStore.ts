import { create } from "zustand";
import type { MealType } from "../types/nutrition";
import { supabase, isSupabaseConfigured } from "../services/supabase";

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

export type WeeklyPlanStatus = "idle" | "loading" | "loaded" | "error";

type WeeklyPlanRow = {
  id: string;
  week_start: string;
  plan_meals: {
    id: string;
    day_of_week: string;
    meal_type: MealType;
    scheduled_time: string | null;
    plan_meal_foods: {
      id: string;
      food_name: string;
      quantity_g: number | null;
      kcal: number | null;
      protein_g: number | null;
      carbo_g: number | null;
      fat_g: number | null;
      is_checked: boolean | null;
      checked_at: string | null;
      taco_id: number | null;
    }[];
  }[];
};

interface WeeklyPlanState {
  plans: PlannedMeal[];
  status: WeeklyPlanStatus;
  errorMessage?: string;

  setPlans: (plans: PlannedMeal[]) => void;
  loadWeeklyPlan: (userId: string, weekStartISO: string) => Promise<void>;
  toggleFoodCheck: (date: string, mealType: MealType, foodId: string) => Promise<void>;
  replaceFood: (date: string, mealType: MealType, foodId: string, newFood: Omit<PlannedFood, "checked">) => void;
  updateFood: (date: string, mealType: MealType, foodId: string, patch: Partial<PlannedFood>) => void;
  removeFood: (date: string, mealType: MealType, foodId: string) => void;
  getPlansForDate: (date: string) => PlannedMeal[];
  isMealComplete: (date: string, mealType: MealType) => boolean;
}

export const useWeeklyPlanStore = create<WeeklyPlanState>((set, get) => ({
  plans: [],
  status: "idle",
  errorMessage: undefined,

  setPlans: (plans) => set({ plans }),

  loadWeeklyPlan: async (userId, weekStartISO) => {
    set({ status: "loading", errorMessage: undefined });

    try {
      // Ambiente local sem Supabase configurado â†’ mantÃ©m comportamento anterior com plano mock
      if (!isSupabaseConfigured) {
        const mock = generateMockWeeklyPlan(weekStartISO);
        set({ plans: mock, status: "loaded" });
        return;
      }

      const { data, error } = await supabase
        .from("weekly_plans")
        .select(
          `
            id,
            week_start,
            plan_meals (
              id,
              day_of_week,
              meal_type,
              scheduled_time,
              plan_meal_foods (
                id,
                food_name,
                quantity_g,
                kcal,
                protein_g,
                carbo_g,
                fat_g,
                is_checked,
                checked_at,
                taco_id
              )
            )
          `
        )
        .eq("user_id", userId)
        .eq("week_start", weekStartISO)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        // Sem plano ativo no banco â†’ fallback local com mock para nÃ£o quebrar a tela Hoje
        set({ plans: [], status: "loaded" });
        return;
      }

      const row = data as unknown as WeeklyPlanRow;

      if (!row.plan_meals || row.plan_meals.length === 0) {
        set({ plans: [], status: "loaded" });
        return;
      }

      const plans = mapWeeklyPlanRowToPlannedMeals(row);

      set({ plans, status: "loaded" });
    } catch (err) {
      // Em caso de erro (Supabase offline, credenciais, etc.), ainda assim
      // garantimos um plano mock para nÃ£o deixar a tela Hoje vazia.
      console.error("[WeeklyPlan] Erro ao carregar plano:", err);
      set({
        plans: [],
        status: "error",
        errorMessage: "Não foi possível carregar o plano semanal.",
      });
    }
  },
  
  toggleFoodCheck: async (date: string, mealType: MealType, foodId: string) => {
    const state = get();
    const plan = state.plans.find((p) => p.date === date && p.type === mealType);
    const food = plan?.foods.find((f) => f.id === foodId);
    if (!food) return;

    const newChecked = !food.checked;

    // Atualizar Zustand imediatamente (otimista)
    set((state) => ({
      plans: state.plans.map((p) =>
        p.date !== date || p.type !== mealType
          ? p
          : {
              ...p,
              foods: p.foods.map((f) =>
                f.id !== foodId ? f : { ...f, checked: newChecked }
              ),
            }
      ),
    }));

    // Persistir no Supabase
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from("plan_meal_foods")
        .update({
          is_checked: newChecked,
          checked_at: newChecked ? new Date().toISOString() : null,
        })
        .eq("id", foodId);

      // Reverter se falhou
      if (error) {
        console.error("[WeeklyPlan] Erro ao persistir checkbox:", error);
        set((state) => ({
          plans: state.plans.map((p) =>
            p.date !== date || p.type !== mealType
              ? p
              : {
                  ...p,
                  foods: p.foods.map((f) =>
                    f.id !== foodId ? f : { ...f, checked: !newChecked }
                  ),
                }
          ),
        }));
      }
    }
  },
  
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

  updateFood: (date, mealType, foodId, patch) =>
    set((state) => ({
      plans: state.plans.map((plan) => {
        if (plan.date !== date || plan.type !== mealType) return plan;
        return {
          ...plan,
          foods: plan.foods.map((food) =>
            food.id === foodId ? { ...food, ...patch } : food
          ),
        };
      }),
    })),

  removeFood: (date, mealType, foodId) =>
    set((state) => ({
      plans: state.plans.map((plan) => {
        if (plan.date !== date || plan.type !== mealType) return plan;
        return {
          ...plan,
          foods: plan.foods.filter((food) => food.id !== foodId),
        };
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

function mapWeeklyPlanRowToPlannedMeals(row: WeeklyPlanRow): PlannedMeal[] {
  const dayOffsets: Record<string, number> = {
    monday: 0, tuesday: 1, wednesday: 2, thursday: 3,
    friday: 4, saturday: 5, sunday: 6,
  };

  const weekStart = new Date(`${row.week_start}T12:00:00`);

  const toDateISO = (dayOfWeek: string): string => {
    const offset = dayOffsets[dayOfWeek.toLowerCase()] ?? 0;
    const d = new Date(weekStart);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };

  const result: PlannedMeal[] = [];

  for (const meal of row.plan_meals ?? []) {
    const date = toDateISO(meal.day_of_week);

    const foods: PlannedFood[] = (meal.plan_meal_foods ?? []).map((pmf) => ({
      id: pmf.id,
      name: pmf.food_name ?? "Alimento",
      quantity_g: pmf.quantity_g ?? 100,
      kcal: Math.round(pmf.kcal ?? 0),
      protein_g: Math.round(pmf.protein_g ?? 0),
      carbo_g: Math.round(pmf.carbo_g ?? 0),
      fat_g: Math.round(pmf.fat_g ?? 0),
      checked: Boolean(pmf.is_checked),
    }));

    const totalKcal = foods.reduce((sum, f) => sum + f.kcal, 0);

    result.push({
      type: meal.meal_type,
      date,
      time: (meal.scheduled_time ?? "").slice(0, 5),
      kcalRange: `${totalKcal} kcal`,
      foods,
    });
  }

  return result;
}

/** Gera plano mock para a semana inteira (fallback local quando Supabase nÃ£o estÃ¡ configurado). */
function generateMockWeeklyPlan(baseDateISO: string): PlannedMeal[] {
  const weekStart = new Date(`${baseDateISO}T12:00:00`);

  const result: PlannedMeal[] = [];

  for (let offset = 0; offset < 7; offset++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + offset);
    const dateISO = d.toISOString().slice(0, 10);

    result.push(
      {
        type: "cafe",
        date: dateISO,
        time: "08:30",
        kcalRange: "488 - 536 kcal",
        foods: [
          { id: "c1", name: "Ovos Mexidos", quantity_g: 100, kcal: 140, protein_g: 12, carbo_g: 1, fat_g: 10, checked: false },
          { id: "c2", name: "Abacate", quantity_g: 100, kcal: 160, protein_g: 2, carbo_g: 8, fat_g: 15, checked: false },
          { id: "c3", name: "PÃ£o Integral", quantity_g: 50, kcal: 120, protein_g: 4, carbo_g: 22, fat_g: 2, checked: false },
        ],
      },
      {
        type: "almoco",
        date: dateISO,
        time: "12:30",
        kcalRange: "650 - 720 kcal",
        foods: [
          { id: "a1", name: "Arroz Integral", quantity_g: 150, kcal: 215, protein_g: 5, carbo_g: 45, fat_g: 2, checked: false },
          { id: "a2", name: "Frango Grelhado", quantity_g: 120, kcal: 165, protein_g: 31, carbo_g: 0, fat_g: 4, checked: false },
          { id: "a3", name: "FeijÃ£o Preto", quantity_g: 100, kcal: 130, protein_g: 8, carbo_g: 23, fat_g: 1, checked: false },
          { id: "a4", name: "Salada Verde", quantity_g: 80, kcal: 40, protein_g: 2, carbo_g: 8, fat_g: 0, checked: false },
          { id: "a5", name: "Azeite (1 colher)", quantity_g: 10, kcal: 100, protein_g: 0, carbo_g: 0, fat_g: 11, checked: false },
        ],
      },
      {
        type: "lanche",
        date: dateISO,
        time: "16:00",
        kcalRange: "180 - 220 kcal",
        foods: [
          { id: "l1", name: "Iogurte Natural", quantity_g: 170, kcal: 120, protein_g: 10, carbo_g: 12, fat_g: 3, checked: false },
          { id: "l2", name: "Granola", quantity_g: 30, kcal: 80, protein_g: 2, carbo_g: 15, fat_g: 2, checked: false },
        ],
      },
      {
        type: "jantar",
        date: dateISO,
        time: "20:00",
        kcalRange: "520 - 580 kcal",
        foods: [
          { id: "j1", name: "SalmÃ£o Assado", quantity_g: 120, kcal: 200, protein_g: 20, carbo_g: 0, fat_g: 13, checked: false },
          { id: "j2", name: "Batata Doce", quantity_g: 100, kcal: 86, protein_g: 2, carbo_g: 20, fat_g: 0, checked: false },
          { id: "j3", name: "BrÃ³colis no Vapor", quantity_g: 100, kcal: 55, protein_g: 4, carbo_g: 11, fat_g: 1, checked: false },
          { id: "j4", name: "Salada de Tomate", quantity_g: 80, kcal: 30, protein_g: 1, carbo_g: 7, fat_g: 0, checked: false },
          { id: "j5", name: "Azeite (1 colher)", quantity_g: 10, kcal: 100, protein_g: 0, carbo_g: 0, fat_g: 11, checked: false },
        ],
      }
    );
  }

  return result;
}
