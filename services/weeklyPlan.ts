import { getSession } from "./auth";

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
    days_remaining?: number;
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
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    return { error: new Error("Supabase URL não configurada") };
  }

  const { data: sessionData, error: sessionError } = await getSession();
  const token = sessionData.session?.access_token;
  if (sessionError || !token) {
    return { error: sessionError ?? new Error("Sessão não encontrada") };
  }

  const url = `${baseUrl}/functions/v1/${EDGE_FUNCTION_NAME}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
      days_remaining?: number;
    };

    if (!res.ok) {
      return {
        data: {
          success: false,
          error: json.error ?? "Erro ao gerar plano",
          days_remaining: json.days_remaining,
        },
      };
    }

    return { data: { success: json.success === true } };
  } catch (err) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : "Erro de rede";
    return {
      data: { success: false, error: message },
      error: err instanceof Error ? err : new Error(message),
    };
  }
}
