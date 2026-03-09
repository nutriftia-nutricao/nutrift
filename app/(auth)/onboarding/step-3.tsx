import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { GradientButton } from "../../../components/ui";
import { OnboardingHeader } from "../../../components/onboarding/OnboardingHeader";
import { OptionCard } from "../../../components/onboarding/OptionCard";
import { Colors } from "../../../constants/colors";
import { Spacing } from "../../../constants/spacing";
import { Typography } from "../../../constants/typography";
import { useOnboardingStore } from "../../../stores/useOnboardingStore";

export default function OnboardingStep3Screen() {
  const { goal, setGoal } = useOnboardingStore();

  const handleContinue = () => {
    if (goal) {
      router.push("/(auth)/onboarding/step-4");
    }
  };

  return (
    <View style={styles.root}>
      <OnboardingHeader step={3} totalSteps={9} subtitle="Objetivo" fallbackRoute="/(auth)/onboarding/step-2" />

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
          emoji="🔥"
          title="Perder gordura"
          subtitle="Déficit calórico controlado"
          selected={goal === "perder_gordura"}
          onPress={() => setGoal("perder_gordura")}
        />
        <OptionCard
          emoji="💪"
          title="Ganhar massa muscular"
          subtitle="Superávit + proteína alta"
          selected={goal === "ganhar_massa"}
          onPress={() => setGoal("ganhar_massa")}
        />
        <OptionCard
          emoji="⚡"
          title="Secar e definir"
          subtitle="Perder gordura mantendo o músculo"
          selected={goal === "manter"}
          onPress={() => setGoal("manter")}
        />
        <OptionCard
          emoji="🏆"
          title="Transformação completa"
          subtitle="Menos gordura. Mais músculo."
          selected={goal === "so_acompanhar"}
          onPress={() => setGoal("so_acompanhar")}
        />
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title="Continuar"
          onPress={handleContinue}
          disabled={!goal}
          showArrow
          colors={["#CAFF66", "#CAFF66"]}
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
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background,
  },
});
