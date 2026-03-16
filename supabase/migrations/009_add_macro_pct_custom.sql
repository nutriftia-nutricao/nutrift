-- Adiciona colunas de percentual customizado de macros
-- NULL = usa os defaults calculados pelo objetivo; valor = customizado pelo usuário
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS protein_pct numeric,
  ADD COLUMN IF NOT EXISTS carbo_pct numeric,
  ADD COLUMN IF NOT EXISTS fat_pct numeric;
