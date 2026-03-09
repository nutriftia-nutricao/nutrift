import "react-native-gesture-handler";

import { Stack, router, useSegments } from "expo-router";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";

import { ErrorBoundary } from "../components/ErrorBoundary";
import { Colors } from "../constants/colors";
import { supabase } from "../services/supabase";

// Garante html/body com altura e fundo no web (evita tela branca)
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    html, body, #root { margin: 0; padding: 0; min-height: 100vh; width: 100%; background: #111111; }
    #root { display: flex; flex: 1; }
  `;
  document.head?.appendChild(style);
}

const rootStyle = [
  { flex: 1, backgroundColor: Colors.background },
  Platform.OS === "web" && { minHeight: "100vh" },
] as const;

export default function RootLayout() {
  const segments = useSegments();

  useEffect(() => {
    // Redireciona para login só em SIGNED_OUT quando já estamos na área autenticada (tabs),
    // para evitar redirecionar enquanto o usuário está em login/onboarding.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        const inTabs = segments[0] === "(tabs)";
        if (inTabs) {
          router.replace("/(auth)/login");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [segments]);

  return (
    <ErrorBoundary>
      <View style={rootStyle}>
        <SafeAreaProvider>
          {Platform.OS === "web" ? (
            <View style={{ flex: 1, backgroundColor: Colors.background }}>
              <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
              }}
            >
              <Stack.Screen
                name="plano-semanal"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="buscar-alimento"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="substituir-alimento"
                options={{ presentation: "modal" }}
              />
            </Stack>
            </View>
          ) : (
            <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: Colors.background },
                }}
              >
                <Stack.Screen
                  name="plano-semanal"
                  options={{ presentation: "modal" }}
                />
                <Stack.Screen
                  name="buscar-alimento"
                  options={{ presentation: "modal" }}
                />
                <Stack.Screen
                  name="substituir-alimento"
                  options={{ presentation: "modal" }}
                />
              </Stack>
            </GestureHandlerRootView>
          )}
        </SafeAreaProvider>
      </View>
    </ErrorBoundary>
  );
}
