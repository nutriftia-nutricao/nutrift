import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../constants/colors";
import { Radius } from "../constants/radius";
import { Spacing } from "../constants/spacing";
import { Typography } from "../constants/typography";
import { getSimilarFoodSuggestions } from "../services/gemini";
import { useWeeklyPlanStore } from "../stores/useWeeklyPlanStore";
import type { MealType } from "../types/nutrition";

interface FoodSuggestion {
  name: string;
  quantity_g: number;
  kcal: number;
  protein_g: number;
  carbo_g: number;
  fat_g: number;
  reason: string;
}

export default function SubstituirAlimentoScreen() {
  const params = useLocalSearchParams();
  const weeklyPlanStore = useWeeklyPlanStore();
  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse dos parâmetros
  const foodId = params.foodId as string;
  const date = params.date as string;
  const mealType = params.mealType as MealType;
  
  const originalFood = {
    name: params.name as string,
    quantity_g: Number(params.quantity_g),
    kcal: Number(params.kcal),
    protein_g: Number(params.protein_g),
    carbo_g: Number(params.carbo_g),
    fat_g: Number(params.fat_g),
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getSimilarFoodSuggestions(originalFood, mealType);
      setSuggestions(result);
    } catch (err) {
      setError("Não foi possível carregar sugestões. Tente novamente.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFood = (food: FoodSuggestion) => {
    // Substituir o alimento no plano semanal
    weeklyPlanStore.replaceFood(date, mealType, foodId, {
      id: foodId, // Mantém o mesmo ID
      name: food.name,
      quantity_g: food.quantity_g,
      kcal: food.kcal,
      protein_g: food.protein_g,
      carbo_g: food.carbo_g,
      fat_g: food.fat_g,
    });
    
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/");
    }
  };

  const renderFoodCard = (food: FoodSuggestion, index: number) => (
    <Pressable
      key={index}
      style={({ pressed }) => [
        styles.foodCard,
        pressed && styles.foodCardPressed,
      ]}
      onPress={() => handleSelectFood(food)}
    >
      <View style={styles.foodHeader}>
        <View style={styles.foodIcon}>
          <Ionicons name="nutrition-outline" size={24} color={Colors.greenDark} />
        </View>
        <View style={styles.foodHeaderInfo}>
          <Text style={styles.foodName}>{food.name}</Text>
          <Text style={styles.foodQuantity}>{food.quantity_g}g</Text>
        </View>
        <Text style={styles.foodKcal}>{food.kcal} kcal</Text>
      </View>

      <View style={styles.macrosRow}>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Proteínas</Text>
          <Text style={[styles.macroValue, styles.macroProtein]}>
            {food.protein_g}g
          </Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Carboidratos</Text>
          <Text style={[styles.macroValue, styles.macroCarbo]}>
            {food.carbo_g}g
          </Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Gorduras</Text>
          <Text style={[styles.macroValue, styles.macroFat]}>
            {food.fat_g}g
          </Text>
        </View>
      </View>

      <View style={styles.reasonBox}>
        <Ionicons name="bulb-outline" size={16} color={Colors.warning} />
        <Text style={styles.reasonText}>{food.reason}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/");
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Substituir Alimento</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Alimento original */}
        <View style={styles.originalSection}>
          <Text style={styles.sectionTitle}>Alimento atual</Text>
          <View style={styles.originalCard}>
            <View style={styles.originalHeader}>
              <Text style={styles.originalName}>{originalFood.name}</Text>
              <Text style={styles.originalKcal}>{originalFood.kcal} kcal</Text>
            </View>
            <Text style={styles.originalQuantity}>{originalFood.quantity_g}g</Text>
            <View style={styles.originalMacros}>
              <Text style={styles.originalMacroText}>
                P: <Text style={styles.macroProtein}>{originalFood.protein_g}g</Text>
              </Text>
              <Text style={styles.originalMacroText}>
                C: <Text style={styles.macroCarbo}>{originalFood.carbo_g}g</Text>
              </Text>
              <Text style={styles.originalMacroText}>
                G: <Text style={styles.macroFat}>{originalFood.fat_g}g</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Sugestões da IA */}
        <View style={styles.suggestionsSection}>
          <View style={styles.suggestionsTitleRow}>
            <Ionicons name="sparkles" size={20} color={Colors.greenDark} />
            <Text style={styles.sectionTitle}>Sugestões da IA</Text>
          </View>

          {isLoading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={Colors.greenDark} />
              <Text style={styles.loadingText}>
                Buscando alimentos similares...
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorWrap}>
              <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.pressed,
                ]}
                onPress={loadSuggestions}
              >
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </Pressable>
            </View>
          )}

          {!isLoading && !error && suggestions.length > 0 && (
            <View style={styles.suggestionsGrid}>
              {suggestions.map((food, index) => renderFoodCard(food, index))}
            </View>
          )}
        </View>

        {/* Botão para busca manual */}
        <Pressable
          style={({ pressed }) => [
            styles.manualSearchButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/buscar-alimento")}
        >
          <Ionicons name="search-outline" size={20} color={Colors.greenDark} />
          <Text style={styles.manualSearchText}>
            Ou busque manualmente na base TACO
          </Text>
        </Pressable>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  originalSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  originalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  originalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  originalName: {
    ...Typography.h4,
    color: Colors.text,
    flex: 1,
  },
  originalKcal: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.text,
  },
  originalQuantity: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  originalMacros: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  originalMacroText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  suggestionsSection: {
    marginBottom: Spacing.xl,
  },
  suggestionsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  loadingWrap: {
    paddingVertical: Spacing.xxxl,
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  errorWrap: {
    paddingVertical: Spacing.xxxl,
    alignItems: "center",
    gap: Spacing.md,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: Colors.greenDark,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    marginTop: Spacing.sm,
  },
  retryButtonText: {
    ...Typography.body,
    color: Colors.surface,
    fontWeight: "600",
  },
  suggestionsGrid: {
    gap: Spacing.md,
  },
  foodCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  foodCardPressed: {
    backgroundColor: Colors.greenLight,
    borderColor: Colors.green,
  },
  foodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  foodIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  foodHeaderInfo: {
    flex: 1,
    gap: 2,
  },
  foodName: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.text,
  },
  foodQuantity: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  foodKcal: {
    ...Typography.h4,
    fontSize: 16,
    color: Colors.text,
  },
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  macroItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  macroLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  macroValue: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: "700",
  },
  macroProtein: {
    color: Colors.protein,
  },
  macroCarbo: {
    color: Colors.carbo,
  },
  macroFat: {
    color: Colors.fat,
  },
  reasonBox: {
    flexDirection: "row",
    gap: Spacing.sm,
    backgroundColor: Colors.carboBg,
    padding: Spacing.md,
    borderRadius: Radius.sm,
  },
  reasonText: {
    ...Typography.caption,
    color: Colors.text,
    flex: 1,
    lineHeight: 18,
  },
  manualSearchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  manualSearchText: {
    ...Typography.body,
    color: Colors.greenDark,
    fontWeight: "600",
  },
});
