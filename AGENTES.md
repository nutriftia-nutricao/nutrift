# AGENTES.md — Nutrift
> Referência completa para agentes de IA (Cursor, Claude Code).
> Leia este arquivo antes de qualquer implementação.

---

## STACK

- **Framework:** React Native + Expo SDK 54 + Expo Router v3
- **Backend:** Supabase (auth + database + edge functions + storage)
- **IA — Plano alimentar:** Gemini 2.5 Flash (via Edge Function — nunca direto no app)
- **IA — Agente Nuti (chat):** GPT-4o-mini (via `services/gpt.ts` direto no app)
- **Pagamentos:** Asaas
- **Analytics:** PostHog
- **Crash:** Sentry
- **Plataforma:** Android primeiro (iOS futuro)
- **Bundle ID:** `com.nutrift.app`

---

## 1. ESTRUTURA DE ARQUIVOS

### app/ — Rotas (Expo Router v3)

```
app/
  index.tsx                          # Auth check + redirect
  _layout.tsx                        # Root layout global

  (auth)/
    _layout.tsx
    login.tsx
    register.tsx
    onboarding/
      index.tsx                      # Redirect para step-1
      step-1.tsx                     # Nome + Sexo + LGPD
      step-2.tsx                     # Dados corporais
      step-3.tsx                     # Objetivo
      step-4.tsx                     # Peso meta
      step-5.tsx                     # Nível de atividade
      step-6.tsx                     # Refeições por dia + horários
      step-7.tsx                     # Ritmo semanal
      step-8.tsx                     # Estilo de dieta
      step-9.tsx                     # Resultado do plano

  (tabs)/
    _layout.tsx                      # Navbar flutuante 4 itens
    index.tsx                        # Tela Hoje — 1265 linhas, refatorar
    progresso.tsx
    agente.tsx                       # Nuti IA
    perfil.tsx

  perfil/
    _layout.tsx
    assinatura.tsx                   # Planos Free/Pro
    dados-corporais.tsx
    dieta-preferencias.tsx
    meu-objetivo.tsx
    notificacoes.tsx
    treino.tsx
    integracoes.tsx
    suporte.tsx
    avaliar.tsx

  buscar-alimento.tsx                # Busca TACO + histórico
  substituir-alimento.tsx            # Substituição de alimento
  plano-semanal.tsx                  # Visualização do plano (Pro) — ainda mock
```

### components/

```
components/
  ui/
    Button.tsx          # primary | secondary | ghost | danger
    Card.tsx
    MealCard.tsx        # isPro prop obrigatória
    ProgressBar.tsx     # animated — height: thin | md | thick
    PillBadge.tsx       # streak | pro | free | success | error | warning
    Input.tsx
    BottomSheet.tsx     # Animated spring + backdrop
    GradientBar.tsx
    GradientButton.tsx
    IconCircle.tsx
    index.ts            # Re-exporta tudo

  home/
    ActivityModal.tsx
    HydrationModal.tsx
    StreakCelebrationModal.tsx
    WeightModal.tsx

  onboarding/
    OnboardingHeader.tsx
    OptionCard.tsx
    BodyMetricPicker.tsx
    ProgressBar.tsx
    RulerPicker.tsx
    Slider.tsx

  ErrorBoundary.tsx
```

### stores/ — Zustand

```
stores/
  useUserStore.ts           # Perfil do usuário autenticado
  useOnboardingStore.ts     # Estado do fluxo de onboarding
  useWeeklyPlanStore.ts     # Plano semanal + checkboxes + substituição
  useNutritionStore.ts      # Logs nutricionais diários + streak
  useHydrationStore.ts      # Hidratação por dia
  useActivityStore.ts       # Atividades físicas
  useAgenteStore.ts         # Histórico de mensagens da Nuti
  useThemeStore.ts          # Tema claro/escuro
  useSignupStore.ts         # Estado do fluxo de cadastro
```

