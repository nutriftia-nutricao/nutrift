import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-auth",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 1. Verificar JWT usando cliente com anon key + token do usuário
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("[gerar-plano] Auth error:", authError?.message);
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cliente admin para operações no banco (sem restrição de RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    await req.json().catch(() => ({}));

    // 2. Buscar perfil
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("goal, daily_kcal, protein_g, carbo_g, fat_g, meals_per_day, diet_type, plan, is_pro, trial_ends_at, last_plan_generated_at")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ success: false, error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Verificar Pro
    const isPro = profile.is_pro || profile.plan === "pro" || profile.plan === "ultra" ||
      (profile.plan === "trial" && profile.trial_ends_at && new Date() < new Date(profile.trial_ends_at));

    if (!isPro) {
      return new Response(JSON.stringify({ success: false, error: "plan_required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    // 5. Rate limiting
    const { count } = await supabase
      .from("ai_requests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("feature", "gerar-plano")
      .gte("created_at", new Date(Date.now() - 86400000).toISOString());

    if ((count ?? 0) >= 50) {
      return new Response(JSON.stringify({ success: false, error: "rate_limit" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Buscar alimentos recentes + base de alimentos do banco
    const { data: recentLogs } = await supabase
      .from("food_logs")
      .select("food_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const recentFoods = [...new Set((recentLogs ?? []).map((l: any) => l.food_name))];

    // Busca alimentos reais da tabela foods para o Gemini usar como referência
    const { data: foodsDb } = await supabase
      .from("foods")
      .select("name, kcal, protein_g, carbo_g, fat_g, sodium_mg, category")
      .eq("is_active", true)
      .order("name");

    // Formata como lookup compacto para o prompt: "nome: P Xg C Xg G Xg (Xkcal)"
    const foodsDbStr = (foodsDb ?? [])
      .map((f: any) => `${f.name}: P${f.protein_g}g C${f.carbo_g}g G${f.fat_g}g (${f.kcal}kcal)`)
      .join("\n");

    // 7. Montar prompt
    const mealsCount = profile.meals_per_day ?? 4;
    const targetKcal = Math.round(profile.daily_kcal);
    const targetProtein = Math.round(profile.protein_g);
    const targetCarbo = Math.round(profile.carbo_g);
    const targetFat = Math.round(profile.fat_g);

    // Distribuição de kcal por refeição (proporções típicas)
    const mealDistributions: Record<number, number[]> = {
      3: [0.30, 0.40, 0.30],
      4: [0.25, 0.35, 0.25, 0.15],
      5: [0.20, 0.10, 0.35, 0.15, 0.20],
      6: [0.20, 0.10, 0.25, 0.10, 0.20, 0.15],
      7: [0.18, 0.08, 0.22, 0.10, 0.20, 0.12, 0.10],
    };
    const mealTypesMap: Record<number, string[]> = {
      3: ["cafe", "almoco", "jantar"],
      4: ["cafe", "lanche_manha", "almoco", "jantar"],
      5: ["cafe", "lanche_manha", "almoco", "lanche", "jantar"],
      6: ["cafe", "lanche_manha", "almoco", "lanche", "jantar", "pos_treino"],
      7: ["cafe", "lanche_manha", "almoco", "pre_treino", "lanche", "jantar", "pos_treino"],
    };
    const safeMealsCount = Math.min(7, Math.max(3, mealsCount));
    const dist = mealDistributions[safeMealsCount] ?? mealDistributions[4];
    const types = mealTypesMap[safeMealsCount] ?? mealTypesMap[4];

    // Macro profile description to guide food selection
    const proteinPct = Math.round((targetProtein * 4 / targetKcal) * 100);
    const carboPct = Math.round((targetCarbo * 4 / targetKcal) * 100);
    const fatPct = Math.round((targetFat * 9 / targetKcal) * 100);

    const mealTargets = types.map((type, i) => {
      const ratio = dist[i] ?? 0.25;
      return {
        meal_type: type,
        protein_g: Math.round(targetProtein * ratio),
        carbo_g: Math.round(targetCarbo * ratio),
        fat_g: Math.round(targetFat * ratio),
        kcal: Math.round(targetKcal * ratio),
      };
    });

    const mealTargetsStr = mealTargets.map(m =>
      `- ${m.meal_type}: P:${m.protein_g}g C:${m.carbo_g}g G:${m.fat_g}g → ${m.kcal}kcal`
    ).join("\n");

    const foodsSection = foodsDb && foodsDb.length > 0
      ? `\nBASE DE ALIMENTOS (macros por 100g — use estes valores quando o alimento estiver listado):
${foodsDbStr}

INSTRUÇÃO IMPORTANTE: Se o alimento estiver na base acima, use EXATAMENTE os macros listados.
Se não estiver na base, use seu conhecimento nutricional para estimar os macros por 100g.\n`
      : "";

    const prompt = `Você é um nutricionista. Gere um plano alimentar diário para dieta ${profile.diet_type ?? "onívora"}.

FÓRMULA DE CÁLCULO (obrigatório usar):
  kcal_do_alimento = (protein_per_100g × 4 + carbs_per_100g × 4 + fat_per_100g × 9) × quantity_g / 100

METAS DIÁRIAS (os macros são a fonte da verdade — kcal é derivada):
  Proteína: ${targetProtein}g (${proteinPct}% das kcal) ← PRIORIDADE MÁXIMA
  Carboidratos: ${targetCarbo}g (${carboPct}% das kcal)
  Gordura: ${targetFat}g (${fatPct}% das kcal)
  Total kcal esperado: ${targetKcal}kcal (tolerância ±30kcal)
${foodsSection}
PERFIL DE ALIMENTOS NECESSÁRIO:
  - Inclua obrigatoriamente fontes ricas em proteína: frango, ovo, atum, carne bovina magra, leite, iogurte, queijo cottage
  - Carboidratos: arroz, pão integral, batata, aveia, macarrão
  - Gorduras saudáveis: azeite, abacate, amendoim
  - Dieta: ${profile.diet_type ?? "onívora"}${recentFoods.length > 0 ? `\n  - Prefira quando possível: ${recentFoods.slice(0, 8).join(", ")}` : ""}

META POR REFEIÇÃO — ajuste quantity_g para bater P, C e G de cada refeição:
${mealTargetsStr}

VERIFICAÇÃO OBRIGATÓRIA antes de retornar — some todos os alimentos e confirme:
  total_proteína ≈ ${targetProtein}g (±5g) | total_carboidratos ≈ ${targetCarbo}g (±5g) | total_gordura ≈ ${targetFat}g (±5g)
  Se qualquer macro estiver fora da tolerância, ajuste as quantidades antes de retornar.

NÚMERO DE ALIMENTOS POR REFEIÇÃO (regra obrigatória):
  - cafe, almoco, jantar → 3 a 4 alimentos
  - lanche_manha, lanche, pre_treino, pos_treino, extra → 1 a 2 alimentos

FORMATO — retorne SOMENTE JSON válido, sem markdown:
{"meals":[{"meal_type":"cafe","scheduled_time":"07:00","foods":[{"name":"Ovo cozido","quantity_g":60,"protein_per_100g":13,"carbs_per_100g":1,"fat_per_100g":11}]}]}

Regras: exatamente ${mealsCount} refeições | NÃO inclua calories_per_100g (será calculado via fórmula)`;

    // 8. Chamar Gemini
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 16384, responseMimeType: "application/json" },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => "");
      console.error("[gerar-plano] Gemini error:", geminiRes.status, errText);
      return new Response(JSON.stringify({ success: false, error: "ai_error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiRes.json();
    const candidate = geminiData?.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text ?? "";
    const cleanText = rawText.replace(/```json|```/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanText);
    } catch {
      console.error("[gerar-plano] JSON parse error. rawText:", rawText.slice(0, 200));
      return new Response(JSON.stringify({ success: false, error: "invalid_ai_response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!parsed?.meals || parsed.meals.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "invalid_ai_response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calcular macros gerados via fórmula Atwater (fonte da verdade)
    // O prompt não pede calories_per_100g, então derivamos kcal dos macros
    let genProtein = 0, genCarbo = 0, genFat = 0;
    for (const meal of parsed.meals) {
      for (const f of meal.foods ?? []) {
        const qty = f.quantity_g / 100;
        genProtein += (f.protein_per_100g ?? 0) * qty;
        genCarbo   += (f.carbs_per_100g ?? 0) * qty;
        genFat     += (f.fat_per_100g ?? 0) * qty;
      }
    }
    genProtein = Math.round(genProtein);
    genCarbo   = Math.round(genCarbo);
    genFat     = Math.round(genFat);
    const genKcal = genProtein * 4 + genCarbo * 4 + genFat * 9;

    console.log(`[gerar-plano] Gerado  → P:${genProtein}g C:${genCarbo}g G:${genFat}g = ${genKcal}kcal`);
    console.log(`[gerar-plano] Meta    → P:${targetProtein}g C:${targetCarbo}g G:${targetFat}g = ${targetKcal}kcal`);

    // Correção proporcional: usa o macro mais acima da meta como fator de escala
    // Ratio < 1 = macro gerado acima do target → precisa reduzir
    const ratioP = targetProtein / (genProtein || 1);
    const ratioC = targetCarbo   / (genCarbo   || 1);
    const ratioF = targetFat     / (genFat     || 1);

    // O menor ratio é o macro mais fora do target (mais acima); escalar por ele
    // garante que nenhum macro ultrapasse a meta
    const correctionRatio = Math.min(ratioP, ratioC, ratioF);
    const needsCorrection = correctionRatio < 0.97; // qualquer macro >3% acima da meta

    if (needsCorrection) {
      console.log(`[gerar-plano] Corrigindo com ratio ${correctionRatio.toFixed(3)} (P:${ratioP.toFixed(3)} C:${ratioC.toFixed(3)} G:${ratioF.toFixed(3)})`);
      for (const meal of parsed.meals) {
        for (const food of meal.foods ?? []) {
          food.quantity_g = Math.max(10, Math.round(food.quantity_g * correctionRatio));
        }
      }
    }

    // 9. Arquivar plano anterior
    await supabase
      .from("weekly_plans")
      .update({ status: "concluido" })
      .eq("user_id", user.id)
      .eq("status", "ativo");

    // 10. Calcular week_start (segunda-feira atual)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    const weekStart = monday.toISOString().slice(0, 10);

    // 11. Criar weekly_plan
    const { data: newPlan, error: planError } = await supabase
      .from("weekly_plans")
      .insert({ user_id: user.id, week_start: weekStart, week_start_date: weekStart, generated_by: "ia", status: "ativo" })
      .select()
      .single();

    if (planError || !newPlan) {
      console.error("[gerar-plano] DB error creating weekly_plan:", planError);
      return new Response(JSON.stringify({ success: false, error: "db_error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 12. Inserir refeições para cada dia da semana
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

    for (const day of days) {
      for (const meal of parsed.meals) {
        const { data: newMeal } = await supabase
          .from("plan_meals")
          .insert({ plan_id: newPlan.id, day_of_week: day, meal_type: meal.meal_type, scheduled_time: meal.scheduled_time })
          .select()
          .single();

        if (!newMeal) continue;

        for (const food of meal.foods) {
          const qty = food.quantity_g / 100;
          const p = Math.round((food.protein_per_100g ?? 0) * qty);
          const c = Math.round((food.carbs_per_100g ?? 0) * qty);
          const f = Math.round((food.fat_per_100g ?? 0) * qty);
          // kcal via Atwater — consistente com os macros salvos
          const kcal = p * 4 + c * 4 + f * 9;
          await supabase.from("plan_meal_foods").insert({
            meal_id: newMeal.id,
            food_name: food.name,
            quantity_g: food.quantity_g,
            kcal,
            protein_g: p,
            carbo_g: c,
            fat_g: f,
            is_checked: false,
          });
        }
      }
    }

    // 13. Atualizar last_plan_generated_at
    await supabase.from("users").update({ last_plan_generated_at: new Date().toISOString() }).eq("id", user.id);

    // 14. Registrar ai_request
    await supabase.from("ai_requests").insert({ user_id: user.id, feature: "gerar-plano" });

    return new Response(
      JSON.stringify({ success: true, plan: { week_start: weekStart, meals_count: parsed.meals.length } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[gerar-plano] Unexpected error:", err);
    return new Response(JSON.stringify({ success: false, error: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
