import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import { GradientButton } from "../../../components/ui";
import { OnboardingHeader } from "../../../components/onboarding/OnboardingHeader";
import { Colors } from "../../../constants/colors";
import { Radius } from "../../../constants/radius";
import { Spacing } from "../../../constants/spacing";
import { Typography } from "../../../constants/typography";
import { useOnboardingStore } from "../../../stores/useOnboardingStore";
import type { OnboardingMealEntry } from "../../../types/onboarding";

const MEAL_COUNTS = [3, 4, 5, 6, 7] as const;
const ITEM_HEIGHT = 52;
const PICKER_VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * PICKER_VISIBLE_ITEMS;

const MEALS_BY_COUNT: Record<number, OnboardingMealEntry[]> = {
  3: [
    { type: "breakfast", label: "Café da manhã", emoji: "☕", default_time: "07:00" },
    { type: "lunch", label: "Almoço", emoji: "🍽️", default_time: "13:00" },
    { type: "dinner", label: "Jantar", emoji: "🌙", default_time: "20:00" },
  ],
  4: [
    { type: "breakfast", label: "Café da manhã", emoji: "☕", default_time: "07:00" },
    { type: "lunch", label: "Almoço", emoji: "🍽️", default_time: "13:00" },
    { type: "afternoon_snack", label: "Lanche da tarde", emoji: "🥤", default_time: "16:00" },
    { type: "dinner", label: "Jantar", emoji: "🌙", default_time: "20:00" },
  ],
  5: [
    { type: "breakfast", label: "Café da manhã", emoji: "☕", default_time: "07:00" },
    { type: "morning_snack", label: "Lanche da manhã", emoji: "🍎", default_time: "10:00" },
    { type: "lunch", label: "Almoço", emoji: "🍽️", default_time: "13:00" },
    { type: "afternoon_snack", label: "Lanche da tarde", emoji: "🥤", default_time: "16:00" },
    { type: "dinner", label: "Jantar", emoji: "🌙", default_time: "20:00" },
  ],
  6: [
    { type: "breakfast", label: "Café da manhã", emoji: "☕", default_time: "07:00" },
    { type: "morning_snack", label: "Lanche da manhã", emoji: "🍎", default_time: "10:00" },
    { type: "lunch", label: "Almoço", emoji: "🍽️", default_time: "13:00" },
    { type: "afternoon_snack", label: "Lanche da tarde", emoji: "🥤", default_time: "16:00" },
    { type: "dinner", label: "Jantar", emoji: "🌙", default_time: "20:00" },
    { type: "supper", label: "Ceia", emoji: "🌛", default_time: "22:00" },
  ],
  7: [
    { type: "breakfast", label: "Café da manhã", emoji: "☕", default_time: "07:00" },
    { type: "morning_snack", label: "Lanche da manhã", emoji: "🍎", default_time: "09:00" },
    { type: "lunch", label: "Almoço", emoji: "🍽️", default_time: "12:00" },
    { type: "afternoon_snack", label: "Lanche da tarde", emoji: "🥤", default_time: "15:00" },
    { type: "extra_snack", label: "Lanche extra", emoji: "🍊", default_time: "17:00" },
    { type: "dinner", label: "Jantar", emoji: "🌙", default_time: "20:00" },
    { type: "supper", label: "Ceia", emoji: "🌛", default_time: "22:00" },
  ],
};

