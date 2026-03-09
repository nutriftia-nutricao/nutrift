# Resultado da avaliação funcional — Nutrift

Documento gerado a partir do plano de avaliação funcional. Cada item foi verificado no código (auditoria estática); itens que exigem execução do app estão marcados como "Não testado (requer execução)".

---

## 1. Pré-requisitos

| Item | Resultado | Detalhe |
|------|-----------|---------|
| **Schema 001** | **Falha** | O arquivo `supabase/migrations/001_nutrift_schema.sql` **não existe** no repositório. Existem apenas `002_add_onboarding_completed.sql` e `003_add_liked_foods.sql`, que fazem `ALTER TABLE public.users`. A documentação em `docs/SUPABASE_NUTRIFT.md` referencia a migração 001 para criar tabelas `users`, `food_logs`, `weekly_plans`, `meal_plans`, `agent_messages` e RLS. **Ação:** Recriar/versionar a migração 001 ou confirmar se o schema foi aplicado manualmente no projeto Supabase. |
| **Variáveis de ambiente** | **OK (parcial)** | `.env.example` existe na raiz com `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_GEMINI_KEY`. Sem `.env` real: `services/supabase.ts` usa placeholders; `services/gemini.ts` usa string vazia e fallback mock. |
| **Supabase Auth** | **Não testado** | Documentação em `docs/GOOGLE_LOGIN.md` e `docs/ANALISETELAS_E_FLUXO.md` descreve "Confirm email" e Redirect URLs. Comportamento só validável com app rodando e projeto Supabase configurado. |

---

## 2. Checklist 3.1 — Autenticação e entrada

| Item | Status | Observação |
|------|--------|------------|
| Login e-mail/senha | **OK (código)** | `login.tsx`: validação de campos, `signIn`, tratamento de erro com `Alert`, redirecionamento via `handleAuthSuccess` → `router.replace("/")`. Com placeholders de Supabase, a chamada falhará em runtime. |
| Cadastro (Register) | **OK (código)** | `register.tsx`: validação (nome, e-mail, senha ≥6, confirmação); `setCredentials` em `useSignupStore`; `setNameOnboarding`; `router.replace("/(auth)/onboarding/step-1")`. Conta criada no step-9, não no register. |
| Login com Google | **OK (código)** | `auth.ts`: `signInWithOAuth`, `WebBrowser.openAuthSessionAsync`, extração de tokens do hash/query, `setSession`. `login.tsx`: `handleGoogleSignIn` → `checkSessionAndRedirect` → `handleAuthSuccess` (fetch/ensure profile, setUser, router.replace("/")). |
| app/index.tsx | **OK (código)** | `recoverSessionFromUrl()`, `getSession()`, retry na web; `fetchUserProfile` / `ensureUserProfile`, `setUser`, hidratação e onboarding store; decisão: sem sessão → login; com sessão e `!onboarding_completed` → step-1; senão → `/(tabs)/`. |
| Logout | **OK (código)** | `_layout.tsx`: `onAuthStateChange` em `SIGNED_OUT`; se `segments[0] === "(tabs)"` faz `router.replace("/(auth)/login")`. |

**Risco:** Sem `EXPO_PUBLIC_SUPABASE_*` válidos, login e perfil não persistem; mensagens de erro vêm do Supabase/Alert.

---

## 3. Checklist 3.2 — Onboarding (steps 1–9)

| Item | Status | Observação |
|------|--------|------------|
| Fluxo linear 1→9 | **OK (código)** | `_layout.tsx` declara todos os steps; cada step faz `router.push` ao próximo; `OnboardingHeader` com fallbackRoute para voltar. |
| Step 1 | **OK** | Nome (store), sexo; `useOnboardingStore`. |
| Step 2 | **OK** | Dados corporais (altura, peso, idade, % gordura); store. |
| Step 3 | **Falha (conforme TASKS)** | Apenas **3 opções**: perder_gordura, ganhar_massa, manter. TASKS.md pede **4 opções**; falta uma no layout. |
| Steps 4–7 | **OK** | Peso meta, atividade, treino, ritmo semanal; dados no store. |
| Step 8 | **OK** | Preferências alimentares (diet_type, liked_foods); `step-8.tsx` existe e usa store. |
| Step 9 | **OK (código)** | Resultado (meta, IMC, etc.); signUp com credenciais do register ou sessão OAuth; `supabase.from("users").update(profileData)` (OAuth) ou `.insert(profile)` (novo); `onboarding_completed: true`. |
| Persistência ao final | **OK (código)** | Step-9 faz insert/update em `users`. Próximo login: index carrega perfil e redireciona para `/(tabs)/` se `onboarding_completed`. |

