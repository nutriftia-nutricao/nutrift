import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { goBack } from "../../utils/navigation";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { GradientColors } from "../../constants/gradients";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";
import { useUserStore } from "../../stores/useUserStore";

const PLANS = [
  {
    key: "free",
    label: "Free",
    price: "Grátis",
    color: Colors.textSecondary,
    features: ["Registro diário", "Macros", "Base TACO", "Dashboard básico", "Sem anúncios"],
  },
  {
    key: "pro",
    label: "Pro",
    price: "R$ 19,90/mês",
    color: Colors.carbo,
    features: ["Tudo do Free", "Planejador IA", "1 refeição livre/semana", "Ajuste de treino", "Relatórios"],
  },
  {
    key: "ultra",
    label: "Ultra",
    price: "R$ 39,90/mês",
    color: Colors.greenDark,
    features: ["Tudo do Pro", "Agente IA completo", "Smartwatch", "Métricas avançadas", "Relatório semanal IA"],
  },
];

export default function AssinaturaScreen() {
  const user = useUserStore((s) => s.user);
  const currentPlan = user?.plan ?? "free";

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => goBack()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Assinatura</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.currentBadge}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.greenDark} />
          <Text style={styles.currentBadgeText}>Plano atual: <Text style={{ fontWeight: "700" }}>{currentPlan.toUpperCase()}</Text></Text>
        </View>

        {PLANS.map((plan) => {
          const isActive = plan.key === currentPlan;
          return (
            <View key={plan.key} style={[styles.planCard, isActive && styles.planCardActive]}>
              <View style={styles.planHeader}>
                <View style={[styles.planBadge, { backgroundColor: `${plan.color}20` }]}>
                  <Text style={[styles.planBadgeText, { color: plan.color }]}>{plan.label}</Text>
                </View>
                <Text style={styles.planPrice}>{plan.price}</Text>
              </View>
              <View style={styles.featureList}>
                {plan.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Ionicons name="checkmark" size={14} color={plan.color} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
              {!isActive && (
                <Pressable style={({ pressed }) => [styles.upgradeBtn, pressed && { opacity: 0.8 }]}>
                  <LinearGradient
                    colors={GradientColors.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.upgradeBtnGradient}
                  >
                    <Text style={styles.upgradeBtnText}>Assinar {plan.label}</Text>
                  </LinearGradient>
                </Pressable>
              )}
              {isActive && (
                <View style={styles.activeLabel}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.greenDark} />
                  <Text style={styles.activeLabelText}>Plano atual</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: Radius.pill, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  headerTitle: { ...Typography.h4, color: Colors.text },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 110, gap: Spacing.md },
  currentBadge: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, backgroundColor: Colors.greenLight, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, alignSelf: "flex-start" },
  currentBadgeText: { ...Typography.caption, color: Colors.greenDark },
  planCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  planCardActive: { borderColor: Colors.green, borderWidth: 2 },
  planHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  planBadge: { borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  planBadgeText: { ...Typography.label, fontSize: 12 },
  planPrice: { ...Typography.h4, color: Colors.text },
  featureList: { gap: Spacing.xs },
  featureRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  featureText: { ...Typography.bodySmall, color: Colors.textSecondary },
  upgradeBtn: { borderRadius: Radius.pill, overflow: "hidden" },
  upgradeBtnGradient: { paddingVertical: Spacing.md, alignItems: "center" },
  upgradeBtnText: { ...Typography.body, fontWeight: "700", color: "#FFF" },
  activeLabel: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, justifyContent: "center" },
  activeLabelText: { ...Typography.caption, color: Colors.greenDark, fontWeight: "600" },
});
