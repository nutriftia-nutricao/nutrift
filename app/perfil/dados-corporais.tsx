import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";
import { useUserStore } from "../../stores/useUserStore";

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  suffix?: string;
  keyboardType?: "numeric" | "default";
}

function Field({ label, value, onChangeText, suffix, keyboardType = "default" }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRow}>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor={Colors.textMuted}
        />
        {suffix ? <Text style={styles.fieldSuffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

export default function DadosCorporaisScreen() {
  const user = useUserStore((s) => s.user);
  const [name, setName] = useState(user?.name ?? "");
  const [weight, setWeight] = useState(String(user?.weight_kg ?? ""));
  const [height, setHeight] = useState(String(user?.height_cm ?? ""));
  const [targetWeight, setTargetWeight] = useState(String(user?.target_weight ?? ""));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      Alert.alert("Salvo!", "Dados corporais atualizados.");
      router.back();
    } catch {
      Alert.alert("Erro", "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Dados corporais</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Resumo atual */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{user?.weight_kg ?? "—"}</Text>
            <Text style={styles.summaryUnit}>kg atual</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{user?.height_cm ?? "—"}</Text>
            <Text style={styles.summaryUnit}>cm altura</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{user?.target_weight ?? "—"}</Text>
            <Text style={styles.summaryUnit}>kg meta</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>INFORMAÇÕES PESSOAIS</Text>
        <View style={styles.card}>
          <Field label="Nome completo" value={name} onChangeText={setName} />
          <View style={styles.divider} />
          <Field label="Peso atual" value={weight} onChangeText={setWeight} suffix="kg" keyboardType="numeric" />
          <View style={styles.divider} />
          <Field label="Altura" value={height} onChangeText={setHeight} suffix="cm" keyboardType="numeric" />
          <View style={styles.divider} />
          <Field label="Peso meta" value={targetWeight} onChangeText={setTargetWeight} suffix="kg" keyboardType="numeric" />
        </View>

        <Text style={styles.sectionLabel}>PLANO NUTRICIONAL ATUAL</Text>
        <View style={styles.macroCard}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{user?.daily_kcal ?? "—"}</Text>
            <Text style={styles.macroLabel}>kcal/dia</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: Colors.protein }]}>{user?.protein_g ?? "—"}g</Text>
            <Text style={styles.macroLabel}>Proteína</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: Colors.carbo }]}>{user?.carbo_g ?? "—"}g</Text>
            <Text style={styles.macroLabel}>Carbos</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: Colors.fat }]}>{user?.fat_g ?? "—"}g</Text>
            <Text style={styles.macroLabel}>Gordura</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
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
  summaryCard: { flexDirection: "row", backgroundColor: Colors.greenLight, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.sm },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { ...Typography.h3, color: Colors.greenDark },
  summaryUnit: { ...Typography.caption, color: Colors.greenDark, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: `${Colors.greenDark}30` },
  sectionLabel: { ...Typography.label, fontSize: 11, color: Colors.textMuted, marginTop: Spacing.md, marginLeft: Spacing.xs },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  fieldWrap: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  fieldLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 },
  fieldRow: { flexDirection: "row", alignItems: "center" },
  fieldInput: { flex: 1, ...Typography.body, color: Colors.text, paddingVertical: 4 },
  fieldSuffix: { ...Typography.body, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.lg },
  macroCard: { flexDirection: "row", backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg },
  macroItem: { flex: 1, alignItems: "center" },
  macroValue: { ...Typography.h4, color: Colors.text },
  macroLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  saveBtn: { backgroundColor: Colors.greenDark, borderRadius: Radius.pill, paddingVertical: Spacing.lg, alignItems: "center", marginTop: Spacing.lg },
  saveBtnText: { ...Typography.body, fontWeight: "700", color: "#FFF" },
});
