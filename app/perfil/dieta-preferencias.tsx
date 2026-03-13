import { Ionicons } from "@expo/vector-icons";
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
import type { UserDietType, UserRestriction } from "../../types/user";

const MEALS = [
  { value: 2, label: "2 refeições" },
  { value: 3, label: "3 refeições" },
  { value: 4, label: "4 refeições" },
  { value: 5, label: "5 refeições" },
  { value: 6, label: "6 refeições" },
];

const DIET_OPTIONS: { id: UserDietType; label: string }[] = [
  { id: "onivoro", label: "Equilibrada" },
  { id: "low_carb", label: "Low carb" },
  { id: "vegetariano", label: "Vegetariana" },
  { id: "vegano", label: "Vegana" },
];

const RESTRICTION_OPTIONS: { id: UserRestriction; label: string }[] = [
  { id: "sem_gluten", label: "Sem glúten" },
  { id: "sem_lactose", label: "Sem lactose" },
];

export default function DietaPreferenciasScreen() {
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);

  const [selectedDiet, setSelectedDiet] = useState<UserDietType>(user?.diet_type ?? "onivoro");
  const [selectedRestrictions, setSelectedRestrictions] = useState<UserRestriction[]>(
    user?.restrictions ?? []
  );
  const [mealsPerDay, setMealsPerDay] = useState<number>(user?.meals_per_day ?? 4);
  const [saving, setSaving] = useState(false);

  const toggleRestriction = (r: UserRestriction) => {
    setSelectedRestrictions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert("Erro", "Faça login novamente para salvar suas preferências.");
      return;
    }

    setSaving(true);
    try {
      const updates = {
        diet_type: selectedDiet,
        restrictions: selectedRestrictions,
        meals_per_day: mealsPerDay,
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
      Alert.alert("Salvo!", "Preferências atualizadas ✓");
      goBack();
    } catch (e) {
      console.error("[perfil/dieta-preferencias] save error:", e);
      Alert.alert("Erro", "Não foi possível salvar.");
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
        <Text style={styles.headerTitle}>Dieta e preferências</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>TIPO DE DIETA</Text>
        <View style={styles.card}>
          {DIET_OPTIONS.map((d, i) => (
            <React.Fragment key={d.id}>
              <Pressable
                style={[styles.optionRow, selectedDiet === d.id && styles.optionRowActive]}
                onPress={() => setSelectedDiet(d.id)}
              >
                <Text style={[styles.optionLabel, selectedDiet === d.id && styles.optionLabelActive]}>
                  {d.label}
                </Text>
                {selectedDiet === d.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.greenDark} />
                )}
              </Pressable>
              {i < DIET_OPTIONS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.sectionLabel}>RESTRIÇÕES</Text>
        <View style={styles.chipWrap}>
          {RESTRICTION_OPTIONS.map((r) => (
            <Pressable
              key={r.id}
              style={[styles.chip, selectedRestrictions.includes(r.id) && styles.chipActive]}
              onPress={() => toggleRestriction(r.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedRestrictions.includes(r.id) && styles.chipTextActive,
                ]}
              >
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>REFEIÇÕES POR DIA</Text>
        <View style={styles.card}>
          {MEALS.map((m, i) => (
            <React.Fragment key={m.value}>
              <Pressable
                style={[styles.optionRow, mealsPerDay === m.value && styles.optionRowActive]}
                onPress={() => setMealsPerDay(m.value)}
              >
                <Text style={[styles.optionLabel, mealsPerDay === m.value && styles.optionLabelActive]}>{m.label}</Text>
                {mealsPerDay === m.value && <Ionicons name="checkmark-circle" size={20} color={Colors.greenDark} />}
              </Pressable>
              {i < MEALS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

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
            {saving ? "Salvando..." : "Salvar preferências"}
          </Text>
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
  optionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  optionRowActive: { backgroundColor: Colors.greenLight },
  optionLabel: { ...Typography.body, color: Colors.text },
  optionLabelActive: { color: Colors.greenDark, fontWeight: "600" },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.lg },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  chipActive: { backgroundColor: Colors.greenLight, borderColor: Colors.green },
  chipText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: "600" },
  chipTextActive: { color: Colors.greenDark },
  saveBtn: { backgroundColor: Colors.greenDark, borderRadius: Radius.pill, paddingVertical: Spacing.lg, alignItems: "center", marginTop: Spacing.lg },
  saveBtnText: { ...Typography.body, fontWeight: "700", color: "#FFF" },
});
