import { supabase } from "./supabase";
import type { UserDietType, UserRestriction } from "../types/user";

/**
 * Atualiza o estado "marcado como consumido" de um alimento do plano semanal.
 * @param planMealFoodId id da linha em plan_meal_foods (uuid)
 * @param isChecked novo valor de is_checked
 */
export async function updatePlanMealFoodChecked(
  planMealFoodId: string,
  isChecked: boolean
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("plan_meal_foods")
    .update({ is_checked: isChecked })
    .eq("id", planMealFoodId);

  if (error) {
    return { error };
  }
  return { error: null };
}

export interface WeeklyPlanFoodFromGemini {
  name: string;
  quantity_g: number;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

export interface WeeklyPlanMealFromGemini {
  meal_type: string;
  scheduled_time: string;
  foods: WeeklyPlanFoodFromGemini[];
}

export interface WeeklyPlanFromGemini {
  meals: WeeklyPlanMealFromGemini[];
}

export interface WeeklyPlanPreferencesPayload {
  goal?: string;
  daily_kcal?: number;
  protein_g?: number;
  carbo_g?: number;
  fat_g?: number;
  meals_per_day?: number;
  diet_type?: UserDietType | null;
  restrictions?: UserRestriction[];
  liked_foods?: string[];
}

export interface GenerateWeeklyPlanSuccessResult {
  success: true;
  plan: WeeklyPlanFromGemini;
}

export interface GenerateWeeklyPlanErrorResult {
  success: false;
  error: string;
  days_remaining?: number;
}

export type GenerateWeeklyPlanResult =
  | GenerateWeeklyPlanSuccessResult
  | GenerateWeeklyPlanErrorResult;

interface GenerateWeeklyPlanInvokeBody {
  userId: string;
  preferences?: WeeklyPlanPreferencesPayload;
}

/**
 * Dispara a Edge Function `generate-weekly-plan` no Supabase para
 * gerar e persistir um novo plano semanal IA para o usuário.
 *
 * Retorna o objeto de domínio usado pela Edge Function (plano diário
 * que é replicado para os 7 dias da semana).
 */
export async function generateWeeklyPlan(
  userId: string,
  preferences?: WeeklyPlanPreferencesPayload
): Promise<{ data: GenerateWeeklyPlanResult | null; error: Error | null }> {
  const body: GenerateWeeklyPlanInvokeBody = { userId, preferences };

  const { data, error } = await supabase.functions.invoke<GenerateWeeklyPlanResult>(
    "generate-weekly-plan",
    {
      body,
    }
  );

  if (error) {
    console.error("[weeklyPlan] Error invoking generate-weekly-plan:", error);
    return { data: null, error };
  }

  return { data: data ?? null, error: null };
}

