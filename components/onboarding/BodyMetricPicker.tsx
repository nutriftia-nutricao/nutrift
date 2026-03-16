import React from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export type BodyMetricPickerProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  majorStep?: number;
  mediumStep?: number;
  decimalPlaces?: number;
  formatValue?: (value: number) => string;
};

// ─── Constantes visuais ────────────────────────────────────────────────────────

/** Largura virtual da régua (px). Todos os cards usam o mesmo valor. */
const RULER_VIRTUAL_WIDTH = 1200;

/** Altura da área da régua (container). */
const RULER_HEIGHT = 64;

/** Área de ticks: os ticks crescem para cima a partir da baseline. */
const TICK_BASELINE = 40; // distância do topo do container até a baseline dos ticks

/** Alturas dos ticks acima da baseline */
const TICK_H_MAJOR = 36;
const TICK_H_MEDIUM = 22;
const TICK_H_MINOR = 10;

/** Largura de cada tick */
const TICK_W = 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function roundToStep(v: number, step: number): number {
  if (step <= 0) return v;
  return Number((Math.round(v / step) * step).toFixed(10));
}

function isMultipleOf(v: number, step: number): boolean {
  if (step <= 0) return false;
  return Math.abs((v / step) - Math.round(v / step)) < 1e-3;
}

/** Gera os ticks visíveis: a cada mediumStep para não poluir */
function buildTicks(
  min: number,
  max: number,
  mediumStep: number,
  majorStep: number
): Array<{ value: number; isMajor: boolean; isMedium: boolean }> {
  const ticks: Array<{ value: number; isMajor: boolean; isMedium: boolean }> = [];
  // Garante que o passo visual seja pelo menos 1
  const dStep = mediumStep > 0 ? mediumStep : 1;
  for (let v = min; v <= max + 1e-6; v += dStep) {
    const rv = Number(v.toFixed(4));
    const isMajor = isMultipleOf(rv, majorStep);
    ticks.push({ value: rv, isMajor, isMedium: !isMajor });
  }
  return ticks;
}

// ─── Componente interno: régua ─────────────────────────────────────────────────

interface RulerProps {
  min: number;
  max: number;
  step: number;
  value: number;
  majorStep: number;
  mediumStep: number;
  onChange: (value: number) => void;
  onPreview: (value: number, isMajor: boolean) => void;
}

