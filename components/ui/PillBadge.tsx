import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/radius';
import { Spacing } from '../../constants/spacing';

type Variant = 'streak' | 'pro' | 'free' | 'success' | 'error' | 'warning';

interface PillBadgeProps {
  label: string;
  variant?: Variant;
  icon?: string;
  style?: ViewStyle;
}

export function PillBadge({ label, variant = 'streak', icon, style }: PillBadgeProps) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  icon: { fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', fontFamily: 'System' },

  // Variantes
  streak: { backgroundColor: 'rgba(202,255,102,0.12)' },
  streakLabel: { color: Colors.primary },

  pro: {
    backgroundColor: 'rgba(202,255,102,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(202,255,102,0.2)',
  },
  proLabel: { color: Colors.primary },

  free: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  freeLabel: { color: Colors.textSecondary },

  success: { backgroundColor: 'rgba(69,197,136,0.12)' },
  successLabel: { color: Colors.success },

  error: { backgroundColor: 'rgba(255,111,67,0.12)' },
  errorLabel: { color: Colors.error },

  warning: { backgroundColor: 'rgba(245,158,11,0.12)' },
  warningLabel: { color: Colors.warning },
});
