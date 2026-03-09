# SESSÃO 2 — Edge Functions: gerar-plano + substituir-alimento

> Cole este prompt no Cursor com os arquivos da pasta `supabase/functions/` abertos.
> Pré-requisito: Sessão 1 concluída e migrations aplicadas no Supabase.

---

## CONTEXTO

Nutrift — React Native + Expo + Supabase + Gemini 2.5 Flash.
Leia o `AGENTES.md` na raiz antes de qualquer implementação.

## TAREFA 1 — Edge Function: gerar-plano

Crie a pasta `supabase/functions/gerar-plano/` com o arquivo `index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    const isCron = body.is_cron === true;
    const regenerateAll = body.regenerate_all === true;

    // ── AUTH ──────────────────────────────────────────────────────────────
    let userId: string;

    if (isCron && regenerateAll) {
      // Cron: regenera todos os Pro ativos
      return await handleCronRegeneration(supabase, corsHeaders);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401, corsHeaders);

    const { data: { user }, error: authError } =
      await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return json({ error: 'Unauthorized' }, 401, corsHeaders);
    userId = user.id;

    // ── VERIFICAR PLANO PRO ────────────────────────────────────────────────
    const { data: userData } = await supabase
      .from('users')
      .select('is_pro, plan, trial_ends_at, last_plan_generated_at')
      .eq('id', userId)
      .single();

    const isPro = userData?.is_pro ||
      (userData?.plan === 'trial' && new Date() < new Date(userData?.trial_ends_at));

    if (!isPro) return json({ error: 'Pro required' }, 403, corsHeaders);

    // ── VERIFICAR COOLDOWN (7 dias) ───────────────────────────────────────
    if (!isCron && userData?.last_plan_generated_at) {
      const lastGen = new Date(userData.last_plan_generated_at);
      const daysSince = (Date.now() - lastGen.getTime()) / 86400000;
      if (daysSince < 7) {
        const daysRemaining = Math.ceil(7 - daysSince);
        return json({ error: 'Cooldown ativo', days_remaining: daysRemaining }, 429, corsHeaders);
      }
    }

    // ── GERAR PLANO ───────────────────────────────────────────────────────
    await generatePlanForUser(supabase, userId);

    return json({ success: true }, 200, corsHeaders);

  } catch (err) {
    console.error('[gerar-plano] Erro:', err);
    return json({ error: 'Internal error', detail: String(err) }, 500, corsHeaders);
  }
});

// ── Gera plano para um usuário específico ─────────────────────────────────
async function generatePlanForUser(supabase: any, userId: string) {
  // 1. Buscar perfil completo
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: macros } = await supabase
    .from('user_macros')
    .select('*')
    .eq('user_id', userId)
    .single();

  // 2. Buscar histórico de alimentos (preferências)
  const { data: recentFoods } = await supabase
    .from('daily_food_logs')
    .select('food_name')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(20);

  const recentFoodNames = [...new Set((recentFoods ?? []).map((f: any) => f.food_name))];

  // 3. Chamar Gemini
  const prompt = buildGeminiPrompt(profile, macros, recentFoodNames);
  const geminiResponse = await callGemini(prompt);
  const plan = parseGeminiResponse(geminiResponse);

  if (!plan?.meals?.length) throw new Error('Gemini retornou plano inválido');

  // 4. Arquivar plano anterior
  await supabase
    .from('weekly_plans')
    .update({ status: 'archived' })
    .eq('user_id', userId)
    .eq('status', 'active');

  // 5. Criar novo plano
  const weekStart = getMonday();
  const { data: newPlan, error: planError } = await supabase
    .from('weekly_plans')
    .insert({ user_id: userId, week_start_date: weekStart, status: 'active', generated_by: 'gemini' })
    .select()
    .single();

  if (planError) throw planError;

  // 6. Criar refeições para cada dia da semana
  const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

  for (const day of days) {
    for (const meal of plan.meals) {
      const { data: planMeal, error: mealError } = await supabase
        .from('plan_meals')
        .insert({
          plan_id: newPlan.id,
          day_of_week: day,
          meal_type: meal.meal_type,
          scheduled_time: meal.scheduled_time
        })
        .select()
        .single();

      if (mealError) throw mealError;

      // 7. Buscar ou criar foods no banco
      for (const food of meal.foods) {
        let foodId: string;

        const { data: existingFood } = await supabase
          .from('foods')
          .select('id')
          .ilike('name', food.name)
          .limit(1)
          .single();

        if (existingFood) {
          foodId = existingFood.id;
        } else {
          const { data: newFood, error: foodError } = await supabase
            .from('foods')
            .insert({
              name: food.name,
              calories: food.calories_per_100g,
              protein: food.protein_per_100g,
              carbs: food.carbs_per_100g,
              fat: food.fat_per_100g,
              portion_grams: food.quantity_g,
              source: 'gemini'
            })
            .select()
            .single();

          if (foodError) throw foodError;
          foodId = newFood.id;
        }

        await supabase.from('plan_meal_foods').insert({
          meal_id: planMeal.id,
          food_id: foodId,
          quantity_g: food.quantity_g,
          is_checked: false
        });
      }
    }
  }

  // 8. Atualizar timestamp
  await supabase
    .from('users')
    .update({ last_plan_generated_at: new Date().toISOString() })
    .eq('id', userId);

  // 9. Registrar uso IA
  await supabase.from('ai_requests').insert({ user_id: userId, feature: 'gerar-plano' });
}

// ── Cron: regenera todos os Pro ───────────────────────────────────────────
async function handleCronRegeneration(supabase: any, corsHeaders: any) {
  const { data: proUsers } = await supabase
    .from('users')
    .select('id')
    .eq('is_pro', true)
    .eq('onboarding_completed', true);

  if (!proUsers?.length) return json({ success: true, count: 0 }, 200, corsHeaders);

  const results = await Promise.allSettled(
    proUsers.map((u: any) => generatePlanForUser(supabase, u.id))
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return json({ success: true, succeeded, failed }, 200, corsHeaders);
}

// ── Helpers ───────────────────────────────────────────────────────────────
function buildGeminiPrompt(profile: any, macros: any, recentFoods: string[]) {
  return `Você é um nutricionista especialista.
