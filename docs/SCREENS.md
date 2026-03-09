# Nutrift — SCREENS.md
> Estrutura e lógica de cada tela. Consulte ao implementar ou alterar telas.

---

## TELA HOJE — (tabs)/index.tsx

```
SafeAreaView bg #111111
│
├── Header
│   ├── Foto usuário (48x48, borderRadius 12) + "Boa tarde, [Nome]"
│   ├── Ícone sino (notificações) com badge vermelho
│   └── Pill streak: 🔥 X dias em sequência
│
├── Card Ajuste Calórico (só segunda-feira se houve ajuste)
│   bg #1C1C1C · borderLeft 3px #CAFF66
│   "Meta ajustada: 2.100 → 1.950 kcal"
│   "Baseado no seu progresso da semana passada 📉"
│
├── Card Calorias (bg #1C1C1C, border #333333)
│   ├── "X kcal consumidas"
│   ├── "Meta: XXXX kcal · XX%"
│   ├── Barra de progresso #CAFF66 (height 6)
│   └── PROTEÍNA Xg · CARBOS Xg · GORDURA Xg
│
├── Cards lado a lado
│   ├── Atividade: "X de XX min" [+]
│   └── Hidratação: "X.X / X.XL" [+]
│
├── Toggle: [Hoje] [Semana]
│
└── FlatList Cards de Refeição
```

### Popup Hidratação (bottom sheet)
```
"Registrar Água"
├── X.XL de X.XL · XX% + barra progresso
├── RÁPIDO: [+200ml] [+300ml] [+500ml]
├── PERSONALIZADO: TextInput + "ml"
└── Botão "Adicionar" (#CAFF66, texto preto)
```

### Popup Atividade (bottom sheet)
```
"Nova Atividade"
├── Tipo: [Caminhada] [Corrida] [Academia]
├── Exercício: TextInput
├── Duração: TextInput + "minutos"
├── Intensidade: [Baixa] [Média] [Alta]
└── Botão "Salvar" (#CAFF66, texto preto)
```

---

## CARDS DE REFEIÇÃO

### Colapsado
```
[emoji 56x56]  [Nome refeição bold]              [chevron]
               [HH:MM · XXX / XXX kcal]
[████████░░░░] ← barra #CAFF66 height 4
```

### Expandido
```
[emoji]  [Nome refeição]   [···]
         [HH:MM · XXX / XXX kcal]
[██████████░░░░░░░░░░]

[ ☐ ]  Nome do Alimento • 150g        XXX kcal
       P: 12g  C: 22g  G: 5g

[✅]  ~~Alimento Marcado~~ • 80g      XXX kcal
       P: 2g   C: 8g   G: 15g    ← strikethrough + cor #666666
```

### Lógica checkbox
```typescript
// Marcar → update plan_meal_foods.is_checked no Supabase
// Barra: checkedFoods.reduce(sum kcal) / totalKcal * 100
// 100% → ícone refeição ganha ✓ #45C588
// Atualizar daily_logs
```

### Menu ···
```
"Substituir via IA"  → Gemini sugere similar em macros (sem custo pontos)
"Buscar na TACO"     → /buscar-alimento (-5 pontos)
"Refeição livre"     → só Pro · 1x/semana · sem penalidade
```

---

## TELA PROGRESSO — (tabs)/progresso.tsx

```
Seletor: [Semanal] [Mensal] [Anual]

Card Insight (se houver conquista)
  borderLeft 3px #CAFF66
  "⚡ NOVO MARCO — X dias seguindo o plano!"

Card Score Consistência
  "87% · 🔥 6 dias · 1 substituição esta semana"

Card duplo 1: Calorias (kcal) | Macros (%)
Card duplo 2: Peso (kg)       | % Gordura
Card duplo 3: Hidratação (ml) | Atividade física
Card IMC: gauge velocímetro

Todos: linha tracejada = meta · linha sólida #CAFF66 = realizado

Card Histórico Ajustes (Pro)
  "Seu plano foi ajustado X vezes esta semana"
  Lista: "Semana 1: 2.100 kcal → Semana 2: 1.950 kcal (-150)"
```

