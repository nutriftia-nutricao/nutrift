# Configurar Supabase apenas para Nutrift

Este guia mostra como deixar seu projeto Supabase dedicado exclusivamente ao Nutrift.

---

## 1. Renomear o projeto (opcional)

Para identificar o projeto como Nutrift no dashboard:

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione o projeto
3. **Project Settings** (ícone engrenagem) → **General**
4. Em **Project name**, altere para **Nutrift**
5. Salve

---

## 2. Criar o schema do banco

O arquivo `supabase/migrations/001_nutrift_schema.sql` contém todas as tabelas e políticas de segurança.

### Como executar

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **New query**
3. Copie todo o conteúdo de `supabase/migrations/001_nutrift_schema.sql`
4. Cole no editor e clique em **Run**

Isso cria:

- **Tabelas:** `users`, `food_logs`, `weekly_plans`, `meal_plans`, `agent_messages`
- **RLS:** cada usuário só acessa seus próprios dados
- **Trigger:** perfil em `users` criado automaticamente ao registrar

---

## 3. Se o projeto já tiver tabelas antigas

Se você criou tabelas de teste ou de outro projeto:

1. **SQL Editor** → **New query**
2. Execute para remover tabelas antigas (ajuste os nomes conforme necessário):

```sql
-- CUIDADO: isso apaga dados permanentemente!
DROP TABLE IF EXISTS public.agent_messages;
DROP TABLE IF EXISTS public.meal_plans;
DROP TABLE IF EXISTS public.weekly_plans;
DROP TABLE IF EXISTS public.food_logs;
DROP TABLE IF EXISTS public.users;
```

3. Depois execute o `001_nutrift_schema.sql` completo

---

## 4. Configurar autenticação (Google, etc.)

Para login com Google e outros provedores:

1. **Authentication** → **Providers** → habilite os que deseja
2. Para Google: siga o guia em `docs/GOOGLE_LOGIN.md`
3. Em **URL Configuration**, configure:
   - **Site URL:** `http://localhost:8081` (web dev) ou a URL do seu app
   - **Redirect URLs:** `http://localhost:8081`, `http://localhost:8082` (Expo web)

---

## 5. Migração: onboarding_completed (usuários Google)

Para que usuários que entram pelo Google passem pelo onboarding antes da página principal:

1. **SQL Editor** → **New query**
2. Execute o conteúdo de `supabase/migrations/002_add_onboarding_completed.sql`

---

## 6. Verificar

Após executar o SQL:

- **Table Editor** deve listar: `users`, `food_logs`, `weekly_plans`, `meal_plans`, `agent_messages`
- **Authentication** → **Policies** deve mostrar as políticas RLS ativas

Seu Supabase está configurado exclusivamente para o Nutrift.