**Risco:** RLS/schema incorretos podem fazer insert/update falhar; usuário pode ficar preso.

---

## 4. Checklist 3.3 — Tela Hoje

| Item | Status | Observação |
|------|--------|------------|
| Carregamento | **OK (código)** | `loadForDate(user.id, date)` no `useFocusEffect`; `fetchFoodLogsForDate` e `fetchStreak` em `useNutritionStore`; estados `isLoading`, `error`. |
| Adicionar alimento | **Falha** | A tela Hoje usa `useNutritionStore` e exibe refeições do **plano semanal** (useWeeklyPlanStore) + logs do dia. Não há botão/link na tela que abra `buscar-alimento` com data/refeição. `buscar-alimento.tsx` ao selecionar alimento só faz `router.back()` e **não chama** `addFoodLog`. Fluxo "adicionar alimento ao dia" **incompleto**. |
| Confirmar refeição | **OK (código)** | `confirmMeal(user.id, mealKey)` no store; `confirmMealLogs` em `services/nutrition.ts` atualiza `confirmed` em `food_logs`; store atualiza logs e chama `fetchStreak`. |
| Streak | **OK (código)** | `fetchStreak` no store; exibido na UI (pill + StreakCelebrationModal). |
| Sem Supabase | **OK (código)** | `fetchFoodLogsForDate` retorna `[]` em erro; `loadForDate` trata e seta `error`; UI tem estado de loading e lista vazia. |

**Dado:** Hoje está conectada ao Supabase para `food_logs` quando env está configurado. A tela também usa `useWeeklyPlanStore` (plano da semana) e exibe `plannedMeals` + checkboxes; esse plano vem do store (que usa Supabase ou mock).

---

## 5. Checklist 3.4 — Plano semanal

| Item | Status | Observação |
|------|--------|------------|
| Tela plano-semanal.tsx | **Falha** | Usa **apenas estado local** (`useState(getMockMealPlans())`) e **não** usa `useWeeklyPlanStore`. Dados exibidos são sempre mock. |
| useWeeklyPlanStore | **OK (código)** | Se `isSupabaseConfigured`: chama `supabase.from("weekly_plans")` com join em `plan_meals`, `plan_meal_foods`, `foods`. Se não: `generateMockWeeklyPlan(weekStartISO)`. |
| Inconsistência | **Falha** | A tela que o usuário abre ao clicar "Semana" (ou link para plano-semanal) é `plano-semanal.tsx`, que **não** lê do store nem do Supabase. A tela **Hoje** (tabs/index) usa o store para exibir o plano do dia selecionado; ao abrir a tela "Plano semanal" (modal/stack), os dados são outro mock. |

**Conclusão:** Plano semanal (tela dedicada) está **não funcional** com dados reais — tela desconectada do store e do backend.

---

## 6. Checklist 3.5 — Buscar alimento e substituir alimento

| Item | Status | Observação |
|------|--------|------------|
| buscar-alimento.tsx | **Falha (mock)** | Recentes e favoritos: `getMockRecentFoods()`, `getMockFavoriteFoods()`. Busca: `setTimeout` com `mockResults` fixos. `handleSelectFood` apenas `router.back()` — **não** chama `addFoodLog` nem passa parâmetros para a tela que abriu. |
| substituir-alimento.tsx | **OK (código, depende Gemini)** | Usa `getSimilarFoodSuggestions` (services/gemini.ts); em falha da API há fallback com sugestões mock. |
| Integração com Hoje | **Falha** | Após escolher alimento em buscar-alimento, nada é gravado em `food_logs`. Fluxo "adicionar alimento ao dia" não implementado de ponta a ponta. |

