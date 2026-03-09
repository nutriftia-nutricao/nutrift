# Análise: telas do app vs CLAUDE.md e fluxo de cadastro

## Diretórios (Claude Code / worktrees)

O `git status` mostra arquivos em **dois contextos**:

- **Repositório principal:** `c:\Users\FERNANDO\Documents\Nutrift` (este workspace).
- **Worktree:** `.claude/worktrees/interesting-mclaren` (usado pelo Claude Code em outra sessão).

Se você rodou o app (Expo) a partir do **worktree** e editou no **workspace principal** (ou o contrário), as alterações não são as mesmas em ambos. Sempre use **um único diretório** para rodar e testar:

- Terminal e servidor: `cd c:\Users\FERNANDO\Documents\Nutrift` e `npm run web` (ou `npx expo start`).
- Edição: os arquivos deste workspace são os que o Expo está usando quando você inicia daqui.

---

## Cadastro não avançava para o onboarding

### Causas possíveis

1. **Confirmação de e-mail no Supabase**  
   Se em **Authentication > Providers > Email** a opção "Confirm email" estiver ativa, o fluxo:
   - Cria a conta.
   - Não inicia sessão até o usuário clicar no link do e-mail.
   - O app mostra o alerta "Confirme seu e-mail" e **não** redireciona para o onboarding.

   **O que fazer:** Para desenvolvimento, desative "Confirm email" no Supabase. Em produção, mantenha ativo e o comportamento atual (não avançar até confirmar) está correto.

2. **Navegação na web (Expo Router)**  
   Chamar `router.replace("/(auth)/onboarding/step-1")` direto da tela de login pode falhar na web em alguns casos (estado do router/layout).

### Ajustes feitos no código

- **Login (`app/(auth)/login.tsx`):**  
  Quando o usuário acaba de se cadastrar e ainda não completou onboarding, o app agora faz `router.replace("/")` em vez de ir direto para `step-1`. O **index** (`app/index.tsx`) já tem a regra: se há sessão e `!user.onboarding_completed`, redireciona para `/(auth)/onboarding/step-1`. Assim a decisão fica centralizada e a navegação na web fica mais estável.

- **Register (`app/(auth)/register.tsx`):**  
  No cadastro com Google, o app agora verifica `profile?.onboarding_completed`. Se o onboarding não foi concluído, redireciona para `/(auth)/onboarding/step-1` em vez de ir direto para `/(tabs)/`.

---

## Estrutura de telas vs CLAUDE.md

### Rotas existentes

| CLAUDE.md | App | Observação |
|-----------|-----|------------|
| `index` (splash + auth) | `app/index.tsx` | Ok |
| `(auth)/login` | `app/(auth)/login.tsx` | Ok (aba Cadastrar + Entrar) |
| `(auth)/register` | `app/(auth)/register.tsx` | Ok (cadastro com credenciais guardadas; conta criada no step-9) |
| `(auth)/onboarding` step 1–7 → **9** | `step-1.tsx` … `step-9.tsx` | 9 steps implementados |
| `(tabs)/` (Hoje) | `app/(tabs)/index.tsx` | Ok |
| `(tabs)/progresso` | `app/(tabs)/progresso.tsx` | Ok |
| `(tabs)/agente` | `app/(tabs)/agente.tsx` | Ok |
| `(tabs)/perfil` | `app/(tabs)/perfil.tsx` | Ok |
| Perfil: 9 subtelas | `app/perfil/*.tsx` | dados-corporais, meu-objetivo, assinatura, notificacoes, integracoes, dieta-preferencias, treino, suporte, avaliar |
| `buscar-alimento` | `app/buscar-alimento.tsx` | Ok |
| `substituir-alimento` | `app/substituir-alimento.tsx` | Ok |
| `plano-semanal` | `app/plano-semanal.tsx` | Ok |

### Onboarding – conteúdo por step (CLAUDE vs app)

| Step | CLAUDE.md | App |
|------|-----------|-----|
| 1 | Nome + Sexo | step-1: Sexo (nome já vem do login/register no store) |
| 2 | Dados corporais (altura, peso, idade, % gordura opcional) | step-2: idem |
| 3 | Objetivo (4 opções) | step-3: idem |
| 4 | Peso meta (slider) | step-4: idem |
| 5 | Nível atividade | step-5: idem |
| 6 | Academia/treino + horário se academia | step-6: idem |
| 7 | Ritmo semanal (kg/semana) | step-7: idem |
| 8 | Preferências alimentares (grid) | step-8: idem |
| 9 | Resultado do plano (meta calórica, data objetivo, etc.) | step-9: idem + criação de conta (email/senha do register) |

---

## Fluxos de cadastro (resumo)

1. **Login (aba “Cadastrar”)**  
   signUp → sessão ativa → `ensureUserProfile` → `setUser` → `router.replace("/")` → index redireciona para `onboarding/step-1` se `!onboarding_completed`.

2. **Tela Register**  
   Usuário preenche nome, e-mail, senha → credenciais guardadas no `useSignupStore` → `router.replace("/(auth)/onboarding/step-1")`. A **conta** é criada só no **step-9** (“Começar agora”), com `signUp` + insert/update em `users`.

3. **Login com Google/Apple**  
   OAuth → sessão → `fetchUserProfile` / `ensureUserProfile` → `setUser` → se `!onboarding_completed` → onboarding; senão → `/(tabs)/`.

4. **Register com Google**  
   OAuth → mesmo fluxo de perfil; agora com a correção: se `!profile?.onboarding_completed` → onboarding; senão → `/(tabs)/`.

---

## Checklist se o cadastro ainda não avançar

- [ ] Supabase: **Authentication > Providers > Email** → “Confirm email” desligado para dev.
- [ ] Rodar e testar sempre no **mesmo diretório** (ex.: `c:\Users\FERNANDO\Documents\Nutrift`), não num worktree diferente.
- [ ] Na web: após “Criar conta grátis”, a URL deve ir para `/` e em seguida para algo como `/onboarding/step-1` (conforme Expo Router).
- [ ] Se aparecer o alerta “Confirme seu e-mail”, o Supabase está com confirmação ativa; desative para testar o fluxo completo sem e-mail.
