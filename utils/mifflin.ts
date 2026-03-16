import { addWeeks } from "date-fns";
import { ActivityMultipliers, RitmoAjuste } from "../constants/macros";
import type { Activity, Goal, WeeklyPace, Sex } from "../types/onboarding";

export interface NutritionResult {
  tmb: number;
  tdee: number;
  meta: number;
  protein_g: number;
  carbo_g: number;
  fat_g: number;
  hydration_ml: number;
  target_date: Date;
}

export function calcularNutricao(user: {
  sex: Sex;
  weight_kg: number;
  height_cm: number;
  age: number;
  activity: Activity;
  goal: Goal;
  target_weight: number;
  weekly_pace: WeeklyPace;
}): NutritionResult {
  // 1. TMB (Mifflin-St Jeor)
  const tmb =
    user.sex === "masculino"
      ? 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age + 5
      : 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age - 161;

  // 2. TDEE
  const activityMultiplier = ActivityMultipliers[user.activity];
  const tdee = Math.round(tmb * activityMultiplier);

  // 3. Meta Calórica
  let ajuste = 0;
  if (user.goal === "perder_gordura") {
    ajuste = RitmoAjuste[user.weekly_pace] || -500;
  } else if (user.goal === "ganhar_massa") {
    ajuste = 300;
  } else if (user.goal === "definir_corpo") {
    // Small deficit: reduce fat while preserving muscle
    ajuste = -200;
  } else if (user.goal === "recomposicao") {
    // Minimal deficit: lose fat and gain muscle simultaneously
    ajuste = -150;
  }

  const meta = Math.round(tdee + ajuste);

  // 4. Macros
  let protein_g: number;
  let fat_g: number;
  let carbo_g: number;

  if (user.goal === "perder_gordura") {
    protein_g = Math.round(user.weight_kg * 2.0);
    fat_g = Math.round((meta * 0.25) / 9);
    carbo_g = Math.round((meta - protein_g * 4 - fat_g * 9) / 4);
  } else if (user.goal === "ganhar_massa") {
    protein_g = Math.round(user.weight_kg * 2.2);
    fat_g = Math.round((meta * 0.25) / 9);
    carbo_g = Math.round((meta - protein_g * 4 - fat_g * 9) / 4);
  } else if (user.goal === "definir_corpo") {
    // High protein to preserve muscle during small deficit
    protein_g = Math.round(user.weight_kg * 2.0);
    fat_g = Math.round((meta * 0.25) / 9);
    carbo_g = Math.round((meta - protein_g * 4 - fat_g * 9) / 4);
  } else {
    // recomposicao: highest protein to support fat loss + muscle gain simultaneously
    protein_g = Math.round(user.weight_kg * 2.2);
    fat_g = Math.round((meta * 0.25) / 9);
    carbo_g = Math.round((meta - protein_g * 4 - fat_g * 9) / 4);
  }

  // 5. Hidratação
  // Base
  let hydration = user.sex === "masculino" ? user.weight_kg * 35 : user.weight_kg * 32;

  // Ajuste por atividade
  switch (user.activity) {
    case "levemente_ativo":
      hydration += 300;
      break;
    case "moderado":
      hydration += 500;
      break;
    case "muito_ativo":
      hydration += 800;
      break;
    default: // sedentario
      hydration += 0;
      break;
  }

  // Ajuste por objetivo
  switch (user.goal) {
    case "perder_gordura":
      hydration += 300;
      break;
    case "ganhar_massa":
      hydration += 200;
      break;
    case "definir_corpo":
    case "recomposicao":
      hydration += 300;
      break;
  }

  // Arredondar para múltiplos de 100ml
  const hydration_ml = Math.ceil(hydration / 100) * 100;

  // 6. Data Estimada
  let weeks = 0;
  if (user.goal === "perder_gordura") {
    const diff = user.weight_kg - user.target_weight;
    if (diff > 0) weeks = diff / user.weekly_pace;
  } else if (user.goal === "ganhar_massa") {
    const diff = user.target_weight - user.weight_kg;
    if (diff > 0) weeks = diff / user.weekly_pace;
  } else if (user.goal === "definir_corpo") {
    // Gradual: ~0.25kg/week (AI will adjust)
    const diff = user.weight_kg - user.target_weight;
    if (diff > 0) weeks = diff / 0.25;
  } else if (user.goal === "recomposicao") {
    // Recomposition is long-term; estimate ~16 weeks as baseline
    weeks = 16;
  }

  const target_date = addWeeks(new Date(), Math.max(Math.ceil(weeks), 1));

  return {
    tmb: Math.round(tmb),
    tdee: Math.round(tdee),
    meta,
    protein_g,
    carbo_g,
    fat_g,
    hydration_ml,
    target_date,
  };
}
