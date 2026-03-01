# CLAUDE.md — Nutrift App
> Guia completo para o Cursor. Leia este arquivo antes de qualquer tarefa.

---

## 🧠 O QUE É O NUTRIFT

App mobile de nutrição inteligente para o mercado brasileiro.
A proposta central: **o usuário sabe exatamente quando vai chegar no objetivo** — com uma data real.

Diferenciais:
- Base de alimentos TACO (UNICAMP) — 6.000+ alimentos brasileiros
- Onboarding em 90 segundos com plano gerado por IA
- Planejador semanal automático
- Agente de Performance e Nutrição IA (plano Ultra)
- Sem anúncios em nenhum plano
- Integração futura com Apple Watch / Wear OS / Garmin

---

## ⚙️ STACK TÉCNICA

| Camada | Tecnologia |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Navegação | Expo Router (file-based) |
| Estado global | Zustand |
| Backend | Supabase (auth + database + storage) |
| Autenticação | Email/senha + Google + Apple Login |
| IA do agente | Google Gemini API |
| Estilização | StyleSheet nativo do React Native |
| Linguagem | TypeScript (strict mode) |
| Ícones | @expo/vector-icons (Ionicons) |
| Fontes | Google Fonts via expo-font (Syne + DM Sans) |

---

## 📁 ESTRUTURA DE PASTAS

```
nutrift/
├── app/                          # Expo Router — cada arquivo = uma rota
│   ├── (auth)/                   # Grupo de rotas não autenticadas
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── onboarding/
│   │       ├── _layout.tsx
│   │       ├── step-1.tsx        # Nome e Sexo
│   │       ├── step-2.tsx        # Dados corporais
│   │       ├── step-3.tsx        # Objetivo principal
│   │       ├── step-4.tsx        # Nível de atividade
│   │       ├── step-5.tsx        # Ritmo semanal
│   │       ├── step-6.tsx        # Preferências alimentares
│   │       └── step-7.tsx        # Resultado do plano
│   ├── (tabs)/                   # Grupo de rotas autenticadas (nav)
│   │   ├── _layout.tsx           # Tab bar com 4 abas
│   │   ├── index.tsx             # Home (Início)
│   │   ├── progresso.tsx         # Progresso
│   │   ├── agente.tsx            # IA (bloqueado Free/Pro)
│   │   └── perfil.tsx            # Perfil
│   ├── plano-semanal.tsx         # Tela plano semanal (modal)
│   └── _layout.tsx               # Root layout
│
├── components/                   # Componentes reutilizáveis
│   ├── ui/                       # Componentes base
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── MacroPill.tsx
│   │   ├── Input.tsx
│   │   └── GradientButton.tsx
│   ├── home/
│   │   ├── CaloriaSummary.tsx
│   │   ├── MacroRow.tsx
│   │   ├── RefeicaoCard.tsx
│   │   └── WeekStrip.tsx
│   ├── plano/
│   │   ├── CalendarioSemanal.tsx
│   │   ├── ResumoDia.tsx
│   │   └── AlimentoRow.tsx
│   ├── onboarding/
│   │   ├── OnboardingHeader.tsx
│   │   ├── OptionCard.tsx
│   │   └── ResultCard.tsx
│   └── agente/
│       ├── ChatBubble.tsx
│       ├── ChatInput.tsx
│       └── UpgradeSheet.tsx
│
├── stores/                       # Zustand stores
│   ├── useUserStore.ts           # Dados do usuário
│   ├── useNutritionStore.ts      # Dados nutricionais do dia
│   ├── usePlanStore.ts           # Plano semanal
│   ├── useOnboardingStore.ts     # Dados do onboarding
│   └── useAgenteStore.ts         # Histórico do chat IA
│
├── services/                     # Integrações externas
│   ├── supabase.ts               # Cliente Supabase
│   ├── gemini.ts                 # Cliente Gemini API
│   ├── auth.ts                   # Funções de autenticação
│   ├── nutrition.ts              # Cálculos nutricionais
│   └── taco.ts                   # Busca na base TACO
│
├── types/                        # TypeScript types globais
│   ├── user.ts
│   ├── nutrition.ts
│   ├── plan.ts
│   └── supabase.ts               # Types gerados do Supabase
│
├── constants/
│   ├── colors.ts                 # Design system — cores
│   ├── typography.ts             # Design system — fontes
│   ├── spacing.ts                # Design system — espaçamentos
│   └── macros.ts                 # Constantes nutricionais
│
├── hooks/                        # Custom hooks
│   ├── useAuth.ts
│   ├── useNutrition.ts
│   └── usePlan.ts
│
├── utils/
│   ├── mifflin.ts                # Cálculo TMB Mifflin-St Jeor
│   ├── macros.ts                 # Cálculo de macros
│   ├── date.ts                   # Helpers de data
│   └── format.ts                 # Formatação (kcal, gramas, etc)
│
└── assets/
    ├── fonts/
    └── images/
```

