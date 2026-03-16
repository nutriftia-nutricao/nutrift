import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

import { Colors } from "../../constants/colors";
import { useHomePressStore } from "../../stores/useHomePressStore";

export default function TabsLayout() {
  const triggerHomePress = useHomePressStore((s) => s.triggerHomePress);

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          height: 64,
          backgroundColor: Colors.surface,
          borderTopWidth: 0,
          borderRadius: 100,
          borderWidth: 1,
          borderColor: Colors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 32,
          elevation: 8,
          paddingBottom: Platform.OS === "ios" ? 20 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          textTransform: "none",
          marginBottom: Platform.OS === "ios" ? 0 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hoje",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "sunny" : "sunny-outline"}
              size={24}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            // Sinaliza ao HomeScreen para voltar ao topo e resetar para hoje
            triggerHomePress();
          },
        }}
      />
      <Tabs.Screen
        name="progresso"
        options={{
          title: "Progresso",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "trending-up" : "trending-up-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agente"
        options={{
          title: "AI",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "sparkles" : "sparkles-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
