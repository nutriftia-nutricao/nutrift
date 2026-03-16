import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { goBack } from "../../utils/navigation";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";
import { supabase } from "../../services/supabase";
import { useUserStore } from "../../stores/useUserStore";
import type { UserGoal } from "../../types/user";
import { getAgeFromBirthDate } from "../../utils/date";
import { calcularNutricao } from "../../utils/mifflin";

const GOALS: {
  key: UserGoal;
  label: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  { key: "perder_gordura", label: "Perder gordura", subtitle: "Déficit calórico controlado", icon: "trending-down-outline" },
  { key: "ganhar_massa", label: "Ganhar massa", subtitle: "Superávit calórico progressivo", icon: "trending-up-outline" },
  { key: "definir_corpo", label: "Definir o corpo", subtitle: "Reduzir gordura preservando músculo", icon: "body-outline" },
  { key: "recomposicao", label: "Recompôr o corpo", subtitle: "Perder gordura e ganhar músculo", icon: "sync-outline" },
];

const PACE_OPTIONS = [
  { value: 0.25, label: "0,25 kg/semana", subtitle: "Devagar e consistente" },
  { value: 0.5, label: "0,5 kg/semana", subtitle: "Ritmo recomendado" },
  { value: 0.75, label: "0,75 kg/semana", subtitle: "Moderado" },
  { value: 1.0, label: "1,0 kg/semana", subtitle: "Agressivo" },
];

const showsPace = (goal: UserGoal) =>
  goal === "perder_gordura" || goal === "ganhar_massa";

