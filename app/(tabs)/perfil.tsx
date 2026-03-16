import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";
import { useTheme } from "../../hooks/useTheme";
import { signOut } from "../../services/auth";
import { fetchUserProfile } from "../../services/user";
import { supabase } from "../../services/supabase";
import { useNutritionStore } from "../../stores/useNutritionStore";
import { useThemeStore } from "../../stores/useThemeStore";
import { useUserStore } from "../../stores/useUserStore";

const GOAL_LABELS: Record<string, string> = {
  perder_gordura: "Perder gordura",
  ganhar_massa: "Ganhar massa",
  definir_corpo: "Definir o corpo",
  recomposicao: "Recompôr o corpo",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  ultra: "Ultra",
  trial: "Pro (Trial)",
};

const DIET_LABELS: Record<string, string> = {
  onivoro: "Equilibrada",
  equilibrada: "Equilibrada",
  low_carb: "Low Carb",
  vegetariano: "Vegetariana",
  vegetariana: "Vegetariana",
  vegano: "Vegana",
  vegana: "Vegana",
  cetogenica: "Cetogênica",
  mediterranea: "Mediterrânea",
};

interface MenuItemProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  onPress: () => void;
  C: ReturnType<typeof useTheme>["C"];
}

function MenuItem({ icon, label, subtitle, badge, badgeColor, onPress, C }: MenuItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        pressed && { backgroundColor: C.greenLight },
      ]}
      onPress={onPress}
    >
      <View style={[styles.menuIconWrap, { backgroundColor: C.background }]}>
        <Ionicons name={icon} size={20} color={C.textSecondary} />
      </View>
      <View style={styles.menuTextWrap}>
        <Text style={[styles.menuLabel, { color: C.text }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.menuSubtitle, { color: C.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={styles.menuRight}>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: badgeColor ?? C.greenDark }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
      </View>
    </Pressable>
  );
}

