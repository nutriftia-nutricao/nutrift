import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

export interface SignUpResult {
  userId: string;
  email: string;
  error: Error | null;
}

export async function signUp(email: string, password: string): Promise<SignUpResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo: undefined,
      data: undefined,
    },
  });

  if (error) {
    return { userId: "", email: "", error };
  }

  const userId = data.user?.id ?? "";
  const userEmail = data.user?.email ?? normalizedEmail;

  // Garantir sessão ativa (necessário para RLS no insert em public.users).
  // Se o projeto exige confirmação de e-mail, a sessão pode não existir ainda.
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session && userId) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (signInError) {
      // Conta criada mas e-mail não confirmado: retornamos sucesso mesmo assim;
      // a tela pode pedir para o usuário confirmar o e-mail antes de continuar.
      return { userId, email: userEmail, error: null };
    }
  }

  return { userId, email: userEmail, error: null };
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
}

/** Redireciona para o login com Google (OAuth). Web: redirect. Native: abre browser. */
export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  const redirectUrl =
    Platform.OS === "web"
      ? typeof window !== "undefined"
        ? window.location.origin
        : undefined
      : Linking.createURL("");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
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

  const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl ?? undefined);
  if (result.type === "success" && result.url) {
    const parsed = Linking.parse(result.url);
    const params = parsed.queryParams as Record<string, string> | undefined;
    const accessToken = params?.access_token;
    const refreshToken = params?.refresh_token;
    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      return { error: sessionError ?? null };
    }
  }

  return { error: new Error("Login com Google cancelado ou falhou") };
}

export async function signOut() {
  return supabase.auth.signOut();
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
