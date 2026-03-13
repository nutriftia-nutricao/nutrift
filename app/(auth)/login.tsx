import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { GradientColors } from "../../constants/gradients";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";
import { getSession, recoverSessionFromUrl, signIn, signInWithApple, signInWithGoogle, signUp } from "../../services/auth";
import { ensureUserProfile, fetchUserProfile } from "../../services/user";
import { useOnboardingStore } from "../../stores/useOnboardingStore";
import { useUserStore } from "../../stores/useUserStore";

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);

  const setUser = useUserStore((s) => s.setUser);
  const localUser = useUserStore((s) => s.user);
  const setOnboardingData = useOnboardingStore((s) => s.setData);

  useEffect(() => {
    let cancelled = false;
    async function tryOAuthReturn() {
      if (Platform.OS !== "web" || typeof window === "undefined") return;
      const hash = window.location.hash || "";
      if (!hash.includes("access_token")) return;
      await recoverSessionFromUrl();
      if (cancelled) return;
      const { data: { session } } = await getSession();
      if (cancelled || !session?.user?.id) return;
      await handleAuthSuccess(session.user.id, session.user.email ?? undefined, session.user.user_metadata as Record<string, string> | undefined);
    }
    tryOAuthReturn();
    return () => { cancelled = true; };
  }, []);

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert("Erro ao entrar com Google", error.message ?? "Tente novamente.");
        return;
      }
      await checkSessionAndRedirect();
    } catch (e) {
      console.error("handleGoogleSignIn:", e);
      Alert.alert("Erro", "Não foi possível entrar com Google. Tente novamente.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoadingApple(true);
    try {
      const { error } = await signInWithApple();
      if (error) {
        Alert.alert("Erro ao entrar com Apple", error.message ?? "Tente novamente.");
        return;
      }
      await checkSessionAndRedirect();
    } catch (e) {
      console.error("handleAppleSignIn:", e);
      Alert.alert("Erro", "Não foi possível entrar com Apple. Tente novamente.");
    } finally {
      setLoadingApple(false);
    }
  };

  const checkSessionAndRedirect = async () => {
    const { data: { session } } = await getSession();
    if (session?.user?.id) {
      await handleAuthSuccess(session.user.id, session.user.email, session.user.user_metadata);
    }
  };

  const handleAuthSuccess = async (userId: string, userEmail?: string, metadata?: Record<string, string>) => {
    try {
      let profile = await fetchUserProfile(userId);

      if (!profile) {
        const profileName =
          metadata?.full_name ??
          metadata?.name ??
          metadata?.given_name ??
          name ??
          "";
        profile = await ensureUserProfile(userId, userEmail || "", profileName);
      }

      if (profile) {
        setUser(profile);
      }

      // Só vai para a tela principal se o onboarding foi explicitamente concluído (step-9).
      // Fallback: mantém concluído localmente para bancos legados sem a coluna onboarding_completed.
      const localCompletionForSameUser =
        localUser?.id === profile?.id && localUser?.onboarding_completed === true;
      const onboardingCompleted =
        profile?.onboarding_completed === true || localCompletionForSameUser;
      const displayName = profile?.name ?? name ?? "";
      setOnboardingData({ name: displayName });
      if (!onboardingCompleted) {
        router.replace("/(auth)/onboarding/step-1");
      } else {
        // Vai explicitamente para "Hoje" (index das tabs)
        router.replace("/(tabs)/index");
      }
    } catch (error) {
      console.error("handleAuthSuccess error:", error);
      setOnboardingData({ name });
      router.replace("/(auth)/onboarding/step-1");
    }
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedEmail || !password) {
      Alert.alert("Campos obrigatórios", "Preencha e-mail e senha.");
      return;
    }

    if (!isLogin && !trimmedName) {
      Alert.alert("Campo obrigatório", "Preencha seu nome para continuar.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Senha fraca", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await signIn(trimmedEmail, password);
        if (error) {
          const msg = error.message === "Invalid login credentials"
            ? "E-mail ou senha incorretos."
            : error.message;
          Alert.alert("Erro ao entrar", msg);
          return;
        }
        if (data.user?.id) {
          await handleAuthSuccess(data.user.id, data.user.email, data.user.user_metadata);
        }
      } else {
        const { userId, error, needsEmailConfirmation } = await signUp(trimmedEmail, password);

        if (error) {
          Alert.alert("Erro ao cadastrar", error.message);
          return;
        }

        if (needsEmailConfirmation) {
          Alert.alert(
            "Confirme seu e-mail",
            `Enviamos um link de confirmação para ${trimmedEmail}. Acesse seu e-mail, clique no link e volte para fazer login.`,
            [{ text: "OK" }]
          );
          return;
        }

        if (userId) {
          // Cadastro e login realizados — cria perfil e vai para onboarding
          await handleAuthSuccess(userId, trimmedEmail, { name: trimmedName });
        }
      }
    } catch (e) {
      console.error("handleSubmit:", e);
      Alert.alert("Erro inesperado", "Ocorreu um erro. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <Image
              source={require("../../assets/images/logo-nutrift.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.heroTitle}>Bem-vindo ao Nutrift</Text>
            <Text style={styles.heroSubtitle}>
              Nutrição inteligente para resultado real
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Toggle Login/Cadastro */}
            <View style={styles.tabRow}>
              <Pressable
                style={[styles.tab, isLogin && styles.tabActive]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Entrar</Text>
              </Pressable>
              <Pressable
                style={[styles.tab, !isLogin && styles.tabActive]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Cadastrar</Text>
              </Pressable>
            </View>

            {/* Campo Nome (só no cadastro) */}
            {!isLogin && (
              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Nome</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Como você quer ser chamado?"
                  placeholderTextColor={Colors.textSecondary}
                  style={styles.input}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            )}

            {/* Campo E-mail */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor={Colors.textSecondary}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Campo Senha */}
            <View style={styles.fieldBlock}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Senha</Text>
                {isLogin && (
                  <Pressable>
                    <Text style={styles.forgotText}>Esqueci minha senha</Text>
                  </Pressable>
                )}
              </View>
              {!isLogin && (
                <Text style={styles.passwordHint}>Mínimo de 6 caracteres</Text>
              )}
              <View style={styles.inputWrapper}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textSecondary}
                  style={[styles.input, { paddingRight: 48 }]}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((v) => !v)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={Colors.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            {/* Botão principal */}
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { opacity: 0.9 },
                loading && { opacity: 0.7 },
              ]}
            >
              <LinearGradient
                colors={GradientColors.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradientButton}
              >
                <Text style={styles.primaryButtonText}>
                  {loading
                    ? "Processando..."
                    : isLogin
                    ? "Entrar"
                    : "Criar conta grátis"}
                </Text>
              </LinearGradient>
            </Pressable>

            {/* Divisor */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Entrar com</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Botões sociais */}
            <View style={styles.socialRow}>
              <SocialButton
                label={loadingApple ? "..." : "Apple"}
                icon="logo-apple"
                dark
                onPress={handleAppleSignIn}
                disabled={loadingApple}
              />
              <SocialButton
                label={loadingGoogle ? "..." : "Google"}
                icon="logo-google"
                dark={false}
                onPress={handleGoogleSignIn}
                disabled={loadingGoogle}
              />
            </View>
          </View>

          {/* Rodapé */}
          <View style={styles.footer}>
            <Text style={styles.termsText}>
              Ao continuar, você concorda com nossos{" "}
              <Text style={styles.termsLink}>Termos de Uso</Text> e{" "}
              <Text style={styles.termsLink}>Política de Privacidade</Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SocialButton({
  label,
  icon,
  dark,
  onPress,
  disabled,
}: {
  label: string;
  icon: "logo-apple" | "logo-google";
  dark: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.socialButton,
        dark && styles.socialButtonDark,
        pressed && { opacity: 0.9 },
        disabled && { opacity: 0.6 },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={dark ? "#FFFFFF" : Colors.text}
      />
      <Text style={[styles.socialButtonText, dark && { color: "#FFFFFF" }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  logoImage: {
    width: 220,
    height: 80,
    marginBottom: Spacing.md,
  },
  heroTitle: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: Colors.background,
    borderRadius: Radius.pill,
    padding: 4,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: Radius.pill,
  },
  tabActive: {
    backgroundColor: Colors.surfaceElevated,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  tabTextActive: {
    color: Colors.text,
    fontWeight: "600",
  },
  fieldBlock: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  passwordHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: -4,
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    height: 54,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    color: Colors.text,
    fontFamily: Typography.body.fontFamily,
    fontSize: Typography.body.fontSize,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  eyeButton: {
    position: "absolute",
    right: Spacing.lg,
  },
  forgotText: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.primary,
  },
  primaryButton: {
    borderRadius: Radius.pill,
    overflow: "hidden",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientButton: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    ...Typography.h4,
    color: "#111111",
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  socialRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  socialButtonDark: {
    backgroundColor: "#252525",
    borderColor: "#252525",
  },
  socialButtonText: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.text,
  },
  footer: {
    marginTop: Spacing.xxl,
    alignItems: "center",
    gap: Spacing.lg,
  },
  termsText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.text,
    textDecorationLine: "underline",
  },
});
