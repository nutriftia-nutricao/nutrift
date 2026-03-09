import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";

interface OptionCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  emoji?: string;
  iconColor?: string;
  iconBgColor?: string;
  selected: boolean;
  onPress: () => void;
  badge?: string;
}

export function OptionCard({
  title,
  subtitle,
  icon,
  emoji,
  iconColor,
  iconBgColor,
  selected,
  onPress,
  badge,
}: OptionCardProps) {
  const showIcon = icon || emoji;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        {showIcon && (
          <View
            style={[
              styles.iconWrapper,
              selected && styles.iconWrapperSelected,
              iconBgColor && { backgroundColor: iconBgColor },
            ]}
          >
            {emoji ? (
              <Text style={styles.emoji}>{emoji}</Text>
            ) : icon ? (
              <Ionicons
                name={icon}
                size={24}
                color={iconColor ?? (selected ? Colors.primaryDark : Colors.textSecondary)}
              />
            ) : null}
          </View>
        )}
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, selected && styles.titleSelected]}>
              {title}
            </Text>
            {badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
          </View>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && (
          <Ionicons name="checkmark" size={14} color={Colors.surface} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
  },
  cardSelected: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  pressed: {
    opacity: 0.95,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.lg,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapperSelected: {
    backgroundColor: Colors.primaryLight,
  },
  textBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.text,
  },
  titleSelected: {
    color: Colors.text,
  },
  badge: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  badgeText: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: "700",
    color: Colors.surface,
    textTransform: "uppercase",
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.md,
  },
  radioSelected: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  emoji: {
    fontSize: 24,
  },
});