function Ruler({
  min,
  max,
  step,
  value,
  majorStep,
  mediumStep,
  onChange,
  onPreview,
}: RulerProps) {
  const scrollRef = React.useRef<ScrollView | null>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);

  // Controle de snap programático (evita loop)
  const isProgrammaticRef = React.useRef(false);
  const programmaticTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Última posição X conhecida (evita scrollTo desnecessário)
  const scrollXRef = React.useRef(-1);

  // Flag para ignorar o primeiro scroll (posição 0 antes de sincronizar)
  const initializedRef = React.useRef(false);

  const range = max - min;

  // Padding lateral = metade da largura do container → o ponto 0 fica centrado
  const sidePadding = containerWidth > 0 ? containerWidth / 2 : 0;

  // Máximo scroll X possível
  const maxScrollX = Math.max(0, RULER_VIRTUAL_WIDTH + 2 * sidePadding - (containerWidth || 0));

  // Converte valor → posição X do scroll (posição onde o centro da tela aponta para esse valor)
  const valueToX = React.useCallback(
    (v: number): number => {
      if (range <= 0 || sidePadding <= 0) return 0;
      return clamp(((v - min) / range) * RULER_VIRTUAL_WIDTH, 0, maxScrollX);
    },
    [min, range, sidePadding, maxScrollX]
  );

  // Converte posição X do scroll → valor
  const xToValue = React.useCallback(
    (offsetX: number): number => {
      if (range <= 0 || sidePadding <= 0) return min;
      // O centro da tela está em offsetX + containerWidth/2
      // Mas como usamos sidePadding = containerWidth/2, o conteúdo começa deslocado
      // O "ponto central do conteúdo" é offsetX (scroll 0 → valor min; scroll max → valor max)
      const raw = min + (offsetX / RULER_VIRTUAL_WIDTH) * range;
      return clamp(roundToStep(raw, step), min, max);
    },
    [min, max, range, step, sidePadding]
  );

  // Ticks pré-calculados (estáticos)
  const ticks = React.useMemo(
    () => buildTicks(min, max, mediumStep, majorStep),
    [min, max, mediumStep, majorStep]
  );

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  // Sincroniza scroll quando o valor externo muda (ex: ao entrar na tela)
  React.useEffect(() => {
    if (containerWidth <= 0) return;
    const targetX = valueToX(value);
    if (Math.abs(targetX - scrollXRef.current) > 0.5) {
      scrollRef.current?.scrollTo({ x: targetX, animated: false });
      scrollXRef.current = targetX;
      initializedRef.current = true;
    }
  }, [value, containerWidth, valueToX]);

  // ── Handlers de scroll ───────────────────────────────────────────────────────

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;

    // Ignora scroll=0 antes de inicializar (evita preview espúrio no valor min)
    if (!initializedRef.current && offsetX < 1 && value > min + step) return;
    initializedRef.current = true;

    scrollXRef.current = offsetX;

    if (isProgrammaticRef.current) return;

    const preview = xToValue(offsetX);
    onPreview(preview, isMultipleOf(preview, majorStep));
  };

  const commitFromOffset = React.useCallback(
    (offsetX: number) => {
      const snapped = xToValue(offsetX);
      onChange(snapped);
      onPreview(snapped, isMultipleOf(snapped, majorStep));

      // Realinha visualmente para o snap exato
      const targetX = valueToX(snapped);
      if (Math.abs(targetX - offsetX) > 0.5) {
        isProgrammaticRef.current = true;
        scrollRef.current?.scrollTo({ x: targetX, animated: true });
        scrollXRef.current = targetX;
        if (programmaticTimerRef.current) clearTimeout(programmaticTimerRef.current);
        programmaticTimerRef.current = setTimeout(() => {
          isProgrammaticRef.current = false;
        }, 200);
      }
    },
    [xToValue, valueToX, onChange, onPreview, majorStep]
  );

  const handleScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const velocityX = Math.abs(e.nativeEvent.velocity?.x ?? 0);
    // Se o utilizador soltou devagar (sem momentum), faz snap imediato
    if (velocityX < 0.1) {
      commitFromOffset(e.nativeEvent.contentOffset.x);
    }
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isProgrammaticRef.current) {
      isProgrammaticRef.current = false;
      return;
    }
    commitFromOffset(e.nativeEvent.contentOffset.x);
  };

  React.useEffect(() => {
    return () => {
      if (programmaticTimerRef.current) clearTimeout(programmaticTimerRef.current);
    };
  }, []);

  return (
    <View style={rulerStyles.container} onLayout={handleLayout}>
      {/* Faixa horizontal de fundo */}
      <View pointerEvents="none" style={rulerStyles.baseline} />

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate={Platform.OS === "ios" ? 0.992 : "normal"}
        contentContainerStyle={{
          paddingHorizontal: sidePadding,
          width: RULER_VIRTUAL_WIDTH + 2 * sidePadding,
        }}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        <View style={rulerStyles.tickRow}>
          {ticks.map(({ value: tv, isMajor, isMedium }) => {
            const x = ((tv - min) / range) * RULER_VIRTUAL_WIDTH;
            const tickH = isMajor ? TICK_H_MAJOR : isMedium ? TICK_H_MEDIUM : TICK_H_MINOR;
            return (
              <View
                key={tv}
                style={[rulerStyles.tickWrap, { left: x - TICK_W / 2 }]}
              >
                {/* Tick cresce de baixo para cima */}
                <View
                  style={[
                    rulerStyles.tick,
                    {
                      height: tickH,
                      opacity: isMajor ? 1 : isMedium ? 0.65 : 0.35,
                    },
                  ]}
                />
                {isMajor && (
                  <Text style={rulerStyles.tickLabel}>{Math.round(tv)}</Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const rulerStyles = StyleSheet.create({
  container: {
    height: RULER_HEIGHT,
    position: "relative",
    overflow: "hidden",
  },
  baseline: {
    position: "absolute",
    left: 0,
    right: 0,
    top: TICK_BASELINE,
    height: 1,
    backgroundColor: Colors.border,
  },
  tickRow: {
    position: "relative",
    height: RULER_HEIGHT,
    width: RULER_VIRTUAL_WIDTH,
  },
  tickWrap: {
    position: "absolute",
    bottom: RULER_HEIGHT - TICK_BASELINE, // alinha os ticks pela baseline
    alignItems: "center",
    // não define width para evitar sobreposição de labels
  },
  tick: {
    width: TICK_W,
    borderRadius: TICK_W / 2,
    backgroundColor: Colors.border,
  },
  tickLabel: {
    ...Typography.caption,
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 3,
    opacity: 0.7,
  },
});

// ─── Componente público: BodyMetricPicker ──────────────────────────────────────

/** Altura total fixa do card — todos os cards têm exatamente este valor. */
const CARD_HEIGHT = 160;

export function BodyMetricPicker({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  majorStep = 10,
  mediumStep = 5,
  decimalPlaces,
  formatValue,
}: BodyMetricPickerProps) {
  // Valor local para resposta imediata ao scroll (sem esperar onChange persistir)
  const [displayValue, setDisplayValue] = React.useState(value);
  const [isMajorAtCenter, setIsMajorAtCenter] = React.useState(false);

  // Mantém displayValue sincronizado quando o valor externo muda
  React.useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handlePreview = React.useCallback((v: number, isMajor: boolean) => {
    setDisplayValue(v);
    setIsMajorAtCenter(isMajor);
  }, []);

  // Determina casas decimais automaticamente se não fornecido
  const dp = React.useMemo(() => {
    if (decimalPlaces !== undefined) return decimalPlaces;
    if (formatValue) return 0; // formatValue cuida da precisão
    return Number.isInteger(step) ? 0 : 1;
  }, [decimalPlaces, step, formatValue]);

  const displayStr = React.useMemo(() => {
    if (formatValue) return formatValue(displayValue);
    return dp === 0
      ? `${Math.round(displayValue)}`
      : displayValue.toFixed(dp);
  }, [displayValue, dp, formatValue]);

  return (
    <View style={[cardStyles.card, { height: CARD_HEIGHT }]}>
      {/* Linha central verde — restrita à área da régua */}
      <View
        pointerEvents="none"
        style={[
          cardStyles.centerLine,
          isMajorAtCenter && cardStyles.centerLineGlow,
        ]}
      />

      {/* Header: label + valor */}
      <View style={cardStyles.header}>
        <Text style={cardStyles.label}>{label}</Text>
        <View style={cardStyles.valueRow}>
          <Text style={cardStyles.valueNumber}>{displayStr}</Text>
          <Text style={cardStyles.valueUnit}>{unit}</Text>
        </View>
      </View>

      {/* Régua */}
      <Ruler
        min={min}
        max={max}
        step={step}
        value={value}
        majorStep={majorStep}
        mediumStep={mediumStep}
        onChange={onChange}
        onPreview={handlePreview}
      />
    </View>
  );
}

// ─── Estilos do card ───────────────────────────────────────────────────────────

const CENTER_LINE_W = 2;
// Layout: paddingTop(md) + HEADER_HEIGHT + marginBottom(md) + RULER_HEIGHT = CARD_HEIGHT
const HEADER_HEIGHT = CARD_HEIGHT - RULER_HEIGHT - Spacing.md - Spacing.md;

const cardStyles = StyleSheet.create({
  card: {
    position: "relative",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 0,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  centerLine: {
    position: "absolute",
    left: "50%",
    marginLeft: -CENTER_LINE_W / 2,
    // Começa exatamente na área da régua: paddingTop + HEADER_HEIGHT + marginBottom
    top: Spacing.md + HEADER_HEIGHT + Spacing.md,
    bottom: 0,
    width: CENTER_LINE_W,
    backgroundColor: Colors.primary,
    borderRadius: CENTER_LINE_W / 2,
  },
  centerLineGlow: {
    ...(Platform.OS === "ios"
      ? {
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 8,
        }
      : {
          elevation: 6,
          shadowColor: Colors.primary,
        }),
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: HEADER_HEIGHT,
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    alignSelf: "center",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  valueNumber: {
    fontFamily: "sans-serif",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: Colors.primary,
    lineHeight: 32,
  },
  valueUnit: {
    fontFamily: "sans-serif",
    fontSize: 13,
    fontWeight: "500",
    color: Colors.primary,
    letterSpacing: 0.5,
    lineHeight: 32,
  },
});
