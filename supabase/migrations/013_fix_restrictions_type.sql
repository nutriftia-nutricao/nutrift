-- rollback: ALTER TABLE public.users DROP COLUMN IF EXISTS restrictions;
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS restrictions jsonb DEFAULT '[]'::jsonb;
