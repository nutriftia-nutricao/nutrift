import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { GradientColors } from "../../constants/gradients";
import { LinearGradient } from "expo-linear-gradient";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";

export default function AvaliarScreen() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert("Selecione uma nota", "Toque nas estrelas para avaliar.");
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Avaliar Nutrift</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="heart" size={48} color={Colors.greenDark} />
          </View>
          <Text style={styles.successTitle}>Obrigado!</Text>
          <Text style={styles.successSub}>Sua avaliação nos ajuda a melhorar o Nutrift para todos.</Text>
          {rating >= 4 && (
            <Pressable
              style={({ pressed }) => [styles.storeBtn, pressed && { opacity: 0.8 }]}
              onPress={() => Linking.openURL("https://apps.apple.com")}
            >
              <LinearGradient colors={GradientColors.primary} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.storeBtnGradient}>
                <Ionicons name="star" size={16} color="#FFF" />
                <Text style={styles.storeBtnText}>Avaliar na App Store</Text>
              </LinearGradient>
            </Pressable>
          )}
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>Voltar ao perfil</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Avaliar Nutrift</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.ratingCard}>
          <Ionicons name="sparkles" size={40} color={Colors.greenDark} />
          <Text style={styles.ratingTitle}>O que você acha do Nutrift?</Text>
          <Text style={styles.ratingSub}>Sua opinião é muito importante para nós</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={40}
                  color={star <= rating ? Colors.carbo : Colors.border}
                />
              </Pressable>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {["", "Muito ruim", "Ruim", "Regular", "Bom", "Excelente!"][rating]}
            </Text>
          )}
        </View>

        <Text style={styles.sectionLabel}>DEIXE UM COMENTÁRIO (OPCIONAL)</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.commentInput}
            placeholder="O que podemos melhorar?"
            placeholderTextColor={Colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
          onPress={handleSubmit}
        >
          <Text style={styles.saveBtnText}>Enviar avaliação</Text>
        </Pressable>
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
  ratingCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, alignItems: "center", gap: Spacing.md },
  ratingTitle: { ...Typography.h3, color: Colors.text, textAlign: "center" },
  ratingSub: { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: "center" },
  starsRow: { flexDirection: "row", gap: Spacing.sm },
  ratingLabel: { ...Typography.body, fontWeight: "700", color: Colors.carbo },
  sectionLabel: { ...Typography.label, fontSize: 11, color: Colors.textMuted, marginTop: Spacing.md, marginLeft: Spacing.xs },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  commentInput: { ...Typography.body, color: Colors.text, padding: Spacing.lg, minHeight: 100, textAlignVertical: "top" },
  saveBtn: { backgroundColor: Colors.greenDark, borderRadius: Radius.pill, paddingVertical: Spacing.lg, alignItems: "center" },
  saveBtnText: { ...Typography.body, fontWeight: "700", color: "#FFF" },
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl, gap: Spacing.lg },
  successIcon: { width: 80, height: 80, borderRadius: Radius.pill, backgroundColor: Colors.greenLight, alignItems: "center", justifyContent: "center" },
  successTitle: { ...Typography.h2, color: Colors.text },
  successSub: { ...Typography.body, color: Colors.textSecondary, textAlign: "center" },
  storeBtn: { borderRadius: Radius.pill, overflow: "hidden", width: "100%" },
  storeBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, paddingVertical: Spacing.lg },
  storeBtnText: { ...Typography.body, fontWeight: "700", color: "#FFF" },
  backLink: { ...Typography.body, color: Colors.textSecondary },
});
