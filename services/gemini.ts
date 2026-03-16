import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY ?? "";

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

/**
 * Transcreve um arquivo de áudio usando Gemini.
 * Recebe o base64 do arquivo e o mimeType (ex: "audio/m4a").
 */
export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: base64Audio,
      },
    },
    { text: "Transcreva exatamente o que foi dito neste áudio em português. Retorne apenas o texto transcrito, sem comentários adicionais." },
  ]);
  return result.response.text().trim();
}

/**
 * Envia uma mensagem ao Gemini com histórico e system prompt.
 * Retorna o texto da resposta.
 */
export async function sendChatMessage(params: {
  systemPrompt: string;
  history: { role: "user" | "model"; text: string }[];
  userMessage: string;
}): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: params.systemPrompt,
  });

  const chat = model.startChat({
    history: params.history.map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    })),
  });

  const result = await chat.sendMessage(params.userMessage);
  return result.response.text();
}

interface FoodSuggestion {
  name: string;
  quantity_g: number;
  kcal: number;
  protein_g: number;
  carbo_g: number;
  fat_g: number;
  reason: string;
}

/** Preferências do usuário (onboarding) para personalizar a substituição. */
export interface SubstitutePreferences {
  diet_type: "onivoro" | "vegetariano" | "vegano" | "low_carb" | null;
  restrictions: string[];
  liked_foods: string[];
}

const DIET_LABELS: Record<string, string> = {
  onivoro: "onívoro",
  vegetariano: "vegetariano (sem carne/peixe)",
  vegano: "vegano (sem nenhum produto animal)",
  low_carb: "low carb (poucos carboidratos)",
};

const RESTRICTION_LABELS: Record<string, string> = {
  sem_gluten: "sem glúten",
  sem_lactose: "sem lactose",
};

/**
 * Gera prompt curto para 1 substituto: mesma categoria, macros próximas, respeitando dieta e preferências.
 * Resposta mais rápida (menos tokens).
 */
function buildSingleSubstitutePrompt(
  originalFood: { name: string; quantity_g: number; kcal: number; protein_g: number; carbo_g: number; fat_g: number },
  mealType: string,
  prefs: SubstitutePreferences | undefined
): string {
  const dietLine = prefs?.diet_type
    ? `Tipo de alimentação do usuário: ${DIET_LABELS[prefs.diet_type] ?? prefs.diet_type}. O substituto DEVE respeitar isso.`
    : "";
  const restrictionStrings = (prefs?.restrictions ?? []).map(
    (r) => RESTRICTION_LABELS[r] ?? r
  );
  const restrictionsLine =
    restrictionStrings.length > 0
      ? `Restrições: ${restrictionStrings.join(", ")}. Não sugerir alimentos que contenham esses itens.`
      : "";
  const likedLine =
    (prefs?.liked_foods?.length ?? 0) > 0
      ? `Alimentos que a pessoa gosta (priorize substitutos desta lista quando for mesma categoria): ${prefs?.liked_foods?.slice(0, 15).join(", ")}.`
      : "";

  return `Substitua este alimento por UM ÚNICO substituto da base TACO (Brasil). Mesma CATEGORIA: se for proteína (alto P), sugira proteína; se carboidrato (alto C), carboidrato; se gordura (alto G), gordura. Macros muito próximas (±15%). Refeição: ${mealType}.
${dietLine}
${restrictionsLine}
${likedLine}

Alimento atual: ${originalFood.name}, ${originalFood.quantity_g}g, ${originalFood.kcal}kcal, P:${originalFood.protein_g}g C:${originalFood.carbo_g}g G:${originalFood.fat_g}g.

Responda APENAS um JSON válido, um único objeto, sem array e sem texto extra:
{"name":"Nome TACO","quantity_g":100,"kcal":140,"protein_g":12,"carbo_g":1,"fat_g":10,"reason":"uma frase"}`;
}

/**
 * Solicita à IA sugestões de alimentos similares. Com preferências, pede 1 substituto (resposta mais rápida).
 */
