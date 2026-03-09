# SETUP.md — Nutrift
> Guia de configuração do ambiente do zero.
> Siga na ordem. Não pule etapas.

---

## 1. Pré-requisitos

```bash
node --version    # >= 18
npm --version     # >= 9
git --version
```

Instalar globais se necessário:
```bash
npm install -g eas-cli
npm install -g supabase
```

---

## 2. Clonar e instalar

```bash
cd C:\Users\FERNANDO\Documents\Nutrift
npm install
```

---

## 3. Variáveis de ambiente

Crie `.env` na raiz (já deve existir — verificar):

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...sua_anon_key
```

**Nunca colocar no .env do app:**
- `GEMINI_API_KEY` → apenas em Edge Functions
- `ASAAS_API_KEY` → apenas em Edge Functions
- `SUPABASE_SERVICE_ROLE_KEY` → apenas em Edge Functions

---

## 4. Supabase — Configuração

### 4.1 Projeto PROD (criar separado do DEV)

1. Acessar app.supabase.com
2. New project → nome: "nutrift-prod"
3. Guardar: URL + anon key + service role key

### 4.2 Aplicar todas as migrations (na ordem)

No SQL Editor do Supabase, executar cada arquivo:

```
supabase/migrations/001_nutrift_schema.sql
supabase/migrations/002_add_onboarding_completed.sql
supabase/migrations/003_add_liked_foods.sql
supabase/migrations/004_add_meal_types_pre_treino.sql
supabase/migrations/005_allow_trigger_insert_users.sql
supabase/migrations/006_pending_fields.sql   ← criar na Sessão 1
```

### 4.3 Verificar RLS em todas as tabelas

No Supabase Dashboard → Table Editor → cada tabela → RLS: ON

### 4.4 Importar banco TACO

```bash
# Na raiz do projeto:
npx ts-node scripts/02_import_taco.ts
```

---

## 5. Edge Functions — Deploy

```bash
# Login Supabase CLI
supabase login

# Linkar ao projeto
supabase link --project-ref SEU_PROJECT_REF

# Configurar secrets (nunca commitar)
supabase secrets set GEMINI_API_KEY=sua_chave_gemini
supabase secrets set ASAAS_API_KEY=sua_chave_asaas

# Deploy (após criar os arquivos na Sessão 2)
supabase functions deploy gerar-plano
supabase functions deploy substituir-alimento
supabase functions deploy webhook-asaas
supabase functions deploy deletar-conta
```

### Teste local de Edge Function

```bash
supabase start
supabase functions serve gerar-plano --env-file supabase/functions/.env
```

---

## 6. Expo / EAS Build

```bash
# Login Expo
eas login

# Inicializar EAS (se eas.json não existir)
eas build:configure
```

Criar `eas.json` na raiz:

```json
{
  "cli": { "version": ">= 5.9.1" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": {
        "buildType": "app-bundle",
        "applicationId": "com.nutrift.app"
      }
    }
  }
}
```

Build de produção:
```bash
eas build --platform android --profile production
```

---

## 7. Rodar em desenvolvimento

```bash
npx expo start
```

- Escanear QR com Expo Go (Android)
- Ou pressionar `a` para abrir no emulador Android

---

## 8. Verificar TypeScript

```bash
npx tsc --noEmit
```

Rodar após cada sessão de implementação. Zero erros antes de commitar.

---

## 9. Estrutura de branches recomendada

```
main          ← produção (build EAS)
develop       ← integração
feature/s1-banco-store
feature/s2-edge-functions
feature/s3-tela-hoje
feature/s4-substituicao-paywall
feature/s5-onboarding-cron
```

---

## 10. Checklist rápido antes de publicar

```bash
npx tsc --noEmit                    # zero erros TypeScript
npx expo doctor                     # dependências saudáveis
eas build --platform android        # build sem erros
# Testar no dispositivo físico via APK preview
# Testar fluxo completo: cadastro → onboarding → Free → trial → Pro → plano gerado
```