export default function MeuObjetivoScreen() {
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);

  const [selectedGoal, setSelectedGoal] = useState<UserGoal>(user?.goal ?? "perder_gordura");
  const [selectedPace, setSelectedPace] = useState<number>(user?.weekly_pace ?? 0.5);
  const [saving, setSaving] = useState(false);

  // Modal de objetivo
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [pendingGoal, setPendingGoal] = useState<UserGoal>(selectedGoal);

  // Modal de ritmo
  const [paceModalVisible, setPaceModalVisible] = useState(false);
  const [pendingPace, setPendingPace] = useState<number>(selectedPace);

  const currentGoal = GOALS.find((g) => g.key === selectedGoal);
  const currentPace = PACE_OPTIONS.find((p) => p.value === selectedPace);

  const openGoalModal = () => {
    setPendingGoal(selectedGoal);
    setGoalModalVisible(true);
  };

  const openPaceModal = () => {
    setPendingPace(selectedPace);
    setPaceModalVisible(true);
  };

  const confirmGoal = () => {
    setSelectedGoal(pendingGoal);
    setGoalModalVisible(false);
  };

  const confirmPace = () => {
    setSelectedPace(pendingPace);
    setPaceModalVisible(false);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const age = getAgeFromBirthDate(new Date(user.birth_date));
      const result = calcularNutricao({
        sex: user.sex,
        weight_kg: user.weight_kg,
        height_cm: user.height_cm,
        age,
        activity: user.activity,
        goal: selectedGoal,
        target_weight: user.target_weight,
        weekly_pace: selectedPace as 0.25 | 0.5 | 0.75 | 1.0,
      });

      const updates = {
        goal: selectedGoal,
        weekly_pace: selectedPace,
        tmb: result.tmb,
        tdee: result.tdee,
        daily_kcal: result.meta,
        protein_g: result.protein_g,
        carbo_g: result.carbo_g,
        fat_g: result.fat_g,
        target_date: result.target_date.toISOString().slice(0, 10),
      };

      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id);

      if (error) {
        Alert.alert("Erro", "Não foi possível salvar. Tente novamente.");
        return;
      }

      updateUser(updates);
      Alert.alert("Salvo!", "Plano recalculado com base nos novos dados ✓");
      goBack();
    } catch {
      Alert.alert("Erro", "Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => goBack()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Meu objetivo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Objetivo atual */}
        <Text style={styles.sectionLabel}>OBJETIVO</Text>
        <TouchableOpacity style={styles.card} onPress={openGoalModal} activeOpacity={0.7}>
          <View style={styles.cardInner}>
            <View style={styles.cardIconWrap}>
              <Ionicons
                name={currentGoal?.icon ?? "flag-outline"}
                size={20}
                color={Colors.greenDark}
              />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>{currentGoal?.label}</Text>
              <Text style={styles.cardSub}>{currentGoal?.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Ritmo semanal */}
        {showsPace(selectedGoal) && (
          <>
            <Text style={styles.sectionLabel}>RITMO SEMANAL</Text>
            <TouchableOpacity style={styles.card} onPress={openPaceModal} activeOpacity={0.7}>
              <View style={styles.cardInner}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name="speedometer-outline" size={20} color={Colors.greenDark} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardLabel}>{currentPace?.label}</Text>
                  <Text style={styles.cardSub}>{currentPace?.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Salvar */}
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && { opacity: 0.8 },
            saving && { opacity: 0.6 },
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Modal — Objetivo */}
      <Modal
        visible={goalModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setGoalModalVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Qual é seu objetivo?</Text>
            <Text style={styles.sheetSubtitle}>Selecione uma opção abaixo</Text>

            <View style={styles.optionsList}>
              {GOALS.map((g, i) => (
                <React.Fragment key={g.key}>
                  <TouchableOpacity
                    style={[
                      styles.optionRow,
                      pendingGoal === g.key && styles.optionRowActive,
                    ]}
                    onPress={() => setPendingGoal(g.key)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        pendingGoal === g.key && styles.optionIconActive,
                      ]}
                    >
                      <Ionicons
                        name={g.icon}
                        size={18}
                        color={pendingGoal === g.key ? Colors.greenDark : Colors.textSecondary}
                      />
                    </View>
                    <View style={styles.optionText}>
                      <Text
                        style={[
                          styles.optionLabel,
                          pendingGoal === g.key && styles.optionLabelActive,
                        ]}
                      >
                        {g.label}
                      </Text>
                      <Text style={styles.optionSub}>{g.subtitle}</Text>
                    </View>
                    <View style={[styles.radio, pendingGoal === g.key && styles.radioActive]}>
                      {pendingGoal === g.key && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                  {i < GOALS.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setGoalModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  pendingGoal === selectedGoal && styles.confirmBtnDisabled,
                ]}
                onPress={confirmGoal}
                disabled={pendingGoal === selectedGoal}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal — Ritmo */}
      <Modal
        visible={paceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaceModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setPaceModalVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Ritmo semanal</Text>
            <Text style={styles.sheetSubtitle}>Com qual velocidade quer progredir?</Text>

            <View style={styles.optionsList}>
              {PACE_OPTIONS.map((p, i) => (
                <React.Fragment key={p.value}>
                  <TouchableOpacity
                    style={[
                      styles.optionRow,
                      pendingPace === p.value && styles.optionRowActive,
                    ]}
                    onPress={() => setPendingPace(p.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionText}>
                      <Text
                        style={[
                          styles.optionLabel,
                          pendingPace === p.value && styles.optionLabelActive,
                        ]}
                      >
                        {p.label}
                      </Text>
                      <Text style={styles.optionSub}>{p.subtitle}</Text>
                    </View>
                    <View style={[styles.radio, pendingPace === p.value && styles.radioActive]}>
                      {pendingPace === p.value && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                  {i < PACE_OPTIONS.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPaceModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  pendingPace === selectedPace && styles.confirmBtnDisabled,
                ]}
                onPress={confirmPace}
                disabled={pendingPace === selectedPace}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: { ...Typography.h4, color: Colors.text },

  // Content
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 110, gap: Spacing.sm },
  sectionLabel: {
    ...Typography.label,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    marginLeft: Spacing.xs,
  },

  // Card (toque para abrir modal)
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1 },
  cardLabel: { ...Typography.body, fontWeight: "600", color: Colors.text },
  cardSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },

  // Save button
  saveBtn: {
    backgroundColor: Colors.greenDark,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  saveBtnText: { ...Typography.body, fontWeight: "700", color: "#FFF" },

  // Modal overlay
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl + 16,
    paddingHorizontal: Spacing.xl,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  sheetTitle: { ...Typography.h4, color: Colors.text, marginBottom: 4 },
  sheetSubtitle: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.lg },

  // Options inside modal
  optionsList: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  optionRowActive: { backgroundColor: Colors.greenLight },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconActive: { backgroundColor: Colors.greenLight },
  optionText: { flex: 1 },
  optionLabel: { ...Typography.body, fontWeight: "600", color: Colors.text },
  optionLabelActive: { color: Colors.greenDark },
  optionSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: Colors.greenDark },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.greenDark },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.lg },

  // Modal actions
  sheetActions: { flexDirection: "row", gap: Spacing.sm },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelBtnText: { ...Typography.body, fontWeight: "600", color: Colors.textSecondary },
  confirmBtn: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: Colors.greenDark,
    alignItems: "center",
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { ...Typography.body, fontWeight: "700", color: "#FFF" },
});
