import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { GradientButton } from "../../../components/ui/GradientButton";
import { ProgressBar } from "../../../components/onboarding/ProgressBar";
import { Colors } from "../../../constants/colors";
import { Radius } from "../../../constants/radius";
import { Spacing } from "../../../constants/spacing";
import { Typography } from "../../../constants/typography";
import { useOnboardingStore } from "../../../stores/useOnboardingStore";
import type { Sex } from "../../../types/onboarding";

export default function OnboardingStep1Screen() {
  const { name, sex, setName, setSex } = useOnboardingStore();

  const handleContinue = () => {
    if (name.trim() && sex) {
      router.push("/(auth)/onboarding/step-2");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ProgressBar progress={1 / 7} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>
          <View style={styles.stepIndicator}>
            <View style={styles.stepLinePrimary} />
            <View style={styles.stepLineSecondary} />
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Vamos começar!</Text>
          <Text style={styles.subtitle}>
            Preencha seus dados básicos para personalizarmos sua experiência de
            nutrição.
          </Text>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Nome Completo</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Como você quer ser chamado?"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
            <Ionicons
              name="person-outline"
              size={20}
              color={Colors.green}
              style={styles.inputIcon}
            />
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Sexo Biológico</Text>

          <View style={styles.sexRow}>
            <SexCard
              label="Masculino"
              icon="male"
              selected={sex === "masculino"}
              onPress={() => setSex("masculino")}
            />
            <SexCard
              label="Feminino"
              icon="female"
              selected={sex === "feminino"}
              onPress={() => setSex("feminino")}
            />
          </View>

          <Text style={styles.helperText}>
            Usamos essa informação para calcular suas necessidades metabólicas
            com mais precisão.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title="Continuar"
          onPress={handleContinue}
          disabled={!name.trim() || !sex}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

interface SexCardProps {
  label: string;
  icon: "male" | "female";
  selected: boolean;
  onPress: () => void;
}

function SexCard({ label, icon, selected, onPress }: SexCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.sexCard,
        selected && styles.sexCardSelected,
        pressed && styles.pressed,
      ]}
    >
      {selected && (
        <View style={styles.sexCardCheck}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.green} />
        </View>
      )}

      <View
        style={[
          styles.sexIconWrapper,
          selected && styles.sexIconWrapperSelected,
        ]}
      >
        <Ionicons
          name={icon === "male" ? "male" : "female"}
          size={26}
          color={selected ? Colors.greenDark : Colors.textSecondary}
        />
      </View>

      <Text style={[styles.sexLabel, selected && styles.sexLabelSelected]}>
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
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
  stepIndicator: {
    alignItems: "flex-end",
    gap: 2,
  },
  stepLinePrimary: {
    width: 24,
    height: 2,
    borderRadius: Radius.pill,
    backgroundColor: Colors.green,
    marginBottom: 2,
  },
  stepLineSecondary: {
    width: 16,
    height: 2,
    borderRadius: Radius.pill,
    backgroundColor: `${Colors.green}4D`,
  },
  titleBlock: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  fieldBlock: {
    marginBottom: Spacing.xl,
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
    height: 56,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingRight: Spacing.xxl,
    backgroundColor: Colors.surface,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: Typography.body.fontFamily,
    fontSize: Typography.body.fontSize,
  },
  inputIcon: {
    position: "absolute",
    right: Spacing.lg,
  },
  sexRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  sexCard: {
    flex: 1,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: "transparent",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  sexCardSelected: {
    borderColor: Colors.green,
    backgroundColor: Colors.greenLight,
  },
  sexCardCheck: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
  },
  sexIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  sexIconWrapperSelected: {
    backgroundColor: Colors.greenLight,
  },
  sexLabel: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  sexLabelSelected: {
    color: Colors.greenDark,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background,
  },
});
