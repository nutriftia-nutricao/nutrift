import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { goBack } from "../../utils/navigation";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";
import { supabase } from "../../services/supabase";
import { useActivityStore } from "../../stores/useActivityStore";
import { useUserStore } from "../../stores/useUserStore";
import type { UserActivity, UserWorkoutType } from "../../types/user";

const ACTIVITIES: { key: UserActivity; label: string; subtitle: string }[] = [
  { key: "sedentario", label: "Sedentário", subtitle: "Pouco ou nenhum exercício" },
  { key: "levemente_ativo", label: "Levemente ativo", subtitle: "1–3 dias por semana" },
  { key: "moderado", label: "Moderadamente ativo", subtitle: "3–5 dias por semana" },
  { key: "muito_ativo", label: "Muito ativo", subtitle: "6–7 dias por semana" },
];

const WORKOUT_TYPES: { key: UserWorkoutType; label: string; subtitle: string }[] = [
  { key: "nao_pratico", label: "Não pratico", subtitle: "Sem rotina de treino" },
  { key: "casa", label: "Em casa", subtitle: "Treino em casa" },
  { key: "academia", label: "Academia", subtitle: "Treino em academia" },
];

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function TreinoScreen() {
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);

  const [activity, setActivity] = useState<UserActivity>(user?.activity ?? "moderado");
  const [workoutType, setWorkoutType] = useState<UserWorkoutType>(
    user?.workout_type ?? "nao_pratico"
  );
  const [workoutTime, setWorkoutTime] = useState<string>(user?.workout_time ?? "");
  const [trainingDays, setTrainingDays] = useState<string[]>(["Seg", "Qua", "Sex"]);
  const [goalMinutes, setGoalMinutes] = useState<number>(
    useActivityStore.getState().goalMinutesPerDay
  );
  const [saving, setSaving] = useState(false);

  const toggleDay = (d: string) =>
    setTrainingDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert("Erro", "Faça login novamente para salvar suas configurações.");
      return;
    }

    setSaving(true);
    try {
      const normalizedWorkoutTime = workoutTime.trim() || null;
      const updates = {
        activity,
        workout_type: workoutType,
        workout_time: normalizedWorkoutTime,
      };

      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id);

      if (error) {
        Alert.alert("Erro", "Não foi possível salvar. Tente novamente.");
        return;
      }

      // Meta de atividade é local (store), não faz parte do perfil no banco hoje.
      useActivityStore.getState().setGoalMinutes(goalMinutes);
      updateUser(updates);
      Alert.alert("Salvo!", "Configurações atualizadas ✓");
      goBack();
    } catch (e) {
      console.error("[perfil/treino] save error:", e);
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
        <Text style={styles.headerTitle}>Atividades</Text>
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

        <Text style={styles.sectionLabel}>TIPO DE TREINO</Text>
        <View style={styles.card}>
          {WORKOUT_TYPES.map((t, i) => (
            <React.Fragment key={t.key}>
              <Pressable
                style={[styles.optionRow, workoutType === t.key && styles.optionRowActive]}
                onPress={() => setWorkoutType(t.key)}
              >
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, workoutType === t.key && styles.optionLabelActive]}>
                    {t.label}
                  </Text>
                  <Text style={styles.optionSub}>{t.subtitle}</Text>
                </View>
                <View style={[styles.radio, workoutType === t.key && styles.radioActive]}>
                  {workoutType === t.key && <View style={styles.radioDot} />}
                </View>
              </Pressable>
              {i < WORKOUT_TYPES.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.sectionLabel}>HORÁRIO DO TREINO (OPCIONAL)</Text>
        <View style={styles.card}>
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Ex.: 07:30 ou Noite</Text>
            <TextInput
              value={workoutTime}
              onChangeText={setWorkoutTime}
              placeholder="—"
              placeholderTextColor={Colors.textMuted}
              style={styles.fieldInput}
              autoCapitalize="sentences"
              autoCorrect={false}
            />
          </View>
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
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && { opacity: 0.8 },
            saving && { opacity: 0.6 },
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? "Salvando..." : "Salvar configurações"}
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
  fieldWrap: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  fieldLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 },
  fieldInput: { ...Typography.body, color: Colors.text, paddingVertical: 6 },
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
