import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GradientButton } from "../../../components/ui";
import { OnboardingHeader } from "../../../components/onboarding/OnboardingHeader";
import { Colors } from "../../../constants/colors";
import { Radius } from "../../../constants/radius";
import { Spacing } from "../../../constants/spacing";
import { Typography } from "../../../constants/typography";
import { useOnboardingStore } from "../../../stores/useOnboardingStore";

export default function OnboardingStep1Screen() {
  const { sex, setSex } = useOnboardingStore();

  const handleContinue = () => {
    if (sex) {
      router.push("/(auth)/onboarding/step-2");
    }
  };

  return (
    <View style={styles.root}>
      <OnboardingHeader step={1} totalSteps={9} subtitle="" showBack={true} fallbackRoute="/(auth)/login" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Vamos começar!</Text>
          <Text style={styles.subtitle}>
            Precisamos de algumas informações para personalizar seu plano de nutrição.
          </Text>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>SEXO BIOLÓGICO</Text>

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
          disabled={!sex}
          showArrow
        />
      </View>
    </View>
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
          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
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
          size={28}
          color={selected ? "#111111" : Colors.textSecondary}
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  titleBlock: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  fieldBlock: {
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  sexRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  sexCard: {
    flex: 1,
    height: 140,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  sexCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
  },
  sexCardCheck: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
  },
  sexIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sexIconWrapperSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sexLabel: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  sexLabelSelected: {
    color: Colors.text,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
});