### services/

```
services/
  supabase.ts       # Cliente Supabase + isSupabaseConfigured
  auth.ts           # getSession, recoverSessionFromUrl
  user.ts           # fetchUserProfile, ensureUserProfile
  nutrition.ts      # CRUD de food logs
  weeklyPlan.ts     # Carregar e salvar plano semanal
  gemini.ts         # Integração Gemini 2.5 Flash (plano alimentar + substituição)
  gpt.ts            # GPT-4o-mini — agente Nuti (chat direto no app)
```

### constants/

```
constants/
  colors.ts       # Paleta completa do design system
  typography.ts   # h1..h4, body, caption, label
  spacing.ts      # xs, sm, md, lg, xl
  radius.ts       # sm, md, lg, xl, pill
  gradients.ts
  macros.ts
```

### types/

```
types/
  nutrition.ts    # MealType, FoodLogEntry, getMealTypesForDisplay, MEAL_TYPE_LABELS
  user.ts         # UserProfile, UserMacros, UserPlan
  onboarding.ts   # OnboardingData, Step types
```

### utils/

```
utils/
  date.ts         # getTodayISO() e helpers de data
  mifflin.ts      # Cálculo TMB, TDEE, macros, IMC
  navigation.ts   # Helpers de navegação
```

### supabase/

```
supabase/
  migrations/
    001_nutrift_schema.sql
    002_add_onboarding_completed.sql
    003_add_liked_foods.sql
    004_add_meal_types_pre_treino.sql
    005_allow_trigger_insert_users.sql
  functions/                         # Edge Functions (criar)
    gerar-plano/
    substituir-alimento/
    webhook-asaas/
    deletar-conta/
```

### Outros

```
scripts/
  02_import_taco.ts     # Importação banco TACO
  check-supabase.js
  test-auth.mjs

docs/
  DESIGN.md · SCREENS.md · SUPABASE_NUTRIFT.md
  ANALISE_TELAS_E_FLUXO.md · AVALIACAO_FUNCIONAL_RESULTADO.md

hooks/
  useTheme.ts

.cursor/
  skills/               # Skills do Cursor por domínio
```

---


## 2. BANCO DE DADOS — Supabase (schema REAL)

> ⚠️ O banco real difere dos nomes planejados originalmente. Usar SEMPRE os nomes abaixo.

### Tabelas existentes

```
users             ← perfil + macros numa tabela só (sem user_profiles / user_macros separados)
alimentos_taco    ← tabela TACO (não "foods") — colunas em português
food_logs         ← registro manual (não "daily_food_logs")
meal_plans        ← estrutura antiga com foods JSONB — não usar para novo fluxo
weekly_plans      ← planos semanais
agent_messages    ← histórico do agente Nuti
```

### Tabelas criadas na migration 006

```
plan_meals        ← refeições do plano (novo fluxo)
plan_meal_foods   ← alimentos de cada refeição + checkbox
ai_requests       ← rate limiting de chamadas IA
```

### users — colunas completas

```sql
id, name, email, avatar_url,
sex,                     -- USER-DEFINED enum
birth_date,              -- date
weight_kg, height_cm,
goal,                    -- USER-DEFINED enum
activity,                -- USER-DEFINED enum (não activity_level)
target_weight,           -- (não goal_weight_kg)
weekly_pace,             -- (não weekly_rate)
plan,                    -- USER-DEFINED enum: free | trial | pro
is_pro,                  -- boolean (adicionado na 006)
trial_ends_at,           -- timestamptz (adicionado na 006)
onboarding_completed,    -- boolean (adicionado na 006)
lgpd_consent_at,         -- timestamptz (adicionado na 006)
last_plan_generated_at,  -- timestamptz (adicionado na 006)
diet_type,               -- text (adicionado na 006)
tmb, tdee,               -- calculados
daily_kcal, protein_g, carbo_g, fat_g,  -- macros (já na users)
target_date, meals_per_day,
created_at
```

