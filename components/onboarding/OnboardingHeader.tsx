import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";

interface OnboardingHeaderProps {
  step: number;
  totalSteps: number;
  subtitle?: string;
  showBack?: boolean;
}

export function OnboardingHeader({
  step,
  totalSteps,
  subtitle,
  showBack = true,
}: OnboardingHeaderProps) {
  const handleBack = () => {
    if (step === 1) {
      router.back();
    } else {
      router.back();
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
  },
  stepLabel: {
    ...Typography.label,
    color: Colors.greenDark,
    fontWeight: "700",
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
