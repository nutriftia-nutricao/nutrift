# SESSÃO 1 — Banco de dados + useWeeklyPlanStore

> Cole este prompt inteiro no Cursor (Cmd+L ou chat lateral).
> Contexto necessário: abrir os arquivos `stores/useWeeklyPlanStore.ts` e `services/weeklyPlan.ts` antes de colar.

---

## CONTEXTO

Estou construindo o Nutrift — app de nutrição React Native + Expo SDK 54 + Supabase.
Leia o `AGENTES.md` na raiz do projeto antes de qualquer implementação.

## TAREFA 1 — Migrations pendentes no Supabase

Crie o arquivo `supabase/migrations/006_pending_fields.sql` com exatamente este conteúdo:

```sql
-- Migration 006: campos pendentes para plano alimentar e rastreamento

-- 1. Campo is_pro na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false;

-- 2. Cooldown de regeneração do plano
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_plan_generated_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Timestamp do checkbox (quando o alimento foi consumido)
ALTER TABLE plan_meal_foods ADD COLUMN IF NOT EXISTS checked_at TIMESTAMPTZ DEFAULT NULL;

-- 4. Source dos alimentos (TACO, gemini, user)
ALTER TABLE foods ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'TACO';

-- 5. Tabela de histórico de alimentos consumidos manualmente
CREATE TABLE IF NOT EXISTS daily_food_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_id      UUID REFERENCES foods(id),
  food_name    TEXT NOT NULL,
  quantity_g   NUMERIC NOT NULL,
  kcal         NUMERIC NOT NULL,
  protein_g    NUMERIC,
  carbo_g      NUMERIC,
  fat_g        NUMERIC,
  meal_type    TEXT,
  logged_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_food_logs_user_date
  ON daily_food_logs(user_id, logged_at DESC);

ALTER TABLE daily_food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_food_logs"
  ON daily_food_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Sincronizar is_pro com campo plan (trigger)
CREATE OR REPLACE FUNCTION sync_is_pro()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_pro := (NEW.plan = 'pro') OR
    (NEW.plan = 'trial' AND NEW.trial_ends_at > NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_is_pro ON users;
CREATE TRIGGER trg_sync_is_pro
  BEFORE INSERT OR UPDATE OF plan, trial_ends_at ON users
  FOR EACH ROW EXECUTE FUNCTION sync_is_pro();
```

## TAREFA 2 — Corrigir useWeeklyPlanStore.ts

Corrija os 3 bugs descritos abaixo no arquivo `stores/useWeeklyPlanStore.ts`.
**Não reescreva o arquivo inteiro** — faça cirurgicamente as alterações necessárias.

### Bug 1 — toggleFoodCheck não persiste no Supabase

Substitua a função `toggleFoodCheck` atual por uma versão async com atualização otimista:

```typescript
toggleFoodCheck: async (date: string, mealType: string, foodId: string) => {
  // 1. Identificar o estado atual do food
  const state = get();
  const plan = state.plans.find(p => p.date === date);
  const meal = plan?.meals.find(m => m.type === mealType);
  const food = meal?.foods.find(f => f.id === foodId);
  if (!food) return;

  const newChecked = !food.checked;

  // 2. Atualizar Zustand imediatamente (otimista)
  set(state => ({
    plans: state.plans.map(p =>
      p.date !== date ? p : {
        ...p,
        meals: p.meals.map(m =>
          m.type !== mealType ? m : {
            ...m,
            foods: m.foods.map(f =>
              f.id !== foodId ? f : { ...f, checked: newChecked }
            )
          }
        )
      }
    )
  }));

  // 3. Persistir no Supabase
  const { error } = await supabase
    .from('plan_meal_foods')
    .update({
      is_checked: newChecked,
      checked_at: newChecked ? new Date().toISOString() : null
    })
    .eq('id', foodId);

  // 4. Reverter se falhou
  if (error) {
    console.error('[WeeklyPlan] Erro ao persistir checkbox:', error);
    set(state => ({
      plans: state.plans.map(p =>
        p.date !== date ? p : {
          ...p,
          meals: p.meals.map(m =>
            m.type !== mealType ? m : {
              ...m,
              foods: m.foods.map(f =>
                f.id !== foodId ? f : { ...f, checked: !newChecked }
              )
            }
          )
        }
      )
    }));
  }
},
```

### Bug 2 — Cálculo de kcal/macros incorreto

Na função `mapWeeklyPlanRowToPlannedMeals` (ou equivalente que mapeia os dados do Supabase), localize onde os valores nutricionais são atribuídos e corrija o cálculo — o banco armazena valores por 100g, então é preciso multiplicar por `quantity_g / 100`:

```typescript
// ANTES (errado):
kcal: f?.calories ?? 0,
protein_g: f?.protein ?? 0,
carbo_g: f?.carbs ?? 0,
fat_g: f?.fat ?? 0,

// DEPOIS (correto):
kcal:      Math.round(((f?.calories ?? 0) * (pmf.quantity_g ?? 100)) / 100),
protein_g: Math.round(((f?.protein  ?? 0) * (pmf.quantity_g ?? 100)) / 100),
carbo_g:   Math.round(((f?.carbs    ?? 0) * (pmf.quantity_g ?? 100)) / 100),
fat_g:     Math.round(((f?.fat      ?? 0) * (pmf.quantity_g ?? 100)) / 100),
```

### Bug 3 — Mock sendo exibido em produção

Localize o bloco onde `generateMockWeeklyPlan()` é chamado quando `data === null`.
Substitua pela lógica:

```typescript
// Se Supabase está configurado e não há plano → usuário Free ou sem plano ainda
// Não mostrar mock — apenas estado vazio
if (isSupabaseConfigured) {
  set({ plans: [], status: 'loaded', hasActivePlan: false });
  return;
}

// Apenas em DEV local (Supabase não configurado):
const mockPlan = generateMockWeeklyPlan();
set({ plans: mockPlan, status: 'loaded', hasActivePlan: true });
```

## TAREFA 3 — Criar hook useUserPlan.ts

Crie o arquivo `hooks/useUserPlan.ts`:

```typescript
import { useUserStore } from '@/stores/useUserStore';

export const useIsPro = (): boolean => {
  const user = useUserStore(state => state.user);
  if (!user) return false;
  if (user.plan === 'pro') return true;
  if (user.plan === 'trial' && user.trial_ends_at) {
    return new Date() < new Date(user.trial_ends_at);
  }
  return false;
};

export const usePlanDaysRemaining = (): number => {
  const user = useUserStore(state => state.user);
  if (!user?.last_plan_generated_at) return 0;
  const lastGen = new Date(user.last_plan_generated_at);
  const daysSince = Math.floor((Date.now() - lastGen.getTime()) / 86400000);
  return Math.max(0, 7 - daysSince);
};
```

## REGRAS

- Não altere nenhum arquivo além dos citados acima
- Não mude nenhum tipo TypeScript existente sem confirmar
- Não instale nenhuma dependência nova
- Após as alterações, rode `npx tsc --noEmit` para verificar erros de tipo
