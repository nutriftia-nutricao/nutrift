-- Adiciona coluna onboarding_completed para controlar se o usuário já passou pelo onboarding
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Usuários existentes (criados antes desta migração) são considerados com onboarding completo
UPDATE public.users SET onboarding_completed = true;
