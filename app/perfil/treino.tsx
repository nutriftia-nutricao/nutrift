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
import type { UserActivity } from "../../types/user";

const ACTIVITIES: { key: UserActivity; label: string; subtitle: string }[] = [
  { key: "sedentario", label: "Sedentário", subtitle: "Pouco ou nenhum exercício" },
  { key: "levemente_ativo", label: "Levemente ativo", subtitle: "1–3 dias por semana" },
  { key: "moderado", label: "Moderadamente ativo", subtitle: "3–5 dias por semana" },
  { key: "muito_ativo", label: "Muito ativo", subtitle: "6–7 dias por semana" },
];

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function TreinoScreen() {
  const [activity, setActivity] = useState<UserActivity>("moderado");
  const [trainingDays, setTrainingDays] = useState<string[]>(["Seg", "Qua", "Sex"]);
  const [goalMinutes, setGoalMinutes] = useState(45);

  const toggleDay = (d: string) =>
    setTrainingDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => goBack()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Treino</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>NÍVEL DE ATIVIDADE</Text>
        <View style={styles.card}>
          {ACTIVITIES.map((a, i) => (
            <React.Fragment key={a.key}>
              <Pressable
                style={[styles.optionRow, activity === a.key && styles.optionRowActive]}
                onPress={() => setActivity(a.key)}
              >
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, activity === a.key && styles.optionLabelActive]}>{a.label}</Text>
                  <Text style={styles.optionSub}>{a.subtitle}</Text>
                </View>
                <View style={[styles.radio, activity === a.key && styles.radioActive]}>
                  {activity === a.key && <View style={styles.radioDot} />}
                </View>
              </Pressable>
              {i < ACTIVITIES.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.sectionLabel}>DIAS DE TREINO</Text>
        <View style={styles.daysWrap}>
          {DAYS.map((d) => (
            <Pressable
              key={d}
              style={[styles.dayBtn, trainingDays.includes(d) && styles.dayBtnActive]}
              onPress={() => toggleDay(d)}
            >
              <Text style={[styles.dayText, trainingDays.includes(d) && styles.dayTextActive]}>{d}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>META DIÁRIA DE ATIVIDADE</Text>
        <View style={styles.card}>
          {[20, 30, 45, 60, 90].map((min, i, arr) => (
            <React.Fragment key={min}>
              <Pressable
                style={[styles.optionRow, goalMinutes === min && styles.optionRowActive]}
                onPress={() => setGoalMinutes(min)}
              >
                <Text style={[styles.optionLabel, goalMinutes === min && styles.optionLabelActive]}>{min} minutos</Text>
                {goalMinutes === min && <Ionicons name="checkmark-circle" size={20} color={Colors.greenDark} />}
              </Pressable>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
          onPress={() => { Alert.alert("Salvo!"); goBack(); }}
        >
          <Text style={styles.saveBtnText}>Salvar configurações</Text>
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
  optionText: { flex: 1 },
  optionLabel: { ...Typography.body, color: Colors.text },
  optionLabelActive: { color: Colors.greenDark, fontWeight: "600" },
  optionSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: Colors.greenDark },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.greenDark },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.lg },
  daysWrap: { flexDirection: "row", gap: Spacing.sm },
  dayBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: "center" },
  dayBtnActive: { backgroundColor: Colors.greenLight, borderColor: Colors.green },
  dayText: { ...Typography.caption, fontWeight: "700", color: Colors.textSecondary },
  dayTextActive: { color: Colors.greenDark },
  saveBtn: { backgroundColor: Colors.greenDark, borderRadius: Radius.pill, paddingVertical: Spacing.lg, alignItems: "center", marginTop: Spacing.lg },
  saveBtnText: { ...Typography.body, fontWeight: "700", color: "#FFF" },
});
