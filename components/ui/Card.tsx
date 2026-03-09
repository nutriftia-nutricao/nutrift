import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/radius';
import { Spacing } from '../../constants/spacing';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevated?: boolean;
  accentLeft?: boolean; // borderLeft #CAFF66 — usado no card de ajuste calórico
}

export function Card({ children, onPress, style, elevated = false, accentLeft = false }: CardProps) {
  const content = (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        accentLeft && styles.accentLeft,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  elevated: {
    backgroundColor: Colors.elevated,
    borderColor: Colors.borderSubtle,
  },
  accentLeft: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
});