---

## 🎨 DESIGN SYSTEM

### Cores — importar sempre de `constants/colors.ts`

```typescript
export const Colors = {
  // Verdes
  green: '#7DC95E',
  greenDark: '#3DA63A',
  greenLight: '#E8F5E9',
  greenMid: '#4CAF50',

  // Fundos
  background: '#F5F5F0',      // fundo principal
  surface: '#FFFFFF',          // cards e superfícies
  surfaceDark: '#111111',      // card Ultra/dark

  // Textos
  text: '#1A1A1A',
  textSecondary: '#757575',
  textMuted: '#BDBDBD',

  // Bordas
  border: '#EBEBEB',

  // Macros (consistentes em todo o app)
  protein: '#EF5350',          // vermelho
  proteinBg: '#FEE2E2',
  carbo: '#F59E0B',            // amarelo/laranja
  carboBg: '#FEF3C7',
  fat: '#3DA63A',              // verde
  fatBg: '#E8F5E9',

  // Estados
  error: '#EF4444',
  errorBg: '#FEE2E2',
  warning: '#F59E0B',
  success: '#3DA63A',
} as const
```

### Gradiente padrão dos botões

```typescript
// SEMPRE cima → baixo, nunca lateral
export const GradientColors = {
  primary: ['#7DC95E', '#3DA63A'] as const,
  dark: ['#1A1A1A', '#111111'] as const,
}
```

### Tipografia — importar sempre de `constants/typography.ts`

```typescript
export const Typography = {
  // Títulos — Syne
  h1: { fontFamily: 'Syne-Bold', fontSize: 32, letterSpacing: -1 },
  h2: { fontFamily: 'Syne-SemiBold', fontSize: 24, letterSpacing: -0.5 },
  h3: { fontFamily: 'Syne-SemiBold', fontSize: 20 },
  h4: { fontFamily: 'Syne-Medium', fontSize: 17 },

  // Corpo — DM Sans
  body: { fontFamily: 'DMSans-Regular', fontSize: 15, lineHeight: 22 },
  bodySmall: { fontFamily: 'DMSans-Regular', fontSize: 13, lineHeight: 18 },
  label: { fontFamily: 'DMSans-Medium', fontSize: 11,
           textTransform: 'uppercase', letterSpacing: 1 },
  caption: { fontFamily: 'DMSans-Regular', fontSize: 12 },
} as const
```

### Espaçamento — importar sempre de `constants/spacing.ts`

```typescript
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const
```

### Bordas e radius

```typescript
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 100,
} as const
```

---

## 🧮 REGRAS DE NEGÓCIO — NUTRIÇÃO

### Cálculo de TMB (Taxa Metabólica Basal)
**Fórmula Mifflin-St Jeor — única fórmula usada no app**

```typescript
// Masculino
TMB = (10 × peso_kg) + (6.25 × altura_cm) - (5 × idade) + 5

// Feminino
TMB = (10 × peso_kg) + (6.25 × altura_cm) - (5 × idade) - 161
```

### Multiplicadores de atividade

```typescript
export const ActivityMultipliers = {
  sedentario: 1.2,          // Sedentário (pouco ou nenhum exercício)
  levemente_ativo: 1.375,   // Levemente ativo (1-3 dias/semana)
  moderado: 1.55,           // Moderadamente ativo (3-5 dias/semana)
  muito_ativo: 1.725,       // Muito ativo (6-7 dias/semana)
} as const
```

### Cálculo TDEE e meta calórica

```typescript
TDEE = TMB × multiplicador_atividade

// Déficit/superávit por objetivo
const CalorieAdjustment = {
  perder_gordura: -500,     // 0.5 kg/semana padrão
  ganhar_massa: +300,
  manter: 0,
}

// Meta calórica final
meta_calorica = TDEE + ajuste_objetivo

// Ajuste por ritmo semanal escolhido (perder gordura)
const RitmoAjuste = {
  0.25: -250,   // 0.25 kg/semana
  0.5: -500,    // 0.5 kg/semana
  0.75: -750,   // 0.75 kg/semana
  1.0: -1000,   // 1.0 kg/semana
}
```

