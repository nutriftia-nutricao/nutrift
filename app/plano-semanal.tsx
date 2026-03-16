import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { addDays, format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import { SafeAreaView } from "react-native-safe-area-context";

import { FoodEditSheet } from "../components/FoodEditSheet";
import { IconCircle } from "../components/ui";
import { Colors } from "../constants/colors";
import { Radius } from "../constants/radius";
import { Spacing } from "../constants/spacing";
import { Typography } from "../constants/typography";
import { useIsPro } from "../hooks/useUserPlan";
import { useWeeklyPlanStore } from "../stores/useWeeklyPlanStore";
import { useUserStore } from "../stores/useUserStore";
import { useOnboardingStore } from "../stores/useOnboardingStore";
import { generateWeeklyPlan } from "../services/weeklyPlan";
import { getSimilarFoodSuggestions, type SubstitutePreferences } from "../services/gemini";
import { getSession, recoverSessionFromUrl, signOut } from "../services/auth";
import { ensureUserProfile, fetchUserProfile } from "../services/user";
import type { MealType } from "../types/nutrition";
import { MEAL_TYPE_LABELS } from "../types/nutrition";
import type { PlannedFood, PlannedMeal } from "../stores/useWeeklyPlanStore";

// Mesmo conjunto de imagens da tela Hoje (assets locais). Fallback para tipos futuros.
const MEAL_IMAGES: Record<MealType, number> = {
  cafe: require("../assets/images/meals/meal-cafe.png"),
  lanche_manha: require("../assets/images/meals/meal-lanche-manha.png"),
  almoco: require("../assets/images/meals/meal-almoco.png"),
  lanche: require("../assets/images/meals/meal-lanche.png"),
  jantar: require("../assets/images/meals/meal-jantar.png"),
  pre_treino: require("../assets/images/meals/meal-pre-treino.png"),
  pos_treino: require("../assets/images/meals/meal-pos-treino.png"),
  extra: require("../assets/images/meals/meal-extra.png"),
};

function replacingKey(mealType: MealType, foodId: string) {
  return `${mealType}|${foodId}`;
}

export default function PlanoSemanalScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMeal, setExpandedMeal] = useState<MealType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [replacingFood, setReplacingFood] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [editSheet, setEditSheet] = useState<{
    food: PlannedFood;
    meal: PlannedMeal;
  } | null>(null);

  const user = useUserStore((s) => s.user);
  const isPro = useIsPro();
  const weeklyPlanStore = useWeeklyPlanStore();
  const onboardingDietType = useOnboardingStore((s) => s.diet_type);
  const onboardingRestrictions = useOnboardingStore((s) => s.restrictions);
  const onboardingLikedFoods = useOnboardingStore((s) => s.liked_foods);
  const dateISO = selectedDate.toISOString().slice(0, 10);

  const weekStart = useMemo(
    () => startOfWeek(selectedDate, { weekStartsOn: 1 }),
    [selectedDate]
  );
  const weekStartISO = format(weekStart, "yyyy-MM-dd");
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const monthYearLabel = useMemo(() => {
    const str = format(weekStart, "MMMM yyyy", { locale: ptBR });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [weekStart]);


  useEffect(() => {
    let cancelled = false;

    async function guardAccess() {
      try {
        const isExternalEntry = !router.canGoBack();
        if (Platform.OS !== "web" && isExternalEntry) {
          const initialUrl = await Linking.getInitialURL();
          if (cancelled) return;

          if (initialUrl) {
            const parsed = Linking.parse(initialUrl);
            const scheme = (parsed.scheme ?? "").toLowerCase();
            const pathParts = [parsed.hostname, parsed.path].filter(
              (part): part is string => typeof part === "string" && part.trim().length > 0
            );
            const normalizedPath = pathParts
              .join("/")
              .replace(/^\/+|\/+$/g, "")
              .toLowerCase();

            if (scheme === "nutrift" && normalizedPath === "plano-semanal") {
              try {
                await signOut();
              } catch {
                // Mesmo com falha de rede, forçamos login para não pular o fluxo.
              }

              if (cancelled) return;
              useUserStore.getState().clearUser();
              router.replace("/(auth)/login");
              return;
            }
          }
        }

        await recoverSessionFromUrl();

        const currentUser = useUserStore.getState().user;

        if (!currentUser?.id) {
          let {
            data: { session },
          } = await getSession();

          if (cancelled) return;

          if (!session?.user?.id) {
            router.replace("/(auth)/login");
            return;
          }

          let profile = await fetchUserProfile(session.user.id);

          if (cancelled) return;

          if (!profile) {
            const email = session.user.email ?? "";
            const name =
              session.user.user_metadata?.full_name ??
              session.user.user_metadata?.name ??
              session.user.user_metadata?.user_name ??
              "";
            profile = await ensureUserProfile(session.user.id, email, name);
          }

          if (cancelled) return;

          if (!profile) {
            router.replace("/(auth)/login");
            return;
          }

          useUserStore.getState().setUser(profile);

          if (!profile.onboarding_completed) {
            useOnboardingStore.getState().setData({ name: profile.name || "" });
            router.replace("/(auth)/onboarding/step-1");
            return;
          }

          setCheckingAccess(false);
          return;
        }

        if (!currentUser.onboarding_completed) {
          router.replace("/(auth)/onboarding/step-1");
          return;
        }

        setCheckingAccess(false);
      } catch {
        if (!cancelled) {
          router.replace("/(auth)/login");
        }
      }
    }

    guardAccess();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      weeklyPlanStore.loadWeeklyPlan(user.id, weekStartISO);
    }
  }, [user?.id, weekStartISO]);

  const plans = useWeeklyPlanStore((s) => s.plans);
  const getPlansForDate = useWeeklyPlanStore((s) => s.getPlansForDate);
  const plannedMeals = useMemo(
    () => getPlansForDate(dateISO),
    [dateISO, plans, getPlansForDate]
  );
  const filteredMeals = useMemo(
    () =>
      plannedMeals.filter(
        (m) =>
          MEAL_TYPE_LABELS[m.type]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.foods.some((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    [plannedMeals, searchQuery]
  );

  const substitutePreferences: SubstitutePreferences = useMemo(
    () => ({
      diet_type: user?.diet_type ?? onboardingDietType,
      restrictions: user?.restrictions ?? onboardingRestrictions ?? [],
      liked_foods: user?.liked_foods ?? onboardingLikedFoods ?? [],
    }),
    [user?.diet_type, user?.restrictions, user?.liked_foods, onboardingDietType, onboardingRestrictions, onboardingLikedFoods]
  );

  const handleOpenEditSheet = (meal: PlannedMeal, food: PlannedFood) => {
    setEditSheet({ food, meal });
  };

  const handleSheetAiSubstitute = async () => {
    if (!editSheet) return;
    await handleReplaceWithAi(editSheet.meal, editSheet.food);
  };

  const handleSheetSave = (updatedFood: PlannedFood) => {
    if (!editSheet) return;
    weeklyPlanStore.updateFood(dateISO, editSheet.meal.type, updatedFood.id, updatedFood);
  };

  const handleSheetRemove = (foodId: string) => {
    if (!editSheet) return;
    weeklyPlanStore.removeFood(dateISO, editSheet.meal.type, foodId);
  };

  const toggleMeal = (mealType: MealType) => {
    setExpandedMeal((prev) => (prev === mealType ? null : mealType));
  };

  const toggleFoodCheck = (mealType: MealType, foodId: string) => {
    weeklyPlanStore.toggleFoodCheck(dateISO, mealType, foodId);
  };

  const handleGeneratePlan = useCallback(async () => {
    if (!user?.id || generating) return;
    setGenerating(true);
    try {
      const result = await generateWeeklyPlan(user.id);
      if (!result.data?.success) {
        Alert.alert("Aviso", result.data?.error ?? "Não foi possível gerar o plano. Tente novamente.");
        return;
      }
      await weeklyPlanStore.loadWeeklyPlan(user.id, weekStartISO);
      setShowSuccessCard(true);
    } catch {
      Alert.alert("Erro", "Não foi possível gerar o plano. Verifique sua conexão.");
    } finally {
      setGenerating(false);
    }
  }, [user?.id, generating, weekStartISO, weeklyPlanStore]);

  const handleReplaceWithAi = useCallback(
    async (meal: PlannedMeal, food: PlannedFood) => {
      const key = replacingKey(meal.type, food.id);
      setReplacingFood(key);
      const TIMEOUT_MS = 15000;
      try {
        const suggestions = await Promise.race([
          getSimilarFoodSuggestions(
            {
              name: food.name,
              quantity_g: food.quantity_g,
              kcal: food.kcal,
              protein_g: food.protein_g,
              carbo_g: food.carbo_g,
              fat_g: food.fat_g,
            },
            meal.type,
            substitutePreferences
          ),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)
          ),
        ]);
        const first = suggestions[0];
        if (!first) {
          setReplacingFood(null);
          return;
        }
        weeklyPlanStore.replaceFood(dateISO, meal.type, food.id, {
          id: food.id,
          name: first.name,
          quantity_g: first.quantity_g,
          kcal: first.kcal,
          protein_g: first.protein_g,
          carbo_g: first.carbo_g,
          fat_g: first.fat_g,
        });
      } catch {
        // timeout ou erro de rede
      } finally {
        setReplacingFood(null);
      }
    },
    [dateISO, weeklyPlanStore, substitutePreferences]
  );

  if (checkingAccess) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/");
            }
          }}
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
            const mealsForDate = weeklyPlanStore.getPlansForDate(iso);
            const hasPlan = mealsForDate.length > 0;
            const allComplete = hasPlan && mealsForDate.every(
              (m) => m.foods.length > 0 && m.foods.every((f) => f.checked)
            );
            const hasAnyChecked = hasPlan && mealsForDate.some((m) => m.foods.some((f) => f.checked));
            const status: "none" | "planned" | "incomplete" | "complete" = allComplete
              ? "complete"
              : hasAnyChecked
                ? "incomplete"
                : hasPlan
                  ? "planned"
                  : "none";
            const isToday = iso === format(new Date(), "yyyy-MM-dd");
            return (
              <Pressable
                key={iso}
                style={[
                  styles.calendarDayCard,
                  status === "complete" && styles.calendarDayCardComplete,
                  status === "planned" && styles.calendarDayCardPlanned,
                  status === "incomplete" && styles.calendarDayCardIncomplete,
                  isToday && styles.calendarDayCardToday,
                  isSelected && styles.calendarDayCardSelected,
                ]}
                onPress={() => setSelectedDate(d)}
              >
                <View style={styles.calendarDayTop}>
                  <Text style={[styles.calendarDayAbbr, isSelected && styles.calendarDayAbbrSelected, isToday && styles.calendarDayAbbrToday]}>
                    {dayAbbr}
                  </Text>
                </View>
                <View style={styles.calendarDayBottom}>
                  <Text style={[styles.calendarDayNum, isSelected && styles.calendarDayNumSelected, isToday && styles.calendarDayNumToday]}>
                    {dayNum}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Gerar plano (Pro) — mostrar apenas se não está loading */}
      {weeklyPlanStore.status !== "loading" && (
        <View style={styles.generateSection}>
          {isPro ? (
            <Pressable
              style={({ pressed }) => [
                styles.generateBtn,
                pressed && { opacity: 0.8 },
                generating && { opacity: 0.6 },
              ]}
              onPress={handleGeneratePlan}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color={Colors.textInverse} />
              ) : (
                <Ionicons name="sparkles" size={18} color={Colors.textInverse} />
              )}
              <Text style={styles.generateBtnText}>
                {generating ? "Gerando seu plano..." : "Gerar plano com IA"}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.upgradeCard}
              onPress={() => router.push("/perfil/assinatura")}
            >
              <Ionicons name="lock-closed-outline" size={18} color={Colors.primary} />
              <Text style={styles.upgradeText}>Faça upgrade para Pro para gerar seu plano</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Lista de refeições */}
      {weeklyPlanStore.status === "loading" ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Carregando plano...</Text>
        </View>
      ) : (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredMeals.map((meal) => {
          const isExpanded = expandedMeal === meal.type;
          const mealLabel = MEAL_TYPE_LABELS[meal.type] ?? meal.type;
          return (
            <View key={`${meal.type}-${meal.date}`} style={styles.mealCard}>
              {/* Header da refeição (sempre visível) */}
              <Pressable
                style={({ pressed }) => [
                  styles.mealHeader,
                  pressed && styles.pressed,
                ]}
                onPress={() => toggleMeal(meal.type)}
              >
                <View style={styles.mealLeft}>
                  <View style={styles.mealImageWrapper}>
                    <Image
                      source={MEAL_IMAGES[meal.type] ?? MEAL_IMAGES.extra}
                      style={styles.mealImage}
                    />
                  </View>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{mealLabel}</Text>
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
                        <Pressable
                          style={styles.foodContent}
                          onPress={() => toggleFoodCheck(meal.type, food.id)}
                          onLongPress={() => handleOpenEditSheet(meal, food)}
                          delayLongPress={400}
                        >
                          <View style={styles.foodItemTop}>
                            <Text
                              style={[
                                styles.foodItemName,
                                food.checked && styles.foodItemNameChecked,
                              ]}
                            >
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
                        </Pressable>

                        {/* Botão editar — abre o sheet */}
                        {replacingFood === replacingKey(meal.type, food.id) ? (
                          <View style={styles.replaceLoading}>
                            <ActivityIndicator size="small" color={Colors.primaryDark} />
                          </View>
                        ) : (
                          <IconCircle
                            icon="sync-outline"
                            size={36}
                            iconSize={18}
                            onPress={() => handleOpenEditSheet(meal, food)}
                            accessibilityLabel={`Substituir ${food.name}`}
                            accessibilityHint="Abre opções para substituir, ajustar ou remover o alimento"
                          />
                        )}
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
              {searchQuery
                ? `Nenhuma refeição encontrada para "${searchQuery}"`
                : "Nenhuma refeição no plano para este dia."}
            </Text>
          </View>
        )}
      </ScrollView>
      )}

      {/* Modal de sucesso — plano gerado */}
      <Modal visible={showSuccessCard} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            {/* Barra verde de destaque no topo */}
            <View style={styles.successAccentBar} />

            <View style={styles.successContent}>
              <Text style={styles.successEmoji}>✦</Text>
              <Text style={styles.successTitle}>Seu plano foi criado!</Text>
              <Text style={styles.successSubtitle}>
                Agora é só começar.{"\n"}Vamos juntos até lá! 💪
              </Text>

              <Pressable
                style={({ pressed }) => [styles.successBtn, pressed && { opacity: 0.85 }]}
                onPress={() => setShowSuccessCard(false)}
              >
                <Text style={styles.successBtnText}>Ver meu plano  →</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sheet de edição de alimento */}
      <FoodEditSheet
        visible={editSheet !== null}
        food={editSheet?.food ?? null}
        mealType={editSheet?.meal.type ?? null}
        dayDate={dateISO}
        onAiSubstitute={handleSheetAiSubstitute}
        onSave={handleSheetSave}
        onRemove={handleSheetRemove}
        onClose={() => setEditSheet(null)}
      />
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
  generateSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
  },
  generateBtnText: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.textInverse,
  },
  upgradeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  upgradeText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
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
    borderWidth: 2,
  },
  calendarDayCardComplete: {
    borderColor: Colors.green,
    borderWidth: 2,
  },
  calendarDayCardPlanned: {
    borderColor: "#555555",
    borderWidth: 2,
  },
  calendarDayCardIncomplete: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  calendarDayCardToday: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
    borderWidth: 2,
  },
  calendarDayAbbrToday: {
    color: "#000",
  },
  calendarDayNumToday: {
    color: "#000",
    fontWeight: "700",
  },
  calendarDayTop: {
    paddingVertical: 6,
    paddingTop: 4,
    alignItems: "center",
  },
  calendarDayAbbr: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  calendarDayAbbrSelected: {
    color: Colors.greenDark,
  },
  calendarDayBottom: {
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
  mealImageWrapper: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.greenLight,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  mealImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
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
  replaceLoading: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
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
  foodItemNameChecked: {
    textDecorationLine: "line-through",
    color: Colors.textDisabled,
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

  // ── Success Modal ─────────────────────────────────────────────
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  successCard: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    // glow verde sutil
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  successAccentBar: {
    height: 5,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  successContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
  },
  successEmoji: {
    fontSize: 28,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  successTitle: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: "center",
    fontWeight: "700",
  },
  successSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  successBtn: {
    marginTop: Spacing.md,
    width: "100%",
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  successBtnText: {
    ...Typography.body,
    fontWeight: "700",
    fontSize: 16,
    color: Colors.textInverse,
    letterSpacing: 0.2,
  },
});
