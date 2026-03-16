-- Nutrift — Schema base
-- Executar no SQL Editor do Supabase antes das migrações 002 e 003.

-- Extensões (se não existirem)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Tabela: users (perfil do usuário; id = auth.uid())
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Usuário',
  email text NOT NULL DEFAULT '',
  sex text NOT NULL DEFAULT 'masculino' CHECK (sex IN ('masculino', 'feminino')),
  birth_date date NOT NULL DEFAULT '1996-01-15',
  weight_kg numeric NOT NULL DEFAULT 75,
  height_cm numeric NOT NULL DEFAULT 178,
  body_fat_pct numeric,
  goal text NOT NULL DEFAULT 'manter' CHECK (goal IN ('perder_gordura', 'ganhar_massa', 'manter', 'so_acompanhar')),
  activity text NOT NULL DEFAULT 'moderado' CHECK (activity IN ('sedentario', 'levemente_ativo', 'moderado', 'muito_ativo')),
  workout_type text CHECK (workout_type IN ('nao_pratico', 'casa', 'academia')),
  workout_time text,
  target_weight numeric NOT NULL DEFAULT 75,
  target_body_fat_pct numeric,
  weekly_pace numeric NOT NULL DEFAULT 0.5,
  diet_type text CHECK (diet_type IN ('onivoro', 'vegetariano', 'vegano', 'low_carb')),
  restrictions text[] DEFAULT '{}',
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'ultra')),
  tmb numeric NOT NULL DEFAULT 1700,
  tdee numeric NOT NULL DEFAULT 2100,
  daily_kcal numeric NOT NULL DEFAULT 2100,
  protein_g numeric NOT NULL DEFAULT 135,
  carbo_g numeric NOT NULL DEFAULT 200,
  fat_g numeric NOT NULL DEFAULT 70,
  hydration_ml integer NOT NULL DEFAULT 2500,
  target_date date NOT NULL DEFAULT '2026-12-31',
  meals_per_day integer DEFAULT 4,
  meals jsonb DEFAULT '[]'::jsonb,
  liked_foods text[] DEFAULT '{}',
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: usuário só acessa o próprio perfil
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Trigger: criar perfil ao registrar (signUp)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuário'),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- Tabela: food_logs (registro diário de alimentos)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.food_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('cafe', 'almoco', 'lanche', 'jantar', 'extra')),
  food_id uuid,
  food_name text NOT NULL,
  quantity_g numeric NOT NULL,
  kcal numeric NOT NULL,
  protein_g numeric NOT NULL DEFAULT 0,
  carbo_g numeric NOT NULL DEFAULT 0,
  fat_g numeric NOT NULL DEFAULT 0,
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON public.food_logs(user_id, date);

ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "food_logs_all_own" ON public.food_logs
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- Tabela: foods (catálogo de alimentos; pode ser TACO ou custom)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.foods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  calories numeric,
  protein numeric,
  carbs numeric,
  fat numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Leitura pública para busca; escrita pode ser restrita a service role
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "foods_select_all" ON public.foods
  FOR SELECT USING (true);

-- =============================================================================
-- Tabela: weekly_plans (plano semanal por usuário)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.weekly_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_week ON public.weekly_plans(user_id, week_start_date);

ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_plans_all_own" ON public.weekly_plans
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- Tabela: plan_meals (refeições do plano semanal)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.plan_meals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  weekly_plan_id uuid NOT NULL REFERENCES public.weekly_plans(id) ON DELETE CASCADE,
  day_of_week text NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  meal_type text NOT NULL CHECK (meal_type IN ('cafe', 'almoco', 'lanche', 'jantar', 'extra')),
  scheduled_time text,
  calories_min numeric,
  calories_max numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_meals_via_plan" ON public.plan_meals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.weekly_plans wp
      WHERE wp.id = plan_meals.weekly_plan_id AND wp.user_id = auth.uid()
    )
  );

-- =============================================================================
-- Tabela: plan_meal_foods (alimentos por refeição do plano)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.plan_meal_foods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_meal_id uuid NOT NULL REFERENCES public.plan_meals(id) ON DELETE CASCADE,
  food_id uuid REFERENCES public.foods(id) ON DELETE SET NULL,
  quantity_g numeric,
  is_checked boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_meal_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_meal_foods_via_meal" ON public.plan_meal_foods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.plan_meals pm
      JOIN public.weekly_plans wp ON wp.id = pm.weekly_plan_id
      WHERE pm.id = plan_meal_foods.plan_meal_id AND wp.user_id = auth.uid()
    )
  );

-- =============================================================================
-- Tabela: agent_messages (histórico do chat com o agente IA)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_user ON public.agent_messages(user_id, created_at);

ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_messages_all_own" ON public.agent_messages
  FOR ALL USING (auth.uid() = user_id);
