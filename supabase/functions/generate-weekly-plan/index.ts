import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateWeeklyPlanRequestBody {
  userId?: string;
  preferences?: UserPreferences;
}

interface UserPreferences {
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

interface UserRow {
  id: string;
  plan: string;
  is_pro?: boolean | null;
  trial_ends_at?: string | null;
  last_plan_generated_at?: string | null;
  goal: string;
  daily_kcal: number;
  protein_g: number;
  carbo_g: number;
  fat_g: number;
  meals_per_day: number | null;
  diet_type: string | null;
  restrictions: string[] | null;
  liked_foods: string[] | null;
}

interface FoodLogRow {
  food_name: string;
}

interface AiRequestRow {
  user_id: string;
  feature: string;
  created_at: string;
}

interface GeminiFood {
  name: string;
  quantity_g: number;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

interface GeminiMeal {
  meal_type: string;
  scheduled_time: string;
  foods: GeminiFood[];
}

interface GeminiPlan {
  meals: GeminiMeal[];
}

interface GenerateWeeklyPlanSuccessResponse {
  success: true;
  plan: GeminiPlan;
}

interface GenerateWeeklyPlanErrorResponse {
  success: false;
  error: string;
  days_remaining?: number;
}

type GenerateWeeklyPlanResponse = GenerateWeeklyPlanSuccessResponse | GenerateWeeklyPlanErrorResponse;

type Database = unknown;
type TypedSupabaseClient = SupabaseClient<Database>;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_DAYS = 7;
const AI_REQUEST_LIMIT_PER_DAY = 50;
const AI_FEATURE_KEY = "gerar-plano";

const WEEK_DAYS: string[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[generate-weekly-plan] Missing Supabase env vars");
      return json({ success: false, error: "Server configuration error" }, 500);
    }

    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey) as TypedSupabaseClient;

    const rawBody = await req.json().catch(() => ({} as unknown));
    const body = (rawBody ?? {}) as GenerateWeeklyPlanRequestBody;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const accessToken = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    if (body.userId && body.userId !== user.id) {
      return json({ success: false, error: "Forbidden" }, 403);
    }

    const userId = user.id;

    const rateLimitResult = await checkRateLimit(supabase, userId);
    if (rateLimitResult) {
      return json(rateLimitResult, 429);
    }

    const { userRow, preferences, recentFoods } = await loadUserProfileAndPreferences(
      supabase,
      userId,
      body.preferences
    );

    const proCheck = checkProAndCooldown(userRow);
    if (proCheck) {
      return json(proCheck.body, proCheck.status);
    }

    const plan = await generatePlanAndPersist(supabase, userRow, preferences, recentFoods);

    return json<GenerateWeeklyPlanSuccessResponse>({ success: true, plan }, 200);
  } catch (err) {
    console.error("[generate-weekly-plan] Erro:", err);
    return json<GenerateWeeklyPlanErrorResponse>({ success: false, error: "Internal error" }, 500);
  }
});

