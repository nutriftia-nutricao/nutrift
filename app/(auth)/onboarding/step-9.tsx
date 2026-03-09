import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GradientButton } from "../../../components/ui";
import { Colors } from "../../../constants/colors";
import { Radius } from "../../../constants/radius";
import { Spacing } from "../../../constants/spacing";
import { Typography } from "../../../constants/typography";
import { getSession, signUp } from "../../../services/auth";
import { supabase } from "../../../services/supabase";
import { fetchUserProfile } from "../../../services/user";
import { useOnboardingStore } from "../../../stores/useOnboardingStore";
import { useHydrationStore } from "../../../stores/useHydrationStore";
import { useSignupStore } from "../../../stores/useSignupStore";
import { useUserStore } from "../../../stores/useUserStore";
import type { User } from "../../../types/user";
import { getBirthDateFromAge } from "../../../utils/date";
import { calcularNutricao } from "../../../utils/mifflin";

function getImcClassification(imc: number): string {
  if (imc < 18.5) return "Abaixo";
  if (imc < 25) return "Normal";
  if (imc < 30) return "Sobrepeso";
  return "Obesidade";
}

function formatDateBRCapitalized(date: Date): string {
  const s = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return s.replace(/\b\w/, (c) => c.toUpperCase());
}

export default function OnboardingStep9Screen() {
  const [loading, setLoading] = useState(false);

  const {
    name,
    sex,
    weight_kg,
    height_cm,
    age,
    body_fat_pct,
    target_weight,
    target_body_fat_pct,
    goal,
    weekly_pace,
    activity,
    workout_type,
    workout_time,
    diet_type,
    restrictions,
    meals_per_day,
    liked_foods,
  } = useOnboardingStore();

  const hasCredentials = useSignupStore((s) => s.hasCredentials);
  const email = useSignupStore((s) => s.email);
  const password = useSignupStore((s) => s.password);
  const clearCredentials = useSignupStore((s) => s.clearCredentials);

  const setUser = useUserStore((s) => s.setUser);

  const handleStart = async () => {
    if (!sex || !goal || !activity) {
      Alert.alert("Erro", "Dados do onboarding incompletos.");
      return;
    }

    const {
      data: { session },
    } = await getSession();
    const sessionUser = session?.user ?? null;
    const hasSessionUser = Boolean(sessionUser);
    const hasCreds = hasCredentials();

    // Nenhuma sessão e nenhuma credencial salva: usuário pulou o cadastro
    if (!hasSessionUser && !hasCreds) {
      Alert.alert(
        "Dados de login",
        "Para continuar, faça seu cadastro na tela anterior (e-mail e senha).",
        [{ text: "OK", onPress: () => router.replace("/(auth)/register") }]
      );
      return;
    }

    setLoading(true);
    try {
      let userId: string;
      let isExistingUser = hasSessionUser;

      if (hasSessionUser) {
        // Já existe usuário autenticado (e-mail/senha ou OAuth).
        userId = sessionUser!.id;
      } else {
        // Sem sessão ainda: cria conta agora usando e-mail/senha do register.
        const { userId: newUserId, error: signUpError } = await signUp(email, password);

        if (signUpError) {
          const msg =
            signUpError.message?.includes("already registered") ||
            signUpError.message?.includes("already exists") ||
            signUpError.message?.includes("already in use")
              ? "Este e-mail já está em uso. Tente entrar ou use outro e-mail."
              : signUpError.message ?? "Não foi possível criar a conta. Tente novamente.";
          Alert.alert("Erro ao criar conta", msg);
          return;
        }

        if (!newUserId) {
          Alert.alert("Erro", "Não foi possível criar a conta. Tente novamente.");
          return;
        }

        const { data: sessionData } = await getSession();
        if (!sessionData.session) {
          Alert.alert(
            "Confirme seu e-mail",
            "Sua conta foi criada. Acesse seu e-mail e clique no link para confirmar. Depois faça login.",
            [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
          );
          return;
        }

        userId = newUserId;
        isExistingUser = false;
      }

      const result = calcularNutricao({
        sex,
        weight_kg,
        height_cm,
        age,
        activity,
        goal,
        target_weight,
        weekly_pace,
      });

      const birth_date = getBirthDateFromAge(age);
      const target_date_iso = result.target_date.toISOString().slice(0, 10);
      const userEmail = hasSessionUser
        ? (sessionUser!.email ?? "").trim().toLowerCase()
        : email.trim().toLowerCase();

      const profileData = {
        name: name.trim() || "Usuário",
        email: userEmail,
        sex,
        birth_date,
        weight_kg,
        height_cm,
        body_fat_pct,
        goal,
        activity,
        workout_type,
        workout_time,
        target_weight,
        weekly_pace,
        diet_type,
        restrictions,
        plan: "free" as const,
        tmb: result.tmb,
        tdee: result.tdee,
        daily_kcal: result.meta,
        protein_g: result.protein_g,
        carbo_g: result.carbo_g,
        fat_g: result.fat_g,
        hydration_ml: result.hydration_ml,
        target_date: target_date_iso,
        meals_per_day: meals_per_day ?? 3,
        liked_foods: liked_foods ?? [],
        onboarding_completed: true,
      };

      // Trigger em auth.users já criou a linha em public.users no signUp; sempre fazemos UPDATE.
      const { error: updateError } = await supabase
        .from("users")
        .update(profileData)
        .eq("id", userId);

      if (updateError) {
        Alert.alert(
          "Erro ao salvar perfil",
          updateError.code === "23505"
            ? "Este e-mail já está cadastrado. Tente fazer login."
            : "Não foi possível salvar seus dados. Verifique a conexão e tente novamente."
        );
        return;
      }

      const freshProfile = await fetchUserProfile(userId);
      const user: User = freshProfile ?? {
        id: userId,
        ...profileData,
        liked_foods: liked_foods ?? [],
        created_at: new Date().toISOString(),
      };
      setUser(user);
      if (user.hydration_ml > 0) {
        useHydrationStore.getState().setWaterGoalL(user.hydration_ml / 1000);
      }
      if (!isExistingUser) clearCredentials();
    } catch (e) {
      console.error("handleStart onboarding:", e);
      Alert.alert(
        "Erro",
        "Não foi possível finalizar. Verifique sua conexão e tente novamente."
      );
    } finally {
      setLoading(false);
      // Garante que, em ambiente web ou mobile, o usuário sempre vá para a tela principal
      // após concluir o onboarding, mesmo que haja falha pontual ao persistir no servidor.
      router.replace("/(tabs)/");
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!sex || !goal || !activity) {
        router.replace("/(auth)/onboarding/step-1");
      }
    }, [sex, goal, activity])
  );

  if (!sex || !goal || !activity) {
    return null;
  }

  const result = calcularNutricao({
    sex,
    weight_kg,
    height_cm,
    age,
    activity,
    goal,
    target_weight,
    weekly_pace,
  });

  const firstName = name.trim().split(/\s+/)[0] || "Usuário";
  const imc = height_cm > 0 ? weight_kg / Math.pow(height_cm / 100, 2) : 0;
  const imcFormatted = imc > 0 ? imc.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—";
  const imcLabel = getImcClassification(imc);
  const weightDiff = target_weight - weight_kg;
  const weightDiffStr =
    Math.abs(weightDiff) < 0.1 ? "Manter" : `${weightDiff >= 0 ? "+" : ""}${weightDiff.toFixed(0)}kg`;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(auth)/onboarding/step-8");
            }
          }}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerLabel}>CONCLUÍDO</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="checkmark" size={40} color={Colors.textInverse} />
          </View>
          <Text style={styles.heroTitle}>Seu plano está pronto, {firstName}!</Text>
          <Text style={styles.heroSubtitle}>
            Calculamos tudo para você chegar lá.
          </Text>
        </View>

        {/* Card meta calórica (tom mais pro preto) + macros em cards coloridos */}
        <View style={styles.calorieCard}>
          <Text style={styles.calorieCardLabel}>META CALÓRICA DIÁRIA</Text>
          <View style={styles.calorieCardValueRow}>
            <Text style={styles.calorieCardValue}>{result.meta.toLocaleString("pt-BR")}</Text>
            <Text style={styles.calorieCardUnit}> kcal</Text>
          </View>
          <View style={styles.macroCardsRow}>
            <View style={[styles.macroCard, styles.macroCardCarbo]}>
              <Text style={styles.macroCardEmoji}>🍞</Text>
              <Text style={styles.macroCardLabel}>Carboidratos</Text>
              <Text style={styles.macroCardValue}>{result.carbo_g}g</Text>
            </View>
            <View style={[styles.macroCard, styles.macroCardProtein]}>
              <Text style={styles.macroCardEmoji}>🥩</Text>
              <Text style={styles.macroCardLabel}>Proteínas</Text>
              <Text style={styles.macroCardValue}>{result.protein_g}g</Text>
            </View>
            <View style={[styles.macroCard, styles.macroCardFat]}>
              <Text style={styles.macroCardEmoji}>🧈</Text>
              <Text style={styles.macroCardLabel}>Gorduras</Text>
              <Text style={styles.macroCardValue}>{result.fat_g}g</Text>
            </View>
          </View>
        </View>

        {/* Data do objetivo (verde mais escuro, puxado pro preto) */}
        <Text style={styles.objectiveLabel}>Você chega ao seu objetivo em</Text>
        <Text style={styles.objectiveDate}>{formatDateBRCapitalized(result.target_date)}</Text>

        {/* Dois cards: IMC + META */}
        <View style={styles.twoCardsRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>IMC</Text>
            <Text style={styles.summaryCardValue}>{imcFormatted}</Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{imcLabel} ✓</Text>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>META</Text>
            <Text style={styles.summaryCardValue}>
              {weight_kg.toFixed(0)} → {target_weight.toFixed(0)}kg
            </Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{weightDiffStr}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title={loading ? "Processando…" : "Começar agora"}
          onPress={handleStart}
          showArrow={!loading}
          disabled={loading}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
  headerLabel: {
    ...Typography.label,
    fontSize: 11,
    color: Colors.text,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  hero: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    ...Typography.h2,
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  heroSubtitle: {
    ...Typography.body,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  calorieCard: {
    backgroundColor: "#1A1F18", // verde muito escuro, puxado pro preto
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(202, 255, 102, 0.2)",
  },
  calorieCardLabel: {
    ...Typography.label,
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  calorieCardValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.lg,
  },
  calorieCardValue: {
    ...Typography.h1,
    fontSize: 40,
    fontWeight: "800",
    color: Colors.primary,
  },
  calorieCardUnit: {
    ...Typography.h3,
    fontSize: 18,
    color: Colors.primary,
    fontWeight: "600",
    marginLeft: 2,
  },
  macroCardsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    width: "100%",
  },
  macroCard: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    alignItems: "center",
  },
  macroCardCarbo: {
    backgroundColor: "rgba(69, 197, 136, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(69, 197, 136, 0.5)",
  },
  macroCardProtein: {
    backgroundColor: "rgba(59, 130, 246, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.5)",
  },
  macroCardFat: {
    backgroundColor: "rgba(234, 179, 8, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.5)",
  },
  macroCardEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  macroCardLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  macroCardValue: {
    ...Typography.caption,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  objectiveLabel: {
    ...Typography.body,
    fontSize: 15,
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  objectiveDate: {
    ...Typography.h3,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  twoCardsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#2A2A2A", // preto suave, menos escuro que surface
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  summaryCardLabel: {
    ...Typography.label,
    fontSize: 11,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  summaryCardValue: {
    ...Typography.h3,
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  pill: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  pillText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textInverse,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background,
  },
});
