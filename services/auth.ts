import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

export interface SignUpResult {
  userId: string;
  email: string;
  error: Error | null;
  /** True quando o Supabase exige confirmação de e-mail antes de ativar a sessão. */
  needsEmailConfirmation?: boolean;
}

export async function signUp(
  email: string,
  password: string,
  name?: string
): Promise<SignUpResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = (name ?? "").trim();

  // Tenta criar a conta
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options:
      normalizedName.length > 0
        ? {
            data: {
              name: normalizedName,
              full_name: normalizedName,
            },
          }
        : undefined,
  });

  if (signUpError) {
    return { userId: "", email: "", error: signUpError };
  }

  // Supabase retorna user mesmo quando confirmação está pendente.
  // Se identities está vazio, o e-mail já existe na base.
  const user = signUpData.user;
  if (!user) {
    return { userId: "", email: "", error: new Error("Não foi possível criar a conta. Tente novamente.") };
  }

  if (user.identities && user.identities.length === 0) {
    return { userId: "", email: "", error: new Error("Este e-mail já está cadastrado. Tente fazer login.") };
  }

  const userId = user.id;
  const userEmail = user.email ?? normalizedEmail;

  // Se o projeto exigir confirmação de e-mail, signUpData.session vem null.
  const needsEmailConfirmation = !signUpData.session;

  return { userId, email: userEmail, error: null, needsEmailConfirmation };
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
}

/** Redireciona para o login com Google (OAuth). Web: redirect. Native: abre browser. */
export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  return signInWithProvider("google");
}

/** Redireciona para o login com Apple (OAuth). */
export async function signInWithApple(): Promise<{ error: Error | null }> {
  return signInWithProvider("apple");
}

async function signInWithProvider(provider: "google" | "apple"): Promise<{ error: Error | null }> {
  // Linking.createURL gera automaticamente a URL correta:
  // - Expo Go (dev): exp://192.168.x.x:8081/--/
  // - Build standalone: nutrift://
  // - Web: window.location.origin
  const redirectUrl =
    Platform.OS === "web"
      ? typeof window !== "undefined"
        ? window.location.origin
        : undefined
      : Linking.createURL("/");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl ?? undefined,
      skipBrowserRedirect: true, // OBRIGATÓRIO: sem isso o Supabase abre browser antes do openAuthSessionAsync
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) return { error };

  const url = data?.url;
  if (!url) return { error: new Error("URL de login não retornada") };

  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.location.href = url;
    return { error: null };
  }

  console.log(`[${provider} OAuth] redirectUrl:`, redirectUrl);
  console.log(`[${provider} OAuth] OAuth URL:`, url);

  const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl ?? undefined);

  console.log(`[${provider} OAuth] result.type:`, result.type);
  if (result.type === "success") {
    console.log(`[${provider} OAuth] result.url:`, result.url);
  }

  if (result.type === "cancel" || result.type === "dismiss") {
    return { error: new Error(`Login com ${provider} cancelado`) };
  }

  if (result.type === "success" && result.url) {
    const rawUrl = result.url;
    const parsed = Linking.parse(rawUrl);
    const qp = parsed.queryParams as Record<string, string> | undefined;

    // PKCE flow (Supabase v2 default for mobile): URL returns ?code=...
    const code = qp?.code;
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(rawUrl);
      return { error: exchangeError ?? null };
    }

    // Implicit flow fallback: tokens in hash (#access_token=...) or query params
    const hashIndex = rawUrl.indexOf("#");
    const hashString = hashIndex !== -1 ? rawUrl.slice(hashIndex + 1) : "";
    const hashParams = new URLSearchParams(hashString);

    let accessToken = hashParams.get("access_token");
    let refreshToken = hashParams.get("refresh_token");

    if (!accessToken || !refreshToken) {
      accessToken = accessToken ?? qp?.access_token ?? null;
      refreshToken = refreshToken ?? qp?.refresh_token ?? null;
    }

    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      return { error: sessionError ?? null };
    }

    // Last resort: session may already be active
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      return { error: null };
    }
  }

  return { error: new Error(`Login com ${provider} falhou. Tente novamente.`) };
}

export async function signOut() {
  return supabase.auth.signOut({ scope: "local" });
}

/**
 * No web, se a URL tiver tokens no hash (retorno do OAuth), define a sessão e limpa a URL.
 * Chame antes de getSession() ao carregar a app após login com Google.
 */
export async function recoverSessionFromUrl(): Promise<void> {
  if (typeof window === "undefined" || !window.location?.hash) return;

  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) return;

  await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  window.history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search
  );
}

export async function resetPassword(email: string): Promise<{ error: Error | null }> {
  const redirectUrl =
    Platform.OS === "web" && typeof window !== "undefined"
      ? `${window.location.origin}/`
      : Linking.createURL("/");

  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: redirectUrl }
  );
  return { error: error ?? null };
}

export function getSession() {
  return supabase.auth.getSession();
}

export function refreshSession() {
  return supabase.auth.refreshSession();
}

export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