async function checkRateLimit(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<GenerateWeeklyPlanErrorResponse | null> {
  const since = new Date(Date.now() - ONE_DAY_MS).toISOString();

  const { count, error } = await supabase
    .from<AiRequestRow>("ai_requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", AI_FEATURE_KEY)
    .gte("created_at", since);

  if (error) {
    console.error("[generate-weekly-plan] Rate limit check error:", error);
    return null;
  }

  if ((count ?? 0) >= AI_REQUEST_LIMIT_PER_DAY) {
    return { success: false, error: "Rate limit exceeded" };
  }

  return null;
}

function checkProAndCooldown(userRow: UserRow):
  | { status: number; body: GenerateWeeklyPlanErrorResponse }
  | null {
  const now = new Date();

  const isPro =
    userRow.is_pro === true ||
    userRow.plan === "pro" ||
    (userRow.plan === "trial" && userRow.trial_ends_at != null && now < new Date(userRow.trial_ends_at));

  if (!isPro) {
    return {
      status: 403,
      body: { success: false, error: "Pro required" },
    };
  }

  if (userRow.last_plan_generated_at) {
    const lastGen = new Date(userRow.last_plan_generated_at);
    const daysSince = (now.getTime() - lastGen.getTime()) / ONE_DAY_MS;
    if (daysSince < COOLDOWN_DAYS) {
      const daysRemaining = Math.ceil(COOLDOWN_DAYS - daysSince);
      return {
        status: 429,
        body: {
          success: false,
          error: "Cooldown ativo",
          days_remaining: daysRemaining,
        },
      };
    }
  }

  return null;
}

async function loadUserProfileAndPreferences(
  supabase: TypedSupabaseClient,
  userId: string,
  overridePreferences?: UserPreferences
): Promise<{
  userRow: UserRow;
  preferences: UserPreferences;
  recentFoods: string[];
}> {
  const { data: userData, error: userError } = await supabase
    .from<UserRow>("users")
    .select(
      [
        "id",
        "plan",
        "is_pro",
        "trial_ends_at",
        "last_plan_generated_at",
        "goal",
        "daily_kcal",
        "protein_g",
        "carbo_g",
        "fat_g",
        "meals_per_day",
        "diet_type",
        "restrictions",
        "liked_foods",
      ].join(",")
    )
    .eq("id", userId)
    .single();

  if (userError || !userData) {
    throw userError ?? new Error("User not found");
  }

  const { data: foodLogs, error: foodError } = await supabase
    .from<FoodLogRow>("food_logs")
    .select("food_name")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (foodError) {
    console.error("[generate-weekly-plan] Error loading food_logs:", foodError);
  }

  const recentFoods = Array.from(
    new Set((foodLogs ?? []).map((row) => row.food_name).filter((name) => Boolean(name)))
  );

  const basePrefs: UserPreferences = {
    goal: userData.goal,
    daily_kcal: Number(userData.daily_kcal),
    protein_g: Number(userData.protein_g),
    carbo_g: Number(userData.carbo_g),
    fat_g: Number(userData.fat_g),
    meals_per_day: userData.meals_per_day ?? undefined,
    diet_type: userData.diet_type,
    restrictions: userData.restrictions ?? [],
    liked_foods: userData.liked_foods ?? [],
  };

  const preferences: UserPreferences = {
    ...basePrefs,
    ...(overridePreferences ?? {}),
  };

  return { userRow: userData, preferences, recentFoods };
}

async function generatePlanAndPersist(
  supabase: TypedSupabaseClient,
  userRow: UserRow,
  preferences: UserPreferences,
  recentFoods: string[]
): Promise<GeminiPlan> {
  const prompt = buildGeminiPrompt(userRow, preferences, recentFoods);
  const rawResponse = await callGemini(prompt);
  const plan = parseGeminiResponse(rawResponse);

  if (!plan || !Array.isArray(plan.meals) || plan.meals.length === 0) {
    throw new Error("Gemini retornou plano inválido");
  }

  // Arquivar plano anterior ativo
  const { error: archiveError } = await supabase
    .from("weekly_plans")
    .update({ status: "archived" })
    .eq("user_id", userRow.id)
    .eq("status", "active");

  if (archiveError) {
    console.error("[generate-weekly-plan] Error archiving previous plans:", archiveError);
  }

  const weekStart = getCurrentWeekMondayISO();

  const { data: newPlan, error: planError } = await supabase
    .from("weekly_plans")
    .insert({
      user_id: userRow.id,
      week_start: weekStart,
      week_start_date: weekStart,
      status: "active",
      generated_by: "gemini",
    })
    .select()
    .single();

  if (planError || !newPlan) {
    throw planError ?? new Error("Erro ao criar weekly_plans");
  }

  // Criar refeições para cada dia e alimentos associados
  for (const day of WEEK_DAYS) {
    for (const meal of plan.meals) {
      const { data: planMeal, error: mealError } = await supabase
        .from("plan_meals")
        .insert({
          plan_id: newPlan.id,
          day_of_week: day,
          meal_type: meal.meal_type,
          scheduled_time: meal.scheduled_time,
        })
        .select()
        .single();

      if (mealError || !planMeal) {
        throw mealError ?? new Error("Erro ao criar plan_meals");
      }

      for (const food of meal.foods) {
        const quantity = Number(food.quantity_g);
        const kcal = Math.round((Number(food.calories_per_100g) * quantity) / 100);
        const protein = Math.round((Number(food.protein_per_100g) * quantity) / 100);
        const carbs = Math.round((Number(food.carbs_per_100g) * quantity) / 100);
        const fat = Math.round((Number(food.fat_per_100g) * quantity) / 100);

        const { error: foodError } = await supabase.from("plan_meal_foods").insert({
          meal_id: planMeal.id,
          food_name: food.name,
          quantity_g: quantity,
          kcal,
          protein_g: protein,
          carbo_g: carbs,
          fat_g: fat,
          is_checked: false,
          checked_at: null,
          taco_id: null,
        });

        if (foodError) {
          throw foodError;
        }
      }
    }
  }

  const { error: updateUserError } = await supabase
    .from("users")
    .update({ last_plan_generated_at: new Date().toISOString() })
    .eq("id", userRow.id);

  if (updateUserError) {
    console.error("[generate-weekly-plan] Error updating last_plan_generated_at:", updateUserError);
  }

  const { error: aiInsertError } = await supabase
    .from("ai_requests")
    .insert({ user_id: userRow.id, feature: AI_FEATURE_KEY });

  if (aiInsertError) {
    console.error("[generate-weekly-plan] Error inserting ai_requests:", aiInsertError);
  }

  return plan;
}

function buildGeminiPrompt(
  user: UserRow,
  preferences: UserPreferences,
  recentFoods: string[]
): string {
  const goal = preferences.goal ?? user.goal;
  const dailyKcal = preferences.daily_kcal ?? Number(user.daily_kcal);
  const protein = preferences.protein_g ?? Number(user.protein_g);
  const carbs = preferences.carbo_g ?? Number(user.carbo_g);
  const fat = preferences.fat_g ?? Number(user.fat_g);
  const mealsPerDay = preferences.meals_per_day ?? user.meals_per_day ?? 5;
  const dietType = preferences.diet_type ?? user.diet_type ?? "onívoro";
  const restrictions = (preferences.restrictions ?? user.restrictions ?? []).join(", ") || "nenhuma";
  const likedFoods = (preferences.liked_foods ?? user.liked_foods ?? []).join(", ") || "não informado";

  const recentFoodsLine = recentFoods.length > 0 ? recentFoods.join(", ") : "não registrado";

  return `
Você é um nutricionista especialista.
Gere um plano alimentar diário personalizado.
Este cardápio será repetido todos os dias da semana.
Use APENAS alimentos da tabela TACO (alimentos brasileiros comuns).

PERFIL:
- Objetivo: ${goal}
- Calorias diárias: ${dailyKcal} kcal
- Proteína: ${protein}g | Carboidratos: ${carbs}g | Gordura: ${fat}g
- Refeições por dia: ${mealsPerDay}
- Dieta: ${dietType}
- Restrições: ${restrictions}
- Alimentos que já consome: ${recentFoodsLine}
- Alimentos preferidos: ${likedFoods}

REGRAS:
1. Total diário dentro de ±5% das metas
2. Quantidades realistas (arroz 150g, frango 120g, ovo 60g/unidade)
3. Horários coerentes com número de refeições
4. Não repetir a mesma proteína em todas as refeições

RESPOSTA: JSON puro, sem markdown, sem explicações.

{
  "meals": [
    {
      "meal_type": "cafe",
      "scheduled_time": "07:30",
      "foods": [
        {
          "name": "Ovos mexidos",
          "quantity_g": 120,
          "calories_per_100g": 155,
          "protein_per_100g": 13,
          "carbs_per_100g": 1,
          "fat_per_100g": 11
        }
      ]
    }
  ]
}

meal_type válidos: cafe | lanche_manha | almoco | lanche | jantar | pre_treino | pos_treino
Use exatamente ${mealsPerDay} refeições.`;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada");
  }

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
      encodeURIComponent(apiKey),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Gemini HTTP ${response.status}: ${text}`);
  }

  const data = (await response.json().catch(() => ({}))) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text != null
      ? data.candidates[0].content.parts?.[0]?.text ?? ""
      : "";

  return text.trim();
}

function parseGeminiResponse(raw: string): GeminiPlan | null {
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(clean) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      Array.isArray((parsed as { meals?: unknown }).meals)
    ) {
      return parsed as GeminiPlan;
    }
    return null;
  } catch {
    return null;
  }
}

function getCurrentWeekMondayISO(): string {
  const d = new Date();
  const day = d.getUTCDay(); // 0 (Sun) - 6 (Sat)
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Monday as start
  d.setUTCDate(diff);
  return d.toISOString().split("T")[0]!;
}

function json<T extends GenerateWeeklyPlanResponse>(body: T, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

