import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
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
import type { DietStyle } from "../../../types/onboarding";

const GRID_GAP = 12;
const DIET_CARD_MIN_WIDTH = 140;

const DIET_OPTIONS: { value: DietStyle; label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { value: "equilibrada", label: "Equilibrada", icon: "nutrition-outline" },
  { value: "vegetariana", label: "Vegetariana", icon: "leaf-outline" },
  { value: "high_protein", label: "High Protein", icon: "barbell-outline" },
  { value: "low_carb", label: "Low Carb", icon: "restaurant-outline" },
];

const MEALS_OPTIONS: { value: number; label: string }[] = [
  { value: 2, label: "2 refeições" },
  { value: 3, label: "3 refeições" },
  { value: 4, label: "4 refeições" },
  { value: 5, label: "5+ refeições" },
];

const SUGGESTED_FOODS = [
  "Frango",
  "Batata Doce",
  "Ovos",
  "Arroz",
  "Brócolis",
  "Peixe",
  "Carne",
  "Aveia",
  "Banana",
  "Queijo",
];

export default function OnboardingStep5Screen() {
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = screenWidth - Spacing.xl * 2;
  const dietCardWidth = Math.max(
    DIET_CARD_MIN_WIDTH,
    (contentWidth - GRID_GAP) / 2
  );

  const {
    diet_style,
    meals_per_day,
    liked_foods,
    setDietStyle,
    setMealsPerDay,
    toggleLikedFood,
  } = useOnboardingStore();

  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [addFoodInput, setAddFoodInput] = useState("");

  const allFoods = [
    ...SUGGESTED_FOODS,
    ...liked_foods.filter((f) => !SUGGESTED_FOODS.includes(f)),
  ];

  const handleAddFood = () => {
    const name = addFoodInput.trim();
    if (name && !allFoods.some((f) => f.toLowerCase() === name.toLowerCase())) {
      toggleLikedFood(name);
    }
    if (name) {
      setAddFoodInput("");
      setShowAddFoodModal(false);
    }
  };

  const handleContinue = () => {
    router.push("/(auth)/onboarding/step-6");
  };

  return (
    <View style={styles.root}>
      <ProgressBar progress={5 / 7} />

      <OnboardingHeader step={5} totalSteps={7} subtitle="Preferências" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Suas Preferências</Text>
          <Text style={styles.subtitle}>
            Personalize seu plano alimentar para melhores resultados.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Estilo de Dieta</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Selecione um</Text>
            </View>
          </View>
          <View style={styles.dietGrid}>
            {DIET_OPTIONS.map((opt) => {
              const isSelected = diet_style === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setDietStyle(opt.value)}
                  style={({ pressed }) => [
                    styles.dietCard,
                    { width: dietCardWidth, minHeight: 88 },
                    isSelected && styles.dietCardSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={28}
                    color={isSelected ? Colors.greenDark : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.dietLabel,
                      isSelected && styles.dietLabelSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequência de Refeições</Text>
          <Text style={styles.sectionSubtitle}>
            Quantas refeições você costuma fazer por dia?
          </Text>
          <View style={styles.mealsGrid}>
            {MEALS_OPTIONS.map(({ value, label }) => {
              const isSelected = meals_per_day === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setMealsPerDay(value)}
                  style={({ pressed }) => [
                    styles.mealCard,
                    isSelected && styles.mealCardSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.mealCardNumber,
                      isSelected && styles.mealCardNumberSelected,
                    ]}
                  >
                    {value === 5 ? "5+" : value}
                  </Text>
                  <Text
                    style={[
                      styles.mealCardLabel,
                      isSelected && styles.mealCardLabelSelected,
                    ]}
                  >
                    refeições
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alimentos que você gosta</Text>
          <View style={styles.foodsRow}>
            {allFoods.map((food) => {
              const isSelected = liked_foods.includes(food);
              return (
                <Pressable
                  key={food}
                  onPress={() => toggleLikedFood(food)}
                  style={({ pressed }) => [
                    styles.foodPill,
                    isSelected && styles.foodPillSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.foodPillText,
                      isSelected && styles.foodPillTextSelected,
                    ]}
                  >
                    {food}
                  </Text>
                  {isSelected && (
                    <Ionicons name="close" size={14} color={Colors.greenDark} />
                  )}
                </Pressable>
              );
            })}
            <Pressable
              style={({ pressed }) => [
                styles.foodPillAdd,
                pressed && styles.pressed,
              ]}
              onPress={() => setShowAddFoodModal(true)}
            >
              <Ionicons name="add" size={20} color={Colors.green} />
            </Pressable>
          </View>
        </View>

        <Modal
          visible={showAddFoodModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddFoodModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowAddFoodModal(false)}
          >
            <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Adicionar alimento</Text>
              <Text style={styles.modalSubtitle}>
                Digite um alimento que você gosta para personalizar seu plano.
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Abacaxi, Tofu..."
                placeholderTextColor={Colors.textMuted}
                value={addFoodInput}
                onChangeText={setAddFoodInput}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={40}
                onSubmitEditing={handleAddFood}
              />
              <View style={styles.modalActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalButtonSecondary,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    setAddFoodInput("");
                    setShowAddFoodModal(false);
                  }}
                >
                  <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalButtonPrimary,
                    pressed && styles.pressed,
                  ]}
                  onPress={handleAddFood}
                >
                  <Text style={styles.modalButtonPrimaryText}>Adicionar</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <View style={styles.tipCard}>
          <View style={styles.tipIconWrapper}>
            <Ionicons name="bulb-outline" size={24} color={Colors.greenDark} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipLabel}>Dica de Especialista</Text>
            <Text style={styles.tipText}>
              Dietas equilibradas com 3 refeições ajudam a manter o metabolismo
              estável.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title="Continuar"
          onPress={handleContinue}
          disabled={!diet_style}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  titleBlock: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    fontSize: 26,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodySmall,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.label,
    fontSize: 12,
    color: Colors.text,
    fontWeight: "800",
    letterSpacing: 1,
  },
  badge: {
    borderWidth: 1,
    borderColor: `${Colors.green}4D`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  badgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: Colors.greenDark,
  },
  dietGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  dietCard: {
    minWidth: DIET_CARD_MIN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dietCardSelected: {
    borderWidth: 2,
    borderColor: Colors.green,
    backgroundColor: Colors.surface,
  },
  pressed: {
    opacity: 0.9,
  },
  dietLabel: {
    ...Typography.bodySmall,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  dietLabelSelected: {
    color: Colors.text,
    fontWeight: "700",
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  mealsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  mealCard: {
    flex: 1,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealCardSelected: {
    backgroundColor: Colors.greenLight,
    borderWidth: 2,
    borderColor: Colors.green,
  },
  mealCardNumber: {
    ...Typography.h1,
    fontSize: 28,
    color: Colors.textSecondary,
  },
  mealCardNumberSelected: {
    color: Colors.greenDark,
  },
  mealCardLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  mealCardLabelSelected: {
    color: Colors.greenDark,
    fontWeight: "600",
  },
  foodsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  foodPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  foodPillSelected: {
    backgroundColor: Colors.greenLight,
    borderColor: `${Colors.green}33`,
  },
  foodPillText: {
    ...Typography.bodySmall,
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  foodPillTextSelected: {
    color: Colors.greenDark,
    fontWeight: "700",
  },
  foodPillAdd: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalBox: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
  },
  modalTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  modalInput: {
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "flex-end",
  },
  modalButtonSecondary: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtonSecondaryText: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  modalButtonPrimary: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: Colors.green,
  },
  modalButtonPrimaryText: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.surface,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    backgroundColor: Colors.greenLight,
    borderWidth: 1,
    borderColor: `${Colors.green}1A`,
  },
  tipIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  tipContent: {
    flex: 1,
  },
  tipLabel: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.greenDark,
    fontWeight: "800",
  },
  tipText: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background,
  },
});
