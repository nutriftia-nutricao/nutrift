import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Colors } from "../constants/colors";
import { Radius } from "../constants/radius";
import { Spacing } from "../constants/spacing";
import { Typography } from "../constants/typography";
import type { PlannedFood } from "../stores/useWeeklyPlanStore";
import type { MealType } from "../types/nutrition";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export type FoodEditSheetProps = {
  visible: boolean;
  food: PlannedFood | null;
  mealType: MealType | null;
  dayDate: string;
  onAiSubstitute: () => Promise<void>;
  onSave: (updatedFood: PlannedFood) => void;
  onRemove: (foodId: string) => void;
  onClose: () => void;
};

type Mode = "menu" | "edit-qty" | "manual-search";

export function FoodEditSheet({
  visible,
  food,
  mealType,
  dayDate,
  onAiSubstitute,
  onSave,
  onRemove,
  onClose,
}: FoodEditSheetProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [mode, setMode] = useState<Mode>("menu");
  const [qtyInput, setQtyInput] = useState("");
  const [manualName, setManualName] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Reset state when a new food is opened
  useEffect(() => {
    if (visible && food) {
      setMode("menu");
      setQtyInput(String(food.quantity_g));
      setManualName("");
      setAiLoading(false);
    }
  }, [visible, food?.id]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!food) return null;

  const handleAiSubstitute = async () => {
    setAiLoading(true);
    try {
      await onAiSubstitute();
      onClose();
    } catch {
      // error handled upstream
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveQty = () => {
    const qty = parseInt(qtyInput, 10);
    if (!qty || qty <= 0) return;
    const ratio = qty / food.quantity_g;
    onSave({
      ...food,
      quantity_g: qty,
      kcal: Math.round(food.kcal * ratio),
      protein_g: Math.round(food.protein_g * ratio * 10) / 10,
      carbo_g: Math.round(food.carbo_g * ratio * 10) / 10,
      fat_g: Math.round(food.fat_g * ratio * 10) / 10,
    });
    onClose();
  };

  const handleManualSave = () => {
    const name = manualName.trim();
    if (!name) return;
    onSave({ ...food, name });
    onClose();
  };

  const handleRemove = () => {
    onRemove(food.id);
    onClose();
  };

  const handleBack = () => setMode("menu");

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Food identity */}
        <View style={styles.foodHeader}>
          <View style={styles.foodHeaderLeft}>
            <Text style={styles.foodName} numberOfLines={2}>
              {food.name}
            </Text>
            <Text style={styles.foodMeta}>
              {food.quantity_g}g • {food.kcal} kcal
            </Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {/* Macro chips */}
        <View style={styles.macroRow}>
          <View style={[styles.macroChip, { backgroundColor: Colors.proteinBg }]}>
            <Text style={[styles.macroChipLabel, { color: Colors.protein }]}>P</Text>
            <Text style={[styles.macroChipValue, { color: Colors.protein }]}>
              {food.protein_g}g
            </Text>
          </View>
          <View style={[styles.macroChip, { backgroundColor: Colors.carboBg }]}>
            <Text style={[styles.macroChipLabel, { color: Colors.carbo }]}>C</Text>
            <Text style={[styles.macroChipValue, { color: Colors.carbo }]}>
              {food.carbo_g}g
            </Text>
          </View>
          <View style={[styles.macroChip, { backgroundColor: Colors.fatBg }]}>
            <Text style={[styles.macroChipLabel, { color: Colors.fat }]}>G</Text>
            <Text style={[styles.macroChipValue, { color: Colors.fat }]}>
              {food.fat_g}g
            </Text>
          </View>
        </View>

        {/* Separator */}
        <View style={styles.divider} />

        {/* --- MODE: MENU --- */}
        {mode === "menu" && (
          <View style={styles.actionsGrid}>
            {/* Substituir com IA */}
            <Pressable
              style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
              onPress={handleAiSubstitute}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="sparkles" size={24} color={Colors.primary} />
              )}
              <Text style={styles.actionLabel}>
                {aiLoading ? "Buscando..." : "Substituir com IA"}
              </Text>
              <Text style={styles.actionSubtitle}>Mesmo perfil de macros</Text>
            </Pressable>

            {/* Substituição manual */}
            <Pressable
              style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
              onPress={() => setMode("manual-search")}
            >
              <Ionicons name="search-outline" size={24} color={Colors.text} />
              <Text style={styles.actionLabel}>Trocar alimento</Text>
              <Text style={styles.actionSubtitle}>Busca livre por nome</Text>
            </Pressable>

            {/* Alterar quantidade */}
            <Pressable
              style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
              onPress={() => setMode("edit-qty")}
            >
              <Ionicons name="scale-outline" size={24} color={Colors.text} />
              <Text style={styles.actionLabel}>Alterar porção</Text>
              <Text style={styles.actionSubtitle}>Recalcula os macros</Text>
            </Pressable>

            {/* Remover */}
            <Pressable
              style={({ pressed }) => [
                styles.actionCard,
                styles.actionCardDanger,
                pressed && styles.pressed,
              ]}
              onPress={handleRemove}
            >
              <Ionicons name="trash-outline" size={24} color={Colors.error} />
              <Text style={[styles.actionLabel, { color: Colors.error }]}>Remover</Text>
              <Text style={[styles.actionSubtitle, { color: Colors.error, opacity: 0.7 }]}>
                Tirar da refeição
              </Text>
            </Pressable>
          </View>
        )}

        {/* --- MODE: EDIT QUANTITY --- */}
        {mode === "edit-qty" && (
          <View style={styles.editSection}>
            <Pressable style={styles.backRow} onPress={handleBack}>
              <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
              <Text style={styles.backLabel}>Voltar</Text>
            </Pressable>
            <Text style={styles.editTitle}>Alterar porção</Text>
            <Text style={styles.editHint}>
              Os macros serão recalculados proporcionalmente.
            </Text>
            <View style={styles.qtyRow}>
              <TextInput
                style={styles.qtyInput}
                value={qtyInput}
                onChangeText={setQtyInput}
                keyboardType="numeric"
                selectTextOnFocus
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.qtyUnit}>g</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.8 }]}
              onPress={handleSaveQty}
            >
              <Text style={styles.confirmBtnText}>Confirmar</Text>
            </Pressable>
          </View>
        )}

        {/* --- MODE: MANUAL SEARCH --- */}
        {mode === "manual-search" && (
          <View style={styles.editSection}>
            <Pressable style={styles.backRow} onPress={handleBack}>
              <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
              <Text style={styles.backLabel}>Voltar</Text>
            </Pressable>
            <Text style={styles.editTitle}>Trocar alimento</Text>
            <Text style={styles.editHint}>
              Digite o nome do alimento substituto. Os macros originais serão mantidos — edite a porção depois se precisar.
            </Text>
            <TextInput
              style={styles.nameInput}
              value={manualName}
              onChangeText={setManualName}
              placeholder={food.name}
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              autoFocus
            />
            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                !manualName.trim() && styles.confirmBtnDisabled,
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleManualSave}
              disabled={!manualName.trim()}
            >
              <Text style={styles.confirmBtnText}>Confirmar troca</Text>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#444444",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  foodHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  foodHeaderLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  foodName: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 4,
  },
  foodMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  macroRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  macroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  macroChipLabel: {
    ...Typography.label,
    fontSize: 10,
  },
  macroChipValue: {
    ...Typography.bodySmall,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  actionCard: {
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 6,
  },
  actionCardDanger: {
    borderColor: Colors.errorBg,
    backgroundColor: Colors.errorBg,
  },
  pressed: {
    opacity: 0.7,
  },
  actionLabel: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.text,
  },
  actionSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  // Edit modes
  editSection: {
    gap: Spacing.md,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  backLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  editTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  editHint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  qtyInput: {
    flex: 1,
    height: 52,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    ...Typography.h3,
    color: Colors.text,
    textAlign: "center",
  },
  qtyUnit: {
    ...Typography.h4,
    color: Colors.textSecondary,
    width: 20,
  },
  nameInput: {
    height: 52,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
    color: Colors.text,
  },
  confirmBtn: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xs,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.textInverse,
  },
});
