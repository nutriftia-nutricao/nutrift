import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { addDays, format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../constants/colors";
import { Radius } from "../constants/radius";
import { Spacing } from "../constants/spacing";
import { Typography } from "../constants/typography";
import type { MealType } from "../types/nutrition";
import { MEAL_TYPE_LABELS } from "../types/nutrition";

interface FoodItem {
  id: string;
  name: string;
  quantity_g: number; // gramas
  prepTime: number | null; // minutos
  kcal: number;
  carbo_g: number;
  protein_g: number;
  fat_g: number;
  checked: boolean; // se o alimento foi consumido
}

interface MealPlan {
  type: MealType;
  label: string;
  emoji: string; // emoji representativo da refeição
  time: string; // horário sugerido
  totalKcal: number;
  kcalRange: string; // ex: "488 - 536 kcal"
  foods: FoodItem[];
}

/** Dados mock do plano semanal (será substituído por geração IA). */
function getMockMealPlans(): MealPlan[] {
  return [
    {
      type: "cafe",
      label: MEAL_TYPE_LABELS.cafe,
      emoji: "☕",
      time: "08:30",
      totalKcal: 420,
      kcalRange: "488 - 536 kcal",
      foods: [
        { id: "1", name: "Ovos Mexidos", quantity_g: 100, prepTime: 10, kcal: 140, carbo_g: 1, protein_g: 12, fat_g: 10, checked: true },
        { id: "2", name: "Abacate", quantity_g: 80, prepTime: null, kcal: 160, carbo_g: 8, protein_g: 2, fat_g: 15, checked: true },
        { id: "3", name: "Pão Integral", quantity_g: 50, prepTime: null, kcal: 120, carbo_g: 22, protein_g: 4, fat_g: 2, checked: true },
      ],
    },
    {
      type: "almoco",
      label: MEAL_TYPE_LABELS.almoco,
      emoji: "🍽️",
      time: "12:30",
      totalKcal: 650,
      kcalRange: "650 - 720 kcal",
      foods: [
        { id: "4", name: "Arroz Integral", quantity_g: 150, prepTime: 30, kcal: 215, carbo_g: 45, protein_g: 5, fat_g: 2, checked: false },
        { id: "5", name: "Frango Grelhado", quantity_g: 120, prepTime: 25, kcal: 165, carbo_g: 0, protein_g: 31, fat_g: 4, checked: false },
        { id: "6", name: "Feijão Preto", quantity_g: 100, prepTime: null, kcal: 130, carbo_g: 23, protein_g: 8, fat_g: 1, checked: false },
        { id: "7", name: "Salada Verde", quantity_g: 80, prepTime: 5, kcal: 40, carbo_g: 8, protein_g: 2, fat_g: 0, checked: false },
        { id: "8", name: "Azeite", quantity_g: 10, prepTime: null, kcal: 100, carbo_g: 0, protein_g: 0, fat_g: 11, checked: false },
      ],
    },
    {
      type: "lanche",
      label: MEAL_TYPE_LABELS.lanche,
      emoji: "🥤",
      time: "16:00",
      totalKcal: 200,
      kcalRange: "180 - 220 kcal",
      foods: [
        { id: "9", name: "Iogurte Natural", quantity_g: 150, prepTime: null, kcal: 120, carbo_g: 12, protein_g: 10, fat_g: 3, checked: false },
        { id: "10", name: "Granola", quantity_g: 30, prepTime: null, kcal: 80, carbo_g: 15, protein_g: 2, fat_g: 2, checked: false },
      ],
    },
    {
      type: "jantar",
      label: MEAL_TYPE_LABELS.jantar,
      emoji: "🌙",
      time: "20:00",
      totalKcal: 550,
      kcalRange: "520 - 580 kcal",
      foods: [
        { id: "11", name: "Salmão Assado", quantity_g: 150, prepTime: 20, kcal: 200, carbo_g: 0, protein_g: 20, fat_g: 13, checked: false },
        { id: "12", name: "Batata Doce", quantity_g: 100, prepTime: 20, kcal: 86, carbo_g: 20, protein_g: 2, fat_g: 0, checked: false },
        { id: "13", name: "Brócolis no Vapor", quantity_g: 80, prepTime: 10, kcal: 55, carbo_g: 11, protein_g: 4, fat_g: 1, checked: false },
        { id: "14", name: "Salada de Tomate", quantity_g: 60, prepTime: 5, kcal: 30, carbo_g: 7, protein_g: 1, fat_g: 0, checked: false },
        { id: "15", name: "Azeite", quantity_g: 10, prepTime: null, kcal: 100, carbo_g: 0, protein_g: 0, fat_g: 11, checked: false },
        { id: "16", name: "Suco Verde", quantity_g: 200, prepTime: 5, kcal: 79, carbo_g: 18, protein_g: 2, fat_g: 0, checked: false },
      ],
    },
  ];
}

export default function PlanoSemanalScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMeal, setExpandedMeal] = useState<MealType | null>(null);
  const [meals, setMeals] = useState<MealPlan[]>(getMockMealPlans());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const weekStart = useMemo(
    () => startOfWeek(selectedDate, { weekStartsOn: 1 }),
    [selectedDate]
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const monthYearLabel = useMemo(() => {
    const str = format(weekStart, "MMMM yyyy", { locale: ptBR });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [weekStart]);

  const filteredMeals = meals.filter((m) =>
    m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.foods.some((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleMeal = (mealType: MealType) => {
    setExpandedMeal((prev) => (prev === mealType ? null : mealType));
  };

  const toggleFoodCheck = (mealType: MealType, foodId: string) => {
    setMeals((prev) =>
      prev.map((meal) => {
        if (meal.type === mealType) {
          return {
            ...meal,
            foods: meal.foods.map((food) =>
              food.id === foodId ? { ...food, checked: !food.checked } : food
            ),
          };
        }
        return meal;
      })
    );
  };

  const isMealComplete = (meal: MealPlan) => {
    return meal.foods.length > 0 && meal.foods.every((f) => f.checked);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header com busca e filtro */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <Pressable
            style={({ pressed }) => [
              styles.searchBox,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push("/buscar-alimento")}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={Colors.textMuted}
              style={styles.searchIcon}
            />
            <Text style={styles.searchPlaceholder}>Buscar</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.filterBtn,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="options-outline" size={22} color={Colors.text} />
          </Pressable>
        </View>

        {/* Botão Voltar */}
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>
      </View>

      {/* Calendário semanal */}
      <View style={styles.calendarSection}>
        <Text style={styles.calendarMonthTitle}>{monthYearLabel}</Text>
        <View style={styles.calendarWeekRow}>
          {weekDays.map((d) => {
            const iso = d.toISOString().split("T")[0];
            const isSelected = d.toDateString() === selectedDate.toDateString();
            const dayAbbr = format(d, "EEE", { locale: ptBR }).toUpperCase().slice(0, 3);
            const dayNum = format(d, "d");
            return (
              <Pressable
                key={iso}
                style={[styles.calendarDayCard, isSelected && styles.calendarDayCardSelected]}
                onPress={() => setSelectedDate(d)}
              >
                <View style={[styles.calendarDayTop, isSelected && styles.calendarDayTopSelected]}>
                  <Text style={[styles.calendarDayAbbr, isSelected && styles.calendarDayAbbrSelected]}>
                    {dayAbbr}
                  </Text>
                </View>
                <View style={styles.calendarDayBottom}>
                  <Text style={[styles.calendarDayNum, isSelected && styles.calendarDayNumSelected]}>
                    {dayNum}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Lista de refeições */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredMeals.map((meal) => {
          const isExpanded = expandedMeal === meal.type;
          const isComplete = isMealComplete(meal);
          return (
            <View key={meal.type} style={styles.mealCard}>
              {/* Header da refeição (sempre visível) */}
              <Pressable
                style={({ pressed }) => [
                  styles.mealHeader,
                  pressed && styles.pressed,
                ]}
                onPress={() => toggleMeal(meal.type)}
              >
                <View style={styles.mealLeft}>
                  <View style={styles.mealImageCircle}>
                    <Text style={styles.mealEmoji}>{meal.emoji}</Text>
                  </View>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{meal.label}</Text>
                    <Text style={styles.mealTime}>
                      {meal.time} • {meal.kcalRange}
                    </Text>
                  </View>
                </View>

                <View style={styles.mealRight}>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={Colors.textSecondary}
                  />
                </View>
              </Pressable>

              {/* Lista de alimentos (expandível) */}
              {isExpanded && (
                <View style={styles.foodsList}>
                  {meal.foods.map((food) => (
                    <View key={food.id} style={styles.foodItem}>
                      <View style={styles.foodItemRow}>
                        <View style={styles.foodContent}>
                          <View style={styles.foodItemTop}>
                            <Text style={styles.foodItemName}>
                              {food.name} • {food.quantity_g}g
                            </Text>
                            <Text style={styles.foodItemKcal}>{food.kcal} kcal</Text>
                          </View>

                          {/* Macros do alimento */}
                          <View style={styles.foodMacrosRow}>
                            <Text style={styles.foodMacroText}>
                              <Text style={styles.foodMacroLabelInline}>P: </Text>
                              <Text style={styles.foodMacroProtein}>{food.protein_g}g</Text>
                            </Text>
                            <Text style={styles.foodMacroText}>
                              <Text style={styles.foodMacroLabelInline}>C: </Text>
                              <Text style={styles.foodMacroCarbo}>{food.carbo_g}g</Text>
                            </Text>
                            <Text style={styles.foodMacroText}>
                              <Text style={styles.foodMacroLabelInline}>G: </Text>
                              <Text style={styles.foodMacroFat}>{food.fat_g}g</Text>
                            </Text>
                          </View>
                        </View>

                        {/* Botão de substituição do alimento */}
                <Pressable
                  style={({ pressed }) => [
                    styles.replaceFoodButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    router.push({
                      pathname: "/substituir-alimento",
                      params: {
                        foodId: food.id,
                        name: food.name,
                        quantity_g: food.quantity_g,
                        kcal: food.kcal,
                        protein_g: food.protein_g,
                        carbo_g: food.carbo_g,
                        fat_g: food.fat_g,
                        mealType: meal.type,
                        date: selectedDate,
                      },
                    });
                  }}
                >
                  <Ionicons name="swap-horizontal" size={20} color={Colors.greenDark} />
                </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {filteredMeals.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              Nenhuma refeição encontrada para "{searchQuery}"
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
    gap: Spacing.md,
  },
  searchRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchPlaceholder: {
    flex: 1,
    ...Typography.body,
    color: Colors.textMuted,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  backButtonText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: "600",
  },
  calendarSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.background,
  },
  calendarMonthTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  calendarWeekRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  calendarDayCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: "hidden",
  },
  calendarDayCardSelected: {
    borderColor: Colors.greenDark,
    backgroundColor: Colors.greenDark,
  },
  calendarDayTop: {
    backgroundColor: Colors.surface,
    paddingVertical: 6,
    paddingTop: 4,
    alignItems: "center",
  },
  calendarDayTopSelected: {
    backgroundColor: Colors.greenDark,
  },
  calendarDayAbbr: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  calendarDayAbbrSelected: {
    color: Colors.surface,
  },
  calendarDayBottom: {
    backgroundColor: Colors.surface,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayNum: {
    ...Typography.h4,
    fontSize: 16,
    color: Colors.textMuted,
  },
  calendarDayNumSelected: {
    color: Colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100, // espaço para a navbar flutuante
    gap: Spacing.md,
  },
  mealCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
  },
  mealLeft: {
    flexDirection: "row",
    gap: Spacing.md,
    flex: 1,
  },
  mealImageCircle: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  mealEmoji: {
    fontSize: 28,
  },
  mealInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  mealName: {
    ...Typography.h4,
    color: Colors.text,
  },
  mealTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  mealRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  foodsList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
  },
  foodItem: {
    paddingVertical: Spacing.xs,
  },
  foodItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  foodContent: {
    flex: 1,
    gap: 6,
  },
  replaceFoodButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.greenLight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  foodItemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  foodItemName: {
    ...Typography.body,
    fontWeight: "400",
    color: Colors.text,
    flex: 1,
  },
  foodItemKcal: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "400",
  },
  foodMacrosRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  foodMacroText: {
    ...Typography.caption,
    fontSize: 11,
  },
  foodMacroLabelInline: {
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  foodMacroProtein: {
    color: Colors.protein,
    fontWeight: "600",
  },
  foodMacroCarbo: {
    color: Colors.carbo,
    fontWeight: "600",
  },
  foodMacroFat: {
    color: Colors.fat,
    fontWeight: "600",
  },
  emptyWrap: {
    paddingVertical: Spacing.xxxl,
    alignItems: "center",
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
