import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { GradientButton } from "../../../components/ui";
import { OnboardingHeader } from "../../../components/onboarding/OnboardingHeader";
import { Colors } from "../../../constants/colors";
import { Radius } from "../../../constants/radius";
import { Spacing } from "../../../constants/spacing";
import { Typography } from "../../../constants/typography";
import { useOnboardingStore } from "../../../stores/useOnboardingStore";
import type { DietType, Restriction } from "../../../types/onboarding";

type DietOptionId = DietType | Restriction;

const DIET_OPTIONS: { id: DietOptionId; label: string; emoji: string }[] = [
  { id: "onivoro", label: "Onívoro", emoji: "🥩" },
  { id: "vegetariano", label: "Vegetariano", emoji: "🥗" },
  { id: "vegano", label: "Vegano", emoji: "🌱" },
  { id: "low_carb", label: "Low Carb", emoji: "🥦" },
  { id: "sem_gluten", label: "Sem glúten", emoji: "🌾" },
  { id: "sem_lactose", label: "Sem lactose", emoji: "🥛" },
];

const DIET_TYPES: DietType[] = ["onivoro", "vegetariano", "vegano", "low_carb"];
const RESTRICTIONS: Restriction[] = ["sem_gluten", "sem_lactose"];

function isRestriction(id: DietOptionId): id is Restriction {
  return RESTRICTIONS.includes(id as Restriction);
}

export default function OnboardingStep8Screen() {
  const { diet_type, restrictions, setDietType, setData } = useOnboardingStore();

  const selectedId: DietOptionId = (() => {
    if (restrictions.includes("sem_gluten")) return "sem_gluten";
    if (restrictions.includes("sem_lactose")) return "sem_lactose";
    return diet_type ?? "onivoro";
  })();

  const handleSelect = (id: DietOptionId) => {
    if (isRestriction(id)) {
      setData({ diet_type: "onivoro", restrictions: [id] });
    } else {
      setData({ diet_type: id, restrictions: [] });
    }
  };

  const handleContinue = () => {
    router.push("/(auth)/onboarding/step-9");
  };

  return (
    <View style={styles.root}>
      <OnboardingHeader
        step={8}
        totalSteps={9}
        subtitle="Dieta"
        fallbackRoute="/(auth)/onboarding/step-7"
      />

      <View style={styles.titleBlock}>
        <Text style={styles.title}>Qual seu estilo de dieta?</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {DIET_OPTIONS.map((opt) => {
          const isSelected = selectedId === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => handleSelect(opt.id)}
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.emojiWrap}>
                {opt.id === "low_carb" ? (
                  <Text
                    style={[
                      styles.arrowEmoji,
                      { color: isSelected ? Colors.primary : Colors.text },
                    ]}
                  >
                    ↓
                  </Text>
                ) : (
                  <Text style={styles.emoji}>{opt.emoji}</Text>
                )}
              </View>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {opt.label}
              </Text>
              {isSelected ? (
                <View style={styles.checkWrap}>
                  <Ionicons name="checkmark" size={22} color={Colors.primary} />
                </View>
              ) : (
                <View style={styles.radio} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton title="Continuar" onPress={handleContinue} showArrow />
      </View>
    </View>
  );
}

const CARD_RADIUS = 14;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  titleBlock: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    fontSize: 24,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: CARD_RADIUS,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: "rgba(202, 255, 102, 0.22)",
  },
  pressed: {
    opacity: 0.95,
  },
  emojiWrap: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  emoji: {
    fontSize: 22,
  },
  arrowEmoji: {
    fontSize: 28,
    fontWeight: "700",
  },
  label: {
    ...Typography.body,
    flex: 1,
    fontSize: 17,
    fontWeight: "500",
    color: Colors.text,
  },
  labelSelected: {
    fontWeight: "600",
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  checkWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background,
  },
});
