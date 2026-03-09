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

const NOTIFICATIONS = [
  { id: "refeicoes", label: "Lembretes de refeição", subtitle: "Avisos nos horários das refeições", icon: "restaurant-outline" },
  { id: "agua", label: "Hidratação", subtitle: "Lembrar de beber água", icon: "water-outline" },
  { id: "treino", label: "Treino", subtitle: "Hora de se exercitar", icon: "barbell-outline" },
  { id: "progresso", label: "Progresso semanal", subtitle: "Resumo toda segunda-feira", icon: "trending-up-outline" },
  { id: "streak", label: "Sequência em risco", subtitle: "Aviso quando a sequência pode quebrar", icon: "flame-outline" },
  { id: "dicas", label: "Dicas de nutrição", subtitle: "Conteúdo personalizado", icon: "bulb-outline" },
];

export default function NotificacoesScreen() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    refeicoes: true,
    agua: true,
    streak: true,
  });

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => goBack()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notificações</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>PREFERÊNCIAS</Text>
        <View style={styles.card}>
          {NOTIFICATIONS.map((n, i) => (
            <React.Fragment key={n.id}>
              <View style={styles.itemRow}>
                <View style={styles.itemIcon}>
                  <Ionicons name={n.icon as any} size={20} color={Colors.textSecondary} />
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.itemLabel}>{n.label}</Text>
                  <Text style={styles.itemSub}>{n.subtitle}</Text>
                </View>
                <Switch
                  value={!!enabled[n.id]}
                  onValueChange={(v) => setEnabled((prev) => ({ ...prev, [n.id]: v }))}
                  trackColor={{ false: Colors.border, true: Colors.green }}
                  thumbColor={enabled[n.id] ? Colors.greenDark : Colors.textMuted}
                />
              </View>
              {i < NOTIFICATIONS.length - 1 && <View style={styles.divider} />}
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
  itemIcon: { width: 40, height: 40, borderRadius: Radius.sm, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" },
  itemText: { flex: 1 },
  itemLabel: { ...Typography.body, fontWeight: "600", color: Colors.text },
  itemSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 68 },
});
