import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { goBack } from "../../utils/navigation";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";

const INTEGRATIONS = [
  { id: "apple_health", label: "Apple Health", subtitle: "Sincronizar passos e calorias", icon: "heart-outline", available: true },
  { id: "google_fit", label: "Google Fit", subtitle: "Sincronizar atividades", icon: "fitness-outline", available: true },
  { id: "apple_watch", label: "Apple Watch", subtitle: "Monitoramento contínuo", icon: "watch-outline", available: false },
  { id: "garmin", label: "Garmin", subtitle: "Dados de treino e sono", icon: "speedometer-outline", available: false },
  { id: "wear_os", label: "Wear OS", subtitle: "Smartwatch Android", icon: "watch-outline", available: false },
];

export default function IntegracoesScreen() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => goBack()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Integrações</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>DISPONÍVEIS</Text>
        <View style={styles.card}>
          {INTEGRATIONS.filter((i) => i.available).map((item, idx, arr) => (
            <React.Fragment key={item.id}>
              <View style={styles.itemRow}>
                <View style={styles.itemIcon}>
                  <Ionicons name={item.icon as any} size={20} color={Colors.textSecondary} />
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemSub}>{item.subtitle}</Text>
                </View>
                <Switch
                  value={!!enabled[item.id]}
                  onValueChange={(v) => setEnabled((prev) => ({ ...prev, [item.id]: v }))}
                  trackColor={{ false: Colors.border, true: Colors.green }}
                  thumbColor={enabled[item.id] ? Colors.greenDark : Colors.textMuted}
                />
              </View>
              {idx < arr.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.sectionLabel}>EM BREVE</Text>
        <View style={styles.card}>
          {INTEGRATIONS.filter((i) => !i.available).map((item, idx, arr) => (
            <React.Fragment key={item.id}>
              <View style={[styles.itemRow, styles.itemRowDisabled]}>
                <View style={styles.itemIcon}>
                  <Ionicons name={item.icon as any} size={20} color={Colors.textMuted} />
                </View>
                <View style={styles.itemText}>
                  <Text style={[styles.itemLabel, { color: Colors.textMuted }]}>{item.label}</Text>
                  <Text style={styles.itemSub}>{item.subtitle}</Text>
                </View>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Em breve</Text>
                </View>
              </View>
              {idx < arr.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
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
  itemRow: { flexDirection: "row", alignItems: "center", padding: Spacing.lg, gap: Spacing.md },
  itemRowDisabled: { opacity: 0.6 },
  itemIcon: { width: 40, height: 40, borderRadius: Radius.sm, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" },
  itemText: { flex: 1 },
  itemLabel: { ...Typography.body, fontWeight: "600", color: Colors.text },
  itemSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 68 },
  comingSoonBadge: { backgroundColor: Colors.border, borderRadius: Radius.pill, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  comingSoonText: { ...Typography.caption, fontSize: 11, color: Colors.textSecondary, fontWeight: "600" },
});
