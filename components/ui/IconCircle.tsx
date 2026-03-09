import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";

import { Colors } from "../../constants/colors";

const DEFAULT_SIZE = 36;
const DEFAULT_ICON_SIZE = 20;

export interface IconCircleProps {
  /** Nome do ícone Ionicons */
  icon: ComponentProps<typeof Ionicons>["name"];
  /** Tamanho do círculo (largura = altura). Default 36 */
  size?: number;
  /** Tamanho do ícone. Default 20 */
  iconSize?: number;
  /** Cor do ícone. Default primaryDark */
  iconColor?: string;
  /** Cor de fundo do círculo. Default primaryLight */
  backgroundColor?: string;
  onPress: () => void;
  /** Acessibilidade */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
}

export function IconCircle({
  icon,
  size = DEFAULT_SIZE,
  iconSize = DEFAULT_ICON_SIZE,
  iconColor = Colors.primaryDark,
  backgroundColor = Colors.primaryLight,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
}: IconCircleProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <Ionicons name={icon} size={iconSize} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.8,
  },
});
