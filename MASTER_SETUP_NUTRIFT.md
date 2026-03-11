# MASTER_SETUP_NUTRIFT.md
> Documento mestre oficial do projeto Nutrift.
> Este arquivo é a fonte única de verdade para setup, arquitetura, regras de execução, prioridades, sessões de desenvolvimento, validações e decisões técnicas.
> Antes de qualquer alteração relevante no projeto, este documento deve ser lido.
> Objetivo: reduzir alucinação do Cursor, preservar estabilidade, acelerar entregas e evitar retrabalho.

---

# 1. VISÃO DO PROJETO

## 1.1 O que é o Nutrift
Nutrift é um app mobile focado em:
- plano alimentar semanal com inteligência artificial
- execução diária simples
- aderência ao plano
- consistência ao longo do tempo
- flexibilidade controlada (substituições inteligentes)
- experiência visual premium, limpa e motivadora

O Nutrift NÃO deve parecer um app técnico ou poluído.
Ele deve parecer:
- leve
- elegante
- confiável
- premium
- objetivo
- com sensação de progresso real

---

## 1.2 Promessa principal do produto
A principal promessa do Nutrift é:

**“Ajudar o usuário a seguir um plano alimentar com consistência e obter resultado real, sem complicação.”**

Isso significa:
- o foco não é só gerar plano
- o foco é fazer o usuário EXECUTAR
- consistência é mais importante que excesso de liberdade
- IA existe para ajudar, não para bagunçar

---

## 1.3 Princípios de produto
1. Menos, porém melhor
2. A tela “Hoje” é o centro do produto
3. Plano semanal é importante, mas não deve competir com “Hoje”
4. Substituição existe, mas não deve incentivar troca compulsiva
5. Free precisa ter valor real
6. Pro precisa parecer claramente melhor
7. UX limpa > excesso de features
8. Toda feature nova deve aumentar aderência ou retenção
9. Não adicionar complexidade antes de estabilizar o core
10. Evitar gamificação infantil; priorizar motivação elegante

---

# 2. ESTADO REAL ATUAL DO PROJETO

## 2.1 Situação atual confirmada
Já foi resolvido / validado:

- Deep link / QR não pode mais burlar auth em `plano-semanal`
- `app/plano-semanal.tsx` agora possui guarda de auth + onboarding
- `app/index.tsx` foi estabilizado
- Novo cadastro voltou a funcionar
- Erro `database error saving new user` foi causado por trigger legado `trg_sync_is_pro`
- Trigger legado `trg_sync_is_pro` foi removido temporariamente do banco
- Novo usuário agora entra no onboarding corretamente
- Após ajuste, o fluxo foi para onboarding (confirmado)

---

## 2.2 Risco importante atual
O banco Supabase real possui **drift** em relação às migrations do repositório.

Isso significa:
- pode existir trigger manual no banco que não está versionado
- pode existir função antiga ainda ativa
- pode existir policy diferente do esperado
- aplicar migrations não garante alinhamento completo com o estado real

**Regra obrigatória:**  
Sempre validar o banco real antes de culpar o app.

---

# 3. PRIORIDADE ABSOLUTA DO NUTRIFT AGORA

## Ordem correta de foco
1. Auth + cadastro
2. Onboarding
3. Tela Hoje
4. Aderência diária
5. Calendário / consistência visual
6. Free vs Pro / Trial
7. Plano semanal
8. Substituição de alimentos
9. Progresso / evolução
10. Agente Nuti
11. Infra / monetização / analytics / observabilidade

**Regra de ouro:**  
Não pular para features “legais” antes do core estar estável.

---

# 4. REGRAS OPERACIONAIS PARA O CURSOR

## 4.1 Como o Cursor deve trabalhar neste projeto
- Sempre fazer **1 sessão por vez**
- Sempre aplicar **patch mínimo**
- Nunca reescrever arquivos grandes sem necessidade
- Nunca mudar design aprovado sem pedido explícito
- Nunca inventar estrutura nova sem necessidade
- Sempre respeitar arquitetura já existente
- Sempre preservar fluxo de auth
- Sempre preservar fluxo de onboarding
- Sempre preservar rota da tela Hoje
- Sempre evitar “refatoração bonita” que cria regressão

---

## 4.2 Regras obrigatórias antes de editar
Antes de alterar qualquer feature:
1. Ler o arquivo atual
2. Entender imports reais
3. Identificar dependências reais
4. Aplicar patch mínimo
5. Não quebrar tipagem
6. Não remover lógica existente sem entender impacto
7. Validar manualmente o fluxo relacionado

---

## 4.3 Regras de segurança
O Cursor NÃO deve:
- recriar triggers no Supabase sem instrução explícita
- reintroduzir `trg_sync_is_pro`
- criar migrations especulativas
- mover arquivos grandes sem necessidade
- trocar nomes de rotas sem revisar o app inteiro
- alterar store global sem revisar usos
- reescrever `app/index.tsx` inteiro sem necessidade
- reescrever `app/plano-semanal.tsx` inteiro sem necessidade
- alterar onboarding sem revisar steps reais existentes

---

## 4.4 Regra de verificação obrigatória
Após qualquer alteração relevante:

```bash
npx tsc --noEmit