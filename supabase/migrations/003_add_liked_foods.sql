-- Adiciona coluna liked_foods para alimentos preferidos do onboarding
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS liked_foods text[] DEFAULT '{}';
