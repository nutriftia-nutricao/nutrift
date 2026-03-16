import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";

interface DayCompleteCelebrationModalProps {
  visible: boolean;
  completedDays: number;
  mealCount: number;
  onClose: () => void;
}

export function DayCompleteCelebrationModal({
  visible,
  completedDays,
  mealCount,
  onClose,
}: DayCompleteCelebrationModalProps) {
  if (!visible) return null;

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
        transition={{ type: "timing", duration: 300 }}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <MotiView
          from={{ opacity: 0, scale: 0.85, translateY: 24 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
          style={styles.cardWrap}
        >
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logo}>✨ Nutrift</Text>
              <View style={styles.flamePill}>
                <Text style={styles.flamePillEmoji}>🔥</Text>
                <Text style={styles.flamePillValue}>{completedDays}</Text>
              </View>
            </View>

            {/* Conteúdo central */}
            <View style={styles.content}>
              <Text style={styles.emoji}>🎉</Text>
              <Text style={styles.title}>Dia completo!</Text>
              <Text style={styles.subtitle}>
                Você seguiu o plano hoje com todas as {mealCount} refeições. Continue assim!
              </Text>
            </View>

            {/* Checkmarks das refeições */}
            <View style={styles.mealsRow}>
              {Array.from({ length: mealCount }).map((_, i) => (
                <MotiView
                  key={i}
                  from={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", delay: i * 80 }}
                  style={styles.checkCircle}
                >
                  <Ionicons name="checkmark" size={18} color={Colors.surface} />
                </MotiView>
              ))}
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.buttonText}>Continuar assim! 💪</Text>
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
    backgroundColor: "rgba(0,0,0,0.6)",
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
    shadowOpacity: 0.25,
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
    color: Colors.green,
    fontWeight: "800",
  },
  flamePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.greenLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  flamePillEmoji: { fontSize: 14 },
  flamePillValue: {
    ...Typography.bodySmall,
    fontWeight: "700",
    color: Colors.greenDark,
  },
  content: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  emoji: {
    fontSize: 64,
    lineHeight: 72,
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h2,
    fontSize: 24,
    color: Colors.text,
    fontWeight: "800",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  mealsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.greenDark,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: "100%",
    backgroundColor: Colors.green,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  buttonText: {
    ...Typography.h4,
    fontSize: 18,
    color: "#000",
    fontWeight: "800",
  },
});
