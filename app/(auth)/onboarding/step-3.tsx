import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GradientButton } from "../../../components/ui/GradientButton";
import { OnboardingHeader } from "../../../components/onboarding/OnboardingHeader";
import { OptionCard } from "../../../components/onboarding/OptionCard";
import { ProgressBar } from "../../../components/onboarding/ProgressBar";
import { Colors } from "../../../constants/colors";
import { Radius } from "../../../constants/radius";
import { Spacing } from "../../../constants/spacing";
import { Typography } from "../../../constants/typography";
import { useOnboardingStore } from "../../../stores/useOnboardingStore";
import type { Goal } from "../../../types/onboarding";

export default function OnboardingStep3Screen() {
  const {
    goal,
    weight_kg,
    target_weight,
    target_body_fat_pct,
    setGoal,
    setTargetWeight,
    setTargetBodyFatPct,
  } = useOnboardingStore();

  const handleContinue = () => {
    if (goal) {
      router.push("/(auth)/onboarding/step-4");
    }
  };

  const canContinue =
    goal &&
    (goal === "manter" ||
      (goal === "perder_gordura" && target_weight < weight_kg) ||
      (goal === "ganhar_massa" && target_weight > weight_kg));

  const minTargetPerder = 30;
  const maxTargetPerder = Math.max(minTargetPerder, Math.round((weight_kg - 0.5) * 10) / 10);
  const minTargetGanhar = Math.round((weight_kg + 0.5) * 10) / 10;
  const maxTargetGanhar = 200;

  return (
    <View style={styles.root}>
      <ProgressBar progress={3 / 7} />

      <OnboardingHeader step={3} totalSteps={7} subtitle="Objetivo" />

      <View style={styles.titleBlock}>
        <Text style={styles.title}>Qual seu objetivo principal?</Text>
        <Text style={styles.subtitle}>
          Escolha a opção que melhor descreve onde você quer chegar.
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <OptionCard
          title="Perder gordura"
          subtitle="Foco em queima calórica"
          icon="flame-outline"
          iconBgColor={Colors.carboBg}
          iconColor={Colors.carbo}
          selected={goal === "perder_gordura"}
          onPress={() => setGoal("perder_gordura")}
        />
        <OptionCard
          title="Ganhar massa"
          subtitle="Hipertrofia e força muscular"
          icon="barbell-outline"
          iconBgColor={Colors.greenLight}
          iconColor={Colors.greenDark}
          selected={goal === "ganhar_massa"}
          onPress={() => setGoal("ganhar_massa")}
        />
        <OptionCard
          title="Manter peso"
          subtitle="Equilíbrio e saúde diária"
          icon="scale-outline"
          iconBgColor={Colors.proteinBg}
          iconColor={Colors.protein}
          selected={goal === "manter"}
          onPress={() => setGoal("manter")}
        />

        {goal === "perder_gordura" && (
          <View style={styles.detailBlock}>
            <Text style={styles.detailTitle}>Detalhes do seu objetivo</Text>
            <Text style={styles.detailSubtitle}>
              Defina seu peso meta e, se quiser, a porcentagem de gordura corporal
              desejada para um plano mais personalizado.
            </Text>

            <View style={styles.stepperCard}>
              <View style={styles.stepperLabelBlock}>
                <Text style={styles.stepperLabel}>Peso meta (kg)</Text>
                <Text style={styles.stepperHint}>
                  Para calcular o prazo do objetivo
                </Text>
              </View>
              <View style={styles.stepperRow}>
                <Pressable
                  onPress={() =>
                    setTargetWeight(
                      Math.max(
                        minTargetPerder,
                        Math.round((target_weight - 0.5) * 10) / 10
                      )
                    )
                  }
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    pressed && styles.pressed,
                    target_weight <= minTargetPerder && styles.stepperBtnDisabled,
                  ]}
                  disabled={target_weight <= minTargetPerder}
                >
                  <Ionicons name="remove" size={20} color={Colors.green} />
                </Pressable>
                <Text style={styles.stepperValue}>
                  {Number(target_weight).toFixed(1)}
                </Text>
                <Pressable
                  onPress={() =>
                    setTargetWeight(
                      Math.min(
                        maxTargetPerder,
                        Math.round((target_weight + 0.5) * 10) / 10
                      )
                    )
                  }
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    pressed && styles.pressed,
                    target_weight >= maxTargetPerder && styles.stepperBtnDisabled,
                  ]}
                  disabled={target_weight >= maxTargetPerder}
                >
                  <Ionicons name="add" size={20} color={Colors.green} />
                </Pressable>
              </View>
            </View>

            <View style={styles.stepperCard}>
              <View style={styles.stepperLabelBlock}>
                <Text style={styles.stepperLabel}>
                  Gordura corporal desejada (%)
                </Text>
                <Text style={styles.stepperHint}>Opcional — meta de referência</Text>
              </View>
              <View style={styles.stepperRow}>
                <Pressable
                  onPress={() =>
                    setTargetBodyFatPct(
                      target_body_fat_pct != null
                        ? Math.max(5, target_body_fat_pct - 1)
                        : 20
                    )
                  }
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="remove" size={20} color={Colors.green} />
                </Pressable>
                <Text style={styles.stepperValue}>
                  {target_body_fat_pct != null ? `${target_body_fat_pct}%` : "—"}
                </Text>
                <Pressable
                  onPress={() =>
                    setTargetBodyFatPct(
                      target_body_fat_pct != null
                        ? Math.min(50, target_body_fat_pct + 1)
                        : 20
                    )
                  }
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="add" size={20} color={Colors.green} />
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {goal === "ganhar_massa" && (
          <View style={styles.detailBlock}>
            <Text style={styles.detailTitle}>Detalhes do seu objetivo</Text>
            <Text style={styles.detailSubtitle}>
              Informe o peso que você quer atingir para calcular o prazo correto
              do seu plano.
            </Text>

            <View style={styles.stepperCard}>
              <View style={styles.stepperLabelBlock}>
                <Text style={styles.stepperLabel}>Peso meta (kg)</Text>
                <Text style={styles.stepperHint}>
                  Peso que você quer alcançar
                </Text>
              </View>
              <View style={styles.stepperRow}>
                <Pressable
                  onPress={() =>
                    setTargetWeight(
                      Math.max(
                        minTargetGanhar,
                        Math.round((target_weight - 0.5) * 10) / 10
                      )
                    )
                  }
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    pressed && styles.pressed,
                    target_weight <= minTargetGanhar && styles.stepperBtnDisabled,
                  ]}
                  disabled={target_weight <= minTargetGanhar}
                >
                  <Ionicons name="remove" size={20} color={Colors.green} />
                </Pressable>
                <Text style={styles.stepperValue}>
                  {Number(target_weight).toFixed(1)}
                </Text>
                <Pressable
                  onPress={() =>
                    setTargetWeight(
                      Math.min(
                        maxTargetGanhar,
                        Math.round((target_weight + 0.5) * 10) / 10
                      )
                    )
                  }
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    pressed && styles.pressed,
                    target_weight >= maxTargetGanhar && styles.stepperBtnDisabled,
                  ]}
                  disabled={target_weight >= maxTargetGanhar}
                >
                  <Ionicons name="add" size={20} color={Colors.green} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title="Continuar"
          onPress={handleContinue}
          disabled={!canContinue}
          showArrow
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  titleBlock: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    fontSize: 28,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  detailBlock: {
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  detailTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  detailSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  stepperCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperLabelBlock: {
    flex: 1,
  },
  stepperLabel: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.text,
  },
  stepperHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  stepperValue: {
    ...Typography.h4,
    minWidth: 48,
    textAlign: "center",
    color: Colors.text,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background,
  },
});
