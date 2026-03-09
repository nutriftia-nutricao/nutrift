import { getSession, recoverSessionFromUrl } from "../services/auth";
import { ensureUserProfile, fetchUserProfile } from "../services/user";
import { useHydrationStore } from "../stores/useHydrationStore";
import { useOnboardingStore } from "../stores/useOnboardingStore";
import { useUserStore } from "../stores/useUserStore";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";

import { Colors } from "../constants/colors";

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [resolvedProfile, setResolvedProfile] = useState<Awaited<ReturnType<typeof fetchUserProfile>> | false>(null);

  const setUser = useUserStore((s) => s.setUser);
  const user = useUserStore((s) => s.user);
  const setOnboardingData = useOnboardingStore((s) => s.setData);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let cancelled = false;

    async function checkAuth() {
      try {
        await recoverSessionFromUrl();
        let {
          data: { session },
        } = await getSession();
        // Na web, a sessão pode ainda não ter sido reidratada do storage; tenta de novo uma vez
        if (!session?.user?.id && typeof window !== "undefined") {
          await new Promise((r) => setTimeout(r, 400));
          if (cancelled) return;
          const retry = await getSession();
          session = retry.data.session;
        }
        if (cancelled) return;
        if (!session?.user?.id) {
          setResolvedProfile(false);
          setChecking(false);
          return;
        }
        // Sempre busca perfil no backend para evitar dados desatualizados (ex.: step-9 falhou em sessão anterior)
        let profile = await fetchUserProfile(session.user.id);
        if (cancelled) return;
        if (!profile) {
          const email = session.user.email ?? "";
          const name =
            session.user.user_metadata?.full_name ??
            session.user.user_metadata?.name ??
            session.user.user_metadata?.user_name ??
            "";
          profile = await ensureUserProfile(session.user.id, email, name);
        }
        if (cancelled) return;
        if (profile) {
          setUser(profile);
          if (profile.hydration_ml && profile.hydration_ml > 0) {
            useHydrationStore.getState().setWaterGoalL(profile.hydration_ml / 1000);
          }
          if (!profile.onboarding_completed) {
            setOnboardingData({ name: profile.name || "" });
          }
          setResolvedProfile(profile);
        } else {
          setResolvedProfile(false);
        }
      } catch {
        if (!cancelled) setResolvedProfile(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [setUser, setOnboardingData, user?.id]);

  if (Platform.OS === "web") {
    return <Redirect href="/(auth)/login" />;
  }

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.greenDark} />
      </View>
    );
  }

  const profile = resolvedProfile === false ? null : resolvedProfile;
  if (profile) {
    // Só vai para a tela principal se o onboarding foi explicitamente concluído (step-9).
    // Qualquer outro valor (undefined, null, false) mantém o usuário no onboarding.
    const onboardingCompleted = profile.onboarding_completed === true;
    if (!onboardingCompleted) {
      return <Redirect href="/(auth)/onboarding/step-1" />;
    }
    return <Redirect href="/(tabs)/" />;
  }

  return <Redirect href="/(auth)/login" />;
}
