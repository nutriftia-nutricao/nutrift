# Nutrift — DESIGN.md
> Design system completo. Consulte ao implementar qualquer componente visual.

---

## CORES — constants/colors.ts

```typescript
export const Colors = {
  // Primária
  primary:       '#CAFF66', // ATENÇÃO: texto sobre esta cor é SEMPRE preto
  primaryDark:   '#A8D94A',
  primaryLight:  '#EDFFC0',

  // Fundos (dark mode padrão)
  background:    '#111111',
  surface:       '#1C1C1C',
  elevated:      '#252525',

  // Texto
  text:          '#FFFFFF',
  textSecondary: '#B3B3B3',
  textDisabled:  '#4D4D4D',
  textOnPrimary: '#111111', // texto PRETO sobre #CAFF66

  // Bordas
  border:        '#333333',
  borderSubtle:  '#2A2A2A',

  // Semânticas
  success:       '#45C588',
  error:         '#FF6F43',
  warning:       '#F59E0B',

  // Macros
  protein:       '#FF6F43',
  proteinBg:     '#3D1F14',
  carbs:         '#F59E0B',
  carbsBg:       '#3D2E0A',
  fat:           '#45C588',
  fatBg:         '#1A3D2E',
} as const;
```

## TIPOGRAFIA — constants/typography.ts

```typescript
// fontFamily: 'System' → SF Pro (iOS) / Roboto (Android)
// Sem fontes externas

export const Typography = {
  h1: { fontFamily: 'System', fontWeight: '700' as const, fontSize: 32, letterSpacing: -1 },
  h2: { fontFamily: 'System', fontWeight: '600' as const, fontSize: 24, letterSpacing: -0.5 },
  h3: { fontFamily: 'System', fontWeight: '600' as const, fontSize: 20 },
  h4: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 17 },
  body: { fontFamily: 'System', fontWeight: '400' as const, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 15 },
  bodySmall: { fontFamily: 'System', fontWeight: '400' as const, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 11, letterSpacing: 1 },
  caption: { fontFamily: 'System', fontWeight: '400' as const, fontSize: 12 },
} as const;
```

## ESPAÇAMENTOS — constants/spacing.ts

```typescript
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
} as const;
```

## BORDAS — constants/radius.ts

```typescript
export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 100,
} as const;
```

---

## NAVBAR FLUTUANTE

```typescript
// components/ui/FloatingNavbar.tsx
const navbarStyle = {
  position: 'absolute',
  bottom: 20,
  left: 20,
  right: 20,
  backgroundColor: '#1C1C1C',
  borderRadius: 100,
  borderWidth: 1,
  borderColor: '#333333',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.40,
  shadowRadius: 32,
  elevation: 20,
  flexDirection: 'row',
  paddingHorizontal: 8,
  paddingVertical: 10,
  alignItems: 'center',
};

// Botão IA (tab central destacada)
const aiButtonStyle = {
  width: 52,
  height: 52,
  borderRadius: 26,
  background: 'linear-gradient(#CAFF66, #A8D94A)', // usar LinearGradient
  marginTop: -8, // elevado acima da navbar
  shadowColor: '#CAFF66',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.35,
  shadowRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
};
// ícone ✨ dentro do botão IA: cor PRETA (#111111), tamanho 24

// Estados
// ativo:   ícone + label #CAFF66
// inativo: ícone + label #B3B3B3
// label:   fontSize 10, fontWeight 500
```

---

## CARD DE REFEIÇÃO

```typescript
// Estado colapsado
{
  backgroundColor: '#1C1C1C',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#333333',
  padding: 16,
}

// Barra de progresso
{
  height: 4,
  borderRadius: 2,
  backgroundColor: '#333333', // fundo vazio
  // preenchimento: #CAFF66
}

// Checkbox por alimento
{
  // vazio:   borda #333333, fundo transparente
  // marcado: fundo #CAFF66, ícone ✓ PRETO
}

// Alimento marcado
{
  textDecorationLine: 'line-through',
  color: '#666666',
}

// Progresso 100% (refeição completa)
// → ícone da refeição ganha check #45C588
```

---

## TIPOS DE REFEIÇÃO

```typescript
export const MEAL_TYPES = {
  breakfast:   { label: 'Café da Manhã',    emoji: '☕', time: '08:00' },
  morning:     { label: 'Lanche da Manhã',  emoji: '🍎', time: '10:00' },
  lunch:       { label: 'Almoço',           emoji: '🍽️', time: '12:30' },
  afternoon:   { label: 'Lanche da Tarde',  emoji: '🥤', time: '16:00' },
  dinner:      { label: 'Jantar',           emoji: '🌙', time: '20:00' },
  pre_workout: { label: 'Pré-treino',       emoji: '⚡', time: null },
  post_workout:{ label: 'Pós-treino',       emoji: '💪', time: null },
} as const;
// Pré/pós-treino: só exibir se user_profiles.workout_time !== null
```

---

## BOTÃO PRIMÁRIO

```typescript
{
  backgroundColor: '#CAFF66',
  borderRadius: 100,
  paddingVertical: 16,
  paddingHorizontal: 24,
  alignItems: 'center',
  // texto: cor #111111 (PRETO), fontWeight 600, fontSize 16
}
```

## BOTTOM SHEET (modais)

```typescript
{
  backgroundColor: '#252525',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  padding: 24,
  // handle: largura 40, altura 4, cor #444444, borderRadius 2, centered
}
```

## PILL / BADGE

```typescript
// Streak
{
  backgroundColor: 'rgba(202,255,102,0.12)',
  borderRadius: 100,
  paddingHorizontal: 12,
  paddingVertical: 6,
  // texto: #CAFF66, fontSize 13, fontWeight 600
}

// Plano Free/Pro
{
  backgroundColor: '#1C1C1C',
  borderWidth: 1,
  borderColor: '#333333',
  borderRadius: 100,
  paddingHorizontal: 10,
  paddingVertical: 4,
  // texto: #B3B3B3, fontSize 12
}
```

---

## FOTO DO USUÁRIO

```typescript
// Sempre quadrada com cantos arredondados
{
  width: 48,   // ou 64 no perfil
  height: 48,
  borderRadius: 12,
  // fallback: círculo com iniciais em #CAFF66 com texto preto
}
```

## GRADIENTES

```typescript
import { LinearGradient } from 'expo-linear-gradient';

// Primário (botão IA, destaques)
<LinearGradient colors={['#CAFF66', '#A8D94A']} start={{x:0,y:0}} end={{x:0,y:1}} />

// Dark (cards especiais)
<LinearGradient colors={['#333333', '#1C1C1C']} start={{x:0,y:0}} end={{x:0,y:1}} />
```

---

## Pastas de design legadas (Stitch)

- As pastas `Stitch/Login`, `Stitch/Onbording` e `Stitch/Tela Principal` contêm **arquivos HTML/PNG antigos** gerados em ferramentas de design.
- Esses arquivos **não** são mais referência oficial de layout nem fazem parte do fluxo do app React Native.
- Qualquer ajuste visual deve ser feito diretamente nas telas em `app/` e nos componentes do design system em `components/ui`.
- As pastas `Stitch/*` podem ser tratadas apenas como histórico/arquivo e, se necessário, movidas para uma pasta separada de design futuramente.
