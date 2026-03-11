import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { BodyMetricPicker } from "../../../components/onboarding/BodyMetricPicker";
import { GradientButton } from "../../../components/ui";
import { OnboardingHeader } from "../../../components/onboarding/OnboardingHeader";
import { Colors } from "../../../constants/colors";
import { Spacing } from "../../../constants/spacing";
import { Typography } from "../../../constants/typography";
import { useOnboardingStore } from "../../../stores/useOnboardingStore";

export default function OnboardingStep2Screen() {
  const {
    age,
    weight_kg,
    height_cm,
    body_fat_pct,
    setAge,
    setWeight,
    setHeight,
    setBodyFatPct,
  } = useOnboardingStore();

  const weightMin = 35;
  const weightMax = 180;

  useEffect(() => {
    if (weight_kg < weightMin) setWeight(weightMin);
    else if (weight_kg > weightMax) setWeight(weightMax);
  }, []);

  // Garante que o valor exibido (18) da tela 2 vá para o store ao focar na tela (dados usados na tela 4)
  useFocusEffect(
    useCallback(() => {
      if (body_fat_pct === null) setBodyFatPct(18);
    }, [body_fat_pct, setBodyFatPct])
  );

  const handleContinue = () => {
    router.push("/(auth)/onboarding/step-3");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.root}>
        <OnboardingHeader step={2} totalSteps={9} subtitle="" showBack={true} fallbackRoute="/(auth)/onboarding/step-1" />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Seus dados corporais</Text>
            <Text style={styles.subtitle}>
              Insira suas informações para calcularmos suas metas
              personalizadas.
            </Text>
          </View>

          <View style={styles.cards}>
            <BodyMetricPicker
              label="ALTURA"
              value={height_cm}
              min={140}
              max={220}
              step={0.1}
              unit="CM"
              majorStep={10}
              mediumStep={5}
              displayStep={10}
              onChange={setHeight}
            />

            <BodyMetricPicker
              label="PESO ATUAL"
              value={weight_kg}
              min={weightMin}
              max={weightMax}
              step={0.1}
              displayStep={10}
              unit="KG"
              majorStep={10}
              mediumStep={5}
              formatValue={(v) => v.toFixed(1)}
              onChange={setWeight}
            />

            <BodyMetricPicker
              label="IDADE"
              value={age}
              min={10}
              max={100}
              step={1}
              unit="ANOS"
              majorStep={10}
              mediumStep={5}
              onChange={setAge}
            />

            <BodyMetricPicker
              label="GORDURA CORPORAL"
              value={body_fat_pct ?? 18}
              min={0}
              max={100}
              step={0.5}
              unit="%"
              majorStep={5}
              mediumStep={2.5}
              formatValue={(v) => v.toFixed(1)}
              onChange={setBodyFatPct}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <GradientButton title="Continuar" onPress={handleContinue} showArrow />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  titleBlock: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  cards: {
    gap: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
});
