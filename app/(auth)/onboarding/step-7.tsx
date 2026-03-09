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
import type { WeeklyPace } from "../../../types/onboarding";

const RITMO_OPTIONS: { value: WeeklyPace; label: string; subtitle: string; emoji: string }[] = [
  { value: 0.25, label: "0,25 kg/semana", subtitle: "Ritmo leve e constante", emoji: "🐢" },
  { value: 0.5, label: "0,5 kg/semana", subtitle: "Equilíbrio perfeito para você", emoji: "🚶" },
  { value: 0.75, label: "0,75 kg/semana", subtitle: "Ritmo acelerado", emoji: "🏃" },
  { value: 1.0, label: "1,0 kg/semana", subtitle: "Ritmo intenso (desafiador)", emoji: "⚡" },
];

interface RitmoCardProps {
  label: string;
  subtitle: string;
  emoji: string;
  selected: boolean;
  badge?: string;
  onPress: () => void;
}

function RitmoCard({ label, subtitle, emoji, selected, badge, onPress }: RitmoCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ritmoCard,
        selected && styles.ritmoCardSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.ritmoCardLeft}>
        <View style={styles.ritmoEmojiBox}>
          <Text style={styles.ritmoEmoji}>{emoji}</Text>
        </View>
        <View style={styles.ritmoTextBlock}>
          <View style={styles.ritmoTitleRow}>
            <Text style={styles.ritmoTitle}>{label}</Text>
            {badge && (
              <View style={styles.ritmoBadge}>
                <Text style={styles.ritmoBadgeText}>{badge}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.ritmoSubtitle,
              selected && styles.ritmoSubtitleSelected,
            ]}
          >
            {subtitle}
          </Text>
        </View>
      </View>
      <View style={[styles.ritmoRadio, selected && styles.ritmoRadioSelected]}>
        {selected && <Ionicons name="checkmark" size={16} color={Colors.surface} />}
      </View>
    </Pressable>
  );
}

export default function OnboardingStep7Screen() {
  const { goal, weekly_pace, setWeeklyPace } = useOnboardingStore();

  const handleContinue = () => {
    router.push("/(auth)/onboarding/step-8");
  };

  const showRitmoOptions = goal === "perder_gordura" || goal === "ganhar_massa";

  return (
    <View style={styles.root}>
      <OnboardingHeader step={7} totalSteps={9} subtitle="Ritmo" fallbackRoute="/(auth)/onboarding/step-6" />

      <View style={styles.titleBlock}>
        <Text style={styles.title}>Qual será o seu ritmo?</Text>
        <Text style={styles.subtitle}>
          {showRitmoOptions
            ? "Escolha a velocidade da sua jornada de forma saudável."
            : "Para seu objetivo, usaremos um ritmo equilibrado."}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {showRitmoOptions ? (
          <>
            {RITMO_OPTIONS.map((opt) => (
              <RitmoCard
                key={opt.value}
                label={opt.label}
                subtitle={opt.subtitle}
                emoji={opt.emoji}
                selected={weekly_pace === opt.value}
                onPress={() => setWeeklyPace(opt.value)}
                badge={opt.value === 0.5 ? "⭐ Recomendado" : undefined}
              />
            ))}
            <View style={styles.tipRow}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.textMuted} />
              <Text style={styles.tipText}>
                Resultados consistentes levam tempo. O ritmo recomendado é ideal para evitar efeito sanfona.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              Para melhorar sua composição corporal, o foco é na qualidade da alimentação e treino para trocar gordura por massa magra, mantendo o peso estável.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton title="Continuar" onPress={handleContinue} showArrow />
      </View>
    </View>
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
    fontWeight: "500",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodySmall,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 128,
    gap: 12,
  },
  ritmoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 80,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ritmoCardSelected: {
    borderWidth: 2,
    borderColor: Colors.primaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.99,
  },
  ritmoCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.lg,
  },
  ritmoEmojiBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  ritmoEmoji: {
    fontSize: 24,
  },
  ritmoTextBlock: {
    flex: 1,
    justifyContent: "center",
  },
  ritmoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  ritmoTitle: {
    ...Typography.bodySmall,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  ritmoBadge: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  ritmoBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.surface,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ritmoSubtitle: {
    ...Typography.bodySmall,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ritmoRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.md,
  },
  ritmoRadioSelected: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  ritmoSubtitleSelected: {
    color: Colors.textSecondary,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  tipText: {
    ...Typography.bodySmall,
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.text,
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background,
  },
});
