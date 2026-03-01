import { supabase } from "./supabase";
import type { User } from "../types/user";

const DEFAULT_BIRTH_DATE = "1996-01-15";
const DEFAULT_TARGET_DATE = "2026-12-31";

/** Valores padrão para perfil criado via OAuth (Google) — usuário pode completar no perfil. */
function defaultUserRow(id: string, email: string, name: string): Omit<User, "created_at"> {
  return {
    id,
    name: name || "Usuário",
    email: email || "",
    sex: "masculino",
    birth_date: DEFAULT_BIRTH_DATE,
    weight_kg: 75,
    height_cm: 178,
    goal: "manter",
    activity: "moderado",
    target_weight: 75,
    weekly_pace: 0.5,
    plan: "free",
    tmb: 1700,
    tdee: 2100,
    daily_kcal: 2100,
    protein_g: 135,
    carbo_g: 200,
    fat_g: 70,
    target_date: DEFAULT_TARGET_DATE,
    meals_per_day: 4,
  };
}

export async function fetchUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as User;
}

/**
 * Garante que existe um perfil em `users` para o id (ex.: primeiro login com Google).
 * Se não existir, insere com dados básicos. Retorna o perfil.
 */
export async function ensureUserProfile(
  id: string,
  email: string,
  name?: string
): Promise<User | null> {
  const existing = await fetchUserProfile(id);
  if (existing) return existing;

  const row = defaultUserRow(id, email, name ?? "");
  const { data, error } = await supabase.from("users").insert(row).select().single();

  if (error) {
    console.error("ensureUserProfile insert:", error);
    return null;
  }
  return data as User;
}
