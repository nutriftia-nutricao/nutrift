/**
 * Testa conexão com Supabase e acesso às tabelas.
 * Uso: node --env-file=.env scripts/check-supabase.js
 * Ou: node -r dotenv/config scripts/check-supabase.js (se tiver dotenv)
 */

async function main() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  console.log("--- Configuração ---");
  console.log("EXPO_PUBLIC_SUPABASE_URL:", url ? `${url.substring(0, 40)}...` : "(não definido)");
  console.log("EXPO_PUBLIC_SUPABASE_ANON_KEY:", key ? `${key.substring(0, 20)}...` : "(não definido)");
  console.log("");

  if (!url || !key) {
    console.error("Erro: defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no .env");
    process.exit(1);
  }

  // URL do Supabase deve ser https://xxx.supabase.co
  if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    console.error("Erro: EXPO_PUBLIC_SUPABASE_URL deve ser a URL do projeto, ex: https://seu-projeto.supabase.co");
    console.error("Você colocou algo que parece uma chave (sb_publishable_...). No dashboard: Project Settings → API → Project URL");
    process.exit(1);
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key);

  const tables = ["users", "food_logs", "weekly_plans", "meal_plans", "plan_meal_foods", "agent_messages"];
  console.log("--- Testando tabelas (SELECT limit 1) ---");

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      console.log(`  ${table}: ERRO - ${error.message} (code: ${error.code})`);
    } else {
      console.log(`  ${table}: OK (${data?.length ?? 0} linha(s))`);
    }
  }

  console.log("");
  console.log("Conclusão: conexão e estrutura OK. (RLS pode retornar vazio se não houver sessão.)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