### alimentos_taco — colunas

```sql
id (integer), nome, categoria, kcal, proteina_g, carbo_g, gordura_g,
fibra_g, sodio_mg, porcao_g, fonte, embedding, name, category, source,
nutrition (jsonb), aliases (jsonb),
-- aliases gerados na 006 (generated columns):
calories, protein, carbs, fat
```

### food_logs — colunas

```sql
id, user_id, date, meal_type (USER-DEFINED), food_id (text),
food_name, quantity_g, kcal, protein_g, carbo_g, fat_g,
confirmed (boolean), created_at
```

### weekly_plans — colunas

```sql
id, user_id, week_start (date), week_start_date (date — 006),
generated_by (USER-DEFINED), status (USER-DEFINED), created_at
```

### plan_meals — criada na 006

```sql
id, plan_id → weekly_plans.id, day_of_week (text: monday..sunday),
meal_type (text), scheduled_time, created_at
```

### plan_meal_foods — criada na 006

```sql
id, meal_id → plan_meals.id, food_name, quantity_g,
kcal, protein_g, carbo_g, fat_g,
is_checked (boolean), checked_at,
taco_id → alimentos_taco.id (opcional),
created_at
```

### Mapeamento de nomes — código vs banco

| Código (stores/services) | Banco real |
|---|---|
| `foods` | `alimentos_taco` |
| `food.calories` | `alimentos_taco.kcal` ou alias `calories` |
| `food.protein` | `alimentos_taco.proteina_g` ou alias `protein` |
| `food.carbs` | `alimentos_taco.carbo_g` ou alias `carbs` |
| `food.fat` | `alimentos_taco.gordura_g` ou alias `fat` |
| `food.name` | `alimentos_taco.nome` ou alias `name` |
| `daily_food_logs` | `food_logs` |
| `user_profiles.goal_weight_kg` | `users.target_weight` |
| `user_profiles.weekly_rate` | `users.weekly_pace` |
| `user_profiles.activity_level` | `users.activity` |
| `weekly_plans.week_start_date` | `weekly_plans.week_start` |
| `user_macros.*` | `users.daily_kcal / protein_g / carbo_g / fat_g` |

### Migrations pendentes (aplicar em ordem)

```
006_migration_real.sql  ← arquivo gerado, aplicar agora
```


## 3. DESIGN SYSTEM — REGRAS CRÍTICAS

### Paleta (constants/colors.ts)

| Token | Hex | Uso |
|---|---|---|
| Colors.primary | #CAFF66 | Botões, checkboxes, barras, destaques |
| Colors.background | #111111 | Fundo de todas as telas |
| Colors.surface | #1C1C1C | Cards, modais, inputs |
| Colors.border | #333333 | Bordas e divisórias |
| Colors.text | #FFFFFF | Texto principal |
| Colors.textSecondary | #B3B3B3 | Labels e texto secundário |
| Colors.textInverse | #111111 | Texto sobre #CAFF66 |
| Colors.protein | #FF6F43 | Proteína nos macros |
| Colors.carbo | #F59E0B | Carboidratos nos macros |
| Colors.fat | #45C588 | Gordura nos macros |
| Colors.blue | #3B82F6 | Hidratação |
| Colors.error | #EF4444 | Erros |
| Colors.greenDark | #2D6A4F | Avatar, botões secundários |

### Regras absolutas — NUNCA violar

