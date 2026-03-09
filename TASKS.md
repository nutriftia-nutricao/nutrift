# TASKS.md — Nutrift
> Ordem de execução. Marque conforme conclui.
> Cada sessão = 1 prompt Cursor separado na pasta `cursor_prompts/`.

---

## ANTES DE COMEÇAR

```bash
# 1. Aplicar migrations no Supabase (SQL Editor)
# Cole o conteúdo de supabase/migrations/006_pending_fields.sql

# 2. Verificar ambiente
npx tsc --noEmit

# 3. Confirmar variáveis de ambiente no .env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=          ← apenas Edge Functions, não vai aqui
ASAAS_API_KEY=           ← apenas Edge Functions, não vai aqui
```

---

## SESSÃO 1 — Banco + Store
**Prompt:** `CURSOR_S1_banco_e_store.md`

- [ ] Migration 006 aplicada no Supabase
- [ ] Bug 1 corrigido: `toggleFoodCheck` persiste no Supabase
- [ ] Bug 2 corrigido: cálculo kcal × quantity_g / 100
- [ ] Bug 3 corrigido: mock removido em produção
- [ ] Hook `hooks/useUserPlan.ts` criado (`useIsPro` + `usePlanDaysRemaining`)
- [ ] `npx tsc --noEmit` sem erros

---

## SESSÃO 2 — Edge Functions
**Prompt:** `CURSOR_S2_edge_functions.md`

- [ ] `supabase/functions/gerar-plano/index.ts` criado
- [ ] `supabase/functions/substituir-alimento/index.ts` criado
- [ ] Secrets configurados: `supabase secrets set GEMINI_API_KEY=...`
- [ ] Teste local: `supabase functions serve gerar-plano`
- [ ] Deploy: `supabase functions deploy gerar-plano`
- [ ] Deploy: `supabase functions deploy substituir-alimento`

---

## SESSÃO 3 — Tela Hoje
**Prompt:** `CURSOR_S3_tela_hoje.md`

- [ ] Bugs 4, 5, 6 corrigidos no `app/(tabs)/index.tsx`
- [ ] Cards Free (vazios) implementados
- [ ] Card de upgrade sutil implementado
- [ ] Bloco Pro envolto em `{isPro && ...}`
- [ ] Botão regenerar com countdown implementado
- [ ] Constante `MEAL_EMOJIS` criada
- [ ] `npx tsc --noEmit` sem erros

---

## SESSÃO 4 — Substituição + Paywall
**Prompt:** `CURSOR_S4_substituicao_paywall.md`

- [ ] `components/home/FoodSubstituteSheet.tsx` criado
- [ ] Aba IA funcionando (chama Edge Function)
- [ ] Aba manual funcionando (TACO + histórico com badge "✓ Já comi")
- [ ] Tela `app/perfil/assinatura.tsx` criada com Free vs Pro lado a lado
- [ ] Toggle Mensal / Anual funcionando
- [ ] `npx tsc --noEmit` sem erros

---

## SESSÃO 5 — Onboarding + Cron + Deletar conta
**Prompt:** `CURSOR_S5_onboarding_perfil_cron.md`

- [ ] `app/(auth)/onboarding/step-8.tsx` criado (estilo de dieta)
- [ ] `app/(auth)/onboarding/step-9.tsx` criado (resultado do plano)
- [ ] `calculateMacros` adicionado em `utils/mifflin.ts`
- [ ] Step 9 salva perfil + macros + `onboarding_completed = true`
- [ ] Cron job configurado no SQL Editor do Supabase
- [ ] `supabase/functions/deletar-conta/index.ts` criado
- [ ] `npx tsc --noEmit` sem erros

---

## PÓS-SESSÕES — Infra e lançamento

### Asaas (fazer manualmente)
- [ ] Criar conta em asaas.com
- [ ] Gerar chave de API (sandbox primeiro)
- [ ] Configurar webhook: `URL/functions/v1/webhook-asaas`
- [ ] Criar planos: mensal R$24,90 + anual R$179,00
- [ ] Implementar `supabase/functions/webhook-asaas/index.ts`
- [ ] Conectar botão "Assinar" na tela de assinatura ao Asaas

### PostHog
- [ ] `npm install posthog-react-native`
- [ ] Configurar em `app/_layout.tsx`
- [ ] Adicionar `posthog.capture()` nos 8 eventos do `AGENTES.md`

### Sentry
- [ ] `npx @sentry/wizard@latest -i reactNative`
- [ ] Envolver app com `Sentry.wrap()`

### Build e Play Store
- [ ] `npm install -g eas-cli`
- [ ] `eas login`
- [ ] Criar `eas.json` com profile production
- [ ] `eas build --platform android --profile production`
- [ ] Criar conta Google Play Console ($25)
- [ ] Upload do AAB na Internal Testing Track
- [ ] Testar no próprio dispositivo
- [ ] Publicar

### Web
- [ ] Registrar `nutrift.com.br` na Hostinger
- [ ] Publicar landing page (Lovable ou Next.js)
- [ ] Hospedar Política de Privacidade em URL pública
- [ ] Hospedar Termos de Uso em URL pública