export default function PerfilScreen() {
  const { isDark, C } = useTheme();
  const toggle = useThemeStore((s) => s.toggle);
  const user = useUserStore((s) => s.user);
  const clearUser = useUserStore((s) => s.clearUser);
  const setUser = useUserStore((s) => s.setUser);
  const isUserLoading = useUserStore((s) => s.isLoading);
  const setUserLoading = useUserStore((s) => s.setLoading);
  const streakFromStore = useNutritionStore((s) => s.streak);
  const [showIntegracoesModal, setShowIntegracoesModal] = useState(false);

  const dietLabel = DIET_LABELS[user?.diet_type ?? ""] ?? "Não definida";
  // TODO: buscar streak real do banco se necessário
  const streakDays = streakFromStore ?? 0;

  const trialDaysLeft = (() => {
    if (user?.plan !== "trial") return null;
    if (!user?.trial_ends_at) return 7;
    const diff = new Date(user.trial_ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  useFocusEffect(
    useCallback(() => {
      async function refresh() {
        if (!user) {
          setUserLoading(true);
        }
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user?.id) return;
          const profile = await fetchUserProfile(session.user.id);
          if (profile) setUser(profile);
        } finally {
          if (!user) {
            setUserLoading(false);
          }
        }
      }

      void refresh();
    }, [setUser, setUserLoading, user])
  );

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  const goalLabel = GOAL_LABELS[user?.goal ?? ""] ?? "—";
  const goalSubtitle =
    user?.daily_kcal != null
      ? `${goalLabel} • ${user.daily_kcal.toLocaleString("pt-BR")} kcal/dia`
      : goalLabel;
  const planLabel = PLAN_LABELS[user?.plan ?? "free"] ?? "Free";
  const planColor =
    user?.plan === "ultra" ? C.greenDark : user?.plan === "pro" ? C.carbo : C.textSecondary;
  const bodyFatCurrent =
    typeof user?.body_fat_pct === "number"
      ? Number(user.body_fat_pct).toLocaleString("pt-BR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : null;
  const bodyFatTarget =
    typeof user?.target_body_fat_pct === "number"
      ? Number(user.target_body_fat_pct).toLocaleString("pt-BR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : null;
  const bodyMetricsSubtitle = `${user?.weight_kg ?? "—"}kg • ${user?.height_cm ?? "—"}cm${
    bodyFatCurrent
      ? bodyFatTarget
        ? ` • GC ${bodyFatCurrent}% → ${bodyFatTarget}%`
        : ` • GC ${bodyFatCurrent}%`
      : ""
  }`;

  const handleSignOut = () => {
    Alert.alert("Sair da conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch {
            // Ignora erro de rede; segue com logout local
          } finally {
            clearUser();
            if (Platform.OS === "web" && typeof window !== "undefined") {
              window.location.href = "/";
            } else {
              router.replace("/(auth)/login");
            }
          }
        },
      },
    ]);
  };

  if (!user && isUserLoading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: C.background }]} edges={["top"]}>
        <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator size="large" color={C.green} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.background }]} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card do usuário */}
        <View style={[styles.userCard, { backgroundColor: C.greenLight }]}>
          <Pressable
            style={[styles.avatar, { backgroundColor: C.greenDark }]}
            onPress={() => router.push("/perfil/dados-corporais")}
          >
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </Pressable>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: C.text }]}>{user?.name ?? "Usuário"}</Text>
            <Pressable onPress={() => router.push("/perfil/dados-corporais")}>
              <Text style={[styles.userSub, { color: C.greenDark }]}>Ver perfil público →</Text>
            </Pressable>
          </View>
          <View style={styles.userBadges}>
            <View style={[styles.planBadge, { borderColor: planColor }]}>
              <Ionicons name="star" size={11} color={planColor} />
              <Text style={[styles.planBadgeText, { color: planColor }]}>{planLabel}</Text>
            </View>
            {trialDaysLeft !== null ? (
              <View style={[styles.streakBadge, { backgroundColor: isDark ? "#1A1A2E" : "#E8E8FF" }]}>
                <Ionicons name="time-outline" size={11} color="#7B68EE" />
                <Text style={[styles.streakBadgeText, { color: "#7B68EE" }]}>{trialDaysLeft}D</Text>
              </View>
            ) : (
              <View style={[styles.streakBadge, { backgroundColor: isDark ? "#2D2010" : "#FFF3E0" }]}>
                <Ionicons name="flame" size={11} color={C.carbo} />
                <Text style={[styles.streakBadgeText, { color: C.carbo }]}>{streakDays}D</Text>
              </View>
            )}
          </View>
        </View>

        {/* Seção: Minha Conta */}
        <Text style={[styles.sectionLabel, { color: C.textMuted }]}>MINHA CONTA</Text>
        <View style={[styles.menuCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <MenuItem C={C} icon="trophy-outline" label="Meu objetivo" subtitle={goalSubtitle} onPress={() => router.push("/perfil/meu-objetivo")} />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <MenuItem C={C} icon="person-outline" label="Dados corporais" subtitle={bodyMetricsSubtitle} onPress={() => router.push("/perfil/dados-corporais")} />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <MenuItem C={C} icon="restaurant-outline" label="Dieta e preferências" subtitle={dietLabel} onPress={() => router.push("/perfil/dieta-preferencias")} />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <MenuItem C={C} icon="calendar-outline" label="Ver plano da semana" badge="Disponível" badgeColor={C.greenDark} onPress={() => router.push("/plano-semanal")} />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <MenuItem C={C} icon="share-social-outline" label="Integrações" onPress={() => setShowIntegracoesModal(true)} />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <MenuItem C={C} icon="barbell-outline" label="Atividades" onPress={() => router.push("/perfil/treino")} />
        </View>

        {/* Seção: Configurações */}
        <Text style={[styles.sectionLabel, { color: C.textMuted }]}>CONFIGURAÇÕES</Text>
        <View style={[styles.menuCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <MenuItem C={C} icon="card-outline" label="Assinatura" badge={planLabel} badgeColor={planColor} onPress={() => router.push("/perfil/assinatura")} />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <MenuItem C={C} icon="notifications-outline" label="Notificações" onPress={() => router.push("/perfil/notificacoes")} />
          <View style={[styles.divider, { backgroundColor: C.border }]} />

          {/* Toggle de tema */}
          <View style={styles.menuItem}>
            <View style={[styles.menuIconWrap, { backgroundColor: C.background }]}>
              <Ionicons
                name={isDark ? "moon" : "sunny-outline"}
                size={20}
                color={C.textSecondary}
              />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={[styles.menuLabel, { color: C.text }]}>Tema</Text>
              <Text style={[styles.menuSubtitle, { color: C.textSecondary }]}>
                {isDark ? "Modo escuro ativo" : "Modo claro ativo"}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: C.border, true: C.green }}
              thumbColor={isDark ? C.greenDark : C.textMuted}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <MenuItem C={C} icon="help-circle-outline" label="Suporte" onPress={() => router.push("/perfil/suporte")} />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <MenuItem C={C} icon="star-outline" label="Avaliar Nutrift" onPress={() => router.push("/perfil/avaliar")} />
        </View>

        {/* Sair */}
        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.6 }]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={18} color={C.error} />
          <Text style={[styles.signOutText, { color: C.error }]}>Sair da conta</Text>
        </Pressable>
      </ScrollView>

      {/* Modal: Integrações em desenvolvimento */}
      <Modal
        visible={showIntegracoesModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIntegracoesModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowIntegracoesModal(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: C.surface, borderColor: C.border }]} onPress={() => {}}>
            <View style={[styles.modalIconWrap, { backgroundColor: isDark ? "#1A1A2E" : "#E8E8FF" }]}>
              <Ionicons name="construct-outline" size={32} color="#7B68EE" />
            </View>
            <Text style={[styles.modalTitle, { color: C.text }]}>Em desenvolvimento</Text>
            <Text style={[styles.modalSubtitle, { color: C.textSecondary }]}>
              As integrações estarão disponíveis no{"\n"}
              <Text style={{ color: C.greenDark, fontWeight: "700" }}>Modo Ultra</Text>
            </Text>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: C.greenDark }]}
              onPress={() => setShowIntegracoesModal(false)}
            >
              <Text style={styles.modalBtnText}>Entendido</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 110,
    gap: Spacing.sm,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { ...Typography.h4, color: "#FFF", fontSize: 16 },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },
  userInfo: { flex: 1 },
  userName: { ...Typography.h4 },
  userSub: { ...Typography.caption, marginTop: 2 },
  userBadges: { flexDirection: "row", gap: Spacing.xs, alignItems: "center" },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  planBadgeText: { ...Typography.caption, fontSize: 11, fontWeight: "700" },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  streakBadgeText: { ...Typography.caption, fontSize: 11, fontWeight: "700" },
  sectionLabel: {
    ...Typography.label,
    fontSize: 11,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  menuCard: {
    borderRadius: Radius.xl,
    overflow: "hidden",
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextWrap: { flex: 1 },
  menuLabel: { ...Typography.body, fontWeight: "600" },
  menuSubtitle: { ...Typography.caption, marginTop: 1 },
  menuRight: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  badge: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  badgeText: { ...Typography.caption, fontSize: 11, fontWeight: "700", color: "#FFF" },
  divider: { height: 1, marginLeft: 68 },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
  },
  signOutText: { ...Typography.body, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  modalCard: {
    width: "100%",
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  modalTitle: { ...Typography.h3, textAlign: "center" },
  modalSubtitle: { ...Typography.body, textAlign: "center", lineHeight: 22 },
  modalBtn: {
    marginTop: Spacing.sm,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  modalBtnText: { ...Typography.body, fontWeight: "700", color: "#FFF" },
});
