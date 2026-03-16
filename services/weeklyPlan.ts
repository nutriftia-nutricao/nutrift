import { supabase } from "./supabase";

const EDGE_FUNCTION_NAME = "gerar-plano";

export interface GenerateWeeklyPlanPreferences {
  goal?: string;
  daily_kcal?: number;
  protein_g?: number;
  carbo_g?: number;
  fat_g?: number;
  meals_per_day?: number;
  diet_type?: string | null;
  restrictions?: string[];
  liked_foods?: string[];
}

export interface GenerateWeeklyPlanResult {
  data?: {
    success: boolean;
    error?: string;
    generations_used?: number;
    generations_limit?: number;
  };
  error?: Error;
}

/**
 * Chama a Edge Function gerar-plano para gerar o plano semanal com IA.
 * Requer usuário Pro e respeita cooldown de 7 dias.
 */
export async function generateWeeklyPlan(
  _userId: string,
  _preferences?: GenerateWeeklyPlanPreferences
): Promise<GenerateWeeklyPlanResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log("[gerar-plano] session user:", session?.user?.email ?? "NULL");
    console.log("[gerar-plano] token type:", session?.access_token ? "JWT present" : "NO TOKEN");

    if (!session?.access_token) {
      return { data: { success: false, error: "Sessão expirada. Faça login novamente." } };
    }

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const res = await fetch(`${supabaseUrl}/functions/v1/${EDGE_FUNCTION_NAME}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({}),
    });

    console.log("[gerar-plano] HTTP status:", res.status);
    const json = await res.json() as { success?: boolean; error?: string; generations_used?: number; generations_limit?: number };
    console.log("[gerar-plano] response:", JSON.stringify(json));

    if (!json.success) {
      return {
        data: {
          success: false,
          error: json.error ?? "Erro ao gerar plano",
          generations_used: json.generations_used,
          generations_limit: json.generations_limit,
        },
      };
    }

    return { data: { success: true } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro de rede";
    console.error("[gerar-plano] catch:", message);
    return {
      data: { success: false, error: message },
      error: err instanceof Error ? err : new Error(message),
    };
  }
}
