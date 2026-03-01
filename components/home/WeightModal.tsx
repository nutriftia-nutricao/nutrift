import { Ionicons } from "@expo/vector-icons";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Colors } from "../../constants/colors";
import { GradientColors } from "../../constants/gradients";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";
import { supabase } from "../../services/supabase";
import { useUserStore } from "../../stores/useUserStore";
import type { User } from "../../types/user";
import { getTodayISO } from "../../utils/date";

interface WeightModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: (updatedUser: User) => void;
}

function formatWeightDate(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  const today = getTodayISO();
  if (isoDate === today) {
    return `Hoje, ${format(d, "d MMM", { locale: ptBR })}`;
  }
  return format(d, "EEEE, d MMM", { locale: ptBR });
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function MonthCalendar({
  selectedISO,
  calendarMonth,
  onMonthChange,
  onSelectDate,
  onClose,
}: {
  selectedISO: string;
  calendarMonth: Date;
  onMonthChange: (d: Date) => void;
  onSelectDate: (iso: string) => void;
  onClose: () => void;
}) {
  const start = startOfMonth(calendarMonth);
  const end = endOfMonth(calendarMonth);
  const days = eachDayOfInterval({ start, end });
  const firstDayOfWeek = getDay(start);
  const padding = firstDayOfWeek;
  const today = getTodayISO();

  return (
    <View style={calendarStyles.overlay}>
      <View style={calendarStyles.box}>
        <View style={calendarStyles.header}>
          <Pressable
            onPress={() => onMonthChange(subMonths(calendarMonth, 1))}
            style={calendarStyles.arrowBtn}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>
          <Text style={calendarStyles.monthTitle}>
            {format(calendarMonth, "MMMM yyyy", { locale: ptBR })}
          </Text>
          <Pressable
            onPress={() => onMonthChange(addMonths(calendarMonth, 1))}
            style={calendarStyles.arrowBtn}
            hitSlop={8}
          >
            <Ionicons name="chevron-forward" size={22} color={Colors.text} />
          </Pressable>
        </View>
        <View style={calendarStyles.weekRow}>
          {WEEKDAYS.map((w) => (
            <Text key={w} style={calendarStyles.weekDayLabel}>
              {w}
            </Text>
          ))}
        </View>
        <View style={calendarStyles.grid}>
          {Array.from({ length: padding }, (_, i) => (
            <View key={`pad-${i}`} style={calendarStyles.cell} />
          ))}
          {days.map((d) => {
            const iso = d.toISOString().slice(0, 10);
            const selected = iso === selectedISO;
            const isToday = iso === today;
            return (
              <Pressable
                key={iso}
                style={[
                  calendarStyles.cell,
                  calendarStyles.cellDay,
                  selected && calendarStyles.cellSelected,
                  isToday && !selected && calendarStyles.cellToday,
                ]}
                onPress={() => onSelectDate(iso)}
              >
                <Text
                  style={[
                    calendarStyles.cellText,
                    selected && calendarStyles.cellTextSelected,
                    isToday && !selected && calendarStyles.cellTextToday,
                  ]}
                >
                  {format(d, "d")}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={calendarStyles.closeRow} onPress={onClose}>
          <Text style={calendarStyles.closeText}>Fechar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const calendarStyles = StyleSheet.create({
  overlay: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  box: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  arrowBtn: {
    padding: Spacing.xs,
  },
  monthTitle: {
    ...Typography.h4,
    color: Colors.text,
    textTransform: "capitalize",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: Spacing.xs,
  },
  weekDayLabel: {
    flex: 1,
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: "center",
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    maxWidth: 40,
    maxHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  cellDay: {},
  cellSelected: {
    backgroundColor: Colors.greenDark,
    borderRadius: Radius.sm,
  },
  cellToday: {
    borderWidth: 1,
    borderColor: Colors.green,
    borderRadius: Radius.sm,
  },
  cellText: {
    ...Typography.bodySmall,
    color: Colors.text,
  },
  cellTextSelected: {
    color: Colors.surface,
    fontWeight: "700",
  },
  cellTextToday: {
    color: Colors.greenDark,
    fontWeight: "700",
  },
  closeRow: {
    marginTop: Spacing.md,
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  closeText: {
    ...Typography.body,
    color: Colors.greenDark,
    fontWeight: "600",
  },
});

export function WeightModal({
  visible,
  onClose,
  onSaved,
}: WeightModalProps) {
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const currentFromUser = user?.weight_kg ?? 0;
  const [weightInput, setWeightInput] = useState(
    currentFromUser > 0 ? String(currentFromUser).replace(".", ",") : ""
  );
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [saving, setSaving] = useState(false);
  const [previousWeight, setPreviousWeight] = useState<number>(currentFromUser);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  useEffect(() => {
    if (visible && user) {
      const w = user.weight_kg ?? 0;
      setWeightInput(w > 0 ? String(w).replace(".", ",") : "");
      setSelectedDate(getTodayISO());
      setPreviousWeight(w);
    }
  }, [visible, user?.id, user?.weight_kg]);

  const weightNum = (() => {
    const s = weightInput.trim().replace(",", ".");
    const n = parseFloat(s);
    return Number.isFinite(n) && n >= 20 && n <= 300 ? n : null;
  })();

  const diffKg = weightNum != null && previousWeight > 0 ? previousWeight - weightNum : null;
  const goal = user?.goal ?? "perder_gordura";

  const handleSave = async () => {
    if (!user?.id || weightNum == null) {
      if (weightNum == null) {
        Alert.alert("Peso inválido", "Informe um peso entre 20 e 300 kg.");
      }
      return;
    }

    try {
      setSaving(true);
      const value = Number(weightNum);
      const { data, error } = await supabase
        .from("users")
        .update({ weight_kg: value })
        .eq("id", user.id)
        .select("weight_kg")
        .single();

      if (error) throw error;
      const savedWeight = (data?.weight_kg != null ? Number(data.weight_kg) : value) as number;
      const updatedUser: User = { ...user, weight_kg: savedWeight };
      setUser(updatedUser);
      onSaved?.(updatedUser);
      onClose();
    } catch (err) {
      console.error("WeightModal handleSave:", err);
      const msg = err instanceof Error ? err.message : "Não foi possível salvar o peso. Tente novamente.";
      Alert.alert("Erro", msg);
    } finally {
      setSaving(false);
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
            <Text style={styles.title}>Registrar Peso</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              hitSlop={12}
            >
              <View style={styles.closeCircle}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </View>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>PESO ATUAL</Text>
          <View style={styles.weightInputWrap}>
            <TextInput
              style={styles.weightInput}
              value={weightInput}
              onChangeText={setWeightInput}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              maxLength={6}
            />
            <Text style={styles.weightUnit}>kg</Text>
          </View>

          {diffKg != null && diffKg !== 0 && (
            <Text style={styles.diffText}>
              {goal === "perder_gordura" && diffKg > 0 && (
                <>Você eliminou <Text style={styles.diffHighlight}>{Math.abs(diffKg).toFixed(1).replace(".", ",")} kg</Text> desde o último registro.</>
              )}
              {goal === "ganhar_massa" && diffKg < 0 && (
                <>Você ganhou <Text style={styles.diffHighlight}>{Math.abs(diffKg).toFixed(1).replace(".", ",")} kg</Text> desde o último registro.</>
              )}
              {goal === "manter" && diffKg !== 0 && (
                <>Variação de <Text style={styles.diffHighlight}>{diffKg > 0 ? "-" : "+"}{Math.abs(diffKg).toFixed(1).replace(".", ",")} kg</Text> desde o último registro.</>
              )}
            </Text>
          )}

          <Text style={styles.sectionLabel}>DATA</Text>
          <Pressable
            style={styles.dateInputWrap}
            onPress={() => {
              setCalendarMonth(new Date(selectedDate + "T12:00:00"));
              setShowCalendar(true);
            }}
          >
            <Text style={styles.dateText}>{formatWeightDate(selectedDate)}</Text>
            <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
          </Pressable>

          {showCalendar && (
            <MonthCalendar
              selectedISO={selectedDate}
              calendarMonth={calendarMonth}
              onMonthChange={setCalendarMonth}
              onSelectDate={(iso) => {
                setSelectedDate(iso);
                setShowCalendar(false);
              }}
              onClose={() => setShowCalendar(false)}
            />
          )}

          <Pressable
            onPress={handleSave}
            disabled={saving || weightNum == null || !user}
            style={({ pressed }) => [styles.saveBtnWrap, pressed && styles.pressed]}
          >
            <LinearGradient
              colors={GradientColors.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.saveBtn}
            >
              <Text style={styles.saveBtnText}>
                {saving ? "Salvando…" : "Salvar Peso"}
              </Text>
            </LinearGradient>
          </Pressable>
          {!user && (
            <Text style={styles.loadingHint}>
              Seu perfil está carregando. Feche e tente novamente se demorar.
            </Text>
          )}
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
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.8,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  weightInputWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  weightInput: {
    flex: 1,
    ...Typography.h2,
    color: Colors.text,
    padding: 0,
  },
  weightUnit: {
    ...Typography.body,
    color: Colors.green,
    marginLeft: Spacing.xs,
  },
  diffText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  diffHighlight: {
    fontWeight: "700",
    color: Colors.greenDark,
  },
  dateInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
  },
  dateText: {
    ...Typography.body,
    color: Colors.text,
  },
  saveBtnWrap: {
    borderRadius: Radius.pill,
    overflow: "hidden",
    shadowColor: Colors.greenDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  saveBtn: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    ...Typography.h4,
    color: Colors.surface,
  },
  loadingHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.md,
  },
});
