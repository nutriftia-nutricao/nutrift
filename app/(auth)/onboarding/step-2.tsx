import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GradientButton } from "../../../components/ui/GradientButton";
import { OnboardingHeader } from "../../../components/onboarding/OnboardingHeader";
import { ProgressBar } from "../../../components/onboarding/ProgressBar";
import { Colors } from "../../../constants/colors";
import { Radius } from "../../../constants/radius";
import { Spacing } from "../../../constants/spacing";
import { Typography } from "../../../constants/typography";
import { useOnboardingStore } from "../../../stores/useOnboardingStore";

export default function OnboardingStep2Screen() {
  const {
    age,
    weight_kg,
    height_cm,
    setAge,
    setWeight,
    setHeight,
  } = useOnboardingStore();

  const handleContinue = () => {
    router.push("/(auth)/onboarding/step-3");
  };

  return (
    <View style={styles.root}>
      <ProgressBar progress={2 / 7} />

      <OnboardingHeader step={2} totalSteps={7} subtitle="Dados Corporais" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Seus dados corporais</Text>
          <Text style={styles.subtitle}>
            Mantenha seus dados atualizados para cálculos precisos de
            macronutrientes.
          </Text>
        </View>

        <View style={styles.cards}>
          <View style={[styles.card, styles.cardActive]}>
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>Idade</Text>
              <View style={styles.valueRow}>
                <Text style={styles.valueText}>{age}</Text>
                <Text style={styles.valueUnit}>anos</Text>
              </View>
            </View>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setAge(Math.max(14, age - 1))}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="remove" size={20} color={Colors.green} />
              </Pressable>
              <Pressable
                onPress={() => setAge(Math.min(120, age + 1))}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="add" size={20} color={Colors.green} />
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={[styles.cardLabel, styles.cardLabelInactive]}>
                Peso Atual
              </Text>
              <View style={styles.valueRow}>
                <Text style={styles.valueText}>
                  {Number(weight_kg).toFixed(1)}
                </Text>
                <Text style={styles.valueUnit}>kg</Text>
              </View>
            </View>
            <View style={styles.weightStepper}>
              <Pressable
                onPress={() =>
                  setWeight(
                    Math.max(30, Math.round((weight_kg - 0.1) * 10) / 10)
                  )
                }
                style={({ pressed }) => [
                  styles.stepperBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="remove" size={20} color={Colors.green} />
              </Pressable>
              <Pressable
                onPress={() =>
                  setWeight(
                    Math.min(300, Math.round((weight_kg + 0.1) * 10) / 10)
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

          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={[styles.cardLabel, styles.cardLabelInactive]}>
                Altura
              </Text>
              <View style={styles.valueRow}>
                <Text style={styles.valueText}>{height_cm}</Text>
                <Text style={styles.valueUnit}>cm</Text>
              </View>
            </View>
            <View style={styles.heightStepper}>
              <Pressable
                onPress={() => setHeight(Math.max(100, height_cm - 1))}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="remove" size={20} color={Colors.green} />
              </Pressable>
              <Pressable
                onPress={() => setHeight(Math.min(250, height_cm + 1))}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="add" size={20} color={Colors.green} />
              </Pressable>
            </View>
          </View>

          <View style={styles.tipCard}>
            <View style={styles.tipOverlay} />
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
              }}
              style={styles.tipImage}
              resizeMode="cover"
            />
            <View style={styles.tipContent}>
              <Text style={styles.tipLabel}>Dica de Precisão</Text>
              <Text style={styles.tipTitle}>Pese-se sempre pela manhã</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton title="Continuar" onPress={handleContinue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
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
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  cards: {
    gap: Spacing.lg,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  cardActive: {
    backgroundColor: Colors.greenLight,
    borderWidth: 2,
    borderColor: Colors.green,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    ...Typography.label,
    color: Colors.green,
  },
  cardLabelInactive: {
    color: Colors.textSecondary,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  valueText: {
    ...Typography.h1,
    fontSize: 36,
    color: Colors.text,
  },
  valueUnit: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  stepper: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  weightStepper: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  heightStepper: {
    flexDirection: "row",
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
  pressed: {
    opacity: 0.8,
  },
  tipCard: {
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    overflow: "hidden",
    aspectRatio: 16 / 9,
    position: "relative",
  },
  tipOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 1,
  },
  tipImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  tipContent: {
    position: "absolute",
    bottom: Spacing.lg,
    left: Spacing.lg,
    zIndex: 2,
  },
  tipLabel: {
    ...Typography.label,
    color: Colors.surface,
    opacity: 0.9,
    marginBottom: Spacing.xs,
  },
  tipTitle: {
    ...Typography.h3,
    color: Colors.surface,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background,
  },
});
