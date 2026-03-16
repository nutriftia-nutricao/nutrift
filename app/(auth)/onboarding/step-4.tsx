import { router } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { GradientButton } from "../../../components/ui";
import { BodyMetricPicker } from "../../../components/onboarding/BodyMetricPicker";
import { OnboardingHeader } from "../../../components/onboarding/OnboardingHeader";
import { Colors } from "../../../constants/colors";
import { Radius } from "../../../constants/radius";
import { Spacing } from "../../../constants/spacing";
import { Typography } from "../../../constants/typography";
import { useOnboardingStore } from "../../../stores/useOnboardingStore";

export default function OnboardingStep4Screen() {
  const {
    weight_kg,
    target_weight,
    setTargetWeight,
    body_fat_pct,
    target_body_fat_pct,
    setTargetBodyFatPct,
    setBodyFatPct,
  } = useOnboardingStore();

  // --- Weight: range fixo amplo igual ao step-2 (garante densidade visual idêntica na régua) ---
  const minWeight = 30;
  const maxWeight = 180;

  useEffect(() => {
    if (target_weight < minWeight) setTargetWeight(minWeight);
    if (target_weight > maxWeight) setTargetWeight(maxWeight);
  }, []);

  // --- Body Fat: range fixo amplo igual ao step-2 ---
  // Fallback: se gordura atual não veio da tela 2, preenche com o mesmo default
  useEffect(() => {
    if (body_fat_pct === null) setBodyFatPct(18);
  }, []);

  const showFatSlider = body_fat_pct !== null && body_fat_pct > 0;
  const minFat = 3;
  const maxFat = 60;

  useEffect(() => {
    if (showFatSlider && target_body_fat_pct === null) {
      setTargetBodyFatPct(body_fat_pct!);
    }
  }, [showFatSlider, body_fat_pct]);

  const handleContinue = () => {
    router.push("/(auth)/onboarding/step-5");
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <OnboardingHeader step={4} totalSteps={9} subtitle="Metas" fallbackRoute="/(auth)/onboarding/step-3" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Defina suas metas</Text>
          <Text style={styles.subtitle}>Onde você quer chegar?</Text>
        </View>

        <View style={styles.metricCard}>
          <BodyMetricPicker
            label="PESO META"
            value={target_weight}
            min={minWeight}
            max={maxWeight}
            step={0.1}
            unit="KG"
            majorStep={10}
            mediumStep={5}
            decimalPlaces={1}
            onChange={setTargetWeight}
          />
        </View>

        <View style={styles.metricCard}>
          <BodyMetricPicker
            label="GORDURA META"
            value={target_body_fat_pct ?? body_fat_pct ?? 20}
            min={0}
            max={100}
            step={0.5}
            unit="%"
            majorStep={10}
            mediumStep={5}
            decimalPlaces={1}
            onChange={(v) => setTargetBodyFatPct(v)}
          />
        </View>

        <View style={styles.infoContainer}>
          {/* Peso — mesma estrutura de 3 colunas */}
          <View style={styles.infoColumns}>
            <View style={styles.infoCol}>
              <Text style={styles.infoColLabel}>ATUAL</Text>
              <View style={styles.infoValueRow}>
                <Text style={styles.infoColValue}>{weight_kg.toFixed(1)}</Text>
                <Text style={styles.infoColUnit}>kg</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoColCenter}>
              <Text style={styles.infoDiffLabel}>DIFERENÇA</Text>
              <Text style={[
                styles.infoDiff,
                Math.abs(target_weight - weight_kg) >= 0.1 && styles.infoDiffActive,
              ]}>
                {Math.abs(target_weight - weight_kg) < 0.1
                  ? "Manter"
                  : `${target_weight > weight_kg ? "+" : ""}${(target_weight - weight_kg).toFixed(1)} kg`}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoCol}>
              <Text style={styles.infoColLabel}>META</Text>
              <View style={styles.infoValueRow}>
                <Text style={styles.infoColValueHighlight}>{target_weight.toFixed(1)}</Text>
                <Text style={styles.infoColUnit}>kg</Text>
              </View>
            </View>
          </View>

          {/* Gordura — mesma estrutura (ATUAL / DIFERENÇA / META) */}
          <View style={styles.infoSeparator} />
          <View style={styles.infoColumns}>
            <View style={styles.infoCol}>
              <Text style={styles.infoColLabel}>ATUAL</Text>
              <View style={styles.infoValueRow}>
                <Text style={styles.infoColValue}>
                  {showFatSlider && body_fat_pct != null ? body_fat_pct.toFixed(1) : "—"}
                </Text>
                <Text style={styles.infoColUnit}>%</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoColCenter}>
              <Text style={styles.infoDiffLabel}>DIFERENÇA</Text>
              <Text style={[
                styles.infoDiff,
                showFatSlider &&
                  body_fat_pct != null &&
                  target_body_fat_pct != null &&
                  Math.abs(target_body_fat_pct - body_fat_pct) >= 0.1 &&
                  styles.infoDiffActive,
              ]}>
                {showFatSlider && body_fat_pct != null && target_body_fat_pct != null
                  ? Math.abs(target_body_fat_pct - body_fat_pct) < 0.1
                    ? "Manter"
                    : `${target_body_fat_pct > body_fat_pct ? "+" : ""}${(target_body_fat_pct - body_fat_pct).toFixed(1)} %`
                  : "—"}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoCol}>
              <Text style={styles.infoColLabel}>META</Text>
              <View style={styles.infoValueRow}>
                <Text style={styles.infoColValueHighlight}>
                  {(target_body_fat_pct ?? body_fat_pct ?? 20).toFixed(1)}
                </Text>
                <Text style={styles.infoColUnit}>%</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton title="Continuar" onPress={handleContinue} showArrow />
      </View>
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
    paddingHorizontal: Spacing.xl,
  },
  titleBlock: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
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
  metricCard: {
    marginTop: Spacing.xl,
  },
  infoContainer: {
    marginTop: Spacing.xxxl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  infoColumns: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  infoCol: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  infoValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  infoColCenter: {
    flex: 1.2,
    alignItems: "center",
    gap: 4,
  },
  infoColLabel: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  infoColValue: {
    ...Typography.h3,
    fontSize: 22,
    color: Colors.text,
  },
  infoColValueHighlight: {
    ...Typography.h3,
    fontSize: 22,
    color: Colors.primary,
  },
  infoColUnit: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  infoDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  infoDiffLabel: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  infoDiff: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  infoDiffActive: {
    color: Colors.primary,
  },
  infoSeparator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
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
