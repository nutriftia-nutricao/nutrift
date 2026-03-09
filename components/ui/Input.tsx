import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/radius';
import { Spacing } from '../../constants/spacing';

interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  suffix?: string;       // ex: "kg", "cm", "ml"
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  hint,
  error,
  suffix,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[
        styles.inputWrap,
        focused && styles.inputWrapFocused,
        !!error && styles.inputWrapError,
      ]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textDisabled}
          selectionColor={Colors.primary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>

      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },

  label: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    height: 52,
  },
  inputWrapFocused: { borderColor: Colors.primary },
  inputWrapError: { borderColor: Colors.error },

  input: {
    flex: 1,
    fontFamily: 'System',
    fontSize: 15,
    color: Colors.text,
    padding: 0,
  },

  suffix: {
    fontFamily: 'System',
    fontSize: 15,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },

  hint: {
    fontFamily: 'System',
    fontSize: 12,
    color: Colors.textMuted,
  },

  error: {
    fontFamily: 'System',
    fontSize: 12,
    color: Colors.error,
  },
});
