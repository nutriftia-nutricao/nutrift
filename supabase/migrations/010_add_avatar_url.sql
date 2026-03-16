-- Adiciona coluna avatar_url na tabela users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Bucket para avatares (executar separadamente no dashboard se necessário)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
