-- Permite que o trigger handle_new_user() insira em public.users ao criar conta (incl. OAuth Google).
-- O trigger roda no contexto do Auth (auth.uid() é null); a política "users_insert_own" exige auth.uid() = id,
-- então o insert do trigger falhava e gerava 500 no login com Google.

CREATE POLICY "users_insert_from_auth_trigger" ON public.users
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL
    AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = id)
  );
