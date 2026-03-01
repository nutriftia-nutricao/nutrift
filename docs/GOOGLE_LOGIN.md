# Entrar com Google — configuração

Para o botão "Entrar com Google" funcionar, configure em dois lugares: **Google Cloud** e **Supabase**.

---

## 1. Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um projeto ou selecione um existente.
3. Vá em **APIs e serviços** → **Credenciais**.
4. Clique em **Criar credenciais** → **ID do cliente OAuth**.
5. Tipo: **Aplicativo da Web**.
6. Nome: ex. "Nutrift Web".
7. Em **Origens JavaScript autorizadas**, adicione:
   - `http://localhost:8081` (desenvolvimento Expo web)
   - Se publicar em produção, adicione a URL do seu site (ex. `https://nutrift.app`).
8. Em **URIs de redirecionamento autorizados**, adicione a URL de callback do Supabase:
   - `https://tqhjrwzlriwtitjrjxni.supabase.co/auth/v1/callback`
   - (Substitua pelo **ref** do seu projeto Supabase se for diferente.)
9. Clique em **Criar** e copie o **ID do cliente** e o **Segredo do cliente**.

---

## 2. Supabase Dashboard

1. Abra o projeto no [Supabase Dashboard](https://supabase.com/dashboard).
2. Vá em **Authentication** → **Providers**.
3. Encontre **Google** e clique para expandir.
4. Ative **Enable Sign in with Google**.
5. Cole o **Client ID** (ID do cliente) do Google.
6. Cole o **Client Secret** (Segredo do cliente) do Google.
7. Salve.

Em **Authentication** → **URL Configuration**:

8. Em **Redirect URLs**, adicione a URL do seu app para onde o usuário deve voltar após o login:
   - Desenvolvimento: `http://localhost:8081`
   - Se usar tunnel: `https://xxxx.exp.direct` (copie do `npx expo start --tunnel`).

---

## 3. Testar

1. Reinicie o Expo (`npx expo start --web --port 8081`).
2. Abra a tela de login e clique em **Entrar com Google**.
3. Escolha sua conta Gmail e autorize.
4. Você deve ser redirecionado de volta ao app e entrar nas abas (Home).

Se der erro "redirect_uri_mismatch", confira se a URL em **Redirect URLs** no Supabase e em **URIs de redirecionamento** no Google estão exatamente iguais à que o app está usando (incluindo porta e http/https).

---

## 4. Abre o Google, clico em "Permitir", mas não entra no app

Isso costuma ser **Redirect URL no Supabase** ou **Site URL**:

1. No Supabase: **Authentication** → **URL Configuration**.
2. Em **Site URL**, deixe exatamente: `http://localhost:8081` (sem barra no final).
3. Em **Redirect URLs**, adicione **uma linha** com exatamente: `http://localhost:8081` (sem barra no final).
4. Salve e tente de novo (Entrar com Google → Permitir).

Se ainda falhar, abra o app de novo em `http://localhost:8081`, faça o fluxo do Google e, ao voltar para o app, veja se a URL da barra de endereço ficou com algo tipo `#access_token=...`. Se não tiver, o Supabase não está redirecionando para o localhost — confira de novo o **Site URL** e **Redirect URLs**.
