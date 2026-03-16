import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { goBack } from "../../utils/navigation";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import type { UserDietType, UserRestriction } from "../../types/user";

const DIET_OPTIONS: {
  id: UserDietType;
  label: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  { id: "onivoro", label: "Equilibrada", subtitle: "Todos os grupos alimentares", icon: "nutrition-outline" },
  { id: "low_carb", label: "Low Carb", subtitle: "Redução de carboidratos", icon: "leaf-outline" },
  { id: "vegetariano", label: "Vegetariana", subtitle: "Sem carnes, com ovos e laticínios", icon: "flower-outline" },
  { id: "vegano", label: "Vegana", subtitle: "100% de origem vegetal", icon: "planet-outline" },
];

const RESTRICTION_OPTIONS: {
  id: UserRestriction;
  label: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  { id: "sem_gluten", label: "Sem glúten", subtitle: "Evita trigo, cevada e centeio", icon: "alert-circle-outline" },
  { id: "sem_lactose", label: "Sem lactose", subtitle: "Evita laticínios e derivados", icon: "remove-circle-outline" },
];

const MEALS_OPTIONS = [
  { value: 2, label: "2 refeições", subtitle: "Jejum intermitente ou OMAD" },
  { value: 3, label: "3 refeições", subtitle: "Café, almoço e jantar" },
  { value: 4, label: "4 refeições", subtitle: "Com um lanche intermediário" },
  { value: 5, label: "5 refeições", subtitle: "Refeições menores e frequentes" },
  { value: 6, label: "6 refeições", subtitle: "Alta frequência alimentar" },
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

  // Macros customizados
  const hasCustomPct = user?.protein_pct != null;
  const defaultPcts = () => {
    const total = (user?.protein_g ?? 0) * 4 + (user?.carbo_g ?? 0) * 4 + (user?.fat_g ?? 0) * 9;
    if (!total) return { p: 30, c: 40, f: 30 };
    return {
      p: Math.round(((user?.protein_g ?? 0) * 4 * 100) / total),
      c: Math.round(((user?.carbo_g ?? 0) * 4 * 100) / total),
      f: Math.round(((user?.fat_g ?? 0) * 9 * 100) / total),
    };
  };
  const initPcts = hasCustomPct && user
    ? { p: user.protein_pct!, c: user.carbo_pct!, f: user.fat_pct! }
    : defaultPcts();
  const [customMacros, setCustomMacros] = useState(hasCustomPct);
  const [proteinPct, setProteinPct] = useState(initPcts.p);
  const [carboPct, setCarboPct] = useState(initPcts.c);
  const [fatPct, setFatPct] = useState(initPcts.f);

  const pctSum = proteinPct + carboPct + fatPct;
  const kcal = user?.daily_kcal ?? 0;
  const previewProtein = Math.round((kcal * proteinPct) / 100 / 4);
  const previewCarbo = Math.round((kcal * carboPct) / 100 / 4);
  const previewFat = Math.round((kcal * fatPct) / 100 / 9);

  // Modal de dieta
  const [dietModalVisible, setDietModalVisible] = useState(false);
  const [pendingDiet, setPendingDiet] = useState<UserDietType>(selectedDiet);

  // Modal de refeições
  const [mealsModalVisible, setMealsModalVisible] = useState(false);
  const [pendingMeals, setPendingMeals] = useState<number>(mealsPerDay);

  // Modal de restrições
  const [restrictionsModalVisible, setRestrictionsModalVisible] = useState(false);
  const [pendingRestrictions, setPendingRestrictions] = useState<UserRestriction[]>(
    selectedRestrictions
  );

  const currentDiet = DIET_OPTIONS.find((d) => d.id === selectedDiet);
  const currentMeals = MEALS_OPTIONS.find((m) => m.value === mealsPerDay);
  const restrictionsLabel =
    selectedRestrictions.length === 0
      ? "Nenhuma restrição"
      : selectedRestrictions
          .map((r) => RESTRICTION_OPTIONS.find((o) => o.id === r)?.label)
          .filter(Boolean)
          .join(", ");

  const openDietModal = () => {
    setPendingDiet(selectedDiet);
    setDietModalVisible(true);
  };

  const openMealsModal = () => {
    setPendingMeals(mealsPerDay);
    setMealsModalVisible(true);
  };

  const openRestrictionsModal = () => {
    setPendingRestrictions([...selectedRestrictions]);
    setRestrictionsModalVisible(true);
  };

  const confirmDiet = () => {
    setSelectedDiet(pendingDiet);
    setDietModalVisible(false);
  };

  const confirmMeals = () => {
    setMealsPerDay(pendingMeals);
    setMealsModalVisible(false);
  };

  const confirmRestrictions = () => {
    setSelectedRestrictions(pendingRestrictions);
    setRestrictionsModalVisible(false);
  };

  const togglePendingRestriction = (r: UserRestriction) => {
    setPendingRestrictions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const restrictionsChanged =
    pendingRestrictions.length !== selectedRestrictions.length ||
    pendingRestrictions.some((r) => !selectedRestrictions.includes(r));

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert("Erro", "Faça login novamente para salvar suas preferências.");
      return;
    }

    if (customMacros && pctSum !== 100) {
      Alert.alert("Percentuais inválidos", `A soma deve ser 100%. Atual: ${pctSum}%.`);
      return;
    }

    setSaving(true);
    try {
      const updates = {
        diet_type: selectedDiet,
        restrictions: selectedRestrictions,
        meals_per_day: mealsPerDay,
        protein_pct: customMacros ? proteinPct : null,
        carbo_pct: customMacros ? carboPct : null,
        fat_pct: customMacros ? fatPct : null,
        ...(customMacros && {
          protein_g: previewProtein,
          carbo_g: previewCarbo,
          fat_g: previewFat,
        }),
      };

      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id);

      if (error) {
        Alert.alert("Erro ao salvar", error.message);
        return;
      }

      updateUser(updates);
      Alert.alert("Salvo!", "Preferências atualizadas ✓");
      goBack();
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível salvar.");
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
        <Text style={styles.headerTitle}>Dieta e preferências</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tipo de dieta */}
        <Text style={styles.sectionLabel}>TIPO DE DIETA</Text>
        <TouchableOpacity style={styles.card} onPress={openDietModal} activeOpacity={0.7}>
          <View style={styles.cardInner}>
            <View style={styles.cardIconWrap}>
              <Ionicons
                name={currentDiet?.icon ?? "nutrition-outline"}
                size={20}
                color={Colors.greenDark}
              />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>{currentDiet?.label}</Text>
              <Text style={styles.cardSub}>{currentDiet?.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Refeições por dia */}
        <Text style={styles.sectionLabel}>REFEIÇÕES POR DIA</Text>
        <TouchableOpacity style={styles.card} onPress={openMealsModal} activeOpacity={0.7}>
          <View style={styles.cardInner}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="restaurant-outline" size={20} color={Colors.greenDark} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>{currentMeals?.label}</Text>
              <Text style={styles.cardSub}>{currentMeals?.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Restrições */}
        <Text style={styles.sectionLabel}>RESTRIÇÕES ALIMENTARES</Text>
        <TouchableOpacity style={styles.card} onPress={openRestrictionsModal} activeOpacity={0.7}>
          <View style={styles.cardInner}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="ban-outline" size={20} color={Colors.greenDark} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>{restrictionsLabel}</Text>
              <Text style={styles.cardSub}>Toque para editar suas restrições</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Plano nutricional atual */}
        <Text style={styles.sectionLabel}>PLANO NUTRICIONAL ATUAL</Text>
        <View style={styles.macroCard}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{user?.daily_kcal ?? "—"}</Text>
            <Text style={styles.macroLabel}>kcal/dia</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: Colors.protein }]}>
              {customMacros ? previewProtein : (user?.protein_g ?? "—")}g
            </Text>
            <Text style={styles.macroLabel}>Proteína</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: Colors.carbo }]}>
              {customMacros ? previewCarbo : (user?.carbo_g ?? "—")}g
            </Text>
            <Text style={styles.macroLabel}>Carbos</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: Colors.fat }]}>
              {customMacros ? previewFat : (user?.fat_g ?? "—")}g
            </Text>
            <Text style={styles.macroLabel}>Gordura</Text>
          </View>
        </View>

        {/* Toggle personalizar macros */}
        <View style={styles.macroToggleRow}>
          <View>
            <Text style={styles.macroToggleLabel}>Personalizar macros</Text>
            <Text style={styles.macroToggleSub}>Ajuste os percentuais manualmente</Text>
          </View>
          <Switch
            value={customMacros}
            onValueChange={(v: boolean) => {
              setCustomMacros(v);
              if (!v) {
                const d = defaultPcts();
                setProteinPct(d.p);
                setCarboPct(d.c);
                setFatPct(d.f);
              }
            }}
            trackColor={{ false: Colors.border, true: Colors.greenDark }}
            thumbColor={customMacros ? Colors.green : Colors.textMuted}
          />
        </View>

        {customMacros && (
          <View style={styles.card}>
            <View style={styles.pctRow}>
              <View style={styles.pctLabelWrap}>
                <Text style={[styles.pctDot, { backgroundColor: Colors.protein }]} />
                <Text style={styles.pctName}>Proteína</Text>
              </View>
              <View style={styles.pctControls}>
                <Pressable style={styles.pctBtn} onPress={() => setProteinPct((v) => Math.max(5, v - 1))}>
                  <Ionicons name="remove" size={16} color={Colors.text} />
                </Pressable>
                <Text style={styles.pctValue}>{proteinPct}%</Text>
                <Pressable style={styles.pctBtn} onPress={() => setProteinPct((v) => Math.min(70, v + 1))}>
                  <Ionicons name="add" size={16} color={Colors.text} />
                </Pressable>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.pctRow}>
              <View style={styles.pctLabelWrap}>
                <Text style={[styles.pctDot, { backgroundColor: Colors.carbo }]} />
                <Text style={styles.pctName}>Carboidratos</Text>
              </View>
              <View style={styles.pctControls}>
                <Pressable style={styles.pctBtn} onPress={() => setCarboPct((v) => Math.max(5, v - 1))}>
                  <Ionicons name="remove" size={16} color={Colors.text} />
                </Pressable>
                <Text style={styles.pctValue}>{carboPct}%</Text>
                <Pressable style={styles.pctBtn} onPress={() => setCarboPct((v) => Math.min(70, v + 1))}>
                  <Ionicons name="add" size={16} color={Colors.text} />
                </Pressable>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.pctRow}>
              <View style={styles.pctLabelWrap}>
                <Text style={[styles.pctDot, { backgroundColor: Colors.fat }]} />
                <Text style={styles.pctName}>Gordura</Text>
              </View>
              <View style={styles.pctControls}>
                <Pressable style={styles.pctBtn} onPress={() => setFatPct((v) => Math.max(5, v - 1))}>
                  <Ionicons name="remove" size={16} color={Colors.text} />
                </Pressable>
                <Text style={styles.pctValue}>{fatPct}%</Text>
                <Pressable style={styles.pctBtn} onPress={() => setFatPct((v) => Math.min(70, v + 1))}>
                  <Ionicons name="add" size={16} color={Colors.text} />
                </Pressable>
              </View>
            </View>
            <View style={[styles.pctSumRow, { backgroundColor: pctSum === 100 ? `${Colors.green}18` : `${Colors.error}18` }]}>
              <Ionicons
                name={pctSum === 100 ? "checkmark-circle" : "alert-circle"}
                size={14}
                color={pctSum === 100 ? Colors.green : Colors.error}
              />
              <Text style={[styles.pctSumText, { color: pctSum === 100 ? Colors.green : Colors.error }]}>
                {pctSum === 100 ? "Soma: 100% ✓" : `Soma: ${pctSum}% — ajuste para totalizar 100%`}
              </Text>
            </View>
          </View>
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
            {saving ? "Salvando..." : "Salvar preferências"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Modal — Tipo de dieta */}
      <Modal
        visible={dietModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDietModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setDietModalVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Tipo de dieta</Text>
            <Text style={styles.sheetSubtitle}>Escolha o estilo alimentar que melhor te representa</Text>

            <View style={styles.optionsList}>
              {DIET_OPTIONS.map((d, i) => (
                <React.Fragment key={d.id}>
                  <TouchableOpacity
                    style={[styles.optionRow, pendingDiet === d.id && styles.optionRowActive]}
                    onPress={() => setPendingDiet(d.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIcon, pendingDiet === d.id && styles.optionIconActive]}>
                      <Ionicons
                        name={d.icon}
                        size={18}
                        color={pendingDiet === d.id ? Colors.greenDark : Colors.textSecondary}
                      />
                    </View>
                    <View style={styles.optionText}>
                      <Text style={[styles.optionLabel, pendingDiet === d.id && styles.optionLabelActive]}>
                        {d.label}
                      </Text>
                      <Text style={styles.optionSub}>{d.subtitle}</Text>
                    </View>
                    <View style={[styles.radio, pendingDiet === d.id && styles.radioActive]}>
                      {pendingDiet === d.id && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                  {i < DIET_OPTIONS.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setDietModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, pendingDiet === selectedDiet && styles.confirmBtnDisabled]}
                onPress={confirmDiet}
                disabled={pendingDiet === selectedDiet}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal — Refeições por dia */}
      <Modal
        visible={mealsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMealsModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMealsModalVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Refeições por dia</Text>
            <Text style={styles.sheetSubtitle}>Quantas vezes você costuma se alimentar por dia?</Text>

            <View style={styles.optionsList}>
              {MEALS_OPTIONS.map((m, i) => (
                <React.Fragment key={m.value}>
                  <TouchableOpacity
                    style={[styles.optionRow, pendingMeals === m.value && styles.optionRowActive]}
                    onPress={() => setPendingMeals(m.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionText}>
                      <Text style={[styles.optionLabel, pendingMeals === m.value && styles.optionLabelActive]}>
                        {m.label}
                      </Text>
                      <Text style={styles.optionSub}>{m.subtitle}</Text>
                    </View>
                    <View style={[styles.radio, pendingMeals === m.value && styles.radioActive]}>
                      {pendingMeals === m.value && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                  {i < MEALS_OPTIONS.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setMealsModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, pendingMeals === mealsPerDay && styles.confirmBtnDisabled]}
                onPress={confirmMeals}
                disabled={pendingMeals === mealsPerDay}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal — Restrições alimentares */}
      <Modal
        visible={restrictionsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRestrictionsModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setRestrictionsModalVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Restrições alimentares</Text>
            <Text style={styles.sheetSubtitle}>Selecione todas que se aplicam a você</Text>

            <View style={styles.optionsList}>
              {RESTRICTION_OPTIONS.map((r, i) => {
                const active = pendingRestrictions.includes(r.id);
                return (
                  <React.Fragment key={r.id}>
                    <TouchableOpacity
                      style={[styles.optionRow, active && styles.optionRowActive]}
                      onPress={() => togglePendingRestriction(r.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                        <Ionicons
                          name={r.icon}
                          size={18}
                          color={active ? Colors.greenDark : Colors.textSecondary}
                        />
                      </View>
                      <View style={styles.optionText}>
                        <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                          {r.label}
                        </Text>
                        <Text style={styles.optionSub}>{r.subtitle}</Text>
                      </View>
                      {/* Checkbox estilo toggle */}
                      <View style={[styles.checkbox, active && styles.checkboxActive]}>
                        {active && (
                          <Ionicons name="checkmark" size={13} color={Colors.greenDark} />
                        )}
                      </View>
                    </TouchableOpacity>
                    {i < RESTRICTION_OPTIONS.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                );
              })}
            </View>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRestrictionsModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, !restrictionsChanged && styles.confirmBtnDisabled]}
                onPress={confirmRestrictions}
                disabled={!restrictionsChanged}
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
  sheetSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },

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

  // Radio (single select)
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

  // Checkbox (multi select)
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: { borderColor: Colors.greenDark, backgroundColor: Colors.greenLight },

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

  // Plano nutricional
  macroCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  macroItem: { flex: 1, alignItems: "center" },
  macroValue: { ...Typography.h4, color: Colors.text },
  macroLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },

  // Toggle macros
  macroToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.xs,
  },
  macroToggleLabel: { ...Typography.body, fontWeight: "600", color: Colors.text },
  macroToggleSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 1 },

  // Controles de percentual
  pctRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  pctLabelWrap: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  pctDot: { width: 10, height: 10, borderRadius: 5 },
  pctName: { ...Typography.body, color: Colors.text, fontWeight: "600" },
  pctControls: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  pctBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pctValue: { ...Typography.body, fontWeight: "700", color: Colors.text, minWidth: 44, textAlign: "center" },
  pctSumRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  pctSumText: { ...Typography.caption, fontWeight: "600" },
});
