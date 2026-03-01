import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
import { getSession, signInWithGoogle } from "../../services/auth";
import { ensureUserProfile, fetchUserProfile } from "../../services/user";
import { useOnboardingStore } from "../../stores/useOnboardingStore";
import { useSignupStore } from "../../stores/useSignupStore";
import { useUserStore } from "../../stores/useUserStore";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const setCredentials = useSignupStore((s) => s.setCredentials);
  const setNameOnboarding = useOnboardingStore((s) => s.setName);
  const setUser = useUserStore((s) => s.setUser);

  const handleCreateAccount = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      Alert.alert("Campo obrigatório", "Preencha seu nome.");
      return;
    }
    if (!trimmedEmail) {
      Alert.alert("Campo obrigatório", "Preencha seu e-mail.");
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      Alert.alert("E-mail inválido", "Digite um e-mail válido.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      Alert.alert("Senha fraca", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Senhas diferentes", "Senha e confirmar senha não coincidem.");
      return;
    }

    setCredentials(trimmedEmail, password);
    setNameOnboarding(trimmedName);
    router.replace("/(auth)/onboarding/step-1");
  };

  const handleGoogleSignUp = async () => {
    setLoadingGoogle(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert("Erro ao cadastrar com Google", error.message ?? "Tente novamente.");
        return;
      }
      const {
        data: { session },
      } = await getSession();
      if (!session?.user?.id) {
        setLoadingGoogle(false);
        return;
      }
      let profile = await fetchUserProfile(session.user.id);
      if (!profile) {
        const email = session.user.email ?? "";
        const name =
          session.user.user_metadata?.full_name ??
          session.user.user_metadata?.name ??
          session.user.user_metadata?.given_name ??
          "";
        profile = await ensureUserProfile(session.user.id, email, name);
      }
      if (profile) setUser(profile);
      router.replace("/(tabs)/");
    } catch (e) {
      console.error("handleGoogleSignUp:", e);
      Alert.alert("Erro", "Não foi possível cadastrar com Google. Tente novamente.");
    } finally {
      setLoadingGoogle(false);
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
            <LinearGradient
              colors={["#3DA63A", "#2e7d32"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoCircle}
            >
              <Text style={styles.logoLetter}>N</Text>
            </LinearGradient>
            <Text style={styles.heroTitle}>Bem-vindo ao Nutrift</Text>
            <Text style={styles.heroSubtitle}>
              Sua jornada saudável começa aqui
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Tab switcher */}
            <View style={styles.tabRow}>
              <Pressable
                style={styles.tabInactive}
                onPress={() => router.replace("/(auth)/login")}
              >
                <Text style={styles.tabTextInactive}>Entrar</Text>
              </Pressable>
              <View style={styles.tabActive}>
                <Text style={styles.tabTextActive}>Cadastrar</Text>
              </View>
            </View>

            {/* Pill gratuito */}
            <View style={styles.freePill}>
              <Text style={styles.freePillText}>
                ✓ Grátis · ✓ Sem cartão · ✓ Sem anúncios
              </Text>
            </View>

            {/* Nome */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Seu nome completo"
                placeholderTextColor={Colors.textSecondary}
                style={styles.input}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            {/* Email */}
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

            {/* Senha */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Senha</Text>
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

            {/* Confirmar senha */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Confirmar senha</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textSecondary}
                style={styles.input}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Botão criar conta */}
            <Pressable
              onPress={handleCreateAccount}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { opacity: 0.85 },
              ]}
            >
              <LinearGradient
                colors={GradientColors.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradientButton}
              >
                <Text style={styles.primaryButtonText}>Criar conta grátis</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>

            {/* Divisor */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social */}
            <View style={styles.socialColumn}>
              <SocialButton
                label="Cadastrar com Apple"
                icon="logo-apple"
                dark
                onPress={() => Alert.alert("Em breve", "Login com Apple estará disponível em breve.")}
              />
              <SocialButton
                label="Cadastrar com Google"
                icon="logo-google"
                dark={false}
                onPress={handleGoogleSignUp}
                disabled={loadingGoogle}
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.termsText}>
              Ao continuar, você concorda com nossos{" "}
              <Text style={styles.termsLink}>Termos de Uso</Text> e{" "}
              <Text style={styles.termsLink}>Política de Privacidade</Text>.
            </Text>
            <Text style={styles.loginText}>
              Já tem conta?{" "}
              <Text
                style={styles.loginLink}
                onPress={() => router.replace("/(auth)/login")}
              >
                Entrar
              </Text>
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
        pressed && !disabled && { opacity: 0.9 },
        disabled && { opacity: 0.6 },
      ]}
    >
      <Ionicons name={icon} size={20} color={dark ? "#FFFFFF" : Colors.text} />
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
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    shadowColor: Colors.greenDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  logoLetter: {
    fontFamily: Typography.h2.fontFamily,
    fontSize: 32,
    color: "#FFFFFF",
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: Colors.background,
    borderRadius: Radius.pill,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tabActive: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingVertical: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabInactive: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabTextActive: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.text,
  },
  tabTextInactive: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  freePill: {
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  freePillText: {
    ...Typography.caption,
    color: Colors.greenDark,
    fontWeight: "700",
  },
  fieldBlock: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
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
  },
  eyeButton: {
    position: "absolute",
    right: Spacing.lg,
  },
  primaryButton: {
    borderRadius: Radius.pill,
    overflow: "hidden",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    shadowColor: Colors.greenDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientButton: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  primaryButtonText: {
    ...Typography.h4,
    color: Colors.surface,
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
  socialColumn: {
    gap: Spacing.sm,
  },
  socialButton: {
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
    backgroundColor: "#111111",
    borderColor: "#111111",
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
  loginText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  loginLink: {
    color: Colors.greenDark,
    fontWeight: "700",
  },
});
