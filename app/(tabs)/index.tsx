import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { addDays, format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityModal } from "../../components/home/ActivityModal";
import { HydrationModal } from "../../components/home/HydrationModal";
import { StreakCelebrationModal } from "../../components/home/StreakCelebrationModal";
import { Colors } from "../../constants/colors";
import { useTheme } from "../../hooks/useTheme";
import { GradientColors } from "../../constants/gradients";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";
import { useActivityStore } from "../../stores/useActivityStore";
import { useHydrationStore } from "../../stores/useHydrationStore";
import { useNutritionStore } from "../../stores/useNutritionStore";
import { useUserStore } from "../../stores/useUserStore";
import { useWeeklyPlanStore } from "../../stores/useWeeklyPlanStore";
import { MEAL_TYPE_LABELS as MEAL_LABELS } from "../../types/nutrition";
import type { MealType } from "../../types/nutrition";
import { fetchFoodLogsForDateRange } from "../../services/nutrition";
import {
  getMealTypesForDisplay,
  MEAL_TYPE_LABELS,
} from "../../types/nutrition";
import type { FoodLogEntry } from "../../types/nutrition";
import { getTodayISO } from "../../utils/date";

const MEAL_TIMES: Record<MealType, string> = {
  cafe: "07:30",
  almoco: "12:00",
  lanche: "16:00",
  jantar: "19:30",
  extra: "—",
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const STREAK_CELEBRATION_THRESHOLD = 5;

export default function HomeScreen() {
  const { C } = useTheme();
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  /** Quando não é null, o modal de celebração é exibido com esse valor (permite simular). */
  const [showCelebrationStreak, setShowCelebrationStreak] = useState<number | null>(null);
  const [showHydrationModal, setShowHydrationModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => getTodayISO());
  const [weekMealStatus, setWeekMealStatus] = useState<Record<string, "all" | "one_missed">>({});
  const hasShownCelebrationThisSession = useRef(false);

  const user = useUserStore((s) => s.user);
  const {
    logs,
    totals,
    streak,
    isLoading,
    loadForDate,
    confirmMeal,
  } = useNutritionStore();
  
  const weeklyPlanStore = useWeeklyPlanStore();
  const plannedMeals = weeklyPlanStore.getPlansForDate(selectedCalendarDate);

  useEffect(() => {
    if (
      !isLoading &&
      streak >= STREAK_CELEBRATION_THRESHOLD &&
      !hasShownCelebrationThisSession.current
    ) {
      hasShownCelebrationThisSession.current = true;
      setShowCelebrationStreak(streak);
    }
  }, [streak, isLoading]);

  const today = getTodayISO();
  const weekStart = useMemo(
    () => startOfWeek(new Date(selectedCalendarDate + "T12:00:00"), { weekStartsOn: 1 }),
    [selectedCalendarDate]
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const monthYearLabel = useMemo(() => {
    const str = format(weekStart, "MMMM yyyy", { locale: ptBR });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [weekStart]);

  const weekStartISO = format(weekStart, "yyyy-MM-dd");
  const weekEndISO = format(weekDays[6], "yyyy-MM-dd");

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadForDate(user.id, today);
      }
    }, [user?.id, today, loadForDate])
  );

  useEffect(() => {
    if (!user?.id) return;
    const mealsPerDayCount = user.meals_per_day ?? 4;
    const expectedMealTypes = getMealTypesForDisplay(mealsPerDayCount);
    const expectedCount = expectedMealTypes.length;

    let cancelled = false;
    (async () => {
      const logs = await fetchFoodLogsForDateRange(user.id, weekStartISO, weekEndISO);
      if (cancelled) return;
      const byDate = new Map<string, FoodLogEntry[]>();
      for (const log of logs) {
        const list = byDate.get(log.date) ?? [];
        list.push(log);
        byDate.set(log.date, list);
      }
      const status: Record<string, "all" | "one_missed"> = {};
      for (const d of weekDays) {
        const iso = d.toISOString().slice(0, 10);
        const dayLogs = byDate.get(iso) ?? [];
        const confirmedMeals = new Set<MealType>();
        for (const log of dayLogs) {
          if (log.confirmed) confirmedMeals.add(log.meal_type);
        }
        const n = confirmedMeals.size;
        if (n === expectedCount) status[iso] = "all";
        else if (n === expectedCount - 1) status[iso] = "one_missed";
      }
      setWeekMealStatus(status);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.meals_per_day, weekStartISO, weekEndISO, weekDays]);

  const userName = user?.name?.trim() || "Usuário";
  const kcalGoal = user?.daily_kcal ?? 2000;
  const kcalConsumed = totals.kcal;
  const kcalPct = kcalGoal > 0 ? Math.min(100, Math.round((kcalConsumed / kcalGoal) * 100)) : 0;

  const macroGoals = useMemo(
    () => [
      { label: "Proteína", value: Math.round(totals.protein_g), goal: user?.protein_g ?? 120, color: Colors.protein },
      { label: "Carbos", value: Math.round(totals.carbo_g), goal: user?.carbo_g ?? 250, color: Colors.carbo },
      { label: "Gordura", value: Math.round(totals.fat_g), goal: user?.fat_g ?? 65, color: Colors.fat },
    ],
    [totals, user]
  );

  const mealsPerDay = user?.meals_per_day ?? 4;
  const mealTypesToShow = getMealTypesForDisplay(mealsPerDay);

  const clampPct = useCallback((value: number) => {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(999, Math.round(value)));
  }, []);

  const mealsForDisplay = useMemo(() => {
    const proteinGoalPerMeal = (user?.protein_g ?? 120) / Math.max(1, mealsPerDay);
    const carboGoalPerMeal = (user?.carbo_g ?? 250) / Math.max(1, mealsPerDay);
    const fatGoalPerMeal = (user?.fat_g ?? 65) / Math.max(1, mealsPerDay);

    return mealTypesToShow.map((key) => {
      const mealLogs = logs.filter((l) => l.meal_type === key);
      const mealKcal = mealLogs.reduce((s, l) => s + (l.kcal ?? 0), 0);
      const mealProtein = mealLogs.reduce((s, l) => s + (l.protein_g ?? 0), 0);
      const mealCarbo = mealLogs.reduce((s, l) => s + (l.carbo_g ?? 0), 0);
      const mealFat = mealLogs.reduce((s, l) => s + (l.fat_g ?? 0), 0);

      const allConfirmed = mealLogs.length > 0 && mealLogs.every((l) => l.confirmed);
      const hasLogs = mealLogs.length > 0;
      const status = allConfirmed ? "done" : hasLogs ? "open" : "pending";
      return {
        key,
        title: MEAL_TYPE_LABELS[key],
        time: MEAL_TIMES[key],
        kcal: Math.round(mealKcal),
        macros: {
          protein_g: Math.round(mealProtein),
          carbo_g: Math.round(mealCarbo),
          fat_g: Math.round(mealFat),
        },
        macroPct: {
          protein: clampPct(proteinGoalPerMeal > 0 ? (mealProtein / proteinGoalPerMeal) * 100 : 0),
          carbo: clampPct(carboGoalPerMeal > 0 ? (mealCarbo / carboGoalPerMeal) * 100 : 0),
          fat: clampPct(fatGoalPerMeal > 0 ? (mealFat / fatGoalPerMeal) * 100 : 0),
        },
        status: status as "done" | "open" | "pending",
        items: mealLogs.map((l) => ({
          id: l.id,
          name: l.food_name,
          kcal: l.kcal,
          protein: l.protein_g,
          carbo: l.carbo_g,
          fat: l.fat_g,
          qty: `${l.quantity_g}g`,
        })),
      };
    });
  }, [logs, mealTypesToShow, user?.protein_g, user?.carbo_g, user?.fat_g, mealsPerDay, clampPct]);

  const todayForWater = getTodayISO();
  const waterTotalMl = useHydrationStore((s) => s.getTotalMlForDate(todayForWater));
  const waterGoal = useHydrationStore((s) => s.waterGoalL);
  const waterLiters = waterTotalMl / 1000;
  const waterPct =
    waterGoal > 0 ? Math.min(100, Math.round((waterLiters / waterGoal) * 100)) : 0;

  const activityMinutes = useActivityStore((s) => s.getTotalMinutesForDate(todayForWater));
  const activityGoalMinutes = useActivityStore((s) => s.goalMinutesPerDay);
  const activityPct =
    activityGoalMinutes > 0
      ? Math.min(100, Math.round((activityMinutes / activityGoalMinutes) * 100))
      : 0;

  const formatIntBR = useCallback((n: number) => {
    try {
      return Math.round(n).toLocaleString("pt-BR");
    } catch {
      return String(Math.round(n));
    }
  }, []);

  const handleConfirmMeal = async (mealKey: string) => {
    if (!user?.id) return;
    const ok = await confirmMeal(user.id, mealKey as MealType);
    if (ok) setExpandedMeal(null);
  };

  const handleSemanaPress = () => {
    router.push("/plano-semanal");
  };

  if (isLoading && logs.length === 0) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: C.background }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.greenDark} />
          <Text style={[styles.loadingText, { color: C.textSecondary }]}>Carregando seu dia…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.greetingLabel}>{getGreeting()},</Text>
              <Text style={styles.greetingName}>{userName}</Text>
            </View>
          </View>
          <Pressable style={styles.notifButton}>
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
            <View style={styles.notifDot} />
          </Pressable>
        </View>

        {/* Streak — em desenvolvimento: segurar para simular o card de 5 dias */}
        <Pressable
          style={styles.streakPill}
          onLongPress={() => {
            if (__DEV__) {
              setShowCelebrationStreak(STREAK_CELEBRATION_THRESHOLD);
            }
          }}
          delayLongPress={600}
        >
          <Ionicons name="flame" size={16} color={Colors.greenDark} />
          <Text style={styles.streakText}>
            {streak} {streak === 1 ? "dia" : "dias"} em sequência
          </Text>
        </Pressable>

        <StreakCelebrationModal
          visible={showCelebrationStreak !== null}
          streak={showCelebrationStreak ?? 0}
          onClose={() => setShowCelebrationStreak(null)}
        />

        <HydrationModal
          visible={showHydrationModal}
          onClose={() => setShowHydrationModal(false)}
          date={todayForWater}
        />

        <ActivityModal
          visible={showActivityModal}
          onClose={() => setShowActivityModal(false)}
          date={todayForWater}
        />

        {/* Card calorias */}
        <View style={styles.card}>
          <View style={styles.kcalRow}>
            <View>
              <Text style={styles.kcalValue}>
                {kcalConsumed}{" "}
                <Text style={styles.kcalUnit}>kcal consumidas</Text>
              </Text>
              <Text style={styles.kcalGoalText}>Meta diária: {kcalGoal} kcal</Text>
            </View>
            <Text style={styles.kcalPct}>{kcalPct}%</Text>
          </View>

          {/* Barra de progresso */}
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={GradientColors.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${kcalPct}%` as any }]}
            />
          </View>

          {/* Macros */}
          <View style={styles.macroRow}>
            {macroGoals.map((m) => {
              const pct = m.goal > 0 ? Math.min(100, Math.round((m.value / m.goal) * 100)) : 0;
              return (
                <View key={m.label} style={styles.macroItem}>
                  <Text style={styles.macroLabel}>{m.label}</Text>
                  <Text style={styles.macroValue}>
                    {m.value}g{" "}
                    <Text style={styles.macroGoal}>/ {m.goal}g</Text>
                  </Text>
                  <View style={styles.macroTrack}>
                    <View
                      style={[
                        styles.macroFill,
                        { width: `${pct}%` as any, backgroundColor: m.color },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Mini cards — Atividade + Hidratação */}
        <View style={styles.miniCardRow}>
          <Pressable
            style={[styles.miniCard, { flex: 1 }]}
            onPress={() => setShowActivityModal(true)}
          >
            <View style={styles.miniCardHeader}>
              <View style={[styles.miniCardIcon, { backgroundColor: Colors.carboBg }]}>
                <Ionicons name="flame" size={20} color={Colors.carbo} />
              </View>
              <Pressable
                style={styles.miniAddButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setShowActivityModal(true);
                }}
              >
                <Ionicons name="add" size={14} color="#FFF" />
              </Pressable>
            </View>
            <View style={styles.activityTopRow}>
              <Text style={styles.miniCardLabel}>Atividade</Text>
              <Text style={styles.activityMetaText}>
                {formatIntBR(activityMinutes)} de {formatIntBR(activityGoalMinutes)} min
              </Text>
            </View>
            <View style={styles.activityProgressTrack}>
              <LinearGradient
                colors={GradientColors.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.activityProgressFill, { width: `${activityPct}%` as any }]}
              />
            </View>
          </Pressable>

          <Pressable
            style={[styles.miniCard, { flex: 1 }]}
            onPress={() => setShowHydrationModal(true)}
          >
            <View style={styles.miniCardHeader}>
              <View style={[styles.miniCardIcon, { backgroundColor: Colors.blueBg }]}>
                <Ionicons name="water-outline" size={20} color={Colors.blue} />
              </View>
              <Pressable
                style={styles.miniAddButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setShowHydrationModal(true);
                }}
              >
                <Ionicons name="add" size={14} color="#FFF" />
              </Pressable>
            </View>
            <View style={styles.waterTopRow}>
              <Text style={styles.miniCardLabel}>Hidratação</Text>
              <Text style={styles.waterMetaText}>
                {waterLiters.toFixed(1)} / {waterGoal.toFixed(1)} L
              </Text>
            </View>
            <View style={styles.waterProgressTrack}>
              <LinearGradient
                colors={[Colors.blue, Colors.blueDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.waterProgressFill, { width: `${waterPct}%` as any }]}
              />
            </View>
          </Pressable>
        </View>

        {/* Calendário semanal */}
        <View style={styles.calendarSection}>
          <Text style={styles.calendarMonthTitle}>{monthYearLabel}</Text>
          <View style={styles.calendarWeekRow}>
            {weekDays.map((d) => {
              const iso = d.toISOString().slice(0, 10);
              const isSelected = iso === selectedCalendarDate;
              const dayAbbr = format(d, "EEE", { locale: ptBR }).toUpperCase().slice(0, 3);
              const dayNum = format(d, "d");
              const mealStatus = weekMealStatus[iso];
              return (
                <Pressable
                  key={iso}
                  style={[styles.calendarDayCard, isSelected && styles.calendarDayCardSelected]}
                  onPress={() => setSelectedCalendarDate(iso)}
                >
                  <View style={[styles.calendarDayTop, isSelected && styles.calendarDayTopSelected]}>
                    {mealStatus != null && (
                      <View
                        style={[
                          styles.calendarDayIndicator,
                          mealStatus === "all" && styles.calendarDayIndicatorGreen,
                          mealStatus === "one_missed" && styles.calendarDayIndicatorRed,
                        ]}
                      />
                    )}
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

        {/* Refeições */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Refeições</Text>
            <Text style={styles.sectionSubtitle}>
              Você costuma fazer {mealsPerDay}{" "}
              {mealsPerDay === 1 ? "refeição" : "refeições"} por dia
            </Text>
          </View>
          <View style={styles.mealToggle}>
              <Pressable
                style={({ pressed }) => [
                  styles.mealToggleBtn,
                  styles.mealToggleBtnActive,
                  pressed && styles.mealToggleBtnHover,
                ]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
              >
                <Text style={styles.mealToggleTextActive}>Hoje</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.mealToggleBtn,
                  pressed && styles.mealToggleBtnHover,
                ]}
                onPress={handleSemanaPress}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
              >
                <Text style={styles.mealToggleTextInactive}>Semana</Text>
              </Pressable>
            </View>
        </View>

        <View style={styles.mealsColumn}>
          {plannedMeals.map((meal) => {
            const isExpanded = expandedMeal === meal.type;
            const isComplete = weeklyPlanStore.isMealComplete(selectedCalendarDate, meal.type);
            const totalKcal = meal.foods.reduce((sum, f) => sum + f.kcal, 0);

            return (
              <View key={meal.type} style={styles.mealCard}>
                <Pressable
                  style={({ pressed }) => [
                    styles.mealCardHeader,
                    pressed && styles.pressed,
                  ]}
                  onPress={() =>
                    setExpandedMeal((prev) => (prev === meal.type ? null : meal.type))
                  }
                >
                  <View style={styles.mealHeaderLeft}>
                    <View style={styles.mealImageCircle}>
                      <Text style={styles.mealEmoji}>
                        {meal.type === "cafe" ? "☕" : meal.type === "almoco" ? "🍽️" : meal.type === "lanche" ? "🥤" : "🌙"}
                      </Text>
                      {isComplete && (
                        <View style={styles.mealCheckBadge}>
                          <Ionicons name="checkmark" size={14} color={Colors.surface} />
                        </View>
                      )}
                    </View>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealTitle}>{MEAL_LABELS[meal.type]}</Text>
                      <Text style={styles.mealTimeSub}>
                        {meal.time} • {meal.kcalRange}
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={Colors.textSecondary}
                  />
                </Pressable>

                {isExpanded && (
                  <View style={styles.mealItems}>
                    {meal.foods.map((food) => (
                      <View key={food.id} style={styles.plannedFoodItem}>
                        <Pressable
                          style={[
                            styles.foodCheckbox,
                            food.checked && styles.foodCheckboxChecked,
                          ]}
                          onPress={() => weeklyPlanStore.toggleFoodCheck(selectedCalendarDate, meal.type, food.id)}
                        >
                          {food.checked && (
                            <Ionicons name="checkmark" size={16} color={Colors.surface} />
                          )}
                        </Pressable>

                        <View style={styles.plannedFoodContent}>
                          <View style={styles.plannedFoodTop}>
                            <Text
                              style={[
                                styles.plannedFoodName,
                                food.checked && styles.plannedFoodNameChecked,
                              ]}
                            >
                              {food.name}
                            </Text>
                            <Text style={styles.plannedFoodKcal}>{food.kcal} kcal</Text>
                          </View>

                          <View style={styles.plannedFoodMacros}>
                            <Text style={styles.plannedMacroText}>
                              <Text style={styles.plannedMacroLabel}>P: </Text>
                              <Text style={styles.plannedMacroProtein}>{food.protein_g}g</Text>
                            </Text>
                            <Text style={styles.plannedMacroText}>
                              <Text style={styles.plannedMacroLabel}>C: </Text>
                              <Text style={styles.plannedMacroCarbo}>{food.carbo_g}g</Text>
                            </Text>
                            <Text style={styles.plannedMacroText}>
                              <Text style={styles.plannedMacroLabel}>G: </Text>
                              <Text style={styles.plannedMacroFat}>{food.fat_g}g</Text>
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.greenDark,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: Typography.h2.fontFamily,
    fontSize: 14,
    color: "#FFF",
  },
  greetingLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  greetingName: {
    ...Typography.h4,
    color: Colors.text,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "#FFF8E8",
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    alignSelf: "flex-start",
    marginBottom: Spacing.lg,
  },
  streakText: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.greenDark,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  kcalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: Spacing.sm,
  },
  kcalValue: {
    fontFamily: Typography.h2.fontFamily,
    fontSize: 22,
    color: Colors.text,
  },
  kcalUnit: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  kcalGoalText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  kcalPct: {
    fontFamily: Typography.h2.fontFamily,
    fontSize: 16,
    color: Colors.greenDark,
  },
  progressTrack: {
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: Radius.pill,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  progressFill: {
    height: "100%",
    borderRadius: Radius.pill,
  },
  macroRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  macroItem: {
    flex: 1,
  },
  macroLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  macroValue: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  macroGoal: {
    fontWeight: "400",
    color: Colors.textSecondary,
    fontSize: 11,
  },
  macroTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.pill,
    overflow: "hidden",
  },
  macroFill: {
    height: "100%",
    borderRadius: Radius.pill,
  },
  miniCardRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  miniCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  miniCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  miniCardIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  miniAddButton: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    backgroundColor: Colors.greenDark,
    alignItems: "center",
    justifyContent: "center",
  },
  waterButtons: {
    flexDirection: "row",
    gap: 4,
  },
  waterMinus: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  miniCardLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  miniCardValue: {
    fontFamily: Typography.h2.fontFamily,
    fontSize: 18,
    color: Colors.text,
  },
  miniCardUnit: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: Typography.body.fontFamily,
  },
  activityTopRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 2,
  },
  activityMetaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: "700",
  },
  activityProgressTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: Radius.pill,
    overflow: "hidden",
    marginTop: Spacing.sm,
  },
  activityProgressFill: {
    height: "100%",
    borderRadius: Radius.pill,
  },
  waterTopRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 2,
  },
  waterMetaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: "700",
  },
  waterProgressTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: Radius.pill,
    overflow: "hidden",
    marginTop: Spacing.sm,
  },
  waterProgressFill: {
    height: "100%",
    borderRadius: Radius.pill,
  },
  calendarSection: {
    marginBottom: Spacing.lg,
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
    borderColor: Colors.green,
    backgroundColor: Colors.surface,
    overflow: "hidden",
  },
  calendarDayCardSelected: {
    borderColor: Colors.greenDark,
  },
  calendarDayTop: {
    backgroundColor: Colors.surface,
    paddingVertical: 6,
    paddingTop: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayTopSelected: {
    backgroundColor: Colors.greenDark,
  },
  calendarDayIndicator: {
    width: "100%",
    height: 3,
    borderRadius: 2,
    marginBottom: 4,
  },
  calendarDayIndicatorGreen: {
    backgroundColor: Colors.greenLight,
  },
  calendarDayIndicatorRed: {
    backgroundColor: Colors.errorBg,
  },
  calendarDayAbbr: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textMuted,
  },
  calendarDayAbbrSelected: {
    color: Colors.surface,
  },
  calendarDayBottom: {
    backgroundColor: Colors.surface,
    paddingVertical: 6,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  mealToggle: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  mealToggleBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  mealToggleBtnActive: {
    borderColor: Colors.green,
    backgroundColor: Colors.greenLight,
  },
  mealToggleBtnHover: {
    backgroundColor: Colors.greenLight,
    borderColor: Colors.green,
  },
  mealToggleTextActive: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.greenDark,
  },
  mealToggleTextInactive: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  mealsColumn: {
    gap: Spacing.sm,
  },
  mealCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealCardDone: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.green,
  },
  mealCardOpen: {
    borderColor: `${Colors.greenDark}20`,
  },
  mealCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealHeaderLeft: {
    flex: 1,
    paddingRight: Spacing.lg,
  },
  mealTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  mealDoneIcon: {
    marginTop: 1,
  },
  mealTitle: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.text,
  },
  mealKcalSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  mealPlusButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  mealPlusGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  mealChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  mealChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  mealChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mealChipText: {
    ...Typography.caption,
    fontWeight: "700",
  },
  mealImageCircle: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.greenLight,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  mealEmoji: {
    fontSize: 28,
  },
  mealCheckBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.greenDark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  mealInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  mealTimeSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  mealItems: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  plannedFoodItem: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  foodCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  foodCheckboxChecked: {
    backgroundColor: Colors.greenDark,
    borderColor: Colors.greenDark,
  },
  plannedFoodContent: {
    flex: 1,
    gap: 6,
  },
  plannedFoodTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  plannedFoodName: {
    ...Typography.body,
    fontWeight: "400",
    color: Colors.text,
    flex: 1,
  },
  plannedFoodNameChecked: {
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
  },
  plannedFoodKcal: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "400",
  },
  plannedFoodMacros: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  plannedMacroText: {
    ...Typography.caption,
    fontSize: 11,
  },
  plannedMacroLabel: {
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  plannedMacroProtein: {
    color: Colors.protein,
    fontWeight: "600",
  },
  plannedMacroCarbo: {
    color: Colors.carbo,
    fontWeight: "600",
  },
  plannedMacroFat: {
    color: Colors.fat,
    fontWeight: "600",
  },
  mealEmptyText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  mealItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  mealItemIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  mealItemName: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.text,
  },
  mealItemKcal: {
    fontWeight: "400",
    color: Colors.textSecondary,
  },
  mealItemMacros: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 2,
  },
  mealItemMacroText: {
    fontSize: 10,
    fontFamily: Typography.body.fontFamily,
    fontWeight: "700",
  },
  mealItemQty: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  confirmButton: {
    borderRadius: Radius.sm,
    overflow: "hidden",
    marginTop: Spacing.xs,
  },
  confirmButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    ...Typography.label,
    color: Colors.surface,
    textTransform: "uppercase",
  },
});