export async function getSimilarFoodSuggestions(
  originalFood: {
    name: string;
    quantity_g: number;
    kcal: number;
    protein_g: number;
    carbo_g: number;
    fat_g: number;
  },
  mealType: string,
  userPreferences?: SubstitutePreferences
): Promise<FoodSuggestion[]> {
  const useFastSingle = userPreferences != null;
  const prompt = useFastSingle
    ? buildSingleSubstitutePrompt(originalFood, mealType, userPreferences)
    : buildLegacyPrompt(originalFood, mealType);

  try {
    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: useFastSingle
        ? { maxOutputTokens: 400, temperature: 0.3 }
        : undefined,
    });
    const response = result.response;
    const text = response?.text?.()?.trim() ?? "";
    if (!text) return getMockSuggestions(originalFood, mealType);

    const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = parseJsonFromText(cleanText);
    if (parsed == null) return getMockSuggestions(originalFood, mealType);

    if (useFastSingle) {
      const one = normalizeSuggestion(Array.isArray(parsed) ? parsed[0] : parsed, originalFood);
      if (one?.name) return [one];
      return getMockSuggestions(originalFood, mealType);
    }

    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const suggestions: FoodSuggestion[] = arr
      .filter((s): s is FoodSuggestion => s != null && typeof s?.name === "string")
      .map((s) => normalizeSuggestion(s, originalFood));
    return suggestions.length > 0 ? suggestions : getMockSuggestions(originalFood, mealType);
  } catch (err) {
    console.warn("[getSimilarFoodSuggestions] erro:", err);
    return getMockSuggestions(originalFood, mealType);
  }
}

/** Extrai objeto ou array JSON de um texto que pode ter prefixo/sufixo. */
function parseJsonFromText(text: string): unknown {
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  const start =
    firstBrace === -1 ? firstBracket : firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket);
  if (start === -1) return null;
  const open = text[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === open) depth++;
    if (text[i] === close) {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  try {
    return JSON.parse(text.slice(start));
  } catch {
    return null;
  }
}

function normalizeSuggestion(
  raw: unknown,
  fallback: { quantity_g: number; kcal: number; protein_g: number; carbo_g: number; fat_g: number }
): FoodSuggestion {
  const s = raw as Record<string, unknown>;
  const num = (v: unknown, d: number) => (typeof v === "number" && !Number.isNaN(v) ? v : typeof v === "string" ? Number(v) || d : d);
  return {
    name: typeof s?.name === "string" ? s.name : "Substituto",
    quantity_g: Math.round(num(s?.quantity_g, fallback.quantity_g)),
    kcal: Math.round(num(s?.kcal, fallback.kcal)),
    protein_g: Math.round(num(s?.protein_g, fallback.protein_g) * 10) / 10,
    carbo_g: Math.round(num(s?.carbo_g, fallback.carbo_g) * 10) / 10,
    fat_g: Math.round(num(s?.fat_g, fallback.fat_g) * 10) / 10,
    reason: typeof s?.reason === "string" ? s.reason : "",
  };
}

/** Prompt longo (3 sugestões) para tela de substituição completa. */
function buildLegacyPrompt(
  originalFood: { name: string; quantity_g: number; kcal: number; protein_g: number; carbo_g: number; fat_g: number },
  mealType: string
): string {
  return `Nutricionista, base TACO Brasil. Alimento: ${originalFood.name}, ${originalFood.quantity_g}g, ${originalFood.kcal}kcal, P:${originalFood.protein_g}g C:${originalFood.carbo_g}g G:${originalFood.fat_g}g. Refeição: ${mealType}.
Sugira 3 substitutos TACO, macros próximas (±20%). Resposta APENAS array JSON:
[{"name":"...","quantity_g":N,"kcal":N,"protein_g":N,"carbo_g":N,"fat_g":N,"reason":"..."}]`;
}

/**
 * Fallback local quando a API falha. Sugere 1 alimento real da mesma categoria.
 */
