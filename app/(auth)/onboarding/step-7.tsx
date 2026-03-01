import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GradientButton } from "../../../components/ui/GradientButton";
import { Colors } from "../../../constants/colors";
import { GradientColors } from "../../../constants/gradients";
import { Radius } from "../../../constants/radius";
import { Spacing } from "../../../constants/spacing";
import { Typography } from "../../../constants/typography";
import { getSession, signUp } from "../../../services/auth";
import { supabase } from "../../../services/supabase";
import { useOnboardingStore } from "../../../stores/useOnboardingStore";
import { useSignupStore } from "../../../stores/useSignupStore";
import { useUserStore } from "../../../stores/useUserStore";
import type { User } from "../../../types/user";
import { formatDateBR, getBirthDateFromAge } from "../../../utils/date";
import { calcularNutricao } from "../../../utils/mifflin";

export default function OnboardingStep7Screen() {
  const [loading, setLoading] = useState(false);

  const {
    name,
    sex,
    weight_kg,
    height_cm,
    age,
    target_weight,
    goal,
    weekly_pace,
    activity,
    diet_style,
    meals_per_day,
  } = useOnboardingStore();

  const hasCredentials = useSignupStore((s) => s.hasCredentials);
  const email = useSignupStore((s) => s.email);
  const password = useSignupStore((s) => s.password);
  const clearCredentials = useSignupStore((s) => s.clearCredentials);

  const setUser = useUserStore((s) => s.setUser);

  const handleStart = async () => {
    if (!hasCredentials()) {
      Alert.alert(
        "Dados de login",
        "Para continuar, faça seu cadastro na tela anterior (e-mail e senha).",
        [{ text: "OK", onPress: () => router.replace("/(auth)/register") }]
      );
      return;
    }

    setLoading(true);
    try {
      const { userId, error: signUpError } = await signUp(email, password);

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

      if (!userId) {
        Alert.alert("Erro", "Não foi possível criar a conta. Tente novamente.");
        return;
      }

      const {
        data: { session },
      } = await getSession();
      if (!session) {
        Alert.alert(
          "Confirme seu e-mail",
          "Sua conta foi criada. Acesse seu e-mail e clique no link para confirmar. Depois faça login.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
        );
        return;
      }

      if (!sex || !goal || !activity) {
        Alert.alert("Erro", "Dados do onboarding incompletos.");
        return;
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

      const profile = {
        id: userId,
        name: name.trim() || "Usuário",
        email: email.trim().toLowerCase(),
        sex,
        birth_date,
        weight_kg,
        height_cm,
        goal,
        activity,
        target_weight,
        weekly_pace,
        plan: "free" as const,
        tmb: result.tmb,
        tdee: result.tdee,
        daily_kcal: result.meta,
        protein_g: result.protein_g,
        carbo_g: result.carbo_g,
        fat_g: result.fat_g,
        target_date: target_date_iso,
        meals_per_day: meals_per_day ?? 4,
      };

      const { error: insertError } = await supabase.from("users").insert(profile);

      if (insertError) {
        console.error("insert users:", insertError.code, insertError.message, insertError.details);
        Alert.alert(
          "Erro ao salvar perfil",
          insertError.code === "23505"
            ? "Este e-mail já está cadastrado. Tente fazer login."
            : "Não foi possível salvar seus dados no servidor. Tente novamente ou entre em contato com o suporte."
        );
        return;
      }

      const user: User = {
        ...profile,
        meals_per_day: meals_per_day ?? 4,
        created_at: new Date().toISOString(),
      };
      setUser(user);
      clearCredentials();
      router.replace("/");
    } catch (e) {
      console.error("handleStart onboarding:", e);
      Alert.alert(
        "Erro",
        "Não foi possível finalizar. Verifique sua conexão e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

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

  const semanas = Math.max(
    1,
    Math.ceil(
      Math.abs(weight_kg - target_weight) /
        (goal === "perder_gordura" ? weekly_pace : 0.25)
    )
  );

  return (
    <View style={styles.root}>
      <View style={styles.progressFull}>
        <LinearGradient
          colors={GradientColors.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
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
            <Ionicons
              name="checkmark-circle"
              size={32}
              color={Colors.green}
              style={{ opacity: 1 }}
            />
          </View>
          <Text style={styles.heroTitle}>Seu plano está pronto!</Text>
          <Text style={styles.heroSubtitle}>
            Personalizamos cada detalhe para você atingir seu objetivo com saúde.
          </Text>
        </View>

        <View style={styles.calcCard}>
          <Text style={styles.calcTitle}>🔥 Como calculamos seu plano</Text>

          <View style={styles.calcRow}>
            <View>
              <Text style={styles.calcLabel}>TAXA BASAL</Text>
              <Text style={styles.calcSublabel}>Calorias em repouso</Text>
            </View>
            <Text style={styles.calcValue}>{result.tmb} kcal</Text>
          </View>

          <View style={styles.calcDivider} />

          <View style={styles.calcRow}>
            <View>
              <Text style={styles.calcLabel}>GASTO TOTAL</Text>
              <Text style={styles.calcSublabel}>Com seu nível de atividade</Text>
            </View>
            <Text style={styles.calcValue}>{result.tdee} kcal</Text>
          </View>

          <View style={styles.calcDivider} />

          <View style={[styles.calcRow, styles.metaRow]}>
            <View>
              <Text style={styles.metaLabel}>SUA META</Text>
              <Text style={styles.calcSublabel}>Para atingir seu objetivo</Text>
            </View>
            <Text style={styles.metaValue}>{result.meta} kcal</Text>
          </View>
        </View>

        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={styles.resultIcon}>
              <LinearGradient
                colors={GradientColors.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.resultIconGradient}
              >
                <Ionicons name="trending-up" size={24} color={Colors.surface} />
              </LinearGradient>
            </View>
            <View>
              <Text style={styles.resultLabel}>Meta Diária</Text>
              <Text style={styles.resultValue}>
                {result.meta}{" "}
                <Text style={styles.resultUnit}>kcal</Text>
              </Text>
            </View>
          </View>

          <View style={styles.resultGrid}>
            <View style={styles.resultItem}>
              <Text style={styles.resultItemLabel}>Previsão de Meta</Text>
              <Text style={styles.resultItemValue}>
                {formatDateBR(result.target_date)}
              </Text>
            </View>
            <View style={[styles.resultItem, styles.resultItemBorder]}>
              <Text style={styles.resultItemLabel}>Foco Semanal</Text>
              <Text style={styles.resultItemValue}>
                {goal === "perder_gordura"
                  ? `-${weekly_pace} kg`
                  : goal === "ganhar_massa"
                    ? "+0.25 kg"
                    : "0 kg"}
              </Text>
            </View>
          </View>

          <View style={styles.weeksBadge}>
            <Text style={styles.weeksText}>
              ⏱ {semanas} semanas seguindo o plano
            </Text>
          </View>
        </View>

        <View style={styles.macrosRow}>
          <View style={styles.macroCard}>
            <View style={[styles.macroIcon, { backgroundColor: Colors.carboBg }]}>
              <Ionicons name="restaurant-outline" size={20} color={Colors.carbo} />
            </View>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>{result.carbo_g}g</Text>
            <View style={[styles.macroBar, { backgroundColor: Colors.carbo }]} />
          </View>
          <View style={styles.macroCard}>
            <View style={[styles.macroIcon, { backgroundColor: Colors.proteinBg }]}>
              <Ionicons name="barbell-outline" size={20} color={Colors.protein} />
            </View>
            <Text style={styles.macroLabel}>Prot</Text>
            <Text style={styles.macroValue}>{result.protein_g}g</Text>
            <View style={[styles.macroBar, { backgroundColor: Colors.protein }]} />
          </View>
          <View style={styles.macroCard}>
            <View style={[styles.macroIcon, { backgroundColor: Colors.fatBg }]}>
              <Ionicons name="water-outline" size={20} color={Colors.fat} />
            </View>
            <Text style={styles.macroLabel}>Gord</Text>
            <Text style={styles.macroValue}>{result.fat_g}g</Text>
            <View style={[styles.macroBar, { backgroundColor: Colors.fat }]} />
          </View>
        </View>

        <View style={styles.strategyCard}>
          <View style={styles.strategyIcon}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.greenDark} />
          </View>
          <View style={styles.strategyContent}>
            <Text style={styles.strategyTitle}>Estratégia Nutrift</Text>
            <Text style={styles.strategyText}>
              Este plano foi calculado com base no seu nível de atividade física e
              preferência por{" "}
              {diet_style === "equilibrada"
                ? "dieta equilibrada"
                : diet_style === "vegetariana"
                  ? "dieta vegetariana"
                  : diet_style === "high_protein"
                    ? "alta proteína"
                    : diet_style === "low_carb"
                      ? "low carb"
                      : diet_style === "keto"
                        ? "keto/low carb"
                        : "dieta equilibrada"}
              .
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title={loading ? "Criando conta…" : "Começar agora"}
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
  progressFull: {
    height: 4,
    width: "100%",
    backgroundColor: Colors.border,
    overflow: "hidden",
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
    color: Colors.green,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    ...Typography.h2,
    fontSize: 26,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  heroSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  calcCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  calcTitle: {
    ...Typography.bodySmall,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  calcRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  calcLabel: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  calcSublabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  calcValue: {
    ...Typography.h4,
    fontSize: 17,
    color: Colors.text,
  },
  calcDivider: {
    height: 1,
    backgroundColor: Colors.background,
    marginVertical: Spacing.xs,
  },
  metaRow: {
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  metaLabel: {
    ...Typography.label,
    color: Colors.greenDark,
  },
  metaValue: {
    ...Typography.h1,
    fontSize: 22,
    color: Colors.greenDark,
  },
  resultCard: {
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.xxl,
    borderWidth: 2,
    borderColor: Colors.green,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  resultIconGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  resultLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  resultValue: {
    ...Typography.h1,
    fontSize: 28,
    color: Colors.text,
  },
  resultUnit: {
    ...Typography.body,
    fontSize: 18,
    color: Colors.textSecondary,
  },
  resultGrid: {
    flexDirection: "row",
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: `${Colors.green}33`,
  },
  resultItem: {
    flex: 1,
  },
  resultItemBorder: {
    borderLeftWidth: 1,
    borderLeftColor: `${Colors.green}33`,
    paddingLeft: Spacing.lg,
  },
  resultItemLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  resultItemValue: {
    ...Typography.h4,
    color: Colors.greenDark,
  },
  weeksBadge: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
  },
  weeksText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  macrosRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  macroCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: "center",
  },
  macroIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  macroLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  macroValue: {
    ...Typography.h4,
    color: Colors.text,
  },
  macroBar: {
    width: "50%",
    height: 3,
    borderRadius: Radius.pill,
    marginTop: Spacing.sm,
  },
  strategyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  strategyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  strategyContent: {
    flex: 1,
  },
  strategyTitle: {
    ...Typography.bodySmall,
    fontWeight: "700",
    color: Colors.text,
  },
  strategyText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background,
  },
});
