import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { goBack } from "../../utils/navigation";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";

const FAQS = [
  { q: "Como recalcular meu plano?", a: "Vá em Dados corporais, atualize seu peso ou objetivo e salve. O plano será recalculado automaticamente." },
  { q: "Posso mudar meu objetivo?", a: "Sim! Em Meu objetivo você pode alterar entre perder gordura, ganhar massa ou manter." },
  { q: "Como cancelar minha assinatura?", a: "Acesse Assinatura e selecione o plano Free. O cancelamento é imediato." },
  { q: "Os dados são seguros?", a: "Sim. Usamos Supabase com criptografia e nunca compartilhamos seus dados." },
];

export default function SuporteScreen() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => goBack()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Suporte</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contato rápido */}
        <View style={styles.contactRow}>
          <Pressable style={styles.contactBtn} onPress={() => Linking.openURL("mailto:suporte@nutrift.app")}>
            <Ionicons name="mail-outline" size={22} color={Colors.greenDark} />
            <Text style={styles.contactLabel}>E-mail</Text>
          </Pressable>
          <Pressable style={styles.contactBtn} onPress={() => Linking.openURL("https://wa.me/5511999999999")}>
            <Ionicons name="logo-whatsapp" size={22} color={Colors.greenDark} />
            <Text style={styles.contactLabel}>WhatsApp</Text>
          </Pressable>
          <Pressable style={styles.contactBtn} onPress={() => Linking.openURL("https://nutrift.app/ajuda")}>
            <Ionicons name="globe-outline" size={22} color={Colors.greenDark} />
            <Text style={styles.contactLabel}>Central</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>PERGUNTAS FREQUENTES</Text>
        <View style={styles.card}>
          {FAQS.map((faq, i) => (
            <React.Fragment key={i}>
              <Pressable
                style={styles.faqRow}
                onPress={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Ionicons
                  name={openFaq === i ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={Colors.textMuted}
                />
              </Pressable>
              {openFaq === i && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.a}</Text>
                </View>
              )}
              {i < FAQS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.sectionLabel}>ENVIAR MENSAGEM</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.messageInput}
            placeholder="Descreva seu problema ou dúvida..."
            placeholderTextColor={Colors.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
          />
        </View>
        <Pressable
          style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.8 }, !message.trim() && { opacity: 0.4 }]}
          disabled={!message.trim()}
          onPress={() => { Alert.alert("Enviado!", "Responderemos em até 24h."); setMessage(""); }}
        >
          <Text style={styles.sendBtnText}>Enviar mensagem</Text>
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
  contactRow: { flexDirection: "row", gap: Spacing.md },
  contactBtn: { flex: 1, backgroundColor: Colors.greenLight, borderRadius: Radius.xl, paddingVertical: Spacing.lg, alignItems: "center", gap: Spacing.xs },
  contactLabel: { ...Typography.caption, color: Colors.greenDark, fontWeight: "600" },
  sectionLabel: { ...Typography.label, fontSize: 11, color: Colors.textMuted, marginTop: Spacing.md, marginLeft: Spacing.xs },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  faqRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: Spacing.lg },
  faqQuestion: { ...Typography.body, fontWeight: "600", color: Colors.text, flex: 1, paddingRight: Spacing.sm },
  faqAnswer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  faqAnswerText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  divider: { height: 1, backgroundColor: Colors.border },
  messageInput: { ...Typography.body, color: Colors.text, padding: Spacing.lg, minHeight: 100, textAlignVertical: "top" },
  sendBtn: { backgroundColor: Colors.greenDark, borderRadius: Radius.pill, paddingVertical: Spacing.lg, alignItems: "center" },
  sendBtnText: { ...Typography.body, fontWeight: "700", color: "#FFF" },
});