1. **Texto sobre #CAFF66 SEMPRE PRETO #111111** — sem exceções
2. **Navbar: 4 itens apenas** — Hoje · Progresso · IA · Perfil
3. **Checkbox marcado: bg #CAFF66 + ✓ PRETO** — nunca verde escuro
4. **Agente Nuti: GPT-4o-mini** via `services/gpt.ts` — direto no app (sem Edge Function)
5. **Plano alimentar + substituição: Gemini 2.5 Flash** — apenas via Edge Function
5. **GEMINI_API_KEY** — apenas Edge Functions, nunca no app
6. **ASAAS_API_KEY** — apenas Edge Functions, nunca no app
7. **SUPABASE_SERVICE_ROLE_KEY** — apenas Edge Functions, nunca no app
8. **OPENAI_API_KEY** — pode ficar no app via `EXPO_PUBLIC_OPENAI_API_KEY` (apenas Nuti)
8. **Tokens de sessão: expo-secure-store** — nunca AsyncStorage
9. **Consentimento LGPD** — obrigatório Step 1, salvar `lgpd_consent_at`
10. **Mínimo calórico:** 1.200 kcal (F) / 1.500 kcal (M)

### Padrão visual — cards de refeição

```
Emoji: 56x56 · borderRadius 14 · bg #252525
Badge ✓ #45C588 quando refeição completa
Barra progresso: 4px #CAFF66 abaixo do header
Alimento marcado: strikethrough + cor #666666
Macros: P #FF6F43 · C #F59E0B · G #45C588
Botão "Substituir": ícone sparkles #CAFF66 (só Pro)
```

### Navbar flutuante

```
bg #1C1C1C · borderRadius 100 · borda #333333 · bottom 20
Ícones: 🏠 Hoje · 📊 Progresso · ✨ IA central elevado · 👤 Perfil
Botão IA: 52x52 · borderRadius 26 · bg #CAFF66 · ✨ PRETO · marginTop -20
Sombra: rgba(202,255,102,0.4)
```

---

## 4. MODELO FREE vs PRO

| Feature | Free | Pro |
|---|---|---|
| Tela Hoje — refeições | Cards vazios (nº do perfil) + botão + | Plano IA preenchido com checkboxes |
| Plano alimentar IA | ❌ | ✅ Cardápio fixo diário personalizado |
| Regeneração manual | ❌ | ✅ 1x por semana (countdown se já usou) |
| Renovação automática | ❌ | ✅ Todo domingo 22h (cron Supabase) |
| Substituição de alimento | ❌ | ✅ IA + busca manual (TACO + histórico) |
| Registro manual | ✅ | ✅ |
| Acompanhamento kcal/macros | ✅ | ✅ |
| Histórico | Limitado | Ilimitado |
| Trial | 7 dias Pro sem cartão, 1x/email | — |

### Preços

```
Free:        grátis
Trial:       7 dias Pro — sem cartão — 1x por email verificado
Pro Mensal:  R$24,90/mês
Pro Anual:   R$179,00/ano (R$14,90/mês) ← ⭐ MAIS POPULAR · 40% economia
```

### Hook de verificação Pro

```typescript
// hooks/useUserPlan.ts
export const useIsPro = () => {
  const { user } = useAuthStore();
  return user?.plan === 'pro' ||
    (user?.plan === 'trial' && new Date() < new Date(user.trial_ends_at));
};
```

### Paywall — 3 momentos

```
A) Bottom sheet ao tocar em feature Pro bloqueada
B) perfil/assinatura.tsx (Free vs Pro lado a lado)
C) Modal fullscreen após trial expirar (dia 8)
   → plano visível com blur
   → "Continuar Pro" #CAFF66 · "Voltar ao Free" cinza
```

---

## 5. PLANO ALIMENTAR IA

### Decisões de produto

- Cardápio **fixo diário** — mesmo cardápio replicado para os 7 dias
- Regeneração manual: **1x por semana** (countdown no botão)
- Renovação automática: **todo domingo 22h BRT** via cron
- Free: refeições em branco + card de upgrade sutil no final da lista

### Edge Function: gerar-plano — fluxo