---

## 7. Checklist 3.6 — Progresso e Agente

| Item | Status | Observação |
|------|--------|------------|
| progresso.tsx | **Falha (mock)** | Comentário no código: "Dados mock". `WEIGHT_DATA` e `CALORIES_DATA` estáticos; não há integração com `food_logs` ou `weekly_plans`. |
| agente.tsx | **OK (código, depende Gemini)** | `useAgenteStore` (mensagens em memória), `sendChatMessage`, `transcribeAudio`. Sem persistência em `agent_messages`. Com `EXPO_PUBLIC_GEMINI_KEY` o chat funciona; sem chave, o serviço retorna mock em falha. |
| Persistência do agente | **Falha** | Histórico de mensagens não é salvo no Supabase (`agent_messages` não usado no código atual). |

---

## 8. Checklist 3.7 — Perfil e subtelas

| Item | Status | Observação |
|------|--------|------------|
| Perfil | **OK (código)** | Dados de `useUserStore`; origem em `fetchUserProfile(session.user.id)` (Supabase `users`) no index. |
| Subtelas com update Supabase | **OK (código)** | `meu-objetivo.tsx`: `supabase.from("users").update(updates).eq("id", user.id)` + `updateUser(updates)`. `dados-corporais.tsx`: `.update(updates)` em users. Outras subtelas: verificar se só leem do store ou também atualizam (notificacoes, dieta-preferencias, treino, etc.). |

**Nota:** `useUserStore.updateUser` apenas atualiza estado local; persistência depende de cada tela chamar Supabase.

---

## 9. Lista de gaps funcionais

1. **Schema 001 ausente** — Migração base não versionada; tabelas/RLS podem não existir no projeto.
2. **Plano semanal (tela)** — Tela `plano-semanal.tsx` não usa `useWeeklyPlanStore` nem Supabase; sempre mock.
3. **Step 3 onboarding** — Apenas 3 opções de objetivo; TASKS pede 4.
4. **Adicionar alimento ao dia** — Buscar-alimento não recebe data/refeição nem chama `addFoodLog`; fluxo incompleto.
5. **Buscar alimento** — 100% mock (recentes, favoritos, busca); sem TACO nem Supabase.
6. **Progresso** — Dados mock; sem integração com food_logs/weekly_plans.
7. **Agente** — Histórico não persistido em `agent_messages`.

---

## 10. Priorização

### Bloqueante para "app funcional e operacional"

- **Schema e env:** Garantir existência do schema base (001 ou equivalente) e `.env` com Supabase (e opcionalmente Gemini) para auth, perfil e food_logs funcionarem.
- **Fluxo "adicionar alimento":** Conectar buscar-alimento à tela Hoje (parâmetros de data/refeição) e chamar `addFoodLog` ao selecionar alimento; ou implementar fluxo alternativo consistente.

### Importante (dados reais)

- **Plano semanal (tela):** Conectar `plano-semanal.tsx` ao `useWeeklyPlanStore` (e portanto ao Supabase quando configurado) ou unificar fonte e remover mock local.
- **Step 3:** Incluir 4ª opção de objetivo conforme TASKS.

### Melhorias (não bloqueantes para MVP)

- **Progresso:** Alimentar gráficos/cards com `food_logs` (e eventualmente peso em users ou tabela dedicada).
- **Agente:** Persistir mensagens em `agent_messages` para histórico entre sessões.
- **Buscar alimento:** Integrar TACO ou base própria via Supabase; persistir recentes/favoritos.

---

## 11. Ordem sugerida para correções

1. Recriar/versionar migração 001 (schema base) e configurar `.env`.
2. Corrigir step 3 (4 opções) e validar onboarding completo com Supabase.
3. Implementar fluxo "adicionar alimento" (buscar-alimento → addFoodLog com date/mealType).
4. Conectar tela plano-semanal ao useWeeklyPlanStore (e remover mock local da tela).
5. Progresso e agente persistido conforme prioridade de produto.
