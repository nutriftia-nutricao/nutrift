import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import { useNavigation, useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { useTheme } from "../../hooks/useTheme";
import { transcribeAudio } from "../../services/gemini";
import { sendChatMessage } from "../../services/gpt";
import { useAgenteStore } from "../../stores/useAgenteStore";
import { useUserStore } from "../../stores/useUserStore";

const QUICK_SUGGESTIONS = [
  { label: "Me mostre receitas saudáveis", prompt: "Me mostre receitas saudáveis para o meu objetivo!" },
  { label: "O que devo comer para minhas metas?", prompt: "O que devo comer para atingir minhas metas?" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Limpa markdown, listas e espaços extras que o modelo ocasionalmente produz.
// ─────────────────────────────────────────────────────────────────────────────
function normalizeAssistantReply(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-•*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// System prompt — enxuto, imperativo, sem redundância.
// ─────────────────────────────────────────────────────────────────────────────
function buildSystemPrompt(
  user: NonNullable<ReturnType<typeof useUserStore.getState>["user"]>,
  isFirstMessage: boolean = false
): string {
  const goalLabel =
    user.goal === "perder_gordura" ? "perda de gordura"
    : user.goal === "ganhar_massa" ? "ganho de massa muscular"
    : user.goal === "definir_corpo" ? "definição corporal com déficit leve"
    : "recomposição corporal gradual";

  const hasMacros = !!(user.daily_kcal && user.protein_g && user.carbo_g && user.fat_g);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return `Você é Nuti, especialista em nutrição esportiva com nível equivalente a nutricionista esportivo experiente e médico do esporte. Fale sempre como um profissional humano — nunca revele que é IA, assistente virtual ou sistema.

PERFIL DO USUÁRIO:
- Nome: ${user.name}
- Objetivo: ${goalLabel}
- Peso atual: ${user.weight_kg} kg | Meta: ${user.target_weight ?? "não informado"} kg | Prazo: ${user.target_date ?? "não informado"}
${hasMacros
  ? `- Plano: ${user.daily_kcal} kcal/dia | Proteína ${user.protein_g}g | Carbo ${user.carbo_g}g | Gordura ${user.fat_g}g`
  : `- Plano calórico: ainda não configurado`
}

REGRAS ABSOLUTAS DE RESPOSTA:
1. Máximo 2 parágrafos curtos por resposta. Nunca ultrapasse isso.
2. Proibido: listas numeradas, bullet points, títulos, markdown, texto fragmentado.
3. Escreva em texto corrido, como um especialista explicando em voz alta durante uma consulta.
4. Proibido começar com: "Claro!", "Ótima pergunta!", "Com certeza!", ou qualquer outro preâmbulo.
5. Se faltar dado essencial, faça UMA única pergunta objetiva — nunca mais de uma.
6. Use os macros do perfil se disponíveis. Se não estiverem, não invente números sem avisar.
7. Para receitas: descreva naturalmente no texto, sem "Ingredientes:" ou "Modo de preparo:".
8. Para estagnação: avalie adesão real (fins de semana incluídos), método de pesagem, sono e retenção hídrica antes de sugerir ajuste calórico.
9. Para sintomas, dor ou suspeita de doença: indique avaliação presencial, sem rodeios.
10. Nunca prescreva medicamentos ou substitua diagnóstico médico.

PERSONALIDADE:
- Calmo, racional, equilibrado. Tom de médico centrado, nunca robótico.
- Se o usuário for rude ou impaciente: responda com serenidade e respeito, nunca com agressividade.

REFERÊNCIAS TÉCNICAS (use quando relevante):
- Proteína para quem treina: 1.6–2.2 g/kg de peso corporal.
- Gorduras: 0.6–1.0 g/kg; priorizar fontes insaturadas.
- Carboidratos: calorias restantes, ajustando por desempenho e recuperação.
- Déficit para emagrecimento sustentável: 300–500 kcal/dia.
- Superávit para ganho com mínimo de gordura: 200–350 kcal/dia.

${isFirstMessage
  ? `PRIMEIRA MENSAGEM: inicie naturalmente com "${saudacao}, ${user.name}." embutido na primeira frase — não como saudação separada.`
  : `Sem saudação de abertura. A conversa já está em andamento.`
}

Responda sempre em português brasileiro.`.trim();
}

// Delay mínimo antes de disparar a API após o usuário enviar mensagem
const REPLY_BUFFER_MS = 500;

export default function AgenteScreen() {
  const { C } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const user = useUserStore((s) => s.user);
  const { messages, isTyping, addMessage, setTyping } = useAgenteStore();
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const firstName = user?.name?.split(" ")[0] ?? "você";
  const hasMessages = messages.length > 0;

  const handleBack = useCallback(() => {
    router.replace("/(tabs)/");
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      const unsubscribeBeforeRemove = navigation.addListener("beforeRemove", (e) => {
        const actionType = e.data.action.type;
        if (actionType !== "GO_BACK" && actionType !== "POP") return;
        e.preventDefault();
        handleBack();
      });

      const backSub = BackHandler.addEventListener("hardwareBackPress", () => {
        handleBack();
        return true;
      });

      return () => {
        unsubscribeBeforeRemove();
        backSub.remove();
      };
    }, [navigation, handleBack])
  );

  // ─── Gravação nativa (iOS/Android) ───────────────────────────────────────
  const startRecordingNative = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permissão negada", "Permita o acesso ao microfone nas configurações.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
      Alert.alert("Erro", "Não foi possível iniciar a gravação.");
    }
  };

  const stopRecordingNative = async () => {
    if (!recordingRef.current) return;
    try {
      setIsRecording(false);
      setIsTranscribing(true);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) throw new Error("URI do áudio não encontrada");
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
      const transcribed = await transcribeAudio(base64, "audio/m4a");
      setIsTranscribing(false);
      if (transcribed) sendMessage(transcribed);
    } catch (err) {
      console.error("Erro ao transcrever áudio:", err);
      setIsTranscribing(false);
      Alert.alert("Erro", "Não foi possível transcrever o áudio. Tente novamente.");
    }
  };

  // ─── Gravação web via Web Speech API ─────────────────────────────────────
  const webSpeechRef = useRef<any>(null);

  const startRecordingWeb = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Alert.alert("Não suportado", "Seu navegador não suporta reconhecimento de voz. Use Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsRecording(false);
      if (transcript) sendMessage(transcript);
    };
    recognition.onerror = () => {
      setIsRecording(false);
      Alert.alert("Erro", "Não foi possível capturar o áudio.");
    };
    recognition.onend = () => setIsRecording(false);
    webSpeechRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecordingWeb = () => {
    webSpeechRef.current?.stop();
    setIsRecording(false);
  };

  const startRecording = Platform.OS === "web" ? startRecordingWeb : startRecordingNative;
  const stopRecording = Platform.OS === "web" ? stopRecordingWeb : stopRecordingNative;

  const handleStop = () => {
    abortRef.current = true;
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    setTyping(false);
  };

  // ─── Uma única bolha por resposta — sem chunks, sem delay artificial ──────
  const sendAssistantMessage = (fullText: string) => {
    if (abortRef.current) return;
    const cleaned = normalizeAssistantReply(fullText);
    addMessage({ role: "assistant", content: cleaned });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  };

  // ─── Processa e envia para a API ──────────────────────────────────────────
  const processMessages = async () => {
    const currentMessages = useAgenteStore.getState().messages;
    const userMessages = currentMessages.filter((m) => m.role === "user");
    if (userMessages.length === 0) return;

    // Limita histórico às últimas 12 mensagens para manter qualidade
    const historyForApi = currentMessages.slice(-13, -1);
    const lastUserMsg = userMessages[userMessages.length - 1];

    abortRef.current = false;

    try {
      const isFirstMessage = userMessages.length === 1;
      const systemPrompt = user ? buildSystemPrompt(user, isFirstMessage) : "";

      const reply = await sendChatMessage({
        systemPrompt,
        history: historyForApi.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          text: m.content,
        })),
        userMessage: lastUserMsg.content,
      });

      if (abortRef.current) return;

      setTyping(false);
      sendAssistantMessage(reply);
    } catch (err) {
      console.error("Agente erro:", err);
      setTyping(false);
      addMessage({
        role: "assistant",
        content: "Tive um problema ao processar sua mensagem. Tente novamente.",
      });
    } finally {
      setTyping(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setInputText("");
    addMessage({ role: "user", content: trimmed });
    setTyping(true);
    flatListRef.current?.scrollToEnd({ animated: true });

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      abortRef.current = true;
    }

    abortRef.current = false;
    debounceTimer.current = setTimeout(() => {
      processMessages();
    }, REPLY_BUFFER_MS);
  };

  const renderMessage = ({ item }: { item: ReturnType<typeof useAgenteStore.getState>["messages"][0] }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAssistant]}>
        {!isUser && (
          <View style={styles.assistantAvatar}>
            <LinearGradient
              colors={GradientColors.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.assistantAvatarGradient}
            >
              <Ionicons name="sparkles" size={14} color="#FFF" />
            </LinearGradient>
          </View>
        )}
        <View style={[
          styles.bubble,
          isUser ? styles.bubbleUser : [styles.bubbleAssistant, { backgroundColor: C.surface }],
        ]}>
          <Text style={[
            styles.bubbleText,
            isUser ? styles.bubbleTextUser : [styles.bubbleTextAssistant, { color: C.text }],
          ]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          style={[styles.headerBtn, { backgroundColor: C.surface }]}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Nuti</Text>
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: C.greenDark }]} />
            <Text style={[styles.onlineText, { color: C.greenDark }]}>Nutrift Online</Text>
          </View>
        </View>
        <Pressable style={[styles.headerBtn, { backgroundColor: C.surface }]}>
          <Ionicons name="ellipsis-horizontal" size={22} color={C.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {!hasMessages ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyContent}>
              <View style={styles.aiIconWrap}>
                <LinearGradient
                  colors={GradientColors.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.aiIconGradient}
                >
                  <Ionicons name="sparkles" size={24} color="#FFF" />
                </LinearGradient>
              </View>
              <Text style={[styles.greetingText, { color: C.text }]}>
                Olá, <Text style={[styles.greetingName, { color: C.green }]}>{firstName}!</Text>
              </Text>
              <Text style={[styles.greetingSub, { color: C.textSecondary }]}>
                Como posso ajudar na sua nutrição hoje?
              </Text>
              <View style={styles.suggestionsWrap}>
                {QUICK_SUGGESTIONS.map((s, i) => (
                  <Pressable
                    key={i}
                    style={({ pressed }) => [
                      styles.suggestionBtn,
                      { backgroundColor: C.surface, borderColor: C.border },
                      pressed && { backgroundColor: C.greenLight, borderColor: C.green },
                    ]}
                    onPress={() => sendMessage(s.prompt)}
                  >
                    <Text style={[styles.suggestionText, { color: C.text }]}>{s.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              isTyping ? (
                <View style={[styles.msgRow, styles.msgRowAssistant]}>
                  <View style={styles.assistantAvatar}>
                    <LinearGradient
                      colors={GradientColors.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.assistantAvatarGradient}
                    >
                      <Ionicons name="sparkles" size={14} color="#FFF" />
                    </LinearGradient>
                  </View>
                  <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble, { backgroundColor: C.surface }]}>
                    <ActivityIndicator size="small" color={C.greenDark} />
                  </View>
                </View>
              ) : null
            }
          />
        )}

        {isTyping && (
          <View style={styles.stopBarWrap}>
            <Pressable
              style={({ pressed }) => [
                styles.stopBar,
                { borderColor: C.border, backgroundColor: C.surface },
                pressed && { opacity: 0.75 },
              ]}
              onPress={handleStop}
            >
              <View style={styles.stopIcon}>
                <View style={[styles.stopSquare, { backgroundColor: C.text }]} />
              </View>
              <Text style={[styles.stopText, { color: C.text }]}>Parar resposta</Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.inputBar, { backgroundColor: C.background }]}>
          <View style={[styles.inputWrap, { backgroundColor: C.surface, borderColor: C.border }]}>
            <TextInput
              style={[styles.input, { color: C.text }]}
              placeholder={
                isRecording ? "Gravando..."
                : isTranscribing ? "Transcrevendo..."
                : "Pergunte qualquer coisa..."
              }
              placeholderTextColor={isRecording ? C.error : C.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              blurOnSubmit={false}
              onSubmitEditing={() => {
                if (Platform.OS === "web") sendMessage(inputText);
              }}
              returnKeyType="send"
              editable={!isRecording && !isTranscribing}
            />

            <View style={styles.inputActions}>
              {inputText.trim() && !isTyping && (
                <Pressable
                  style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
                  onPress={() => sendMessage(inputText)}
                >
                  <LinearGradient
                    colors={GradientColors.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.actionBtnGradient}
                  >
                    <Ionicons name="arrow-up" size={16} color="#FFF" />
                  </LinearGradient>
                </Pressable>
              )}

              {isTranscribing ? (
                <ActivityIndicator size="small" color={C.greenDark} style={styles.actionBtn} />
              ) : (
                <Pressable
                  onPressIn={startRecording}
                  onPressOut={stopRecording}
                  style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
                >
                  <LinearGradient
                    colors={isRecording ? [C.error, "#C0392B"] : [C.border, C.border]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.actionBtnGradient}
                  >
                    <Ionicons
                      name={isRecording ? "stop" : "mic"}
                      size={16}
                      color={isRecording ? "#FFF" : C.textSecondary}
                    />
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: { alignItems: "center", gap: 2 },
  headerTitle: { ...Typography.label, fontSize: 13, letterSpacing: 1.5 },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  onlineText: { ...Typography.caption, fontWeight: "600" },
  emptyContainer: { flex: 1 },
  emptyContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  aiIconWrap: {
    marginBottom: Spacing.sm,
    shadowColor: Colors.greenDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  aiIconGradient: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingText: { ...Typography.h2, fontSize: 24, textAlign: "center", marginTop: Spacing.xs },
  greetingName: {},
  greetingSub: { ...Typography.bodySmall, textAlign: "center", marginBottom: Spacing.lg },
  suggestionsWrap: { width: "100%", gap: Spacing.sm },
  suggestionBtn: {
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
  },
  suggestionText: { ...Typography.body, fontSize: 14, fontWeight: "600", textAlign: "center" },
  messagesList: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowAssistant: { justifyContent: "flex-start" },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    overflow: "hidden",
    flexShrink: 0,
  },
  assistantAvatarGradient: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  bubble: {
    maxWidth: "75%",
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  bubbleUser: { backgroundColor: Colors.greenDark, borderBottomRightRadius: Radius.sm },
  bubbleAssistant: {
    borderBottomLeftRadius: Radius.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleText: { ...Typography.body, lineHeight: 22 },
  bubbleTextUser: { color: "#FFF" },
  bubbleTextAssistant: {},
  typingBubble: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, minWidth: 60, alignItems: "center" },
  stopBarWrap: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm, alignItems: "center" },
  stopBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  stopIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  stopSquare: { width: 7, height: 7, borderRadius: 1.5 },
  stopText: { ...Typography.caption, fontWeight: "600" },
  inputBar: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: 96 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  input: { flex: 1, ...Typography.body, maxHeight: 80, paddingVertical: 4 },
  inputActions: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, flexShrink: 0 },
  actionBtn: { flexShrink: 0 },
  actionBtnPressed: { opacity: 0.75 },
  actionBtnGradient: { width: 32, height: 32, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center" },
});