---

## TELA AGENTE IA — (tabs)/agente.tsx

```
Header: "NUTRIFT AI" · • Online (#45C588)

Estado inicial:
├── ✨ centralizado grande (#CAFF66)
├── "Olá, [Nome]!"
└── "Como posso ajudar na sua nutrição hoje?"

Ações rápidas:
├── "Ver meu plano desta semana"
└── "Sugerir substituição"

Input: "Pergunte qualquer coisa..." + 🎤

Regras:
- Sessão começa do zero (sem histórico)
- Contexto do usuário injetado automaticamente
- Gemini 2.5 Flash
- Só Pro (Free vê paywall)
```

---

## TELA PERFIL — (tabs)/perfil.tsx

```
Header card
├── Foto (64x64, borderRadius 14)
├── Nome · Badge [Free/Pro] · 🔥 streak

MINHA CONTA
├── Meu objetivo
├── Dados corporais
├── Dieta e preferências
└── Integrações

CONFIGURAÇÕES
├── Assinatura
├── Notificações
├── Tema (Dark/Light)
└── Sair / Excluir conta
```

### Notificações — perfil/notificacoes.tsx
```
Toggle geral: Ativar notificações

Por refeição (se toggle ON):
├── Café da Manhã  [toggle] [08:00 ▼]
├── Lanche Manhã   [toggle] [10:00 ▼]
├── Almoço         [toggle] [12:30 ▼]
├── Lanche Tarde   [toggle] [15:00 ▼]
└── Jantar         [toggle] [19:30 ▼]

Motivacionais [toggle separado]

→ Salva em notification_settings + agenda expo-notifications locais
```

### Dados Corporais — perfil/dados-corporais.tsx
```
INFORMAÇÕES
├── Peso atual (kg)
├── Altura (cm)
├── % Gordura (opcional)
└── Peso meta (kg)

PLANO ATUAL (readonly)
└── kcal/dia · P · C · G

Botão "Salvar" (#CAFF66, texto preto)
→ Atualiza user_profiles + recalcula user_macros
```

---

## ONBOARDING — app/(auth)/onboarding/

### Estilo visual (referência: print enviado)
```
- bg #111111
- Barra de progresso no topo (#CAFF66, fina)
- Título grande centralizado branco
- Subtítulo pequeno #B3B3B3
- Scroll picker nativo para números (altura, peso, idade)
- Cards de seleção: bg #1C1C1C, border #333333
  → selecionado: border #CAFF66, bg rgba(202,255,102,0.08)
- Botão "Continuar" (#CAFF66, texto preto, largura total, fixo no bottom)
- Seta voltar ← no top left
```

### Step 1 — Nome + Sexo
```
"Como você se chama?"
TextInput nome

"Qual seu sexo biológico?"
[Card Masculino 👨] [Card Feminino 👩]
```

### Step 2 — Dados corporais
```
"Qual sua altura?"     → scroll picker 140–220 cm
"Qual seu peso?"       → scroll picker 30–200 kg
"Qual sua idade?"      → scroll picker 15–100 anos
"% Gordura (opcional)" → TextInput numérico
  hint: "Encontre nas configurações da sua balança"
```

### Step 3 — Objetivo (4 cards)
```
"Qual é seu objetivo?"

[Perder gordura]
 Déficit calórico controlado

[Ganhar massa muscular]
 Superávit + proteína alta

[Secar e definir]
 Perder gordura mantendo o músculo

[Transformação completa]
 Menos gordura. Mais músculo. Ao mesmo tempo.
 ⚠️ "Caminho mais desafiador — e mais recompensador"
```

### Step 4 — Peso meta
```
"Qual seu peso ideal?"
Slider visual com valor atual em pill #CAFF66
Range dinâmico baseado no objetivo selecionado
```

### Step 5 — Nível atividade (4 cards)
```
Sedentário       | Trabalho em casa/escritório
Levemente ativo  | 1–3 dias de exercício/semana
Moderado         | 3–5 dias de exercício/semana
Muito ativo      | 6–7 dias ou trabalho físico
```