```
1.  Verificar JWT
2.  Verificar is_pro → 403 se Free
3.  Verificar cooldown: last_plan_generated_at < 7 dias → 429 com days_remaining
    (ignorar se is_cron = true)
4.  Buscar perfil completo (users + user_profiles + user_macros)
5.  Buscar últimos 20 alimentos de daily_food_logs (preferências)
6.  Montar prompt Gemini com perfil + histórico
7.  Chamar Gemini 2.5 Flash → JSON com refeições
8.  Validar JSON (schema check) → 500 se inválido
9.  Arquivar plano anterior (status = 'archived')
10. Salvar: weekly_plans → plan_meals → plan_meal_foods
11. Replicar mesmo cardápio para os 7 dias (monday..sunday)
12. Atualizar users.last_plan_generated_at = now()
13. Retornar { success: true }
```

### Prompt base para Gemini

```typescript
const prompt = `
Você é um nutricionista especialista.
Gere um plano alimentar diário personalizado.
Este cardápio será repetido todos os dias da semana.
Use APENAS alimentos da tabela TACO (alimentos brasileiros comuns).

PERFIL:
- Objetivo: ${user.goal}
- Calorias diárias: ${user.daily_kcal} kcal
- Proteína: ${user.protein_g}g | Carboidratos: ${user.carbo_g}g | Gordura: ${user.fat_g}g
- Refeições por dia: ${user.meals_per_day}
- Dieta: ${user.diet_type ?? 'onívoro'}
- Restrições: ${user.restrictions ?? 'nenhuma'}
- Alimentos que já consome: ${recentFoods.join(', ') || 'não registrado'}

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
Use exatamente ${user.meals_per_day} refeições.
`;
```

### Cron job — domingo 22h BRT

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'regenerar-planos-domingo',
  '0 1 * * 1',   -- 01:00 UTC segunda = 22:00 BRT domingo
  $$
  SELECT net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/gerar-plano',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer [SERVICE_ROLE_KEY]'
    ),
    body := jsonb_build_object('is_cron', true, 'regenerate_all', true)
  )
  $$
);
```

### Cooldown de regeneração

```typescript
// Client (UX — mostrar countdown)
const lastGen = new Date(user.last_plan_generated_at);
const daysSince = Math.floor((Date.now() - lastGen.getTime()) / 86400000);
const daysRemaining = daysSince < 7 ? 7 - daysSince : 0;

// Server (segurança — Edge Function retorna 429 com { days_remaining })
// NUNCA confiar só no client
```

---

## 6. ONBOARDING — 9 STEPS

| Step | Conteúdo | Salva em |
|---|---|---|
| 1 | Nome + Sexo + Checkbox LGPD (obrigatório) | users.lgpd_consent_at |
| 2 | Altura + Peso + Idade (scroll picker) | user_profiles |
| 3 | Objetivo (4 opções) | user_profiles.goal |
| 4 | Peso meta (slider) | user_profiles.goal_weight_kg |
| 5 | Nível de atividade | user_profiles.activity_level |
| 6 | Refeições por dia (3-7) + horários | user_profiles.meals_per_day + notification_settings |
| 7 | Ritmo semanal | user_profiles.weekly_rate |
| 8 | Estilo de dieta (6 opções) | user_profiles.diet_type |
| 9 | Resultado: kcal + macros + IMC + data objetivo | users.onboarding_completed = true |

### Padrão visual obrigatório — todos os steps

```
bg #111111
Barra progresso topo: #CAFF66 · altura 4px
Label "PASSO X DE 9" #CAFF66 topo direito + nome branco abaixo
Seta ← branca topo esquerdo
Título grande branco bold centralizado · Subtítulo #B3B3B3
Cards selecionáveis: bg #1C1C1C · borda #333333 · borderRadius 16
  → selecionado: borda #CAFF66 · bg rgba(202,255,102,0.08)
