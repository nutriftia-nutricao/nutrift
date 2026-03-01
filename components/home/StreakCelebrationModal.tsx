import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "../../constants/colors";
import { GradientColors } from "../../constants/gradients";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";

const WEEK_DAYS = ["S", "T", "Q", "Q", "S", "S", "D"]; // Seg a Dom

interface StreakCelebrationModalProps {
  visible: boolean;
  streak: number;
  onClose: () => void;
}

export function StreakCelebrationModal({
  visible,
  streak,
  onClose,
}: StreakCelebrationModalProps) {
  if (!visible) return null;

  const filledCount = Math.min(streak, 7);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: "timing", duration: 300 }}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <MotiView
          from={{
            opacity: 0,
            scale: 0.85,
            translateY: 24,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            translateY: 0,
          }}
          transition={{
            type: "timing",
            duration: 400,
          }}
          style={styles.cardWrap}
        >
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logo}>
                ✨ Nutrift
              </Text>
              <View style={styles.streakPill}>
                <Text style={styles.streakPillEmoji}>🔥</Text>
                <Text style={styles.streakPillValue}>{streak}</Text>
              </View>
            </View>

            {/* Conteúdo central */}
            <View style={styles.content}>
              <Text style={styles.emoji}>🔥</Text>
              <Text style={styles.number}>{streak}</Text>
              <Text style={styles.title}>dias em sequência!</Text>
              <Text style={styles.subtitle}>
                Você está imparável — continue assim!
              </Text>
            </View>

            {/* Semana */}
            <View style={styles.weekRow}>
              {WEEK_DAYS.map((day, i) => {
                const filled = i < filledCount;
                return (
                  <View key={i} style={styles.dayCol}>
                    <Text
                      style={[
                        styles.dayLabel,
                        filled ? styles.dayLabelFilled : styles.dayLabelEmpty,
                      ]}
                    >
                      {day}
                    </Text>
                    <View
                      style={[
                        styles.dayCircle,
                        filled ? styles.dayCircleFilled : styles.dayCircleEmpty,
                      ]}
                    >
                      {filled && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={Colors.surface}
                        />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              <LinearGradient
                colors={GradientColors.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Continuar assim! 💪</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </MotiView>
      </MotiView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(28, 28, 28, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  cardWrap: {
    width: "100%",
    maxWidth: 360,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: Spacing.xxl,
  },
  logo: {
    ...Typography.h3,
    color: Colors.greenDark,
    fontWeight: "800",
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.greenLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  streakPillEmoji: {
    fontSize: 14,
  },
  streakPillValue: {
    ...Typography.bodySmall,
    fontWeight: "700",
    color: Colors.greenDark,
  },
  content: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  emoji: {
    fontSize: 64,
    lineHeight: 64,
    marginBottom: Spacing.sm,
  },
  number: {
    ...Typography.h1,
    fontSize: 48,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.h2,
    fontSize: 20,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  dayCol: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  dayLabel: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: "700",
  },
  dayLabelFilled: {
    color: Colors.textSecondary,
  },
  dayLabelEmpty: {
    color: Colors.textMuted,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleFilled: {
    backgroundColor: Colors.greenDark,
    shadowColor: Colors.greenDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  dayCircleEmpty: {
    backgroundColor: Colors.border,
  },
  button: {
    width: "100%",
    borderRadius: Radius.pill,
    overflow: "hidden",
    shadowColor: Colors.greenDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.95,
  },
  buttonGradient: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    ...Typography.h4,
    fontSize: 18,
    color: Colors.surface,
  },
});
