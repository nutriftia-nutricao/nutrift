/**
 * Script para importar dados TACO (Tabela Brasileira de Composição de Alimentos)
 * para a tabela public.foods no Supabase.
 *
 * Uso: npx tsx 02_import_taco.ts
 *
 * Requer: .env com EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY
 * (ou SUPABASE_SERVICE_ROLE_KEY para inserir — a tabela foods tem RLS com SELECT público).
 */

async function loadEnv() {
  try {
    await import("dotenv/config");
  } catch {
    // dotenv opcional
  }
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Amostra de alimentos no estilo TACO (nome, kcal, proteína, carboidrato, gordura por 100g)
const TACO_SAMPLE = [
  { name: "Arroz branco cozido", calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3 },
  { name: "Feijão carioca cozido", calories: 127, protein: 8.6, carbs: 23.2, fat: 0.5 },
  { name: "Frango inteiro cozido", calories: 170, protein: 25, carbs: 0, fat: 7.4 },
  { name: "Ovo de galinha cozido", calories: 155, protein: 12.6, carbs: 1.1, fat: 10.6 },
  { name: "Banana prata", calories: 98, protein: 1.3, carbs: 25.9, fat: 0.1 },
];

async function main() {
  await loadEnv();

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log(
      "Variáveis EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY (ou SUPABASE_SERVICE_ROLE_KEY) não definidas. Defina no .env e rode de novo."
    );
    process.exit(0);
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const rows = TACO_SAMPLE.map((r) => ({
    name: r.name,
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fat: r.fat,
  }));

  const { data, error } = await supabase.from("foods").insert(rows).select("id");

  if (error) {
    console.error("Erro ao inserir na tabela foods:", error.message);
    console.log(
      "Dica: inserts em public.foods podem exigir SUPABASE_SERVICE_ROLE_KEY no .env (RLS)."
    );
    process.exit(1);
  }

  console.log(`TACO import: ${data?.length ?? 0} alimentos inseridos.`);
}

main();