Gere um plano alimentar diário personalizado.
Este cardápio será repetido todos os dias da semana.
Use APENAS alimentos comuns brasileiros (tabela TACO).

PERFIL:
- Objetivo: ${profile?.goal ?? 'fat_loss'}
- Calorias diárias: ${macros?.daily_kcal ?? 2000} kcal
- Proteína: ${macros?.protein_g ?? 150}g | Carboidratos: ${macros?.carbo_g ?? 200}g | Gordura: ${macros?.fat_g ?? 65}g
- Refeições por dia: ${profile?.meals_per_day ?? 5}
- Dieta: ${profile?.diet_type ?? 'onívoro'}
- Restrições: ${profile?.restrictions?.join(', ') || 'nenhuma'}
- Alimentos consumidos recentemente: ${recentFoods.slice(0,10).join(', ') || 'não registrado'}

REGRAS:
1. Total diário dentro de ±5% das metas calóricas
2. Quantidades realistas: arroz 150g, frango grelhado 120g, ovo 60g/unidade, banana 100g
3. Não repetir a mesma proteína principal em todas as refeições
4. Horários coerentes com o número de refeições

RESPOSTA: JSON puro, sem markdown, sem texto antes ou depois.

{
  "meals": [
    {
      "meal_type": "cafe",
      "scheduled_time": "07:00",
      "foods": [
        {
          "name": "Nome do alimento",
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
Use exatamente ${profile?.meals_per_day ?? 5} refeições.`;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
      })
    }
  );

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

function parseGeminiResponse(raw: string): any {
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function json(body: any, status: number, headers: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}
```

## TAREFA 2 — Edge Function: substituir-alimento

Crie `supabase/functions/substituir-alimento/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401, corsHeaders);

    const { data: { user }, error: authError } =
      await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return json({ error: 'Unauthorized' }, 401, corsHeaders);

    const { food_name, quantity_g, goal, diet_type, restrictions } = await req.json();
    if (!food_name) return json({ error: 'food_name obrigatório' }, 400, corsHeaders);

    // Rate limiting
    const { count } = await supabase
      .from('ai_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('feature', 'substituir-alimento')
      .gte('created_at', new Date(Date.now() - 86400000).toISOString());

    if ((count ?? 0) >= 30) return json({ error: 'Limite diário atingido' }, 429, corsHeaders);

    const prompt = `Você é um nutricionista.
Sugira 3 substitutos para "${food_name}" (${quantity_g}g).
Objetivo do usuário: ${goal ?? 'fat_loss'}
Dieta: ${diet_type ?? 'onívoro'}
Restrições: ${restrictions?.join(', ') || 'nenhuma'}

Critérios: valor nutricional similar, alimento brasileiro comum, fácil de encontrar.

RESPOSTA: JSON puro, sem markdown.

{
  "suggestions": [
    {
      "name": "Nome do alimento",
      "quantity_g": 120,
      "calories_per_100g": 110,
      "protein_per_100g": 22,
      "carbs_per_100g": 0,
      "fat_per_100g": 2,
      "reason": "Motivo em 1 frase curta"
    }
  ]
}`;

    const apiKey = Deno.env.get('GEMINI_API_KEY')!;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    await supabase.from('ai_requests').insert({ user_id: user.id, feature: 'substituir-alimento' });

    return json(result, 200, corsHeaders);

  } catch (err) {
    return json({ error: 'Internal error', detail: String(err) }, 500, corsHeaders);
  }
});

function json(body: any, status: number, headers: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}
```

## TAREFA 3 — Configurar variáveis de ambiente nas Edge Functions

Crie o arquivo `supabase/functions/.env` (não commitar — adicionar ao .gitignore):

```
GEMINI_API_KEY=sua_chave_aqui
ASAAS_API_KEY=sua_chave_aqui
```

Para fazer deploy:
```bash
supabase functions deploy gerar-plano --no-verify-jwt
supabase functions deploy substituir-alimento --no-verify-jwt
supabase secrets set GEMINI_API_KEY=sua_chave_aqui
supabase secrets set ASAAS_API_KEY=sua_chave_aqui
```

## REGRAS

- GEMINI_API_KEY nunca no app — apenas Edge Functions
- SUPABASE_SERVICE_ROLE_KEY nunca no app — apenas Edge Functions
- Não altere nenhum store ou componente nesta sessão
- Após criar, teste via `supabase functions serve gerar-plano` localmente
