import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";

import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { useTheme } from "../../hooks/useTheme";

const TAB_ICON_SIZE = 22;
const ACTIVE_CIRCLE_SIZE = 40;

function TabIcon({
  name,
  nameOutline,
  focused,
  C,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  nameOutline: React.ComponentProps<typeof Ionicons>["name"];
  focused: boolean;
  C: ReturnType<typeof useTheme>["C"];
}) {
  return (
    <View
      style={{
        width: ACTIVE_CIRCLE_SIZE,
        height: ACTIVE_CIRCLE_SIZE,
        borderRadius: ACTIVE_CIRCLE_SIZE / 2,
        backgroundColor: focused ? C.greenLight : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons
        name={focused ? name : nameOutline}
        size={TAB_ICON_SIZE}
        color={focused ? C.text : C.textMuted}
      />
    </View>
  );
}

export default function TabsLayout() {
  const { C } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: Spacing.xl,
          left: Spacing.xl,
          right: Spacing.xl,
          height: 60,
          backgroundColor: C.surfaceMuted,
          borderTopWidth: 0,
          borderRadius: Radius.pill,
          borderWidth: 1,
          borderColor: C.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 8,
          paddingBottom: Spacing.sm,
          paddingTop: Spacing.sm,
          paddingHorizontal: Spacing.sm,
        },
        tabBarActiveTintColor: C.greenDark,
        tabBarInactiveTintColor: C.textMuted,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hoje",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="sunny" nameOutline="sunny-outline" focused={focused} C={C} />
          ),
        }}
      />
      <Tabs.Screen
        name="progresso"
        options={{
          title: "Progresso",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="trending-up" nameOutline="trending-up-outline" focused={focused} C={C} />
          ),
        }}
      />
      <Tabs.Screen
        name="agente"
        options={{
          title: "IA",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="sparkles" nameOutline="sparkles-outline" focused={focused} C={C} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" nameOutline="person-outline" focused={focused} C={C} />
          ),
        }}
      />
    </Tabs>
  );
}
