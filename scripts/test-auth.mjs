/**
 * Teste de cadastro e login Supabase.
 * Uso: node scripts/test-auth.mjs
 * Requer .env com EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env");

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error("Arquivo .env não encontrado em:", envPath);
    process.exit(1);
  }
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && value) process.env[key] = value;
  }
}

loadEnv();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey || url.includes("placeholder")) {
  console.error("Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no .env");
  process.exit(1);
}

const supabase = createClient(url, anonKey);

const TEST_EMAIL = `teste-${Date.now()}@nutrift-test.local`;
const TEST_PASSWORD = "senha123";

async function main() {
  console.log("--- Teste de cadastro (signUp) ---");
  console.log("URL:", url);
  console.log("E-mail de teste:", TEST_EMAIL);

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (signUpError) {
    console.error("\n[FALHA] signUp erro:", signUpError.message);
    console.error("Código:", signUpError.code || signUpError.status);
    console.error("Detalhes:", JSON.stringify(signUpError, null, 2));
    process.exit(1);
  }

  console.log("\n[OK] signUp sucesso.");
  console.log("User id:", signUpData.user?.id ?? "(vazio)");
  console.log("Session:", signUpData.session ? "ativa" : "null (confirmação de e-mail?)");

  if (!signUpData.session) {
    console.log("\n--- Projeto pode exigir confirmação de e-mail ---");
    console.log("No Supabase Dashboard: Authentication > Providers > Email > desative 'Confirm email' para testes.");
  }

  console.log("\n--- Teste de login (signIn) ---");
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (signInError) {
    console.error("[FALHA] signIn erro:", signInError.message);
    process.exit(1);
  }
  console.log("[OK] signIn sucesso. Session ativa.");
}

main().catch((e) => {
  console.error("Erro:", e);
  process.exit(1);
});
