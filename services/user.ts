import { supabase } from "./supabase";
import type { User } from "../types/user";

const DEFAULT_BIRTH_DATE = "1996-01-15";
const DEFAULT_TARGET_DATE = "2026-12-31";

function isMissingBodyFatColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const message = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  return (
    code === "PGRST204" &&
    message.includes("body_fat_pct") &&
    message.includes("users")
  );
}

/** Valores padrão para perfil criado via OAuth (Google) — usuário deve completar onboarding. */
function defaultUserRow(id: string, email: string, name: string): Omit<User, "created_at"> {
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return {
    id,
    name: name || "Usuário",
    email: email || "",
    sex: "masculino",
    birth_date: DEFAULT_BIRTH_DATE,
    weight_kg: 75,
    height_cm: 178,
    body_fat_pct: null,
    goal: "definir_corpo",
    activity: "moderado",
    workout_type: null,
    workout_time: null,
    target_weight: 75,
    target_body_fat_pct: null,
    weekly_pace: 0.5,
    diet_type: null,
    restrictions: [],
    plan: "trial",
    trial_ends_at: trialEndsAt,
    tmb: 1700,
    tdee: 2100,
    daily_kcal: 2100,
    protein_g: 135,
    carbo_g: 200,
    fat_g: 70,
    hydration_ml: 2500,
    target_date: DEFAULT_TARGET_DATE,
    meals_per_day: 4,
    meals: [],
    onboarding_completed: false,
  };
}

export async function fetchUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  const user = data as User;
  return {
    ...user,
    onboarding_completed: user.onboarding_completed === true,
  };
}

/**
 * Garante que existe um perfil em `users` para o id (ex.: primeiro login com Google).
 * Se não existir, insere com dados básicos. Retorna o perfil.
 * Se o insert falhar (ex.: RLS sem sessão ativa), retorna um perfil temporário em memória
 * para que o usuário consiga avançar no onboarding — o perfil será persistido ao final.
 */
export async function ensureUserProfile(
  id: string,
  email: string,
  name?: string
): Promise<User | null> {
  const existing = await fetchUserProfile(id);
  if (existing) return existing;

  const row = defaultUserRow(id, email, name ?? "");
  let { data, error } = await supabase.from("users").insert(row).select().single();

  // Compatibilidade com bancos legados sem a coluna body_fat_pct.
  if (isMissingBodyFatColumnError(error)) {
    const { body_fat_pct: _ignored, ...rowWithoutBodyFat } = row;
    const retry = await supabase.from("users").insert(rowWithoutBodyFat).select().single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error("ensureUserProfile insert error:", error.message, error.code);
    // Retorna perfil temporário em memória para não bloquear o onboarding
    return { ...row, created_at: new Date().toISOString() } as User;
  }
  return data as User;
}
