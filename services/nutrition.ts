import { supabase } from "./supabase";
import type { FoodLogEntry, MealType } from "../types/nutrition";
import type { DayTotals } from "../types/nutrition";

export async function fetchFoodLogsForDate(
  userId: string,
  date: string
): Promise<FoodLogEntry[]> {
  const { data, error } = await supabase
    .from("food_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("meal_type", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("fetchFoodLogsForDate:", error);
    return [];
  }
  return (data ?? []) as FoodLogEntry[];
}

/**
 * Busca todos os food_logs do usuário em um intervalo de datas (inclusive).
 * Usado para exibir status de refeições na semana do calendário.
 */
export async function fetchFoodLogsForDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<FoodLogEntry[]> {
  const { data, error } = await supabase
    .from("food_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("meal_type", { ascending: true });

  if (error) {
    console.error("fetchFoodLogsForDateRange:", error);
    return [];
  }
  return (data ?? []) as FoodLogEntry[];
}

export function aggregateTotals(logs: FoodLogEntry[]): DayTotals {
  return logs.reduce(
    (acc, log) => ({
      kcal: acc.kcal + (log.kcal ?? 0),
      protein_g: acc.protein_g + (log.protein_g ?? 0),
      carbo_g: acc.carbo_g + (log.carbo_g ?? 0),
      fat_g: acc.fat_g + (log.fat_g ?? 0),
    }),
    { kcal: 0, protein_g: 0, carbo_g: 0, fat_g: 0 }
  );
}

export async function confirmMealLogs(
  userId: string,
  date: string,
  mealType: MealType
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("food_logs")
    .update({ confirmed: true })
    .eq("user_id", userId)
    .eq("date", date)
    .eq("meal_type", mealType);

  if (error) {
    console.error("confirmMealLogs:", error);
    return { error };
  }
  return { error: null };
}

/**
 * Retorna o número de dias seguidos em que o usuário registrou e confirmou
 * pelo menos uma refeição (conta de hoje para trás). Sem registros = 0.
 */
export async function fetchStreak(userId: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const from = thirtyDaysAgo.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("food_logs")
    .select("date, confirmed")
    .eq("user_id", userId)
    .gte("date", from)
    .lte("date", today);

  if (error || !data?.length) {
    return 0;
  }

  const datesWithConfirmed = new Set<string>();
  for (const row of data as { date: string; confirmed: boolean }[]) {
    if (row.confirmed) {
      datesWithConfirmed.add(row.date);
    }
  }

  let streak = 0;
  const check = new Date();
  for (let i = 0; i < 30; i++) {
    const d = check.toISOString().slice(0, 10);
    if (datesWithConfirmed.has(d)) {
      streak += 1;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export async function addFoodLog(
  userId: string,
  date: string,
  mealType: MealType,
  entry: {
    food_id?: string | null;
    food_name: string;
    quantity_g: number;
    kcal: number;
    protein_g: number;
    carbo_g: number;
    fat_g: number;
  }
): Promise<{ data: FoodLogEntry | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("food_logs")
    .insert({
      user_id: userId,
      date,
      meal_type: mealType,
      food_id: entry.food_id ?? null,
      food_name: entry.food_name,
      quantity_g: entry.quantity_g,
      kcal: entry.kcal,
      protein_g: entry.protein_g,
      carbo_g: entry.carbo_g,
      fat_g: entry.fat_g,
      confirmed: false,
    })
    .select()
    .single();

  if (error) {
    console.error("addFoodLog:", error);
    return { data: null, error };
  }
  return { data: data as FoodLogEntry, error: null };
}
