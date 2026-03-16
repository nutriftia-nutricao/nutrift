-- rollback:
-- UPDATE users SET goal = 'manter' WHERE goal = 'definir_corpo';
-- UPDATE users SET goal = 'so_acompanhar' WHERE goal = 'recomposicao';
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_goal_check;
-- ALTER TABLE users ADD CONSTRAINT users_goal_check CHECK (goal IN ('perder_gordura', 'ganhar_massa', 'manter', 'so_acompanhar'));

-- Migrate existing records to new goal values
UPDATE users SET goal = 'definir_corpo' WHERE goal = 'manter';
UPDATE users SET goal = 'recomposicao' WHERE goal = 'so_acompanhar';

-- Update CHECK constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_goal_check;
ALTER TABLE users ADD CONSTRAINT users_goal_check
  CHECK (goal IN ('perder_gordura', 'ganhar_massa', 'definir_corpo', 'recomposicao'));
