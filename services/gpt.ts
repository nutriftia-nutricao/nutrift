import { z } from "zod";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? "";
const OPENAI_MODEL = process.env.EXPO_PUBLIC_OPENAI_MODEL ?? "gpt-4o-mini";

type GeminiLikeHistoryItem = { role: "user" | "model"; text: string };

type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const OpenAIErrorSchema = z.object({
  error: z
    .object({
      message: z.string().optional(),
      type: z.string().optional(),
      code: z.string().optional(),
    })
    .optional(),
});

const OpenAIChatCompletionSchema = z.object({
  choices: z.array(
    z.object({
      message: z
        .object({
          content: z.string().optional(),
        })
        .optional(),
    })
  ),
});

export async function sendChatMessage(params: {
  systemPrompt: string;
  history: GeminiLikeHistoryItem[];
  userMessage: string;
}): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing EXPO_PUBLIC_OPENAI_API_KEY");
  }

  const messages: OpenAIMessage[] = [];

  const systemPrompt = params.systemPrompt.trim();
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  for (const h of params.history) {
    messages.push({
      role: h.role === "user" ? "user" : "assistant",
      content: h.text,
    });
  }

  messages.push({ role: "user", content: params.userMessage });

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.6,
      }),
    });
  } catch {
    throw new Error(
      "Falha de rede ao chamar a OpenAI. No web, isso pode ser bloqueio de CORS por chamar a OpenAI direto do navegador."
    );
  }

  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const parsedError = OpenAIErrorSchema.safeParse(json);
    const msg = parsedError.success ? parsedError.data.error?.message : undefined;
    throw new Error(msg ?? `OpenAI error (${res.status})`);
  }

  const parsed = OpenAIChatCompletionSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Resposta inesperada da OpenAI.");
  }

  const text = parsed.data.choices[0]?.message?.content?.trim();
  return text && text.length > 0
    ? text
    : "Desculpe, não consegui gerar uma resposta agora.";
}