### Step 6 — Treino
```
"Você faz atividade física?"
[Não pratico] [Pratico em casa] [Academia / esporte]

Se academia:
"Qual horário costuma treinar?"
scroll picker 06:00–22:00
```

### Step 7 — Ritmo semanal
```
"Qual ritmo de mudança você prefere?"
(só para objetivos com déficit ou superávit)

[0,25 kg/semana]  Devagar e consistente
[0,5 kg/semana]   Ritmo recomendado ← padrão
[0,75 kg/semana]  Moderado
[1,0 kg/semana]   Agressivo
```

### Step 8 — Preferências alimentares
```
"Você segue alguma dieta específica?"
Grid 2x3 (múltipla seleção):
[Onívoro ✓ padrão] [Vegetariano]
[Vegano]           [Low carb]
[Sem glúten]       [Sem lactose]
```

### Step 9 — Resultado (não é form — só exibe)
```
"Seu plano está pronto, [Nome]! 🎉"

┌─────────────────────────────────┐
│  2.100 kcal / dia               │  ← bg #CAFF66, texto PRETO
│  Para perder 0,5kg por semana   │
└─────────────────────────────────┘

"Você chega ao seu objetivo em"
[15 de Junho de 2026]              ← grande, #CAFF66

┌──────────────┬──────────────┐
│ TMB          │ Hidratação   │
│ 1.680 kcal   │ 3,4L / dia   │
├──────────────┼──────────────┤
│ IMC          │ Meta         │
│ 24,2 Normal  │ 72kg → 68kg  │
└──────────────┴──────────────┘

Pills macros:
[P 160g #FF6F43] [C 210g #F59E0B] [G 65g #45C588]

Mensagem por objetivo:
  Perder gordura:   "Você perde Xkg até [data]"
  Ganhar massa:     "Você ganha Xkg de massa até [data]"
  Secar e definir:  "Você vai de X% para Y% gordura até [data]"
  Transformação:    "Em [data] menos X% gordura e mais músculo visível"

[Começar meu plano →]              ← #CAFF66, texto PRETO, largura total
```

---

## PLANO SEMANAL — plano-semanal.tsx

### Alterações no código atual
```
REMOVER: barra de busca do topo
MANTER:  seletor dias da semana
MANTER:  cards refeição colapsáveis
ADICIONAR: barra progresso kcal em cada card
ADICIONAR: checkbox por alimento (remover ícone swap atual)
MOVER: substituição para menu ···
TROCAR: Colors.greenDark → #CAFF66
TROCAR: Colors.greenLight → #1C1C1C
CONECTAR: mock → Supabase
```

### Query Supabase
```typescript
const { data: plan } = await supabase
  .from('weekly_plans')
  .select(`*, plan_meals(*, plan_meal_foods(*, foods(*)))`)
  .eq('user_id', userId)
  .eq('week_start_date', weekStart)
  .eq('status', 'active')
  .single();

// Marcar alimento
await supabase
  .from('plan_meal_foods')
  .update({ is_checked: true, checked_at: new Date().toISOString() })
  .eq('id', foodId);
```

---

## PAYWALL

### A — Bottom sheet (ao tocar em feature bloqueada)
```
Ícone da feature + "Recurso exclusivo Pro"
3 bullets com benefícios principais
[Iniciar 7 dias grátis] (#CAFF66, texto preto)
[Ver todos os benefícios] → Perfil > Assinatura
```

### B — Perfil > Assinatura
```
Free vs Pro lado a lado
Destaque: R$179/ano = R$14,90/mês (economia 40%)
[Iniciar 7 dias grátis] (#CAFF66)
[Assinar Pro R$24,90/mês]
```

### C — Após trial expirar (dia 8, modal fullscreen)
```
"Seu período gratuito acabou"
Plano próxima semana visível mas com blur
"Continue com Pro para desbloquear"
[Continuar Pro] (#CAFF66, texto preto)
[Voltar ao Free] (texto #B3B3B3)
```
