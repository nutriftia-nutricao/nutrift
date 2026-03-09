-- Estende meal_type para incluir lanche_manha, pre_treino e pos_treino
-- (alinhado com types/nutrition.ts no app)

ALTER TABLE public.food_logs
  DROP CONSTRAINT IF EXISTS food_logs_meal_type_check;

ALTER TABLE public.food_logs
  ADD CONSTRAINT food_logs_meal_type_check
  CHECK (meal_type IN (
    'cafe', 'lanche_manha', 'almoco', 'lanche', 'jantar', 'pre_treino', 'pos_treino', 'extra'
  ));

ALTER TABLE public.plan_meals
  DROP CONSTRAINT IF EXISTS plan_meals_meal_type_check;

ALTER TABLE public.plan_meals
  ADD CONSTRAINT plan_meals_meal_type_check
  CHECK (meal_type IN (
    'cafe', 'lanche_manha', 'almoco', 'lanche', 'jantar', 'pre_treino', 'pos_treino', 'extra'
  ));
