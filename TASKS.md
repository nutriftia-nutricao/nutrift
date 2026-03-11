# TASKS.md — Nutrift
> Ordem de execução realista e atualizada do projeto.
> Regra principal: estabilizar o core antes de adicionar complexidade.
> Cada sessão = 1 prompt separado em `cursor_prompts/`.

---

## PRINCÍPIOS DE EXECUÇÃO

- Sempre fazer **1 sessão por vez**
- Sempre aplicar **patch mínimo**
- Nunca reescrever telas inteiras sem necessidade
- Nunca quebrar design aprovado
- Sempre rodar ao final:
  - `npx tsc --noEmit`
- Antes de avançar:
  - validar fluxo manual no app real (Android físico preferencialmente)

---

## STATUS ATUAL DO PROJETO (IMPORTANTE)

### Já resolvido
- [x] Deep link / QR não pode mais burlar auth em `plano-semanal`
- [x] `app/plano-semanal.tsx` agora possui guarda de auth + onboarding
- [x] `app/index.tsx` está mais estável e sem dependência desnecessária de `user?.id`
- [x] Novo cadastro voltou a funcionar
- [x] Erro `database error saving new user` foi causado por trigger legado `trg_sync_is_pro`
- [x] Trigger legado `trg_sync_is_pro` removido temporariamente do banco
- [x] Novo usuário agora entra no onboarding corretamente

### Atenção crítica
- [ ] Banco Supabase real possui **drift** em relação às migrations
- [ ] Existe lógica legada fora do repositório (ex.: `sync_is_pro`)
- [ ] Antes de avançar muito, validar que o banco real está alinhado com o app

---

# SESSÃO 1 — Estabilizar fluxo de cadastro + onboarding
**Prompt sugerido:** `CURSOR_S1_fluxo_auth_onboarding.md`

Objetivo: garantir que o fluxo principal do Nutrift está 100% confiável.

- [ ] Revisar `app/(auth)/onboarding/step-1.tsx`
- [ ] Revisar `app/(auth)/onboarding/step-8.tsx` (se existir)
- [ ] Revisar `app/(auth)/onboarding/step-9.tsx`
- [ ] Revisar `services/user.ts`
- [ ] Revisar `app/index.tsx`

### Validar:
- [ ] Usuário novo cria conta sem erro
- [ ] Usuário entra no onboarding automaticamente
- [ ] Dados do onboarding persistem corretamente
- [ ] Step final salva no `public.users`
- [ ] `onboarding_completed = true` é salvo corretamente
- [ ] Usuário cai em `/(tabs)/` ao concluir
- [ ] Reabrir app não volta para onboarding
- [ ] Sem regressão no login

### Banco:
- [ ] Confirmar se `public.users` está recebendo os dados esperados
- [ ] Confirmar se não há outros triggers legados problemáticos
- [ ] Não recriar `trg_sync_is_pro` ainda

### Verificação final:
- [ ] `npx tsc --noEmit` sem erros

---

# SESSÃO 2 — Tela Hoje (core principal do produto)
**Prompt sugerido:** `CURSOR_S2_tela_hoje_core.md`

Objetivo: tornar a tela Hoje o centro do app, confiável e limpa.

- [ ] Revisar `app/(tabs)/index.tsx`
- [ ] Corrigir carregamento do plano do dia atual
- [ ] Garantir data correta do dia selecionado
- [ ] Garantir refeições corretas por dia
- [ ] Garantir macros consumidos corretos
- [ ] Garantir cálculo correto de calorias e macros por alimento
- [ ] Corrigir `quantity_g` → cálculo kcal × quantity_g / 100 (se ainda houver inconsistência)
- [ ] Remover qualquer mock residual em produção
- [ ] Criar / validar constante `MEAL_EMOJIS`
- [ ] Melhorar loading / empty state sem poluir UX

### Free vs Pro (na tela Hoje)
- [ ] Free vê conteúdo útil e não tela “morta”
- [ ] Pro vê bloco completo
- [ ] Blocos Pro envoltos em `{isPro && ...}` quando necessário
- [ ] CTA de upgrade sutil e elegante

