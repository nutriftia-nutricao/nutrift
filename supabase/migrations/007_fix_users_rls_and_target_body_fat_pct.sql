-- Garante coluna usada pelo onboarding e políticas RLS consistentes para escrita via app.
-- Corrige cenários de drift em que o upsert/update no step-9 falha com 42501.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS target_body_fat_pct numeric;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS meals jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger de auth roda sem JWT de usuário (auth.uid() = null), então precisa dessa policy.
DROP POLICY IF EXISTS "users_insert_from_auth_trigger" ON public.users;
CREATE POLICY "users_insert_from_auth_trigger" ON public.users
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() IS NULL
    AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = id)
  );
