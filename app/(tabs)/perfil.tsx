import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
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
import { useThemeStore } from "../../stores/useThemeStore";
import { useUserStore } from "../../stores/useUserStore";

const GOAL_LABELS: Record<string, string> = {
  perder_gordura: "Perder gordura",
  ganhar_massa: "Ganhar massa",
  manter: "Manter peso",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  ultra: "Ultra",
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

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  const goalLabel = GOAL_LABELS[user?.goal ?? ""] ?? "—";
  const planLabel = PLAN_LABELS[user?.plan ?? "free"] ?? "Free";
  const planColor =
    user?.plan === "ultra" ? C.greenDark : user?.plan === "pro" ? C.carbo : C.textSecondary;
  const streakDays = 5;

  const handleSignOut = () => {
    Alert.alert("Sair da conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await signOut();
          clearUser();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.background }]} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card do usuário */}
        <View style={[styles.userCard, { backgroundColor: C.greenLight }]}>
          <View style={[styles.avatar, { backgroundColor: C.greenDark }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
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
            <View style={[styles.streakBadge, { backgroundColor: isDark ? "#2D2010" : "#FFF3E0" }]}>
              <Ionicons name="flame" size={11} color={C.carbo} />
              <Text style={[styles.streakBadgeText, { color: C.carbo }]}>{streakDays}D</Text>
            </View>
          </View>
        </View>

        {/* Seção: Minha Conta */}
        <Text style={[styles.sectionLabel, { color: C.textMuted }]}>MINHA CONTA</Text>
        <View style={[styles.menuCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <MenuItem C={C} icon="trophy-outline" label="Meu objetivo" subtitle={goalLabel} onPress={() => router.push("/perfil/meu-objetivo")} />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <MenuItem C={C} icon="person-outline" label="Dados corporais" subtitle={`${user?.weight_kg ?? "—"}kg • ${user?.height_cm ?? "—"}cm`} onPress={() => router.push("/perfil/dados-corporais")} />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <MenuItem C={C} icon="restaurant-outline" label="Dieta e preferências" subtitle="Equilibrada" onPress={() => router.push("/perfil/dieta-preferencias")} />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <MenuItem C={C} icon="calendar-outline" label="Ver plano da semana" badge="Disponível" badgeColor={C.greenDark} onPress={() => router.push("/plano-semanal")} />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <MenuItem C={C} icon="share-social-outline" label="Integrações" onPress={() => router.push("/perfil/integracoes")} />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <MenuItem C={C} icon="barbell-outline" label="Treino" onPress={() => router.push("/perfil/treino")} />
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
});
