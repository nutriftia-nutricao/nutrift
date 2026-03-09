import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { Colors } from "../../constants/colors";
import { GradientColors } from "../../constants/gradients";
import { Radius } from "../../constants/radius";
import { Typography } from "../../constants/typography";

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  showArrow?: boolean;
  /** Cores do gradiente [início, fim]. Ex: ["#CAFF66", "#CAFF66"] para sólido verde limão. */
  colors?: string[];
}

export function GradientButton({
  title,
  onPress,
  style,
  disabled = false,
  showArrow = false,
  colors = GradientColors.primary,
}: GradientButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.wrapper,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.gradient, style]}
      >
        <View style={styles.content}>
          <Text style={styles.text}>{title}</Text>
          {showArrow && (
            <Ionicons
              name="arrow-forward"
              size={20}
              color="#111111"
              style={styles.arrow}
            />
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: Radius.pill,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    height: 56,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  arrow: {
    marginLeft: 2,
  },
  text: {
    ...Typography.h4,
    color: "#111111", // Texto preto sobre primária (Regra crítica)
    fontWeight: "600",
  },
});
