import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY ?? "";

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
});

/**
 * Transcreve um arquivo de áudio usando Gemini.
 * Recebe o base64 do arquivo e o mimeType (ex: "audio/m4a").
 */
export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
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
    model: "gemini-flash-latest",
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

/**
 * Solicita à IA sugestões de alimentos similares que mantenham macros e calorias próximas.
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
  mealType: string
): Promise<FoodSuggestion[]> {
  const prompt = `Você é um nutricionista especializado em alimentação brasileira e conhece profundamente a Tabela TACO (Tabela Brasileira de Composição de Alimentos da UNICAMP).

ALIMENTO ORIGINAL:
- Nome: ${originalFood.name}
- Quantidade: ${originalFood.quantity_g}g
- Calorias: ${originalFood.kcal} kcal
- Proteínas: ${originalFood.protein_g}g
- Carboidratos: ${originalFood.carbo_g}g
- Gorduras: ${originalFood.fat_g}g
- Refeição: ${mealType}

TAREFA:
Sugira 3 alimentos da base TACO que possam SUBSTITUIR este alimento, mantendo valores nutricionais PRÓXIMOS (±20% de variação é aceitável).

REGRAS IMPORTANTES:
1. Use APENAS alimentos típicos brasileiros da base TACO (UNICAMP)
2. Mantenha calorias próximas (±20%)
3. Mantenha proporção de macros similar (proteína, carboidrato, gordura)
4. Considere o tipo de refeição (ex: não sugerir sobremesa no café da manhã)
5. Priorize alimentos práticos e comuns no Brasil
6. Ajuste as quantidades em gramas para atingir valores nutricionais similares
7. Use nomes oficiais da tabela TACO

EXEMPLOS DE ALIMENTOS TACO:
- Cereais: arroz integral, aveia, pão integral, tapioca
- Proteínas: frango, carne bovina, peixe, ovo, feijão
- Laticínios: leite, iogurte, queijo minas, requeijão
- Frutas: banana, maçã, mamão, abacate, laranja
- Legumes: batata doce, mandioca, inhame, abóbora

FORMATO DE RESPOSTA (JSON válido):
[
  {
    "name": "Nome do alimento conforme tabela TACO",
    "quantity_g": 150,
    "kcal": 140,
    "protein_g": 12,
    "carbo_g": 1,
    "fat_g": 10,
    "reason": "Breve explicação de por que é uma boa substituição"
  }
]

Responda APENAS com o array JSON, sem texto adicional.`;

  try {
    console.log("🤖 Iniciando chamada ao Gemini...");
    console.log("📝 Alimento original:", originalFood.name);
    
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log("✅ Resposta recebida da IA");
    console.log("📄 Texto bruto:", text.substring(0, 200));
    
    // Remove markdown code blocks se existirem
    const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const suggestions: FoodSuggestion[] = JSON.parse(cleanText);
    console.log("✅ Sugestões parseadas:", suggestions.length);
    return suggestions;
  } catch (error: any) {
    console.error("❌ Erro detalhado ao buscar sugestões da IA:");
    console.error("Tipo:", error?.constructor?.name);
    console.error("Mensagem:", error?.message);
    console.error("Stack:", error?.stack);
    console.error("Error completo:", JSON.stringify(error, null, 2));
    
    // Retornar sugestões mock para testes
    console.log("⚠️ Retornando sugestões mock para testes");
    return getMockSuggestions(originalFood, mealType);
  }
}

/**
 * Sugestões mock para testes quando a API falha.
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
  // Sugestões genéricas baseadas no perfil nutricional
  const isHighProtein = originalFood.protein_g > 10;
  const isLowCarb = originalFood.carbo_g < 5;
  const isHighFat = originalFood.fat_g > 10;

  if (isHighProtein && isLowCarb) {
    return [
      {
        name: "Omelete simples",
        quantity_g: Math.round(originalFood.quantity_g * 0.95),
        kcal: Math.round(originalFood.kcal * 1.05),
        protein_g: Math.round(originalFood.protein_g * 1.1),
        carbo_g: Math.round(originalFood.carbo_g * 1.2),
        fat_g: Math.round(originalFood.fat_g * 0.95),
        reason: "Alta proteína, baixo carboidrato, ideal para a refeição",
      },
      {
        name: "Queijo cottage",
        quantity_g: Math.round(originalFood.quantity_g * 1.3),
        kcal: Math.round(originalFood.kcal * 0.98),
        protein_g: Math.round(originalFood.protein_g * 1.15),
        carbo_g: Math.round(originalFood.carbo_g * 2),
        fat_g: Math.round(originalFood.fat_g * 0.7),
        reason: "Fonte proteica magra, fácil preparo",
      },
      {
        name: "Peito de frango desfiado",
        quantity_g: Math.round(originalFood.quantity_g * 0.8),
        kcal: Math.round(originalFood.kcal * 1.02),
        protein_g: Math.round(originalFood.protein_g * 1.3),
        carbo_g: 0,
        fat_g: Math.round(originalFood.fat_g * 0.4),
        reason: "Proteína magra, versátil",
      },
    ];
  }

  // Fallback genérico
  return [
    {
      name: "Alternativa 1",
      quantity_g: originalFood.quantity_g,
      kcal: Math.round(originalFood.kcal * 1.05),
      protein_g: originalFood.protein_g,
      carbo_g: originalFood.carbo_g,
      fat_g: originalFood.fat_g,
      reason: "Valores nutricionais similares",
    },
    {
      name: "Alternativa 2",
      quantity_g: Math.round(originalFood.quantity_g * 1.1),
      kcal: Math.round(originalFood.kcal * 0.95),
      protein_g: Math.round(originalFood.protein_g * 1.1),
      carbo_g: Math.round(originalFood.carbo_g * 0.9),
      fat_g: originalFood.fat_g,
      reason: "Opção com perfil nutricional próximo",
    },
    {
      name: "Alternativa 3",
      quantity_g: Math.round(originalFood.quantity_g * 0.9),
      kcal: originalFood.kcal,
      protein_g: originalFood.protein_g,
      carbo_g: Math.round(originalFood.carbo_g * 1.1),
      fat_g: Math.round(originalFood.fat_g * 0.9),
      reason: "Mantém equilíbrio de macros",
    },
  ];
}