### Distribuição de macros padrão

```typescript
// Perder gordura
protein_g = peso_atual_kg * 2.0        // 2g por kg
fat_g = meta_calorica * 0.25 / 9       // 25% das calorias
carbo_g = restante / 4                  // resto em carbos

// Ganhar massa
protein_g = peso_atual_kg * 2.2
fat_g = meta_calorica * 0.25 / 9
carbo_g = restante / 4

// Manter
protein_g = peso_atual_kg * 1.8
fat_g = meta_calorica * 0.30 / 9
carbo_g = restante / 4
```

### Cálculo da data estimada do objetivo

```typescript
const semanas = Math.abs(peso_atual - peso_meta) / ritmo_kg_semana
const data_estimada = addWeeks(new Date(), semanas)
```

---

## 🔢 CÁLCULO COMPLETO — TELA 7 E PERFIL

### Função principal em `utils/mifflin.ts`

```typescript
interface NutritionResult {
  tmb: number       // Taxa Metabólica Basal — calorias para existir
  tdee: number      // Gasto Total Diário — com atividade física
  meta: number      // Meta calórica final — após ajuste do objetivo
  protein_g: number
  carbo_g: number
  fat_g: number
  target_date: Date
}

export function calcularNutricao(user: {
  sex: 'masculino' | 'feminino'
  weight_kg: number
  height_cm: number
  age: number
  activity: keyof typeof ActivityMultipliers
  goal: 'perder_gordura' | 'ganhar_massa' | 'manter'
  target_weight: number
  weekly_pace: 0.25 | 0.5 | 0.75 | 1.0
}): NutritionResult {

  // 1. TMB — Mifflin-St Jeor
  const tmb = user.sex === 'masculino'
    ? (10 * user.weight_kg) + (6.25 * user.height_cm) - (5 * user.age) + 5
    : (10 * user.weight_kg) + (6.25 * user.height_cm) - (5 * user.age) - 161

  // 2. TDEE — TMB × fator de atividade
  const tdee = Math.round(tmb * ActivityMultipliers[user.activity])

  // 3. META — TDEE + ajuste por ritmo semanal
  const ajuste = RitmoAjuste[user.weekly_pace]
  const meta = Math.round(tdee + ajuste)

  // 4. Macros baseados na meta
  const protein_g = Math.round(user.weight_kg * 2.0)
  const fat_g = Math.round((meta * 0.25) / 9)
  const carbo_g = Math.round((meta - (protein_g * 4) - (fat_g * 9)) / 4)

  // 5. Data estimada
  const semanas = Math.abs(user.weight_kg - user.target_weight) / user.weekly_pace
  const target_date = addWeeks(new Date(), semanas)

  return {
    tmb: Math.round(tmb),
    tdee,
    meta,
    protein_g,
    carbo_g,
    fat_g,
    target_date,
  }
}
```

---

### Exibição na Tela 7 do Onboarding

Mostrar os três valores em cards separados ANTES do resultado final,
para o usuário entender de onde vieram as calorias:

```
┌─────────────────────────────────────────┐
│  🔥 Como chegamos ao seu plano          │
│                                         │
│  TMB    1.820 kcal  "só existindo"      │
│  TDEE   2.600 kcal  "com sua rotina"    │
│  META   2.100 kcal  "para seu objetivo" │
│                     ← destaque verde    │
└─────────────────────────────────────────┘
```

Regras de exibição:
- TMB: label "Taxa Basal" · subtítulo "Calorias para o corpo funcionar em repouso"
- TDEE: label "Gasto Total" · subtítulo "Considerando seu nível de atividade"
- META: label "Sua Meta" · destaque em verde · subtítulo "Para atingir seu objetivo no ritmo escolhido"
- Fonte dos valores: Syne · 24px · weight 700
- META em Colors.greenDark · os outros em Colors.text
- Card: bg #F5F5F0 · radius 16px · padding 20px
- Separador: linha 1px #EBEBEB entre cada item

---

### Recálculo automático no Perfil

Sempre que o usuário salvar alterações nos dados abaixo,
chamar `calcularNutricao()` e atualizar o Supabase automaticamente:

