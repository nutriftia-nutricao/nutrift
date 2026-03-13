-- Compatibilidade: alguns ambientes foram criados sem esta coluna.
-- Necessário para o onboarding (step-9) salvar perfil sem erro PGRST204.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS body_fat_pct numeric;
