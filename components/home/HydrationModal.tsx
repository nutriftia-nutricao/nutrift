import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Colors } from "../../constants/colors";
import { GradientColors } from "../../constants/gradients";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";
import { useHydrationStore } from "../../stores/useHydrationStore";
import { getTodayISO } from "../../utils/date";

const QUICK_AMOUNTS = [
  { ml: 200, label: "+200ml", icon: "cafe-outline" as const },
  { ml: 300, label: "+300ml", icon: "wine-outline" as const },
  { ml: 500, label: "+500ml", icon: "water-outline" as const },
];

interface HydrationModalProps {
  visible: boolean;
  onClose: () => void;
  /** Data do dia (YYYY-MM-DD). Default: hoje. */
  date?: string;
}

export function HydrationModal({
  visible,
  onClose,
  date,
}: HydrationModalProps) {
  const today = date ?? getTodayISO();
  const totalMl = useHydrationStore((s) => s.getTotalMlForDate(today));
  const waterGoalL = useHydrationStore((s) => s.waterGoalL);
  const addWater = useHydrationStore((s) => s.addWater);

  const [customMl, setCustomMl] = useState("");

  const waterLiters = totalMl / 1000;
  const waterPct =
    waterGoalL > 0
      ? Math.min(100, Math.round((waterLiters / waterGoalL) * 100))
      : 0;

  const handleQuickAdd = (ml: number) => {
    addWater(today, ml);
  };

  const handleAddCustom = () => {
    const n = parseInt(customMl.trim(), 10);
    if (Number.isFinite(n) && n > 0) {
      addWater(today, Math.min(n, 5000));
      setCustomMl("");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.box} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Registrar Água</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              hitSlop={12}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>
              {waterLiters.toFixed(1)}L de {waterGoalL.toFixed(1)}L
            </Text>
            <Text style={styles.progressPct}>{waterPct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${waterPct}%` },
              ]}
            />
          </View>

          <Text style={styles.sectionTitle}>ADICIONAR RÁPIDO</Text>
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map(({ ml, label, icon }) => (
              <Pressable
                key={ml}
                onPress={() => handleQuickAdd(ml)}
                style={({ pressed }) => [
                  styles.quickBtn,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.quickIconWrap}>
                  <Ionicons name={icon} size={24} color={Colors.blue} />
                </View>
                <Text style={styles.quickLabel}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>PERSONALIZADO</Text>
          <View style={styles.customRow}>
            <TextInput
              style={styles.customInput}
              placeholder="Ex: 250"
              placeholderTextColor={Colors.textMuted}
              value={customMl}
              onChangeText={setCustomMl}
              keyboardType="number-pad"
              maxLength={4}
            />
            <Text style={styles.customUnit}>ml</Text>
          </View>

          <Pressable
            onPress={handleAddCustom}
            style={({ pressed }) => [styles.addBtnWrap, pressed && styles.pressed]}
          >
            <LinearGradient
              colors={GradientColors.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.addBtn}
            >
              <Text style={styles.addBtnText}>Adicionar</Text>
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  box: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h4,
    color: Colors.text,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  pressed: {
    opacity: 0.8,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  progressPct: {
    ...Typography.bodySmall,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: Radius.pill,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  progressFill: {
    height: "100%",
    borderRadius: Radius.pill,
    backgroundColor: Colors.blue,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.blueBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickIconWrap: {
    marginBottom: Spacing.xs,
  },
  quickLabel: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.blue,
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  customInput: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    ...Typography.body,
    color: Colors.text,
  },
  customUnit: {
    ...Typography.body,
    color: Colors.textSecondary,
    minWidth: 24,
  },
  addBtnWrap: {
    borderRadius: Radius.pill,
    overflow: "hidden",
  },
  addBtn: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    ...Typography.h4,
    color: Colors.surface,
  },
});
