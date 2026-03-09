import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { GradientButton } from "../../../components/ui";
import { Colors } from "../../../constants/colors";
import { Radius } from "../../../constants/radius";
import { Spacing } from "../../../constants/spacing";
import { Typography } from "../../../constants/typography";
import { OnboardingHeader } from "../../../components/onboarding/OnboardingHeader";
import { useOnboardingStore } from "../../../stores/useOnboardingStore";
import type { Activity } from "../../../types/onboarding";

const ACTIVITY_OPTIONS: {
  value: Activity;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  {
    value: "sedentario",
    title: "Sedentário",
    subtitle: "Trabalho sentado, sem exercícios.",
    icon: "desktop-outline",
  },
  {
    value: "levemente_ativo",
    title: "Leve",
    subtitle: "Exercício leve 1-3 dias/semana.",
    icon: "walk-outline",
  },
  {
    value: "moderado",
    title: "Moderadamente Ativo",
    subtitle: "Exercício moderado 3-5 dias/semana.",
    icon: "barbell-outline",
  },
  {
    value: "muito_ativo",
    title: "Muito Ativo",
    subtitle: "Atleta ou exercício 6-7 dias/semana.",
    icon: "flash-outline",
  },
];

export default function OnboardingStep5Screen() {
  const { activity, setActivity } = useOnboardingStore();

  const handleContinue = () => {
    if (activity) {
      router.push("/(auth)/onboarding/step-6");
    }
  };

  return (
    <View style={styles.root}>
      <OnboardingHeader step={5} totalSteps={9} subtitle="Nível de Atividade" fallbackRoute="/(auth)/onboarding/step-4" />

      <View style={styles.titleBlock}>
        <Text style={styles.title}>Qual seu nível de atividade?</Text>
        <Text style={styles.subtitle}>
          Selecione a opção que melhor descreve sua rotina semanal.
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {ACTIVITY_OPTIONS.map((opt) => {
          const isSelected = activity === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setActivity(opt.value)}
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                pressed && styles.pressed,
              ]}
            >
              {isSelected && <View style={styles.cardSelectedBar} />}
              <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                <Ionicons
                  name={opt.icon}
                  size={24}
                  color={isSelected ? Colors.primary : Colors.textSecondary}
                />
              </View>
              <View style={styles.textBlock}>
                <Text style={styles.cardTitle}>{opt.title}</Text>
                <Text style={styles.cardSubtitle}>{opt.subtitle}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title="Continuar"
          onPress={handleContinue}
          disabled={!activity}
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    fontSize: 24,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodySmall,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceElevated,
  },
  cardSelectedBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primary,
  },
  pressed: {
    opacity: 0.95,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxSelected: {
    backgroundColor: Colors.primaryLight,
  },
  textBlock: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.body,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  cardSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background,
  },
});