function getMockSuggestions(
  originalFood: {
    name: string;
    quantity_g: number;
    kcal: number;
    protein_g: number;
    carbo_g: number;
    fat_g: number;
  },
  mealType: string
): FoodSuggestion[] {
  const isHighProtein = originalFood.protein_g >= 10;
  const isHighCarb = originalFood.carbo_g >= 15;
  const isHighFat = originalFood.fat_g >= 8;
  const isCafe = mealType === "cafe" || mealType === "lanche_manha";

  // Proteína dominante
  if (isHighProtein && !isHighCarb) {
    const opts: FoodSuggestion[] = [
      { name: "Ovo cozido", quantity_g: 100, kcal: 147, protein_g: 13, carbo_g: 1, fat_g: 10, reason: "Proteína completa, fácil preparo" },
      { name: "Peito de frango grelhado", quantity_g: 100, kcal: 159, protein_g: 32, carbo_g: 0, fat_g: 3, reason: "Proteína magra, baixo teor de gordura" },
      { name: "Atum em água escorrido", quantity_g: 80, kcal: 90, protein_g: 20, carbo_g: 0, fat_g: 1, reason: "Proteína concentrada, praticidade" },
      { name: "Iogurte grego natural", quantity_g: 150, kcal: 133, protein_g: 17, carbo_g: 6, fat_g: 4, reason: "Proteína com probióticos" },
    ];
    return [opts[Math.floor(Math.random() * opts.length)]];
  }

  // Carboidrato dominante
  if (isHighCarb && !isHighProtein) {
    const opts: FoodSuggestion[] = [
      { name: "Aveia em flocos", quantity_g: 50, kcal: 181, protein_g: 7, carbo_g: 30, fat_g: 3, reason: "Carboidrato complexo, rico em fibras" },
      { name: "Pão integral", quantity_g: 50, kcal: 121, protein_g: 5, carbo_g: 22, fat_g: 2, reason: "Carboidrato de absorção moderada" },
      { name: "Batata-doce cozida", quantity_g: 150, kcal: 135, protein_g: 2, carbo_g: 31, fat_g: 0, reason: "Carboidrato de baixo índice glicêmico" },
      { name: "Banana", quantity_g: 100, kcal: 98, protein_g: 1, carbo_g: 23, fat_g: 0, reason: "Energia rápida, rico em potássio" },
    ];
    return [opts[Math.floor(Math.random() * opts.length)]];
  }

  // Gordura dominante
  if (isHighFat && !isHighCarb) {
    const opts: FoodSuggestion[] = [
      { name: "Abacate", quantity_g: 80, kcal: 128, protein_g: 1, carbo_g: 3, fat_g: 12, reason: "Gordura monoinsaturada, anti-inflamatório" },
      { name: "Castanha-do-pará", quantity_g: 20, kcal: 132, protein_g: 3, carbo_g: 1, fat_g: 13, reason: "Gordura boa, rico em selênio" },
      { name: "Azeite de oliva extravirgem", quantity_g: 10, kcal: 90, protein_g: 0, carbo_g: 0, fat_g: 10, reason: "Gordura saudável, sabor suave" },
    ];
    return [opts[Math.floor(Math.random() * opts.length)]];
  }

  // Café da manhã / lanche — sugestões contextuais
  if (isCafe) {
    const opts: FoodSuggestion[] = [
      { name: "Tapioca com queijo", quantity_g: 80, kcal: 180, protein_g: 8, carbo_g: 28, fat_g: 4, reason: "Clássico do café brasileiro, versátil" },
      { name: "Vitamina de banana com aveia", quantity_g: 250, kcal: 200, protein_g: 6, carbo_g: 38, fat_g: 3, reason: "Nutritivo e prático para o café" },
      { name: "Iogurte com granola", quantity_g: 180, kcal: 210, protein_g: 8, carbo_g: 32, fat_g: 5, reason: "Equilíbrio de macro e probióticos" },
    ];
    return [opts[Math.floor(Math.random() * opts.length)]];
  }

  // Misto — substituto equilibrado
  const opts: FoodSuggestion[] = [
    { name: "Ovo mexido", quantity_g: 100, kcal: 155, protein_g: 11, carbo_g: 1, fat_g: 12, reason: "Equilibrado em proteína e gordura" },
    { name: "Frango com arroz integral", quantity_g: 200, kcal: 290, protein_g: 25, carbo_g: 28, fat_g: 5, reason: "Refeição completa e balanceada" },
    { name: "Atum com batata-doce", quantity_g: 200, kcal: 220, protein_g: 22, carbo_g: 25, fat_g: 2, reason: "Proteína + carboidrato complexo" },
  ];
  return [opts[Math.floor(Math.random() * opts.length)]];
}
