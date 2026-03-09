import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/radius';
import { Spacing } from '../../constants/spacing';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.textOnPrimary : Colors.primary}
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`], styles[`${size}Label`]]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  fullWidth: { width: '100%' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.4 },

  // Variantes
  primary: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: Spacing.xl,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 16,
    paddingHorizontal: Spacing.xl,
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  danger: {
    backgroundColor: 'rgba(255,111,67,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,111,67,0.2)',
    paddingVertical: 16,
    paddingHorizontal: Spacing.xl,
  },

  // Tamanhos
  md: {},
  sm: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
  },

  // Labels
  label: {
    fontFamily: 'System',
    fontWeight: '600',
  },
  primaryLabel: { color: Colors.textOnPrimary, fontSize: 16 },
  secondaryLabel: { color: Colors.text, fontSize: 16 },
  ghostLabel: { color: Colors.primary, fontSize: 15 },
  dangerLabel: { color: Colors.error, fontSize: 16 },
  mdLabel: { fontSize: 16 },
  smLabel: { fontSize: 14 },
});