```typescript
// Campos que disparam recálculo ao salvar
const CAMPOS_RECALCULO = [
  'weight_kg',      // peso atual
  'height_cm',      // altura
  'birth_date',     // idade
  'activity',       // nível de atividade
  'goal',           // objetivo
  'target_weight',  // peso meta
  'weekly_pace',    // ritmo semanal
] as const

// Hook no perfil
const handleSavePerfil = async (dadosAtualizados: Partial<User>) => {
  const precisaRecalcular = CAMPOS_RECALCULO.some(
    campo => campo in dadosAtualizados
  )

  if (precisaRecalcular) {
    const novoCalculo = calcularNutricao({ ...user, ...dadosAtualizados })
    await supabase
      .from('users')
      .update({
        ...dadosAtualizados,
        daily_kcal: novoCalculo.meta,
        protein_g: novoCalculo.protein_g,
        carbo_g: novoCalculo.carbo_g,
        fat_g: novoCalculo.fat_g,
        target_date: novoCalculo.target_date,
        tmb: novoCalculo.tmb,
        tdee: novoCalculo.tdee,
      })
      .eq('id', user.id)
  } else {
    // Salva só os campos alterados sem recalcular
    await supabase.from('users').update(dadosAtualizados).eq('id', user.id)
  }
}
```

Feedback visual após recálculo:
- Toast verde: "Plano recalculado com base nos novos dados ✓"
- Mostrar TMB / TDEE / META atualizados na seção "Meu Plano" do perfil
- Atualizar Zustand store imediatamente para refletir em toda a UI

---

## 👤 PLANOS E PERMISSÕES

```typescript
export type Plan = 'free' | 'pro' | 'ultra'

export const PlanFeatures = {
  free: {
    registro_diario: true,
    macros: true,
    taco: true,
    dashboard_basico: true,
    sem_anuncios: true,           // SEMPRE — em todos os planos
    planejador_ia: false,
    refeicao_livre: false,
    ajuste_treino: false,
    relatorios: false,
    agente_ia: false,
    smartwatch: false,
  },
  pro: {
    ...free_features,
    planejador_ia: true,
    refeicao_livre: true,         // 1x por semana
    ajuste_treino: true,
    relatorios: true,
    agente_ia: false,             // IA nos bastidores apenas
    smartwatch: false,
  },
  ultra: {
    ...pro_features,
    agente_ia: true,              // Chat completo com o agente
    smartwatch: true,
    metricas_avancadas: true,
    relatorio_semanal_ia: true,
  },
}
```

### Regra do botão IA no nav

```typescript
// Se free ou pro: mostrar botão com cadeado → abre UpgradeSheet
// Se ultra: botão desbloqueado → navega para agente.tsx
const handleAgentePress = () => {
  if (user.plan !== 'ultra') {
    openUpgradeSheet()
  } else {
    router.push('/(tabs)/agente')
  }
}
```

---

## 🗄️ MODELOS DE DADOS — SUPABASE

### Tabela: `users`
```sql
id            uuid (PK, auth.users)
name          text
email         text
sex           enum ('masculino', 'feminino')
birth_date    date
weight_kg     numeric
height_cm     numeric
goal          enum ('perder_gordura', 'ganhar_massa', 'manter')
activity      enum ('sedentario', 'levemente_ativo', 'moderado', 'muito_ativo')
target_weight numeric
weekly_pace   numeric (0.25 | 0.5 | 0.75 | 1.0)
plan          enum ('free', 'pro', 'ultra') DEFAULT 'free'
tmb           numeric (Taxa Metabólica Basal — calculada no onboarding)
tdee          numeric (Gasto Total Diário — calculado no onboarding)
daily_kcal    numeric (META final — calculada no onboarding)
protein_g     numeric
carbo_g       numeric
fat_g         numeric
target_date   date (calculada no onboarding)
created_at    timestamptz
```

### Tabela: `food_logs`
```sql
id            uuid (PK)
user_id       uuid (FK users)
date          date
meal_type     enum ('cafe', 'almoco', 'lanche', 'jantar', 'extra')
food_id       text (referência TACO)
food_name     text
quantity_g    numeric
kcal          numeric
protein_g     numeric
carbo_g       numeric
fat_g         numeric
confirmed     boolean DEFAULT false
created_at    timestamptz
```

