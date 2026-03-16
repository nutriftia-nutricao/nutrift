-- Adiciona trial_ends_at e concede 7 dias Pro a todos os usuários free.
-- O campo plan é text com CHECK constraint (não enum).

-- 1. Adicionar coluna trial_ends_at
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- 2. Remover o CHECK antigo que não incluía 'trial'
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_plan_check;

-- Se o banco tiver um tipo enum user_plan, converter a coluna para text antes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_plan'
  ) THEN
    ALTER TABLE public.users
      ALTER COLUMN plan TYPE text USING plan::text;
  END IF;
END $$;

-- 3. Recriar o CHECK incluindo 'trial'
ALTER TABLE public.users
  ADD CONSTRAINT users_plan_check
    CHECK (plan IN ('free', 'pro', 'ultra', 'trial'));

-- 4. Dar 7 dias de trial a todos os usuários free sem trial anterior
UPDATE public.users
SET
  plan          = 'trial',
  trial_ends_at = now() + interval '7 days'
WHERE
  plan = 'free'
  AND trial_ends_at IS NULL;

-- 5. Novo padrão: todo cadastro começa como trial
ALTER TABLE public.users
  ALTER COLUMN plan SET DEFAULT 'trial';