### Verificação final:
- [ ] `npx tsc --noEmit` sem erros

---

# SESSÃO 3 — Aderência diária + persistência real
**Prompt sugerido:** `CURSOR_S3_aderencia_diaria.md`

Objetivo: fazer a aderência virar mecânica central do Nutrift.

- [ ] Corrigir / validar `toggleFoodCheck`
- [ ] Garantir persistência real no Supabase
- [ ] Garantir que check de alimento reflita no dia correto
- [ ] Garantir que o estado persiste ao reabrir app
- [ ] Garantir que logs manuais não conflitam com plano semanal

### Regras de aderência:
- [ ] Aderência por alimento concluído
- [ ] Aderência por refeição (agregada)
- [ ] Aderência diária consolidada
- [ ] Definir regra clara:
  - `complete`
  - `partial`
  - `off_plan`
  - `empty`

### Verificação final:
- [ ] `npx tsc --noEmit` sem erros

---

# SESSÃO 4 — Calendário / visão semanal
**Prompt sugerido:** `CURSOR_S4_calendario_aderencia.md`

Objetivo: mostrar consistência visual e motivação.

- [ ] Revisar calendário / week strip
- [ ] Exibir status visual do dia
- [ ] Mostrar dia atual com destaque correto
- [ ] Navegar entre dias sem quebrar store
- [ ] Preservar seleção de data
- [ ] Garantir leitura correta da aderência por dia
- [ ] Empty states elegantes

### Status visuais:
- [ ] `complete`
- [ ] `partial`
- [ ] `off_plan`
- [ ] `empty`

### Verificação final:
- [ ] `npx tsc --noEmit` sem erros

---

# SESSÃO 5 — Free vs Pro + Trial de 7 dias
**Prompt sugerido:** `CURSOR_S5_free_pro_trial.md`

Objetivo: estruturar monetização sem quebrar o valor do Free.

- [ ] Criar / revisar `hooks/useUserPlan.ts`
- [ ] Expor `useIsPro`
- [ ] Expor `usePlanDaysRemaining`
- [ ] Garantir regra de trial de 7 dias
- [ ] Garantir expiração correta do trial
- [ ] Garantir `is_pro` derivado corretamente no app (sem depender do trigger legado por enquanto)

### Regra atual recomendada:
- Free:
  - [ ] Acesso à tela Hoje
  - [ ] Registro manual
  - [ ] Acompanhamento básico
- Pro:
  - [ ] Plano semanal completo
  - [ ] Substituição com IA
  - [ ] Histórico mais inteligente
  - [ ] Insights futuros
- Trial:
  - [ ] 7 dias ao concluir onboarding (ou conforme regra definida)

### Verificação final:
- [ ] `npx tsc --noEmit` sem erros

---

# SESSÃO 6 — Tela de assinatura / paywall inteligente
**Prompt sugerido:** `CURSOR_S6_paywall_assinatura.md`

Objetivo: vender sem parecer agressivo.

- [ ] Criar / revisar `app/perfil/assinatura.tsx`
- [ ] Free vs Pro lado a lado
- [ ] Benefícios claros e curtos
- [ ] Toggle Mensal / Anual
- [ ] Botão “Assinar” pronto para integração
- [ ] CTA sutil
- [ ] UX sem poluição visual

### Verificação final:
- [ ] `npx tsc --noEmit` sem erros

---

# SESSÃO 7 — Geração do plano semanal (IA)
**Prompt sugerido:** `CURSOR_S7_geracao_plano.md`

Objetivo: consolidar a principal promessa do Nutrift.

- [ ] Revisar `app/plano-semanal.tsx`
- [ ] Revisar serviço de geração atual
- [ ] Garantir que auth guard permanece intacto
- [ ] Garantir que somente usuário autorizado acessa
- [ ] Garantir que plano semanal é salvo corretamente
- [ ] Garantir cooldown / countdown de regeneração
- [ ] Garantir feedback visual elegante
- [ ] Garantir que plano semanal não pode ser “spamado”

