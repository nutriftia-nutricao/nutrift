import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/radius';
import { Spacing } from '../../constants/spacing';
import { ProgressBar } from './ProgressBar';

export interface FoodItem {
  id: string;
  name: string;
  quantity_g: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  is_checked: boolean;
}

export interface MealCardProps {
  type: string;
  label: string;
  emoji: string;
  scheduledTime: string;
  foods: FoodItem[];
  isPro: boolean;
  freeMenuUsedThisWeek?: boolean; // refeição livre já usada essa semana
  onToggleFood: (foodId: string, checked: boolean) => void;
  onSubstituteAI: (foodId: string) => void;
  onSubstituteTACO: (foodId: string) => void;
  onFreeMenu: () => void;
}

export function MealCard({
  label,
  emoji,
  scheduledTime,
  foods,
  isPro,
  freeMenuUsedThisWeek = false,
  onToggleFood,
  onSubstituteAI,
  onSubstituteTACO,
  onFreeMenu,
}: MealCardProps) {
  const [expanded, setExpanded] = useState(false);

  const checkedKcal = foods
    .filter((f) => f.is_checked)
    .reduce((sum, f) => sum + f.kcal, 0);
  const totalKcal = foods.reduce((sum, f) => sum + f.kcal, 0);
  const progress = totalKcal > 0 ? checkedKcal / totalKcal : 0;
  const isComplete = progress === 1 && foods.length > 0;

  const handleMenuPress = useCallback((food: FoodItem) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            'Cancelar',
            'Substituir via IA',
            'Buscar na TACO (-5 pts)',
            ...(isPro && !freeMenuUsedThisWeek ? ['Marcar como refeição livre'] : []),
          ],
          cancelButtonIndex: 0,
          tintColor: Colors.primary,
        },
        (idx) => {
          if (idx === 1) onSubstituteAI(food.id);
          if (idx === 2) onSubstituteTACO(food.id);
          if (idx === 3 && isPro && !freeMenuUsedThisWeek) onFreeMenu();
        }
      );
    } else {
      Alert.alert('Opções', food.name, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Substituir via IA', onPress: () => onSubstituteAI(food.id) },
        { text: 'Buscar na TACO (-5 pts)', onPress: () => onSubstituteTACO(food.id) },
        ...(isPro && !freeMenuUsedThisWeek
          ? [{ text: 'Refeição livre', onPress: onFreeMenu }]
          : []),
      ]);
    }
  }, [isPro, freeMenuUsedThisWeek]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <Pressable
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
        onPress={() => setExpanded((prev) => !prev)}
      >
        <View style={styles.emojiWrap}>
          <Text style={styles.emoji}>{emoji}</Text>
          {isComplete && (
            <View style={styles.completeBadge}>
              <Text style={styles.completeBadgeText}>✓</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.mealLabel}>{label}</Text>
          <Text style={styles.mealMeta}>
            {scheduledTime} · {checkedKcal} / {totalKcal} kcal
          </Text>
        </View>

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.textSecondary}
        />
      </Pressable>

      {/* Barra de progresso */}
      <View style={styles.progressWrap}>
        <ProgressBar progress={progress} height="thin" />
      </View>

      {/* Lista de alimentos */}
      {expanded && (
        <View style={styles.foodsList}>
          {foods.map((food, index) => (
            <View
              key={food.id}
              style={[
                styles.foodItem,
                index < foods.length - 1 && styles.foodItemBorder,
              ]}
            >
              {/* Checkbox */}
              <Pressable
                onPress={() => onToggleFood(food.id, !food.is_checked)}
                style={({ pressed }) => [
                  styles.checkbox,
                  food.is_checked && styles.checkboxChecked,
                  pressed && styles.pressed,
                ]}
              >
                {food.is_checked && (
                  <Text style={styles.checkboxTick}>✓</Text>
                )}
              </Pressable>

              {/* Info do alimento */}
              <View style={styles.foodInfo}>
                <Text
                  style={[
                    styles.foodName,
                    food.is_checked && styles.foodNameDone,
                  ]}
                >
                  {food.name} · {food.quantity_g}g
                </Text>
                <View style={styles.macrosRow}>
                  <Text style={styles.macroP}>P: {food.protein_g}g</Text>
                  <Text style={styles.macroC}>C: {food.carbs_g}g</Text>
                  <Text style={styles.macroF}>G: {food.fat_g}g</Text>
                </View>
              </View>

              {/* Kcal + menu */}
              <View style={styles.foodRight}>
                <Text style={styles.foodKcal}>{food.kcal}</Text>
                <Pressable
                  onPress={() => handleMenuPress(food)}
                  style={({ pressed }) => [
                    styles.menuBtn,
                    pressed && styles.pressed,
                  ]}
                  hitSlop={8}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={18}
                    color={Colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.7 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  emojiWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emoji: { fontSize: 26 },
  completeBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  completeBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  info: { flex: 1 },
  mealLabel: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 3,
  },
  mealMeta: {
    fontFamily: 'System',
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // Progress bar
  progressWrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },

  // Foods list
  foodsList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 10,
  },
  foodItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },

  // Checkbox
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxTick: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },

  // Food info
  foodInfo: { flex: 1, gap: 3 },
  foodName: {
    fontFamily: 'System',
    fontSize: 15,
    color: Colors.text,
  },
  foodNameDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  macrosRow: { flexDirection: 'row', gap: 10 },
  macroP: { fontSize: 11, fontWeight: '600', color: Colors.protein },
  macroC: { fontSize: 11, fontWeight: '600', color: Colors.carbs },
  macroF: { fontSize: 11, fontWeight: '600', color: Colors.fat },

  // Right side
  foodRight: { alignItems: 'flex-end', gap: 6 },
  foodKcal: {
    fontFamily: 'System',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  menuBtn: {
    padding: 2,
  },
});