Scroll picker: selecionado bg #CAFF66 texto PRETO bold
Botão fixo base: borderRadius 100 · bg #CAFF66 · texto PRETO · "Continuar →"
```

### Step 6 — mapeamento de refeições

```
3 → ☕ Café 07:00 · 🍽️ Almoço 13:00 · 🌙 Jantar 20:00
4 → ☕ Café 07:00 · 🍽️ Almoço 13:00 · 🥤 Lanche tarde 16:00 · 🌙 Jantar 20:00
5 → ☕ Café · 🍎 Lanche manhã · 🍽️ Almoço · 🥤 Lanche tarde · 🌙 Jantar
6 → 5 + 🌛 Ceia 22:00
7 → 6 + 🍊 Lanche extra 17:00
```

### Step 9 — layout aprovado

```
Label "CONCLUÍDO" #CAFF66 topo direito
Círculo 72x72 #CAFF66 com ✓ PRETO centralizado
Título: "Seu plano está pronto, {nome}!"

Card hero bg #CAFF66 TODO texto PRETO:
  "META CALÓRICA DIÁRIA"
  "{calories} kcal" fontSize 56 bold
  Divisória rgba(0,0,0,0.15)
  "P {protein}g · C {carbs}g · G {fat}g"

"{data objetivo}" fontSize 28 bold #CAFF66

2 cards #1C1C1C lado a lado:
  IMC: valor + badge "Normal ✓" #45C588
  META: "{atual} → {meta}kg" + badge "−Xkg" #CAFF66 texto PRETO

Botão: "Começar agora →" #CAFF66 texto PRETO

Ao pressionar:
1. Salvar Zustand → Supabase (user_profiles + user_macros)
2. users.onboarding_completed = true
3. Navegar para (tabs)/index
```

---

## 7. EDGE FUNCTIONS SUPABASE

| Função | Trigger | Responsabilidade |
|---|---|---|
| gerar-plano | Manual (Pro) + Cron domingo | Gemini → salvar plano no banco |
| substituir-alimento | Tap "Substituir" (Pro) | Gemini → 3 sugestões de substitutos |
| webhook-asaas | POST do Asaas | Atualizar users.plan conforme eventos |
| deletar-conta | Perfil → Deletar conta | Cascade delete de todos os dados (LGPD) |

### Segurança — obrigatório em todas

```typescript
// Verificar JWT
const { data: { user }, error } = await supabase.auth.getUser(
  req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
);
if (error || !user) return new Response('Unauthorized', { status: 401 });

// Rate limiting (ai_requests — 50 calls/24h)
const { count } = await supabase
  .from('ai_requests')
  .select('*', { count: 'exact' })
  .eq('user_id', user.id)
  .eq('feature', 'gerar-plano')
  .gte('created_at', new Date(Date.now() - 86400000).toISOString());
if (count >= 50) return new Response('Rate limit', { status: 429 });
```

---

## 8. SUBSTITUIÇÃO DE ALIMENTO (Pro)

```
Fluxo:
1. Usuário toca "Substituir" no alimento expandido
2. Abre FoodSubstituteSheet (bottom sheet 2 abas)

Aba "IA Sugere":
  → Chama Edge Function substituir-alimento
  → Gemini retorna 3 sugestões com perfil nutricional similar + motivo
  → Usuário escolhe → confirma

Aba "Busca manual":
  → Input com debounce 400ms
  → Busca em paralelo:
     · foods (TACO): .ilike('name', '%query%').limit(10)
     · daily_food_logs do usuário: últimos 5, order by logged_at DESC
  → Histórico: badge "✓ Já comi" em #CAFF66
  → Selecionar → input quantidade (g) → confirmar

Ao confirmar:
  → weeklyPlanStore.replaceFood(date, mealType, foodId, newFood)
  → UPDATE plan_meal_foods SET food_id, quantity_g WHERE id = foodId
```

---

## 9. BUGS CONHECIDOS — CORRIGIR

### useWeeklyPlanStore.ts

**Bug 1 — checkbox não persiste no Supabase:**
```typescript
// ERRADO (atual — só Zustand, perde ao fechar app):
toggleFoodCheck: (date, mealType, foodId) => set((state) => ({ ... }))

