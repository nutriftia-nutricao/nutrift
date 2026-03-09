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

export async function signUp(email: string, password: string): Promise<SignUpResult> {
  const normalizedEmail = email.trim().toLowerCase();

  // Tenta criar a conta
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
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
  // No Expo Go: exp://192.168.x.x:8081/--/
  // Em build standalone: nutrift://
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
    // Tokens podem vir no hash (#access_token=...) ou como query params
    const rawUrl = result.url;

    // Extrai a parte do hash se existir
    const hashIndex = rawUrl.indexOf("#");
    const hashString = hashIndex !== -1 ? rawUrl.slice(hashIndex + 1) : "";
    const hashParams = new URLSearchParams(hashString);

    let accessToken = hashParams.get("access_token");
    let refreshToken = hashParams.get("refresh_token");

    // Fallback: tenta nos query params
    if (!accessToken || !refreshToken) {
      const parsed = Linking.parse(rawUrl);
      const qp = parsed.queryParams as Record<string, string> | undefined;
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

    // Se não há tokens na URL de retorno, verifica se o Supabase já tem sessão ativa
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

export function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
