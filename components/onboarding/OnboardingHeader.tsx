import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";
import { ProgressBar } from "./ProgressBar";

interface OnboardingHeaderProps {
  step: number;
  totalSteps: number;
  subtitle?: string;
  showBack?: boolean;
  fallbackRoute?: string;
}

export function OnboardingHeader({
  step,
  totalSteps,
  subtitle,
  showBack = true,
  fallbackRoute,
}: OnboardingHeaderProps) {
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (fallbackRoute) {
      router.replace(fallbackRoute as never);
    }
  };

  return (
    <View style={styles.container}>
      {showBack && (
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
      )}
      <View style={styles.progressContainer}>
        <ProgressBar progress={step / totalSteps} />
      </View>
      <View style={styles.stepInfo}>
        <Text style={styles.stepLabel}>
          PASSO {step} DE {totalSteps}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: Spacing.sm,
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
  stepInfo: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  stepLabel: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    fontSize: 14,
  },
});