// CORRETO — otimista + persistência:
toggleFoodCheck: async (date, mealType, foodId) => {
  set((state) => ({ ... }));   // 1. UI imediata
  const { error } = await supabase
    .from('plan_meal_foods')
    .update({ is_checked: food.checked, checked_at: food.checked ? new Date().toISOString() : null })
    .eq('id', foodId);
  if (error) set((state) => ({ /* reverter */ }));  // 3. Reverter se falhou
};
```

**Bug 2 — cálculo de kcal errado (banco guarda por 100g):**
```typescript
// ERRADO:
kcal: f?.calories ?? 0,

// CORRETO:
kcal:      Math.round((f?.calories ?? 0) * (pmf.quantity_g ?? 0) / 100),
protein_g: Math.round((f?.protein  ?? 0) * (pmf.quantity_g ?? 0) / 100),
carbo_g:   Math.round((f?.carbs    ?? 0) * (pmf.quantity_g ?? 0) / 100),
fat_g:     Math.round((f?.fat      ?? 0) * (pmf.quantity_g ?? 0) / 100),
```

**Bug 3 — mock em produção:**
```typescript
// Quando Supabase configurado e data === null:
// ERRADO: generateMockWeeklyPlan() — mostra dados falsos
// CORRETO:
set({ plans: [], status: 'loaded' });
// Mock apenas quando isSupabaseConfigured === false (DEV local)
```

### app/(tabs)/index.tsx

**Bug 4:** título hardcoded → usar `{mealsSectionTitle}` (variável já existe)

**Bug 5:** `styles.pressed` não definido → adicionar `pressed: { opacity: 0.7 }`

**Bug 6 — código morto (remover):**
- `mealsForDisplay` — processada mas nunca renderizada
- `weekMealStatus` — não usado na UI
- Import `fetchFoodLogsForDateRange`
- Import `FoodLogEntry`

---

## 10. ANALYTICS — PostHog

| Evento | Props | Quando |
|---|---|---|
| onboarding_step_completed | `{ step: number }` | Ao concluir cada step |
| trial_started | — | Ao iniciar trial |
| paywall_viewed | `{ moment: 'A' \| 'B' \| 'C' }` | Ao abrir paywall |
| subscription_started | `{ plan: 'monthly' \| 'annual' }` | Ao assinar |
| plan_generated | — | Após gerar plano IA |
| agent_message_sent | — | Ao enviar msg para Nuti |
| food_substituted | `{ method: 'ai' \| 'manual' }` | Ao substituir alimento |
| food_checked | `{ meal_type: string }` | Ao marcar alimento consumido |

---

## 11. CÁLCULOS BASE — utils/mifflin.ts

```typescript
// TMB — Mifflin-St Jeor
const tmb = sex === 'M'
  ? 10 * weight + 6.25 * height - 5 * age + 5
  : 10 * weight + 6.25 * height - 5 * age - 161;

// TDEE
const multiplier = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
const tdee = tmb * multiplier[activity];

// Meta calórica por objetivo
const calorieGoal = {
  fat_loss:    tdee - 500,
  muscle_gain: tdee + 300,
  recomp_cut:  tdee - 300,
  full_recomp: tdee - 400,
}[goal];

// Macros (% do total calórico)
const macros = {
  fat_loss:    { p: 0.35, c: 0.35, f: 0.30 },
  muscle_gain: { p: 0.30, c: 0.45, f: 0.25 },
  recomp_cut:  { p: 0.40, c: 0.30, f: 0.30 },
  full_recomp: { p: 0.40, c: 0.30, f: 0.30 },
}[goal];

// Mínimo calórico
const minCalories = sex === 'F' ? 1200 : 1500;
const finalCalories = Math.max(minCalories, calorieGoal);