### Tabela: `weekly_plans`
```sql
id            uuid (PK)
user_id       uuid (FK users)
week_start    date
generated_by  enum ('ia', 'manual')
status        enum ('ativo', 'concluido', 'rascunho')
created_at    timestamptz
```

### Tabela: `meal_plans`
```sql
id            uuid (PK)
plan_id       uuid (FK weekly_plans)
day_of_week   integer (0=seg, 6=dom)
meal_type     enum ('cafe', 'almoco', 'lanche', 'jantar')
scheduled_at  time
foods         jsonb (array de alimentos com macros)
total_kcal    numeric
confirmed     boolean DEFAULT false
is_cheat_meal boolean DEFAULT false
```

### Tabela: `agent_messages`
```sql
id            uuid (PK)
user_id       uuid (FK users)
role          enum ('user', 'assistant')
content       text
created_at    timestamptz
```

---

## 🤖 INTEGRAÇÃO GEMINI — AGENTE IA

### Configuração do cliente

```typescript
// services/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_KEY!)

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction: buildSystemPrompt(user),
})
```

### System prompt do agente

```typescript
export const buildSystemPrompt = (user: User) => `
Você é o Agente de Performance e Nutrição do Nutrift.
Você fala português brasileiro de forma clara, direta e encorajadora.

DADOS DO USUÁRIO:
- Nome: ${user.name}
- Objetivo: ${user.goal}
- Meta calórica: ${user.daily_kcal} kcal/dia
- Macros: Proteína ${user.protein_g}g | Carbo ${user.carbo_g}g | Gordura ${user.fat_g}g
- Peso atual: ${user.weight_kg}kg | Meta: ${user.target_weight}kg
- Data estimada do objetivo: ${user.target_date}

REGRAS:
1. Nunca se apresente como nutricionista — você é um agente de IA
2. Para questões médicas, oriente a consultar um profissional
3. Respostas objetivas, máximo 3 parágrafos curtos
4. Use os dados do usuário para personalizar cada resposta
5. Sempre encoraje a consistência — pequenos ajustes, não reinventar o plano
`
```

---

## 📐 REGRAS DE CÓDIGO

### 1. TypeScript strict — sem `any`
```typescript
// ❌ Errado
const user: any = {}

// ✅ Correto
const user: User = {}
```

### 2. Componentes sempre tipados com interface
```typescript
// ✅ Padrão obrigatório
interface MacroPillProps {
  type: 'protein' | 'carbo' | 'fat'
  value: number
  unit?: string
}

export function MacroPill({ type, value, unit = 'g' }: MacroPillProps) {
  // ...
}
```

### 3. Styles sempre no final do arquivo com StyleSheet
```typescript
// ✅ Padrão obrigatório
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
})
```

### 4. Nunca hardcodar cores ou tamanhos
```typescript
// ❌ Errado
backgroundColor: '#7DC95E'
padding: 16

// ✅ Correto
backgroundColor: Colors.green
padding: Spacing.lg
```

### 5. Zustand store — padrão obrigatório
```typescript
// stores/useUserStore.ts
interface UserState {
  user: User | null
  isLoading: boolean
  setUser: (user: User) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))
```

### 6. Gradientes — sempre via LinearGradient
```typescript
import { LinearGradient } from 'expo-linear-gradient'

// ✅ Padrão para todos os botões primários
<LinearGradient
  colors={GradientColors.primary}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}  // sempre cima → baixo
  style={styles.button}
>
```

### 7. Tratamento de erros assíncronos
```typescript
// ✅ Sempre try/catch com feedback ao usuário
const handleSave = async () => {
  try {
    setLoading(true)
    await saveData()
  } catch (error) {
    console.error('handleSave:', error)
    Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.')
  } finally {
    setLoading(false)
  }
}
```

### 8. Expo Router — navegação tipada
```typescript
import { router } from 'expo-router'

// ✅ Sempre usar router tipado
router.push('/(tabs)/progresso')
router.replace('/(auth)/login')
router.back()
```

---

## 📱 NAVBAR — DEFINIÇÃO OFICIAL

### 4 abas fixas — ordem obrigatória
```
1. Hoje      → /(tabs)/index        → ícone: casa
2. Progresso → /(tabs)/progresso    → ícone: gráfico de barras
3. IA        → /(tabs)/agente       → ícone: ✨ estrela (botão destacado)
4. Perfil    → /(tabs)/perfil       → ícone: pessoa
```

