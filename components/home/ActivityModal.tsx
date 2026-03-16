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
import {
  useActivityStore,
  calcKcalBurned,
  type ActivityIntensity,
  type ActivityType,
} from "../../stores/useActivityStore";
import { useUserStore } from "../../stores/useUserStore";
import { getTodayISO } from "../../utils/date";

const ACTIVITY_TYPES: {
  value: ActivityType;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  { value: "caminhada", label: "Caminhada", icon: "walk-outline" },
  { value: "corrida", label: "Corrida", icon: "footsteps-outline" },
  { value: "academia", label: "Academia", icon: "barbell-outline" },
];

const INTENSITIES: { value: ActivityIntensity; label: string }[] = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
];

const DEFAULT_NAMES: Record<ActivityType, string> = {
  caminhada: "Caminhada",
  corrida: "Corrida",
  academia: "Academia",
};

interface ActivityModalProps {
  visible: boolean;
  onClose: () => void;
  date?: string;
}

export function ActivityModal({
  visible,
  onClose,
  date,
}: ActivityModalProps) {
  const today = date ?? getTodayISO();
  const addEntry = useActivityStore((s) => s.addEntry);
  const weightKg = useUserStore((s) => s.user?.weight_kg ?? 70);

  const [activityType, setActivityType] = useState<ActivityType>("caminhada");
  const [exerciseName, setExerciseName] = useState(DEFAULT_NAMES.caminhada);
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState<ActivityIntensity>("media");

  const handleTypeSelect = (type: ActivityType) => {
    setActivityType(type);
    setExerciseName(DEFAULT_NAMES[type]);
  };

  const handleSave = () => {
    const min = parseInt(duration.trim(), 10);
    if (!Number.isFinite(min) || min < 1) return;
    const durationClamped = Math.min(min, 999);
    const kcal_burned = calcKcalBurned(activityType, intensity, durationClamped, weightKg);
    addEntry({
      type: activityType,
      name: exerciseName.trim() || DEFAULT_NAMES[activityType],
      duration_min: durationClamped,
      intensity,
      kcal_burned,
      date: today,
    });
    setDuration("");
    setIntensity("media");
    setActivityType("caminhada");
    setExerciseName(DEFAULT_NAMES.caminhada);
    onClose();
  };

  const canSave = duration.trim().length > 0 && parseInt(duration.trim(), 10) >= 1;

  /** Preview de kcal em tempo real enquanto o usuário digita */
  const previewKcal = (() => {
    const min = parseInt(duration.trim(), 10);
    if (!Number.isFinite(min) || min < 1) return null;
    return calcKcalBurned(activityType, intensity, Math.min(min, 999), weightKg);
  })();

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
            <Text style={styles.title}>Nova Atividade</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              hitSlop={12}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>

          <View style={styles.typeRow}>
            {ACTIVITY_TYPES.map(({ value, label, icon }) => (
              <Pressable
                key={value}
                onPress={() => handleTypeSelect(value)}
                style={({ pressed }) => [
                  styles.typeBtn,
                  activityType === value && styles.typeBtnSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.typeIconWrap,
                    activityType === value && styles.typeIconWrapSelected,
                  ]}
                >
                  <Ionicons
                    name={icon}
                    size={28}
                    color={activityType === value ? Colors.greenDark : Colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.typeLabel,
                    activityType === value && styles.typeLabelSelected,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionLabel}>EXERCÍCIO</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Caminhada"
            placeholderTextColor={Colors.textMuted}
            value={exerciseName}
            onChangeText={setExerciseName}
          />

          <Text style={styles.sectionLabel}>DURAÇÃO (MIN)</Text>
          <View style={styles.durationRow}>
            <TextInput
              style={[styles.input, styles.durationInput]}
              placeholder="30"
              placeholderTextColor={Colors.textMuted}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text style={styles.durationUnit}>minutos</Text>
          </View>

          {previewKcal !== null && (
            <View style={styles.previewRow}>
              <Ionicons name="flame-outline" size={14} color={Colors.carbo} />
              <Text style={styles.previewText}>
                Estimativa: ~{previewKcal} kcal queimadas
              </Text>
            </View>
          )}

          <Text style={styles.sectionLabel}>INTENSIDADE</Text>
          <View style={styles.intensityRow}>
            {INTENSITIES.map(({ value: v, label: l }) => (
              <Pressable
                key={v}
                onPress={() => setIntensity(v)}
                style={({ pressed }) => [
                  styles.intensityBtn,
                  intensity === v && styles.intensityBtnSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.intensityLabel,
                    intensity === v && styles.intensityLabelSelected,
                  ]}
                >
                  {l}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.saveBtnWrap,
              pressed && canSave && styles.pressed,
              !canSave && styles.saveBtnDisabled,
            ]}
          >
            <LinearGradient
              colors={GradientColors.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.saveBtn}
            >
              <Text style={styles.saveBtnText}>Salvar Atividade</Text>
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
    marginBottom: Spacing.xl,
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
  typeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  typeBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  typeBtnSelected: {
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.lg,
  },
  typeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  typeIconWrapSelected: {
    backgroundColor: Colors.greenLight,
    borderColor: Colors.green,
  },
  typeLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  typeLabelSelected: {
    color: Colors.greenDark,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    height: 48,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  durationInput: {
    flex: 1,
    marginBottom: 0,
  },
  durationUnit: {
    ...Typography.body,
    color: Colors.greenDark,
    fontWeight: "600",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -Spacing.md,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  previewText: {
    ...Typography.caption,
    color: Colors.carbo,
    fontWeight: "600",
  },
  intensityRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  intensityBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  intensityBtnSelected: {
    backgroundColor: Colors.greenLight,
    borderColor: Colors.green,
  },
  intensityLabel: {
    ...Typography.bodySmall,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  intensityLabelSelected: {
    color: Colors.greenDark,
  },
  saveBtnWrap: {
    borderRadius: Radius.pill,
    overflow: "hidden",
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtn: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    ...Typography.h4,
    color: Colors.surface,
  },
});
