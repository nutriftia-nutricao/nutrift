import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { goBack } from "../../utils/navigation";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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

const GOALS: { key: UserGoal; label: string; subtitle: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { key: "perder_gordura", label: "Perder gordura", subtitle: "Déficit calórico controlado", icon: "trending-down-outline" },
  { key: "ganhar_massa", label: "Ganhar massa", subtitle: "Superávit calórico progressivo", icon: "trending-up-outline" },
  { key: "manter", label: "Manter peso", subtitle: "Equilíbrio calórico", icon: "remove-outline" },
];

const PACE_OPTIONS = [
  { value: 0.25, label: "0,25 kg/semana", subtitle: "Devagar e consistente" },
  { value: 0.5, label: "0,5 kg/semana", subtitle: "Ritmo recomendado" },
  { value: 0.75, label: "0,75 kg/semana", subtitle: "Moderado" },
  { value: 1.0, label: "1,0 kg/semana", subtitle: "Agressivo" },
];

export default function MeuObjetivoScreen() {
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const [selectedGoal, setSelectedGoal] = useState<UserGoal>(user?.goal ?? "perder_gordura");
  const [selectedPace, setSelectedPace] = useState<number>(user?.weekly_pace ?? 0.5);
  const [saving, setSaving] = useState(false);

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
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => goBack()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Meu objetivo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>QUAL É SEU OBJETIVO?</Text>
        <View style={styles.card}>
          {GOALS.map((g, i) => (
            <React.Fragment key={g.key}>
              <Pressable
                style={[styles.optionRow, selectedGoal === g.key && styles.optionRowActive]}
                onPress={() => setSelectedGoal(g.key)}
              >
                <View style={[styles.optionIcon, selectedGoal === g.key && styles.optionIconActive]}>
                  <Ionicons name={g.icon} size={20} color={selectedGoal === g.key ? Colors.greenDark : Colors.textSecondary} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, selectedGoal === g.key && styles.optionLabelActive]}>{g.label}</Text>
                  <Text style={styles.optionSub}>{g.subtitle}</Text>
                </View>
                <View style={[styles.radio, selectedGoal === g.key && styles.radioActive]}>
                  {selectedGoal === g.key && <View style={styles.radioDot} />}
                </View>
              </Pressable>
              {i < GOALS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {selectedGoal !== "manter" && (
          <>
            <Text style={styles.sectionLabel}>RITMO SEMANAL</Text>
            <View style={styles.card}>
              {PACE_OPTIONS.map((p, i) => (
                <React.Fragment key={p.value}>
                  <Pressable
                    style={[styles.optionRow, selectedPace === p.value && styles.optionRowActive]}
                    onPress={() => setSelectedPace(p.value)}
                  >
                    <View style={styles.optionText}>
                      <Text style={[styles.optionLabel, selectedPace === p.value && styles.optionLabelActive]}>{p.label}</Text>
                      <Text style={styles.optionSub}>{p.subtitle}</Text>
                    </View>
                    <View style={[styles.radio, selectedPace === p.value && styles.radioActive]}>
                      {selectedPace === p.value && <View style={styles.radioDot} />}
                    </View>
                  </Pressable>
                  {i < PACE_OPTIONS.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>
          </>
        )}

        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? "Salvando..." : "Salvar alterações"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: Radius.pill, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  headerTitle: { ...Typography.h4, color: Colors.text },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 110, gap: Spacing.sm },
  sectionLabel: { ...Typography.label, fontSize: 11, color: Colors.textMuted, marginTop: Spacing.md, marginLeft: Spacing.xs },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  optionRow: { flexDirection: "row", alignItems: "center", padding: Spacing.lg, gap: Spacing.md },
  optionRowActive: { backgroundColor: Colors.greenLight },
  optionIcon: { width: 40, height: 40, borderRadius: Radius.sm, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" },
  optionIconActive: { backgroundColor: Colors.greenLight },
  optionText: { flex: 1 },
  optionLabel: { ...Typography.body, fontWeight: "600", color: Colors.text },
  optionLabelActive: { color: Colors.greenDark },
  optionSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: Colors.greenDark },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.greenDark },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.lg },
  saveBtn: { backgroundColor: Colors.greenDark, borderRadius: Radius.pill, paddingVertical: Spacing.lg, alignItems: "center", marginTop: Spacing.lg },
  saveBtnText: { ...Typography.body, fontWeight: "700", color: "#FFF" },
});