### Estilo: navbar FLUTUANTE
- Flutua sobre o conteúdo — não grudada na borda inferior
- Posição: fixed bottom · margin bottom 20px · margin horizontal 20px
- Formato pill: bg #FFFFFF · border-radius 100px
- Borda: 1px #EBEBEB
- Sombra: 0px 8px 32px rgba(0,0,0,0.10)
- Padding horizontal 8px · Padding vertical 10px

### Botão IA (destacado)
- Círculo 52px · gradiente cima→baixo #7DC95E → #3DA63A
- Elevado -8px acima da linha da navbar
- Sombra: 0px 6px 20px rgba(61,166,58,0.45)
- Ícone ✨ branco 24px (Ultra) · ícone 🔒 branco 22px (Free/Pro)

### Estados
- Ativo: ícone + label #3DA63A
- Inativo: ícone + label #BDBDBD
- Label: 10px · weight 500

---

## 🔄 FLUXO DE NAVEGAÇÃO

```
App abre
  ├── Usuário não autenticado → /(auth)/login
  │     └── Primeiro acesso → /(auth)/onboarding/step-1 → ... → step-7
  │
  └── Usuário autenticado → /(tabs)/index (Home)
        ├── Botão "Semana" → /plano-semanal (modal)
        ├── Nav: Progresso → /(tabs)/progresso
        ├── Nav: IA (Ultra) → /(tabs)/agente
        ├── Nav: IA (Free/Pro) → UpgradeSheet (bottom sheet)
        └── Nav: Perfil → /(tabs)/perfil
```

---

## ✅ CHECKLIST ANTES DE CADA COMMIT

- [ ] Nenhum `any` no TypeScript
- [ ] Nenhuma cor ou tamanho hardcodado
- [ ] Todos os gradientes são cima → baixo
- [ ] Cores de macros consistentes (proteína=vermelho, carbo=amarelo, gordura=verde)
- [ ] Fundo principal `#F5F5F0` (não branco puro)
- [ ] Tratamento de erro em todas as funções assíncronas
- [ ] Loading state em todas as ações que esperam resposta
- [ ] Permissões de plano verificadas antes de abrir features pagas

---

## 🚫 O QUE NUNCA FAZER

- Nunca usar `#FFFFFF` como fundo de tela — usar `#F5F5F0`
- Nunca gradiente lateral — sempre cima → baixo
- Nunca usar `any` no TypeScript
- Nunca hardcodar strings de UI — criar constants/strings.ts
- Nunca chamar Gemini API diretamente do componente — sempre via services/gemini.ts
- Nunca armazenar dados sensíveis em AsyncStorage — usar Supabase
- Nunca mostrar features pagas sem verificar o plano do usuário
- Nunca usar a palavra "nutricionista" para descrever o agente IA

---

## 🎨 LEITURA DE DESIGNS DO STITCH — REGRAS DE IMPLEMENTAÇÃO

### Como usar os arquivos exportados do Stitch

O design visual do Nutrift foi criado no Stitch.
Quando o usuário fornecer um print, imagem ou código exportado do Stitch,
siga este processo obrigatório antes de escrever qualquer código:

**PASSO 1 — ANALISAR O DESIGN**
Examine a imagem/export com atenção total antes de codar. Identifique:
- Estrutura de layout (colunas, linhas, sobreposições)
- Hierarquia visual (o que é maior/menor, o que está em destaque)
- Espaçamentos aproximados entre elementos
- Estados visíveis (ativo, inativo, expandido, concluído)
- Componentes reutilizáveis presentes na tela

**PASSO 2 — MAPEAR PARA O DESIGN SYSTEM**
Nunca invente valores. Sempre mapeie o que vê para as constantes do projeto:
- Cores → Colors (constants/colors.ts)
- Espaçamentos → Spacing (constants/spacing.ts)
- Raios de borda → Radius (constants/radius.ts)
- Tipografia → Typography (constants/typography.ts)

**PASSO 3 — IDENTIFICAR COMPONENTES EXISTENTES**
Antes de criar novo código, verificar se já existe componente para o elemento:
- Botão verde gradiente → GradientButton.tsx
- Card branco com borda → Card.tsx
- Pills de macros → MacroPill.tsx
- Barra de progresso → ProgressBar.tsx
- Input de formulário → Input.tsx

