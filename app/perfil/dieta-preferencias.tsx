import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";

const DIETS = ["Equilibrada", "Low carb", "Cetogênica", "Vegetariana", "Vegana", "Sem glúten", "Sem lactose"];
const ALLERGIES = ["Amendoim", "Frutos do mar", "Ovos", "Leite", "Soja", "Trigo", "Nozes"];
const MEALS = [
  { value: 2, label: "2 refeições" },
  { value: 3, label: "3 refeições" },
  { value: 4, label: "4 refeições" },
  { value: 5, label: "5 refeições" },
  { value: 6, label: "6 refeições" },
];

export default function DietaPreferenciasScreen() {
  const [selectedDiet, setSelectedDiet] = useState("Equilibrada");
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [mealsPerDay, setMealsPerDay] = useState(4);

  const toggleAllergy = (a: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Dieta e preferências</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>TIPO DE DIETA</Text>
        <View style={styles.card}>
          {DIETS.map((d, i) => (
            <React.Fragment key={d}>
              <Pressable
                style={[styles.optionRow, selectedDiet === d && styles.optionRowActive]}
                onPress={() => setSelectedDiet(d)}
              >
                <Text style={[styles.optionLabel, selectedDiet === d && styles.optionLabelActive]}>{d}</Text>
                {selectedDiet === d && <Ionicons name="checkmark-circle" size={20} color={Colors.greenDark} />}
              </Pressable>
              {i < DIETS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.sectionLabel}>ALERGIAS E RESTRIÇÕES</Text>
        <View style={styles.chipWrap}>
          {ALLERGIES.map((a) => (
            <Pressable
              key={a}
              style={[styles.chip, selectedAllergies.includes(a) && styles.chipActive]}
              onPress={() => toggleAllergy(a)}
            >
              <Text style={[styles.chipText, selectedAllergies.includes(a) && styles.chipTextActive]}>{a}</Text>
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
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
          onPress={() => { Alert.alert("Salvo!"); router.back(); }}
        >
          <Text style={styles.saveBtnText}>Salvar preferências</Text>
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