### Edge Function / serviço
- [ ] Criar ou estabilizar `supabase/functions/gerar-plano/index.ts` (se for manter esse nome)
- [ ] Confirmar nome final da função (evitar duplicidade com `generate-weekly-plan`)
- [ ] Padronizar 1 única fonte de geração

### Verificação final:
- [ ] `npx tsc --noEmit` sem erros

---

# SESSÃO 8 — Substituição de alimentos (manual + IA)
**Prompt sugerido:** `CURSOR_S8_substituicao_alimentos.md`

Objetivo: permitir flexibilidade sem destruir consistência.

- [ ] Criar / revisar `components/home/FoodSubstituteSheet.tsx`
- [ ] Aba IA funcionando
- [ ] Aba manual funcionando
- [ ] TACO funcionando
- [ ] Histórico de alimentos funcionando
- [ ] Badge “✓ Já comi” funcionando
- [ ] Regras de substituição respeitando macros aproximados
- [ ] UX rápida e limpa

### Regra de produto:
- [ ] Substituição pode existir
- [ ] Mas não incentivar troca compulsiva
- [ ] Se necessário, adicionar aviso de consistência

### Verificação final:
- [ ] `npx tsc --noEmit` sem erros

---

# SESSÃO 9 — Progresso / evolução
**Prompt sugerido:** `CURSOR_S9_progresso.md`

Objetivo: dar sensação de avanço real.

- [ ] Criar visão de progresso
- [ ] Peso / tendência
- [ ] Hidratação
- [ ] Calorias médias
- [ ] Aderência semanal
- [ ] Consistência
- [ ] Comparações simples e motivadoras
- [ ] Free vs Pro definido com elegância

### Verificação final:
- [ ] `npx tsc --noEmit` sem erros

---

# SESSÃO 10 — Agente Nuti (modo certo)
**Prompt sugerido:** `CURSOR_S10_agente_nuti.md`

Objetivo: Nuti ser útil, leve e sem virar bagunça.

- [ ] Revisar `agente.tsx`
- [ ] Manter respostas curtas, humanas e assertivas
- [ ] Free = orientação leve / leitura
- [ ] Pro = mais contexto, mais personalização
- [ ] Não permitir que substitua o fluxo principal do app
- [ ] Não poluir a UX
- [ ] Garantir consistência com plano e dados do usuário

### Verificação final:
- [ ] `npx tsc --noEmit` sem erros

---

# SESSÃO 11 — Banco / normalização final
**Prompt sugerido:** `CURSOR_S11_banco_normalizacao.md`

Objetivo: alinhar o banco real ao repositório e remover dívidas técnicas.

- [ ] Auditar triggers reais do banco
- [ ] Auditar policies reais do banco
- [ ] Auditar colunas reais vs migrations
- [ ] Identificar drift
- [ ] Criar migration(s) corretivas
- [ ] Decidir se `sync_is_pro` volta ou se fica derivado no app/backend
- [ ] Se recriar `sync_is_pro`, usar versão simples e segura
- [ ] Garantir que signup nunca mais quebra

### Verificação final:
- [ ] Migrations alinhadas
- [ ] `npx tsc --noEmit` sem erros

---

# INFRA E LANÇAMENTO (APÓS CORE ESTÁVEL)

## Asaas
- [ ] Criar conta no Asaas
- [ ] Gerar chave sandbox
- [ ] Configurar webhook: `/functions/v1/webhook-asaas`
- [ ] Criar planos: mensal / anual
- [ ] Implementar `supabase/functions/webhook-asaas/index.ts`
- [ ] Conectar botão “Assinar”

## PostHog
- [ ] Instalar `posthog-react-native`
- [ ] Configurar em `app/_layout.tsx`
- [ ] Instrumentar eventos principais

## Sentry
- [ ] Instalar via wizard
- [ ] Envolver app com `Sentry.wrap()`

## Build / Play Store
- [ ] Configurar `eas.json`
- [ ] Build preview
- [ ] Build production
- [ ] Internal Testing
- [ ] Validar no device real
- [ ] Publicar

## Web
- [ ] Registrar domínio
- [ ] Publicar landing page
- [ ] Política de privacidade
- [ ] Termos de uso