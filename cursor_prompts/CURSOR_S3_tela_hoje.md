# SESSÃO 3 — Tela Hoje: Free vs Pro

> Cole este prompt no Cursor com o arquivo `app/(tabs)/index.tsx` aberto.
> Pré-requisito: Sessões 1 e 2 concluídas.

---

## CONTEXTO

Nutrift — React Native + Expo SDK 54. Leia `AGENTES.md` antes de implementar.
Design system: bg #111111 · primary #CAFF66 · surface #1C1C1C · texto sobre #CAFF66 SEMPRE PRETO.

## TAREFA 1 — Corrigir bugs no arquivo index.tsx atual

Sem reescrever o arquivo, corrija cirurgicamente:

**Bug 4:** Localize onde o título "Refeições de hoje" está hardcoded e substitua pela variável `{mealsSectionTitle}` que já existe no componente.

**Bug 5:** No StyleSheet.create ao final do arquivo, adicione a entrada que está faltando:
```typescript
pressed: {
  opacity: 0.7,
},
```

**Bug 6 — Remover código morto:**
- Remova a variável `mealsForDisplay` e todo seu bloco de cálculo (não está sendo usada na renderização)
- Remova o state `weekMealStatus` (não está sendo usado na UI)
- Remova os imports `fetchFoodLogsForDateRange` e `FoodLogEntry` se estiverem importados mas não usados

## TAREFA 2 — Lógica Free vs Pro na seção de refeições

No `app/(tabs)/index.tsx`, a seção que renderiza as refeições do dia precisa bifurcar entre dois comportamentos.

Importe o hook no topo do arquivo (após imports existentes):
```typescript
import { useIsPro } from '@/hooks/useUserPlan';
```

Dentro do componente, adicione:
```typescript
const isPro = useIsPro();
const { user } = useUserStore();
const mealsCount = user?.meals_per_day ?? 4;
```

### Lógica de renderização da seção de refeições

Substitua o bloco que renderiza os MealCards pela lógica condicional abaixo.

**Se isPro === false (Free):**
Renderiza N cards vazios baseado em `mealsCount`, onde N = meals_per_day do perfil.

```tsx
// Refeições Free — cards vazios com botão de registro manual
const freeMealTypes = getMealTypesForDisplay(mealsCount);

{!isPro && (
  <>
    {freeMealTypes.map((mealType, index) => (
      <View key={mealType} style={styles.freeMealCard}>
        <View style={styles.freeMealHeader}>
          <Text style={styles.freeMealEmoji}>{MEAL_EMOJIS[mealType] ?? '🍽️'}</Text>
          <View style={styles.freeMealInfo}>
            <Text style={styles.freeMealTitle}>{MEAL_TYPE_LABELS[mealType]}</Text>
            <Text style={styles.freeMealSubtitle}>Nenhum alimento registrado</Text>
          </View>
          <TouchableOpacity
            style={styles.freeMealAddButton}
            onPress={() => router.push('/buscar-alimento')}
          >
            <Text style={styles.freeMealAddIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    ))}

    {/* Card de upgrade sutil no final */}
    <TouchableOpacity
      style={styles.upgradeCard}
      onPress={() => router.push('/perfil/assinatura')}
    >
      <Text style={styles.upgradeIcon}>✨</Text>
      <View style={styles.upgradeTextContainer}>
        <Text style={styles.upgradeTitle}>Receba um plano personalizado com IA</Text>
        <Text style={styles.upgradeSubtitle}>Assine o Pro e deixe a Nuti montar tudo para você</Text>
      </View>
      <Text style={styles.upgradeArrow}>→</Text>
    </TouchableOpacity>
  </>
)}
```

**Styles para o bloco Free** (adicionar no StyleSheet):
```typescript
freeMealCard: {
  backgroundColor: '#1C1C1C',
  borderRadius: 16,
  padding: 16,
  marginBottom: 8,
  borderWidth: 1,
  borderColor: '#2A2A2A',
},
freeMealHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},
freeMealEmoji: {
  fontSize: 32,
  width: 44,
  textAlign: 'center',
},
freeMealInfo: {
  flex: 1,
},
freeMealTitle: {
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: '600',
},
freeMealSubtitle: {
  color: '#666666',
  fontSize: 13,
  marginTop: 2,
},
freeMealAddButton: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#2A2A2A',
  borderWidth: 1,
  borderColor: '#CAFF66',
  alignItems: 'center',
  justifyContent: 'center',
},
freeMealAddIcon: {
  color: '#CAFF66',
  fontSize: 22,
  fontWeight: '300',
  lineHeight: 26,
},
upgradeCard: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#1A1A1A',
  borderRadius: 16,
  padding: 16,
  marginTop: 8,
  borderWidth: 1,
  borderColor: '#2A2A2A',
  gap: 12,
},
upgradeIcon: {
  fontSize: 24,
},
upgradeTextContainer: {
  flex: 1,
},
upgradeTitle: {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: '600',
},
upgradeSubtitle: {
  color: '#888888',
  fontSize: 12,
  marginTop: 2,
},
upgradeArrow: {
  color: '#CAFF66',
  fontSize: 18,
},
```

**Se isPro === true (Pro):**
Mantém o comportamento atual de renderizar os MealCards com o plano da semana.
Certifique-se de que o bloco Pro está dentro de `{isPro && ( ... )}`.

## TAREFA 3 — Constante MEAL_EMOJIS

Se não existir, crie em `types/nutrition.ts` ou `constants/macros.ts`:

```typescript
export const MEAL_EMOJIS: Record<string, string> = {
  cafe: '☕',
  lanche_manha: '🍎',
  almoco: '🍽️',
  lanche: '🥤',
  jantar: '🌙',
  pre_treino: '⚡',
  pos_treino: '💪',
  ceia: '🌛',
};
```

## TAREFA 4 — Estado do botão "Gerar plano" (Pro)

No header da seção de refeições Pro, adicione o botão de regeneração com countdown:

```tsx
import { usePlanDaysRemaining } from '@/hooks/useUserPlan';

// Dentro do componente:
const daysRemaining = usePlanDaysRemaining();
const canRegenerate = daysRemaining === 0;

// Botão (exibir apenas para Pro):
{isPro && (
  <TouchableOpacity
    style={[styles.regenButton, !canRegenerate && styles.regenButtonDisabled]}
    onPress={canRegenerate ? handleRegenerate : undefined}
    disabled={!canRegenerate}
  >
    <Text style={styles.regenButtonText}>
      {canRegenerate ? '✨ Novo plano' : `🔒 ${daysRemaining}d`}
    </Text>
  </TouchableOpacity>
)}

// handleRegenerate:
const handleRegenerate = async () => {
  try {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    const res = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/gerar-plano`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      }
    );
    if (res.ok) {
      await fetchWeeklyPlan(); // refetch do store
    }
  } catch (e) {
    console.error('[Hoje] Erro ao regenerar plano:', e);
  }
};
```

**Styles para botão regenerar:**
```typescript
regenButton: {
  paddingHorizontal: 14,
  paddingVertical: 7,
  borderRadius: 100,
  backgroundColor: '#CAFF66',
},
regenButtonDisabled: {
  backgroundColor: '#2A2A2A',
},
regenButtonText: {
  color: '#111111',
  fontSize: 13,
  fontWeight: '700',
},
```

## REGRAS

- Texto sobre #CAFF66 SEMPRE PRETO #111111
- Não remover nenhuma feature existente Pro que já funciona
- Rodar `npx tsc --noEmit` após as alterações
- Não instalar dependências novas
