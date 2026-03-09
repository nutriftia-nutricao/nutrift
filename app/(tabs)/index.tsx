import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { addDays, format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";
import { useActivityStore } from "../../stores/useActivityStore";
import { useHydrationStore } from "../../stores/useHydrationStore";
import { useNutritionStore } from "../../stores/useNutritionStore";
import { useUserStore } from "../../stores/useUserStore";
import { useWeeklyPlanStore } from "../../stores/useWeeklyPlanStore";
import {
  MEAL_TYPE_LABELS as MEAL_LABELS,
  getMealTypesForDisplay,
  type MealType,
} from "../../types/nutrition";
import { LinearGradient } from "expo-linear-gradient";
import { getTodayISO } from "../../utils/date";
import { ProgressBar } from "../../components/ui";
import type { WeeklyPlanStatus } from "../../stores/useWeeklyPlanStore";

/** Valores fictícios para visualizar a barra e cards quando não há dados reais (~67% da meta) */
const DEMO_VALUES = {
  kcal: 1420,
  kcalGoal: 2100,
  protein_g: 98,
  protein_goal: 160,
  carbo_g: 145,
  carbo_goal: 240,
  fat_g: 44,
  fat_goal: 65,
  activityMin: 45,
  activityGoal: 60,
  waterL: 2.1,
  waterGoal: 3.4,
};

const MEAL_TIMES: Record<MealType, string> = {
  cafe: "07:30",
  lanche_manha: "10:00",
  almoco: "12:00",
  lanche: "16:00",
  jantar: "19:30",
  pre_treino: "06:30",
  pos_treino: "21:30",
  extra: "—",
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/** Data formatada como no Stitch: "Sábado, 7 de março" */
function getFormattedDate(): string {
  const str = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const BAR_HEIGHT = 30;
const BAR_WIDTH = 6;
const BAR_GAP = 3;

/** Barra de progresso com várias barrinhas verticais (mesma altura e largura) até o final da linha */
function VerticalBarsProgress({ progress }: { progress: number }) {
  const target = Math.min(1, Math.max(0, progress));
  const animValue = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  const barCount = containerWidth > 0
    ? Math.max(1, Math.floor((containerWidth + BAR_GAP) / (BAR_WIDTH + BAR_GAP)))
    : 42;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: target,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [target]);

  return (
    <View
      style={verticalBarsStyles.wrap}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {Array.from({ length: barCount }).map((_, i) => {
        const segmentStart = i / barCount;
        const segmentEnd = (i + 1) / barCount;
        const heightAnim = animValue.interpolate({
          inputRange: [segmentStart, segmentEnd],
          outputRange: [0, BAR_HEIGHT],
          extrapolate: "clamp",
        });
        return (
          <View key={i} style={verticalBarsStyles.bar}>
            <View style={[verticalBarsStyles.barBg, { height: BAR_HEIGHT }]} />
            <Animated.View
              style={[
                verticalBarsStyles.barFill,
                { height: heightAnim },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const verticalBarsStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: BAR_GAP,
    height: BAR_HEIGHT,
    marginVertical: Spacing.md,
    width: "100%",
    alignSelf: "stretch",
    color: "rgba(44, 44, 44, 1)",
  },
  bar: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: 2,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barBg: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#3A3A3A",
    borderRadius: 2,
  },
  barFill: {
    backgroundColor: Colors.primary,
    borderRadius: 2,
    width: "100%",
  },
});

/** Barra de macro com animação e efeito de sombra na parte não preenchida (até o fim do card) */
function AnimatedMacroFill({ progress, color }: { progress: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(1, Math.max(0, progress)),
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress]);
  return (
    <View style={styles.macroTrackWrapper}>
      <LinearGradient
        colors={["#404040", "#383838", "#2A2A2A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.macroFill,
          {
            backgroundColor: color,
            width: anim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </View>
  );
}

/** Wrapper que anima entrada do card (fade + slide) com delay opcional */
function AnimatedCard({
  children,
  style,
  delay = 0,
}: {
  children: React.ReactNode;
  style?: any;
  delay?: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Emojis por tipo de refeição (estilo Stitch) */
const MEAL_EMOJI: Record<MealType, string> = {
  cafe: "☕",
  lanche_manha: "🍎",
  almoco: "🍽️",
  lanche: "🥪",
  jantar: "🌙",
  pre_treino: "💪",
  pos_treino: "🥤",
  extra: "🍴",
};

const STREAK_CELEBRATION_THRESHOLD = 5;

export default function HomeScreen() {
  const { C } = useTheme();
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  /** Quando não é null, o modal de celebração é exibido com esse valor (permite simular). */
  const [showCelebrationStreak, setShowCelebrationStreak] = useState<number | null>(null);
  const [showHydrationModal, setShowHydrationModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => getTodayISO());
  const hasShownCelebrationThisSession = useRef(false);

  const user = useUserStore((s) => s.user);
  const today = getTodayISO();
  const {
    logs,
    streak,
    isLoading,
    loadForDate,
  } = useNutritionStore();
  
  const weeklyPlanStore = useWeeklyPlanStore();
  /** Refeições do dia selecionado no calendário (lista + consumo + indicadores). */
  const plannedMeals = weeklyPlanStore.getPlansForDate(selectedCalendarDate);
  const weeklyPlanStatus: WeeklyPlanStatus = weeklyPlanStore.status;

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

  const weekStart = useMemo(
    () => startOfWeek(new Date(selectedCalendarDate + "T12:00:00"), { weekStartsOn: 1 }),
    [selectedCalendarDate]
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const weekStartISO = format(weekStart, "yyyy-MM-dd");

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadForDate(user.id, today);
      }
    }, [user?.id, today, loadForDate])
  );

  useEffect(() => {
    if (!user?.id) return;
    weeklyPlanStore.loadWeeklyPlan(user.id, weekStartISO);
  }, [user?.id, weekStartISO]);

  // Sincroniza meta de hidratação do plano do usuário para o store
  useEffect(() => {
    if (user?.hydration_ml && user.hydration_ml > 0) {
      useHydrationStore.getState().setWaterGoalL(user.hydration_ml / 1000);
    }
  }, [user?.hydration_ml]);

  const userName = user?.name?.trim() || "Usuário";
  const firstName = userName.split(" ")[0] || userName;
  const kcalGoal = user?.daily_kcal ?? 2000;

  /** Totais do dia selecionado: refeições do plano cujos alimentos foram marcados como consumidos. */
  const plannedCheckedTotals = useMemo(() => {
    let kcal = 0;
    let protein_g = 0;
    let carbo_g = 0;
    let fat_g = 0;
    for (const meal of plannedMeals) {
      for (const food of meal.foods) {
        if (food.checked) {
          kcal += food.kcal;
          protein_g += food.protein_g;
          carbo_g += food.carbo_g;
          fat_g += food.fat_g;
        }
      }
    }
    return { kcal, protein_g, carbo_g, fat_g };
  }, [plannedMeals]);

  /** Consumo diário = só as refeições de hoje (itens marcados). Usa valores fictícios quando zerado para visualização. Meta sempre vem do perfil do usuário. */
  const useDemoConsumption = plannedCheckedTotals.kcal === 0;
  const kcalConsumed = useDemoConsumption ? DEMO_VALUES.kcal : plannedCheckedTotals.kcal;
  const displayKcalGoal = kcalGoal;
  const kcalPct =
    displayKcalGoal > 0
      ? Math.min(100, Math.round((kcalConsumed / displayKcalGoal) * 100))
      : 0;

  const macroGoals = useMemo(() => {
    const proteinGoal = user?.protein_g ?? 120;
    const carboGoal = user?.carbo_g ?? 250;
    const fatGoal = user?.fat_g ?? 65;
    if (useDemoConsumption) {
      return [
        { label: "Proteína", value: DEMO_VALUES.protein_g, goal: proteinGoal, color: Colors.protein },
        { label: "Carbos", value: DEMO_VALUES.carbo_g, goal: carboGoal, color: Colors.carbo },
        { label: "Gordura", value: DEMO_VALUES.fat_g, goal: fatGoal, color: Colors.fat },
      ];
    }
    return [
      { label: "Proteína", value: Math.round(plannedCheckedTotals.protein_g), goal: proteinGoal, color: Colors.protein },
      { label: "Carbos", value: Math.round(plannedCheckedTotals.carbo_g), goal: carboGoal, color: Colors.carbo },
      { label: "Gordura", value: Math.round(plannedCheckedTotals.fat_g), goal: fatGoal, color: Colors.fat },
    ];
  }, [plannedCheckedTotals, user, useDemoConsumption]);

  const mealsPerDay = user?.meals_per_day ?? 4;
  const mealTypesToShow = getMealTypesForDisplay(mealsPerDay);

  /** Título da seção de refeições: "Refeições de hoje" ou "Refeições de qua., 5 mar" conforme o dia selecionado. */
  const mealsSectionTitle = useMemo(() => {
    if (selectedCalendarDate === today) return "Refeições de hoje";
    const d = new Date(selectedCalendarDate + "T12:00:00");
    const dayName = format(d, "EEE", { locale: ptBR }).replace(/\.$/, "");
    const dayMonth = format(d, "d MMM", { locale: ptBR });
    return `Refeições de ${dayName}, ${dayMonth}`;
  }, [selectedCalendarDate, today]);

  /** Título do card de consumo: "Consumo diário" (hoje) ou "Consumo do dia — qua., 5 mar". */
  const consumptionCardTitle = useMemo(() => {
    if (selectedCalendarDate === today) return "Consumo diário";
    const d = new Date(selectedCalendarDate + "T12:00:00");
    const dayName = format(d, "EEE", { locale: ptBR }).replace(/\.$/, "");
    const dayMonth = format(d, "d MMM", { locale: ptBR });
    return `Consumo do dia — ${dayName}, ${dayMonth}`;
  }, [selectedCalendarDate, today]);

  const clampPct = useCallback((value: number) => {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(999, Math.round(value)));
  }, []);

  const handleChangeWeek = useCallback(
    (direction: "prev" | "next") => {
      const current = new Date(selectedCalendarDate + "T12:00:00");
      const delta = direction === "prev" ? -7 : 7;
      const nextDate = addDays(current, delta);
      const iso = format(nextDate, "yyyy-MM-dd");
      setSelectedCalendarDate(iso);
    },
    [selectedCalendarDate]
  );

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
        title: MEAL_LABELS[key],
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
  const useDemoWater = waterLiters === 0;
  const displayWaterL = useDemoWater ? DEMO_VALUES.waterL : waterLiters;
  const displayWaterGoal = useDemoWater ? DEMO_VALUES.waterGoal : waterGoal;
  const waterPct =
    displayWaterGoal > 0 ? Math.min(100, Math.round((displayWaterL / displayWaterGoal) * 100)) : 0;

  const activityMinutes = useActivityStore((s) => s.getTotalMinutesForDate(todayForWater));
  const activityGoalMinutes = useActivityStore((s) => s.goalMinutesPerDay);
  const useDemoActivity = activityMinutes === 0;
  const displayActivityMin = useDemoActivity ? DEMO_VALUES.activityMin : activityMinutes;
  const displayActivityGoal = useDemoActivity ? DEMO_VALUES.activityGoal : activityGoalMinutes;
  const activityPct =
    displayActivityGoal > 0
      ? Math.min(100, Math.round((displayActivityMin / displayActivityGoal) * 100))
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
        {/* Header — estilo Stitch: Bom dia, Nome 👋 + data */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {firstName.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.greetingName}>
                {getGreeting()}, {firstName} 👋
              </Text>
              <Text style={styles.greetingLabel}>{getFormattedDate()}</Text>
            </View>
          </View>
          <Pressable style={styles.notifButton}>
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
            <View style={styles.notifDot} />
          </Pressable>
        </View>

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

        {/* Card consumo diário — estilo Stitch */}
        <AnimatedCard style={styles.card}>
          <View style={styles.consumptionTitleRow}>
            <View style={styles.consumptionTitleLeft}>
              <Ionicons name="flash" size={18} color="#FACC15" style={styles.consumptionTitleIcon} />
              <Text style={styles.consumptionTitle}>{consumptionCardTitle}</Text>
            </View>
            {streak > 0 && (
              <Pressable
                style={styles.streakBadge}
                onLongPress={() => {
                  if (__DEV__) setShowCelebrationStreak(STREAK_CELEBRATION_THRESHOLD);
                }}
                delayLongPress={600}
              >
                <Ionicons name="flame" size={14} color={Colors.carbo} />
                <Text style={styles.streakBadgeText}>
                  {streak} {streak === 1 ? "dia" : "dias"}
                </Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.kcalBig}>
            {formatIntBR(kcalConsumed)}
            <Text style={styles.kcalBigUnit}> kcal</Text>
          </Text>
          <Text style={styles.kcalMeta}>Meta: {formatIntBR(displayKcalGoal)} kcal</Text>

          <VerticalBarsProgress progress={kcalPct / 100} />

          <View style={styles.macroRow}>
            {[
              { ...macroGoals[0], labelCap: "PROTEÍNA" },
              { ...macroGoals[1], labelCap: "CARBOS" },
              { ...macroGoals[2], labelCap: "GORDURA" },
            ].map((m, index) => {
              const pct = m.goal > 0 ? Math.min(100, Math.round((m.value / m.goal) * 100)) : 0;
              return (
                <React.Fragment key={m.label}>
                  {index > 0 && <View style={styles.macroDivider} />}
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>{m.labelCap}</Text>
                    <Text style={styles.macroValue}>
                      {m.value}g <Text style={styles.macroGoal}>/ {m.goal}g</Text>
                    </Text>
                    <AnimatedMacroFill progress={pct / 100} color={m.color} />
                  </View>
                </React.Fragment>
              );
            })}
          </View>

          <View style={styles.consumptionFooter}>
            <View style={styles.gastasRow}>
              <Ionicons name="flame" size={14} color={Colors.carbo} />
              <Text style={styles.gastasTextWhite}>Gastas: 320 kcal</Text>
            </View>
            <Text style={styles.disponivelText}>
              Disponível: +{formatIntBR(Math.max(0, displayKcalGoal - kcalConsumed))} kcal
            </Text>
          </View>
        </AnimatedCard>

        {/* Mini cards — ATIVIDADE + HIDRATAÇÃO (estilo Stitch) */}
        <AnimatedCard style={styles.miniCardRow} delay={80}>
          <Pressable
            style={[styles.miniCard, { flex: 1 }]}
            onPress={() => setShowActivityModal(true)}
          >
            <View style={styles.miniCardHeader}>
              <View style={styles.miniCardTitleRow}>
                <Ionicons name="bicycle-outline" size={18} color={Colors.text} />
                <Text style={styles.miniCardLabelCaps}>ATIVIDADE</Text>
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
            <Text style={styles.miniCardValue}>
              {formatIntBR(displayActivityMin)} / {formatIntBR(displayActivityGoal)} min
            </Text>
            <ProgressBar progress={activityPct / 100} color={Colors.carbo} />
          </Pressable>

          <Pressable
            style={[styles.miniCard, { flex: 1 }]}
            onPress={() => setShowHydrationModal(true)}
          >
            <View style={styles.miniCardHeader}>
              <View style={styles.miniCardTitleRow}>
                <Ionicons name="water-outline" size={18} color={Colors.text} />
                <Text style={styles.miniCardLabelCaps}>HIDRATAÇÃO</Text>
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
            <Text style={styles.miniCardValue}>
              {displayWaterL.toFixed(1).replace(".", ",")} / {displayWaterGoal.toFixed(1).replace(".", ",")} L
            </Text>
            <ProgressBar progress={waterPct / 100} color={Colors.blue} />
          </Pressable>
        </AnimatedCard>

        {/* Calendário semanal — estilo Stitch acima das refeições */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarRow}>
            <Pressable
              style={({ pressed }) => [
                styles.calendarArrow,
                pressed && styles.pressed,
              ]}
              onPress={() => handleChangeWeek("prev")}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={Colors.textSecondary}
              />
            </Pressable>

            <View style={styles.calendarWeekRow}>
              {weekDays.map((d) => {
                const iso = format(d, "yyyy-MM-dd");
                const isSelected = iso === selectedCalendarDate;
                const mealsForDate = weeklyPlanStore.getPlansForDate(iso);
                const hasPlan = mealsForDate.length > 0;
                const allMealsComplete =
                  hasPlan &&
                  mealsForDate.every(
                    (meal) =>
                      meal.foods.length > 0 &&
                      meal.foods.every((food) => food.checked)
                  );
                const hasAnyChecked =
                  hasPlan &&
                  mealsForDate.some((meal) =>
                    meal.foods.some((food) => food.checked)
                  );

                const status: "none" | "incomplete" | "complete" =
                  allMealsComplete
                    ? "complete"
                    : hasAnyChecked || hasPlan
                      ? "incomplete"
                      : "none";

                const dayNum = format(d, "d");
                const dayAbbr = format(d, "EEE", {
                  locale: ptBR,
                }).toUpperCase();

                return (
                  <Pressable
                    key={iso}
                    style={({ pressed }) => [
                      styles.calendarDayCard,
                      status === "complete" && styles.calendarDayCardComplete,
                      status === "incomplete" &&
                        styles.calendarDayCardIncomplete,
                      isSelected && styles.calendarDayCardSelected,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setSelectedCalendarDate(iso)}
                  >
                    <View style={styles.calendarDayTop}>
                      <Text style={styles.calendarDayNum}>{dayNum}</Text>
                    </View>
                    <View style={styles.calendarDayBottom}>
                      <Text style={styles.calendarDayAbbr}>{dayAbbr}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.calendarArrow,
                pressed && styles.pressed,
              ]}
              onPress={() => handleChangeWeek("next")}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={Colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        {/* Refeições de hoje — título apenas (estilo Stitch) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Refeições de hoje</Text>
        </View>

        <View style={styles.mealsColumn}>
          {weeklyPlanStatus === "loading" && plannedMeals.length === 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionSubtitle}>
                Carregando seu plano desta semana…
              </Text>
            </View>
          )}

          {weeklyPlanStatus === "loaded" && plannedMeals.length === 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionSubtitle}>
                Nenhum plano encontrado para esta semana. Gere seu plano no domingo à noite
                ou peça ajuda ao agente IA.
              </Text>
            </View>
          )}

          {plannedMeals.map((meal) => {
            const isExpanded = expandedMeal === meal.type;
            const isComplete = weeklyPlanStore.isMealComplete(selectedCalendarDate, meal.type);
            const totalKcal = meal.foods.reduce((sum, f) => sum + f.kcal, 0);
            const checkedKcal = meal.foods.reduce((sum, f) => sum + (f.checked ? f.kcal : 0), 0);
            const progressPct = totalKcal > 0 ? Math.min(100, (checkedKcal / totalKcal) * 100) : 0;
            const timeStr = meal.time || (MEAL_TIMES[meal.type as MealType] ?? "—");
            const kcalStr =
              totalKcal === 0
                ? "0 kcal"
                : Math.round(checkedKcal) === Math.round(totalKcal)
                  ? `${Math.round(checkedKcal)} kcal`
                  : `${Math.round(checkedKcal)}/${Math.round(totalKcal)} kcal`;

            return (
              <View
                key={meal.type}
                style={[styles.mealCard, isComplete && styles.mealCardDone]}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.mealCardHeader,
                    isExpanded && styles.mealCardExpanded,
                    pressed && styles.pressed,
                  ]}
                  onPress={() =>
                    setExpandedMeal((prev) => (prev === meal.type ? null : meal.type))
                  }
                >
                  <View style={styles.mealHeaderLeft}>
                    <Text style={styles.mealEmoji}>{MEAL_EMOJI[meal.type as MealType] ?? "🍴"}</Text>
                    <View style={styles.mealInfo}>
                      <View style={styles.mealTitleRow}>
                        <Text style={styles.mealTitle} numberOfLines={1}>
                          {MEAL_LABELS[meal.type as MealType] ?? "Refeição"}
                        </Text>
                        {isComplete && (
                          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} style={styles.mealDoneIcon} />
                        )}
                      </View>
                      <Text style={styles.mealTimeSub} numberOfLines={1}>
                        {timeStr} · {kcalStr}
                      </Text>
                      <ProgressBar progress={progressPct / 100} height="thin" />
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
                          style={[styles.foodCheckbox, food.checked && styles.foodCheckboxChecked]}
                          onPress={() =>
                            weeklyPlanStore.toggleFoodCheck(selectedCalendarDate, meal.type, food.id)
                          }
                        >
                          {food.checked && (
                            <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
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
                              {food.name} - {food.quantity_g}g
                            </Text>
                            <Text style={styles.plannedFoodKcal}>{food.kcal} kcal</Text>
                          </View>
                          {!food.checked && (
                            <Text style={styles.plannedFoodPcg}>
                              P{" "}
                              <Text style={styles.plannedMacroProtein}>{food.protein_g}g</Text> C{" "}
                              <Text style={styles.plannedMacroCarbo}>{food.carbo_g}g</Text> G{" "}
                              <Text style={styles.plannedMacroFat}>{food.fat_g}g</Text>
                            </Text>
                          )}
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
  pressed: {
    opacity: 0.7,
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
    borderRadius: 20,
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  consumptionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  consumptionTitleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  consumptionTitleIcon: {
    marginRight: 2,
  },
  consumptionTitle: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: "#1A3D1A",
  },
  streakBadgeText: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.text,
  },
  kcalBig: {
    ...Typography.h1,
    fontSize: 36,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  kcalBigUnit: {
    fontSize: 18,
    fontWeight: "400",
    color: Colors.textSecondary,
  },
  kcalMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  consumptionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  gastasRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gastasText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: "600",
  },
  gastasTextWhite: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: "600",
  },
  disponivelText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: "700",
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  macroDivider: {
    width: 1,
    backgroundColor: "#404040",
    marginHorizontal: Spacing.sm,
  },
  macroItem: {
    flex: 1,
    minWidth: 0,
  },
  macroLabel: {
    ...Typography.label,
    color: Colors.text,
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
  macroTrackWrapper: {
    width: "100%",
    height: 6,
    borderRadius: Radius.pill,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  macroFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
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
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
  },
  miniCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  miniCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  miniCardLabelCaps: {
    ...Typography.label,
    fontSize: 11,
    color: Colors.text,
  },
  miniCardValue: {
    ...Typography.h4,
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.sm,
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
  calendarSection: {
    marginBottom: Spacing.lg,
  },
  calendarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  calendarArrow: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarWeekRow: {
    flex: 1,
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
    borderColor: Colors.primary,
  },
  calendarDayCardComplete: {
    borderColor: Colors.success,
    backgroundColor: Colors.fatBg,
  },
  calendarDayCardIncomplete: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorBg,
  },
  calendarDayTop: {
    paddingTop: 6,
    paddingBottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayBottom: {
    paddingBottom: 6,
    paddingTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayNum: {
    ...Typography.h4,
    fontSize: 16,
    color: Colors.text,
  },
  calendarDayAbbr: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  mealCardDone: {
    opacity: 0.9,
  },
  mealCardExpanded: {
    borderColor: Colors.primary,
  },
  mealCardOpen: {
    borderColor: `${Colors.greenDark}20`,
  },
  mealCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 0,
  },
  mealHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
    minHeight: 0,
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
    fontSize: 14,
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
    color: Colors.text,
  },
  mealEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  mealImageWrapper: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    position: "relative",
  },
  mealImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  mealCheckBadge: {
    position: "absolute",
    bottom: -6,
    right: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.background,
  },
  mealInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 2,
    minWidth: 0,
  },
  mealProgressLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    fontSize: 11,
  },
  mealTimeSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
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
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
  plannedFoodPcg: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
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
    color: Colors.textSecondary,
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
  mealProgressTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: Radius.pill,
    overflow: "hidden",
    marginTop: 6,
  },
  mealProgressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },
});
