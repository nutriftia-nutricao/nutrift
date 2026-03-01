import { addWeeks } from "./date";
import { ActivityMultipliers } from "../constants/macros";
import { RitmoAjuste } from "../constants/macros";
import type { Activity, Goal, WeeklyPace } from "../types/onboarding";

export interface NutritionResult {
  tmb: number;
  tdee: number;
  meta: number;
  protein_g: number;
  carbo_g: number;
  fat_g: number;
  target_date: Date;
}

export function calcularNutricao(user: {
  sex: "masculino" | "feminino";
  weight_kg: number;
  height_cm: number;
  age: number;
  activity: Activity;
  goal: Goal;
  target_weight: number;
  weekly_pace: WeeklyPace;
}): NutritionResult {
  const tmb =
    user.sex === "masculino"
      ? 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age + 5
      : 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age - 161;

  const tdee = Math.round(tmb * ActivityMultipliers[user.activity]);

  let ajuste = 0;
  if (user.goal === "perder_gordura") {
    ajuste = RitmoAjuste[user.weekly_pace];
  } else if (user.goal === "ganhar_massa") {
    ajuste = 300;
  }

  const meta = Math.round(tdee + ajuste);

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
  } else {
    protein_g = Math.round(user.weight_kg * 1.8);
    fat_g = Math.round((meta * 0.3) / 9);
    carbo_g = Math.round((meta - protein_g * 4 - fat_g * 9) / 4);
  }

  const semanas =
    user.goal === "perder_gordura"
      ? Math.abs(user.weight_kg - user.target_weight) / user.weekly_pace
      : user.goal === "ganhar_massa"
        ? Math.abs(user.target_weight - user.weight_kg) / 0.25
        : 0;

  const target_date = addWeeks(new Date(), Math.max(semanas, 1));

  return {
    tmb: Math.round(tmb),
    tdee,
    meta,
    protein_g,
    carbo_g,
    fat_g,
    target_date,
  };
}