**PASSO 4 — IMPLEMENTAR PIXEL-PERFECT**
Replicar o design com fidelidade máxima:

```typescript
// ✅ Abordagem correta ao receber um design do Stitch
// 1. Descrever o que vê antes de codar
// "Vejo um card branco com borda 1px #EBEBEB, radius 16px,
//  padding 16px, contendo header com ícone à esquerda e
//  chevron à direita, seguido de lista de alimentos"

// 2. Mapear para constantes
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,      // #FFFFFF
    borderWidth: 1,
    borderColor: Colors.border,            // #EBEBEB
    borderRadius: Radius.lg,              // 16px
    padding: Spacing.lg,                  // 16px
  }
})

// 3. Replicar estados visuais
// Estado concluído: borda esquerda verde 3px
// Estado expandido: chevron rotacionado 180°
// Estado pendente: círculo vazio com borda #EBEBEB
```

---

### Regras específicas por elemento do Stitch

**CARDS DE REFEIÇÃO**
- Concluído: borderLeftWidth 3 · borderLeftColor Colors.greenDark · ícone ✓ círculo verde
- Expandido: chevron rotacionado · lista de alimentos visível
- Pendente: círculo vazio borderWidth 1.5 · borderColor Colors.border

**CARDS DE SELEÇÃO (onboarding)**
- Inativo: bg Colors.surface · border 1px Colors.border · texto Colors.textSecondary
- Ativo: bg Colors.greenLight · border 2px Colors.green · borderLeftWidth 4 Colors.green

**BARRAS DE PROGRESSO**
- Sempre altura 4px · borderRadius Radius.pill
- Fundo: Colors.border (#EBEBEB)
- Preenchimento: gradiente esquerda→direita Colors.green → Colors.greenDark
- Nunca mostrar percentual em texto — só a barra visual

**PILLS DE MACROS**
- Proteína: bg Colors.proteinBg (#FEE2E2) · texto Colors.protein (#EF5350)
- Carboidrato: bg Colors.carboBg (#FEF3C7) · texto Colors.carbo (#F59E0B)
- Gordura: bg Colors.fatBg (#E8F5E9) · texto Colors.fat (#3DA63A)
- Padding: 4px 10px · borderRadius Radius.pill · fontSize 11 · fontWeight '600'

**BOTÕES PRIMÁRIOS**
- Sempre LinearGradient cima→baixo #7DC95E → #3DA63A
- Altura: 56px (telas principais) · 44px (dentro de cards)
- borderRadius: Radius.pill (100px)
- Sombra: shadowColor '#3DA63A' · shadowOffset {0,4} · shadowOpacity 0.35 · shadowRadius 12

**NAVBAR FLUTUANTE**
- position: 'absolute' · bottom: 20 · left: 20 · right: 20
- borderRadius: Radius.pill
- bg: Colors.surface · borderWidth 1 · borderColor Colors.border
- Sombra: shadowColor '#000' · shadowOpacity 0.10 · shadowRadius 16
- Botão IA: marginTop: -8 (elevado acima da navbar)

---

### Quando receber código exportado do Stitch

O Stitch pode exportar em React Native ou HTML/CSS.
Se o código vier em formato diferente do projeto, converter seguindo estas regras:

```typescript
// Stitch exporta em pixels absolutos → converter para Spacing/Radius
// Stitch usa hex inline → substituir por Colors.*
// Stitch usa StyleSheet inline → mover para StyleSheet.create() no final
// Stitch não usa TypeScript → adicionar tipagem completa
// Stitch não usa gradiente → substituir backgroundColor por LinearGradient
// Stitch usa fontes genéricas → substituir por Syne ou DM Sans conforme hierarquia
```

---

### Checklist de fidelidade ao design Stitch

Antes de entregar qualquer tela implementada, verificar:
- [ ] Layout idêntico ao design — mesma hierarquia visual
- [ ] Cores mapeadas para Colors.* — sem hex hardcodado
- [ ] Espaçamentos usando Spacing.* — sem números soltos
- [ ] Estados visuais todos implementados (ativo/inativo/expandido/pendente)
- [ ] Navbar flutuante presente e funcional
- [ ] Gradiente nos botões primários (não backgroundColor sólido)
- [ ] Fundo de tela #F5F5F0 (não branco)
- [ ] Scroll funcionando quando conteúdo ultrapassa a tela
- [ ] Padding bottom 90px para conteúdo não ficar atrás da navbar