export default function OnboardingStep6Screen() {
  const { meals_per_day, setMealsPerDay, setMeals } = useOnboardingStore();
  const [selectedCount, setSelectedCount] = useState(() => {
    const n = Math.min(7, Math.max(3, meals_per_day));
    return n;
  });
  const scrollRef = useRef<ScrollView>(null);

  const currentMeals = MEALS_BY_COUNT[selectedCount] ?? MEALS_BY_COUNT[5];

  // Scroll inicial para centralizar o valor atual (ex.: 5 refeições)
  useEffect(() => {
    const idx = MEAL_COUNTS.indexOf(selectedCount as (typeof MEAL_COUNTS)[number]);
    if (idx < 0) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: idx * ITEM_HEIGHT,
        animated: false,
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const getIndexFromOffset = useCallback((y: number) => {
    const index = Math.round(y / ITEM_HEIGHT);
    return Math.max(0, Math.min(MEAL_COUNTS.length - 1, index));
  }, []);

  // Atualiza a seleção e a lista de refeições em tempo real enquanto arrasta
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const index = getIndexFromOffset(y);
      const count = MEAL_COUNTS[index];
      setSelectedCount(count);
    },
    [getIndexFromOffset]
  );

  // Ao soltar o dedo, encaixa no item mais próximo
  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const index = getIndexFromOffset(y);
      const count = MEAL_COUNTS[index];
      setSelectedCount(count);
      scrollRef.current?.scrollTo({
        y: index * ITEM_HEIGHT,
        animated: true,
      });
    },
    [getIndexFromOffset]
  );

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const index = getIndexFromOffset(y);
      const count = MEAL_COUNTS[index];
      setSelectedCount(count);
      const targetY = index * ITEM_HEIGHT;
      const currentY = e.nativeEvent.contentOffset.y;
      if (Math.abs(currentY - targetY) > 2 && scrollRef.current) {
        scrollRef.current.scrollTo({
          y: targetY,
          animated: true,
        });
      }
    },
    [getIndexFromOffset]
  );

  const handleContinue = () => {
    setMealsPerDay(selectedCount);
    setMeals(currentMeals);
    router.push("/(auth)/onboarding/step-7");
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <OnboardingHeader
        step={6}
        totalSteps={9}
        subtitle="Refeições"
        fallbackRoute="/(auth)/onboarding/step-5"
      />

      <View style={styles.titleBlock}>
        <Text style={styles.title}>Quantas refeições por dia?</Text>
        <Text style={styles.subtitle}>
          Distribuímos suas calorias entre elas
        </Text>
      </View>

      <View style={styles.pickerWrap}>
        <LinearGradient
          colors={[Colors.background, "transparent"]}
          style={styles.pickerFadeTop}
          pointerEvents="none"
        />
        <View style={styles.pickerWindow}>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={{
              paddingVertical: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
            }}
            onScroll={handleScroll}
            onScrollEndDrag={handleScrollEnd}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            scrollEventThrottle={16}
          >
            {MEAL_COUNTS.map((count) => {
              const isSelected = count === selectedCount;
              return (
                <View
                  key={count}
                  style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      isSelected && styles.pickerItemTextSelected,
                    ]}
                  >
                    {count} refeições
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
        <LinearGradient
          colors={["transparent", Colors.background]}
          style={styles.pickerFadeBottom}
          pointerEvents="none"
        />
      </View>

      <View style={styles.mealListSection}>
        <Text style={styles.mealListLabel}>SUAS REFEIÇÕES</Text>
        <View style={styles.mealCard}>
          {currentMeals.map((meal, index) => (
            <React.Fragment key={meal.type}>
              {index > 0 && <View style={styles.mealSeparator} />}
              <View style={styles.mealRow}>
                <Text style={styles.mealEmoji}>{meal.emoji}</Text>
                <Text style={styles.mealLabel}>{meal.label}</Text>
                <Text style={styles.mealTime}>{meal.default_time}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.mealNote}>
          Horários ajustáveis depois em Configurações
        </Text>
      </View>

      <View style={styles.footer}>
        <GradientButton title="Continuar" onPress={handleContinue} showArrow />
      </View>
    </SafeAreaView>
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
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodySmall,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  pickerWrap: {
    height: PICKER_HEIGHT,
    marginHorizontal: Spacing.xl,
    position: "relative",
  },
  pickerFadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    zIndex: 1,
  },
  pickerFadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    zIndex: 1,
  },
  pickerWindow: {
    flex: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerItemSelected: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.sm,
  },
  pickerItemText: {
    ...Typography.body,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  pickerItemTextSelected: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textInverse,
  },
  mealListSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  mealListLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  mealCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  mealSeparator: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginLeft: Spacing.lg + 28,
  },
  mealEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: "center",
  },
  mealLabel: {
    ...Typography.body,
    flex: 1,
    fontWeight: "500",
    color: Colors.text,
  },
  mealTime: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  mealNote: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background,
    marginTop: "auto",
  },
});
