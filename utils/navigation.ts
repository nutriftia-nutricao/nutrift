import { router } from "expo-router";

/**
 * Volta para a tela anterior se houver histórico.
 * Caso contrário, redireciona para a home (tabs).
 * Evita o erro "GO_BACK was not handled by any navigator" no Expo Go.
 */
export function goBack(fallback: string = "/(tabs)/") {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as never);
  }
}
