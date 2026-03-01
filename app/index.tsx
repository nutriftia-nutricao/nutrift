import { getSession, recoverSessionFromUrl } from "../services/auth";
import { ensureUserProfile, fetchUserProfile } from "../services/user";
import { useUserStore } from "../stores/useUserStore";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { Colors } from "../constants/colors";

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const setUser = useUserStore((s) => s.setUser);
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        await recoverSessionFromUrl();
        const {
          data: { session },
        } = await getSession();
        if (cancelled) return;
        if (!session?.user?.id) {
          setHasSession(false);
          setChecking(false);
          return;
        }
        if (user?.id === session.user.id) {
          setHasSession(true);
          setChecking(false);
          return;
        }
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
          setHasSession(true);
        } else {
          setHasSession(false);
        }
      } catch {
        if (!cancelled) setHasSession(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [setUser, user?.id]);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.greenDark} />
      </View>
    );
  }

  if (hasSession) {
    return <Redirect href="/(tabs)/" />;
  }

  return <Redirect href="/(auth)/login" />;
}
