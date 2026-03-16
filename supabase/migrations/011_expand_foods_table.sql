-- Migration 011: Expandir tabela foods com campos nutricionais completos (TACO/TBCA/custom)
-- Executar no SQL Editor do Supabase

-- 1. Remover dados antigos (se houver) para evitar conflito de colunas
-- ATENÇÃO: só apaga se a tabela estava vazia ou com dados de teste
-- Se quiser preservar, remova esta linha:
-- DELETE FROM public.foods;

-- 2. Adicionar colunas novas (com IF NOT EXISTS-equivalent via DO block)
DO $$
BEGIN
  -- ENUMs (category, source, confidence)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'food_category') THEN
    CREATE TYPE food_category AS ENUM (
      'carnes_aves', 'peixes_frutos_mar', 'ovos_laticinios', 'graos_cereais',
      'frutas', 'vegetais_verduras', 'leguminosas', 'paes_massas',
      'fit_funcionais', 'suplementos', 'industrializados', 'regionais',
      'preparacoes', 'outros'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'food_source') THEN
    CREATE TYPE food_source AS ENUM ('taco', 'tbca', 'usda', 'rotulo', 'custom');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'food_confidence') THEN
    CREATE TYPE food_confidence AS ENUM ('high', 'medium', 'low');
  END IF;
END
$$;

-- 3. Adicionar colunas se não existirem
ALTER TABLE public.foods
  ADD COLUMN IF NOT EXISTS name_lower text GENERATED ALWAYS AS (lower(name)) STORED,
  ADD COLUMN IF NOT EXISTS kcal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS protein_g numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS carbo_g numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fat_g numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fiber_g numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sodium_mg numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sugar_g numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saturated_fat_g numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS portion_g numeric DEFAULT 100,
  ADD COLUMN IF NOT EXISTS portion_label text DEFAULT '100g',
  ADD COLUMN IF NOT EXISTS category food_category DEFAULT 'outros',
  ADD COLUMN IF NOT EXISTS source food_source DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS confidence food_confidence DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS taco_id integer,
  ADD COLUMN IF NOT EXISTS barcode text,
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS search_terms text[];

-- 4. Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_foods_name_lower ON public.foods(name_lower);
CREATE INDEX IF NOT EXISTS idx_foods_category ON public.foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_source ON public.foods(source);
CREATE INDEX IF NOT EXISTS idx_foods_is_active ON public.foods(is_active);
CREATE INDEX IF NOT EXISTS idx_foods_taco_id ON public.foods(taco_id);
CREATE INDEX IF NOT EXISTS idx_foods_barcode ON public.foods(barcode);

-- 5. Permitir busca por texto completo
CREATE INDEX IF NOT EXISTS idx_foods_name_fts ON public.foods 
  USING gin(to_tsvector('portuguese', name));

-- 6. (Pulado) Tabela foods não possui colunas legadas — nada a migrar.