// IMC
const imc = weight / Math.pow(height / 100, 2);
const imcLabel = imc < 18.5 ? 'Abaixo do peso'
  : imc < 25 ? 'Normal ✓'
  : imc < 30 ? 'Acima do peso'
  : 'Obesidade';
```

---

## 12. OBJETIVOS — 4 OPÇÕES

| Chave | Label | Estratégia |
|---|---|---|
| fat_loss | Perder gordura | Déficit −500 kcal |
| muscle_gain | Ganhar massa muscular | Superávit +300 kcal + proteína alta |
| recomp_cut | Secar e definir | Déficit leve −300 kcal + proteína máxima |
| full_recomp | Transformação completa | Déficit −400 kcal + proteína máxima |

---

## 13. PROMPTS GEMINI

### Agente Nuti — GPT-4o-mini (services/gpt.ts)

```typescript
// services/gpt.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // necessário no React Native
});

export async function chatWithNuti(
  messages: { role: 'user' | 'assistant'; content: string }[],
  userContext: {
    name: string;
    goal: string;
    calories: number;
    streak: number;
  }
) {
  const systemPrompt = `Você é a Nuti — nutricionista de alta performance do Nutrift.
Usuário: ${userContext.name} | Objetivo: ${userContext.goal} | Meta: ${userContext.calories} kcal | Streak: ${userContext.streak} dias.
Seja direto, empático e prático. Respostas curtas (máx 3 parágrafos).
Nunca invente valores nutricionais. Se não souber, diga para consultar um nutricionista.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: 512,
    temperature: 0.7,
  });

  return response.choices[0].message.content ?? '';
}
```

**Variável de ambiente necessária (no .env do app):**
```
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
```

**Instalar dependência:**
```bash
npm install openai
```

---

## 14. CHECKLIST DE LANÇAMENTO

### Produto
- [ ] Onboarding steps 8 e 9 criados e testados
- [ ] Tela Hoje refatorada (Free vs Pro)
- [ ] Navbar corrigida (4 itens)
- [ ] Bug 1: checkbox persiste no Supabase
- [ ] Bug 2: cálculo kcal correto (× quantity_g / 100)
- [ ] Bug 3: remover mock em produção
- [ ] Bugs 4-6: corrigir index.tsx
- [ ] Edge Function gerar-plano deployada e testada
- [ ] Edge Function substituir-alimento deployada
- [ ] FoodSubstituteSheet implementado
- [ ] Paywall implementado (3 momentos A/B/C)
- [ ] Integração Asaas (webhook-asaas + criar assinatura)
- [ ] Notificações push por refeição (Expo Notifications)
- [ ] Tela exclusão de conta + Edge Function deletar-conta
- [ ] Consentimento LGPD no Step 1 salvando lgpd_consent_at

### Infraestrutura
- [ ] Conta Google Play Console ($25)
- [ ] Conta expo.dev + EAS CLI instalado
- [ ] eas.json configurado (bundle ID: com.nutrift.app)
- [ ] Projeto Supabase PROD separado do DEV
- [ ] Migrations pendentes aplicadas no PROD
- [ ] RLS habilitado em todas as tabelas
- [ ] Banco TACO importado (scripts/02_import_taco.ts)
- [ ] PostHog instalado + eventos configurados
- [ ] Sentry instalado
- [ ] Cron job configurado (pg_cron + pg_net)
- [ ] Build de produção gerado via EAS

### Play Store
- [ ] Domínio nutrift.com.br registrado (Hostinger)
- [ ] Landing page publicada
- [ ] Política de Privacidade em URL pública
- [ ] Termos de Uso em URL pública
- [ ] Ícone 1024x1024px PNG sem transparência
- [ ] Screenshots (Hoje + Progresso) 1080x1920px
- [ ] Feature Graphic 1024x500px
- [ ] Content Rating preenchido
- [ ] Build aprovado no Internal Testing Track
- [ ] App publicado na Play Store
