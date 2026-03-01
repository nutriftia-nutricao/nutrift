import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Colors } from "../constants/colors";

const rootStyle = [
  { flex: 1, backgroundColor: Colors.background },
  Platform.OS === "web" && { minHeight: "100vh" },
] as const;

export default function RootLayout() {
  return (
    <View style={rootStyle}>
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    </View>
  );
}
