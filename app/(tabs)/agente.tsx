import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { sendChatMessage, transcribeAudio } from "../../services/gemini";
import { useAgenteStore } from "../../stores/useAgenteStore";
import { useUserStore } from "../../stores/useUserStore";

const QUICK_SUGGESTIONS = [
  { label: "Me mostre receitas saudáveis", prompt: "Me mostre receitas saudáveis para o meu objetivo!" },
  { label: "O que devo comer para minhas metas?", prompt: "O que devo comer para atingir minhas metas?" },
];

function buildSystemPrompt(user: NonNullable<ReturnType<typeof useUserStore.getState>["user"]>) {
  return `Você é o Agente de Performance e Nutrição do Nutrift.

DADOS DO USUÁRIO:
- Nome: ${user.name}
- Objetivo: ${user.goal}
- Meta calórica: ${user.daily_kcal} kcal/dia
- Macros: Proteína ${user.protein_g}g | Carbo ${user.carbo_g}g | Gordura ${user.fat_g}g
- Peso atual: ${user.weight_kg}kg | Meta: ${user.target_weight}kg
- Data estimada do objetivo: ${user.target_date}

REGRAS DE COMPORTAMENTO:
1. Responda sempre em português brasileiro
2. Seja direto e objetivo — máximo 3 frases por resposta
3. Nunca use emojis
4. Nunca use markdown (sem asteriscos, sem hashtags, sem listas com traços, sem negrito, sem itálico)
5. Escreva em texto corrido simples, como uma conversa natural
6. Nunca se apresente como nutricionista — você é um agente de IA
7. Para questões médicas, oriente a consultar um profissional de saúde
8. Use os dados do usuário para personalizar cada resposta
9. Encoraje consistência — pequenos ajustes, não reinventar o plano`;
}

const REPLY_BUFFER_MS = 5000;

export default function AgenteScreen() {
  const { C } = useTheme();
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

  // ─── Gravação nativa (iOS/Android) via expo-av ───────────────────────────
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
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
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

  // ─── Seletores de plataforma ──────────────────────────────────────────────
  const startRecording = Platform.OS === "web" ? startRecordingWeb : startRecordingNative;
  const stopRecording = Platform.OS === "web" ? stopRecordingWeb : stopRecordingNative;

  // Divide o texto em partes naturais (por frase) e envia com pausas
  const sendInChunks = async (fullText: string) => {
    // Quebra por ponto final, exclamação ou interrogação seguido de espaço ou fim
    const sentences = fullText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (let i = 0; i < sentences.length; i++) {
      // Pausa proporcional ao tamanho da frase — simula digitação humana
      const delay = Math.min(400 + sentences[i].length * 18, 1800);
      await new Promise((res) => setTimeout(res, delay));
      addMessage({ role: "assistant", content: sentences[i] });
      flatListRef.current?.scrollToEnd({ animated: true });

      // Mostra "digitando..." entre frases (exceto na última)
      if (i < sentences.length - 1) {
        setTyping(true);
        await new Promise((res) => setTimeout(res, 600));
      }
    }
  };

  const processMessages = async () => {
    const currentMessages = useAgenteStore.getState().messages;
    const userMessages = currentMessages.filter((m) => m.role === "user");
    if (userMessages.length === 0) return;

    // Pega todas as mensagens acumuladas no buffer para montar o histórico
    const historyForApi = currentMessages.slice(0, -1);

    // A última mensagem do usuário é a que será enviada
    const lastUserMsg = userMessages[userMessages.length - 1];

    abortRef.current = false;

    try {
      const systemPrompt = user ? buildSystemPrompt(user) : "";

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
      await sendInChunks(reply);
    } catch (err) {
      console.error("Agente erro:", err);
      setTyping(false);
      addMessage({
        role: "assistant",
        content: "Desculpe, tive um problema ao processar sua mensagem. Tente novamente.",
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

    // Cancela o timer anterior — reinicia o buffer de 5s
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      abortRef.current = true;
    }

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
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={[styles.headerBtn, { backgroundColor: C.surface }]}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: C.text }]}>NUTRIFT AI</Text>
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: C.greenDark }]} />
            <Text style={[styles.onlineText, { color: C.greenDark }]}>Online</Text>
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
        {/* Área principal */}
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
              <Text style={[styles.greetingSub, { color: C.textSecondary }]}>Como posso ajudar na sua nutrição hoje?</Text>
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

        {/* Input — fixo acima da navbar */}
        <View style={[styles.inputBar, { backgroundColor: C.background }]}>
          <View style={[styles.inputWrap, { backgroundColor: C.surface, borderColor: C.border }]}>
            {/* Campo de texto */}
            <TextInput
              style={[styles.input, { color: C.text }]}
              placeholder={isRecording ? "Gravando..." : isTranscribing ? "Transcrevendo..." : "Pergunte qualquer coisa..."}
              placeholderTextColor={isRecording ? C.error : C.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage(inputText)}
              returnKeyType="send"
              editable={!isRecording && !isTranscribing}
            />

            {/* Lado direito: enviar (quando tem texto) + microfone (sempre) */}
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
  root: {
    flex: 1,
  },

  // Header
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
  headerCenter: {
    alignItems: "center",
    gap: 2,
  },
  headerTitle: {
    ...Typography.label,
    fontSize: 13,
    letterSpacing: 1.5,
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  onlineText: {
    ...Typography.caption,
    fontWeight: "600",
  },

  // Tela inicial
  emptyContainer: {
    flex: 1,
  },
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
  greetingText: {
    ...Typography.h2,
    fontSize: 24,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  greetingName: {},
  greetingSub: {
    ...Typography.bodySmall,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  suggestionsWrap: {
    width: "100%",
    gap: Spacing.sm,
  },
  suggestionBtn: {
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
  },
  suggestionBtnPressed: {},
  suggestionText: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  // Mensagens
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
  msgRowUser: {
    justifyContent: "flex-end",
  },
  msgRowAssistant: {
    justifyContent: "flex-start",
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    overflow: "hidden",
    flexShrink: 0,
  },
  assistantAvatarGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  bubbleUser: {
    backgroundColor: Colors.greenDark,
    borderBottomRightRadius: Radius.sm,
  },
  bubbleAssistant: {
    borderBottomLeftRadius: Radius.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleText: {
    ...Typography.body,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: "#FFF",
  },
  bubbleTextAssistant: {},
  typingBubble: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minWidth: 60,
    alignItems: "center",
  },

  // Input — acima da navbar (navbar: bottom 24 + height 60 = 84)
  inputBar: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: 96,
  },
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
  inputIcon: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    ...Typography.body,
    maxHeight: 80,
    paddingVertical: 4,
  },
  inputActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flexShrink: 0,
  },
  actionBtn: {
    flexShrink: 0,
  },
  actionBtnPressed: {
    opacity: 0.75,
  },
  actionBtnGradient: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtn: {
    flexShrink: 0,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnPressed: {
    opacity: 0.8,
  },
  sendBtnGradient: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
