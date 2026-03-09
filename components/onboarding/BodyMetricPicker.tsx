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
  /** Quando definido, a régua mostra marcos apenas a cada displayStep (ex: 5 kg); o valor continua alterando pelo step (ex: 0.1). */
  displayStep?: number;
  formatValue?: (value: number) => string;
};

interface RulerPickerProps {
  min: number;
  max: number;
  step: number;
  value: number;
  majorStep: number;
  mediumStep: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  onCenterChange: (value: number, isMajor: boolean) => void;
  /** Escala visual: só desenha ticks a cada displayStep; valor ainda usa step. */
  displayStep?: number;
}

function createRange(min: number, max: number, step: number): number[] {
  const values: number[] = [];
  const safeStep = step > 0 ? step : 1;
  for (let current = min; current <= max + 1e-6; current += safeStep) {
    values.push(Number(current.toFixed(4)));
  }
  return values;
}

function isMultipleOf(value: number, step: number): boolean {
  if (step <= 0) return false;
  const quotient = value / step;
  const diff = Math.abs(quotient - Math.round(quotient));
  return diff < 1e-3;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const ITEM_WIDTH = 10;
const FOCUS_RANGE = 2.5; // ticks within this distance get interpolation
const CONTINUOUS_CONTENT_WIDTH = 1000; // largura virtual da régua no modo displayStep

function roundToStep(value: number, step: number): number {
  if (step <= 0) return value;
  const rounded = Math.round(value / step) * step;
  return Number(rounded.toFixed(4));
}

function RulerPicker({
  min,
  max,
  step,
  value,
  majorStep,
  mediumStep,
  onChange,
  formatValue,
  onCenterChange,
  displayStep,
}: RulerPickerProps) {
  const scrollRef = React.useRef<ScrollView | null>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const isScrollingRef = React.useRef(false);
  const initialScrollSyncedRef = React.useRef(false);

  const useContinuous = displayStep != null && displayStep > 0;

  const values = React.useMemo(
    () => createRange(min, max, step),
    [min, max, step]
  );

  const displayValues = React.useMemo(
    () => (useContinuous ? createRange(min, max, displayStep!) : values),
    [useContinuous, min, max, useContinuous ? displayStep! : step, values]
  );

  const safeStep = React.useMemo(
    () => (step > 0 ? step : 1),
    [step]
  );

  const range = max - min;

  const selectedIndex = React.useMemo(() => {
    const clampedValue = clamp(value, min, max);
    const rawIndex = Math.round((clampedValue - min) / safeStep);
    return Math.max(0, Math.min(values.length - 1, rawIndex));
  }, [value, min, max, safeStep, values.length]);

  const initialScrollXContinuous = React.useMemo(() => {
    if (!useContinuous || range <= 0) return 0;
    return ((clamp(value, min, max) - min) / range) * CONTINUOUS_CONTENT_WIDTH;
  }, [useContinuous, value, min, max, range]);

  const [scrollX, setScrollX] = React.useState(
    useContinuous ? initialScrollXContinuous : selectedIndex * ITEM_WIDTH
  );

  const sidePadding = React.useMemo(
    () =>
      useContinuous && containerWidth > 0
        ? containerWidth / 2
        : containerWidth > 0
          ? (containerWidth - ITEM_WIDTH) / 2
          : 0,
    [containerWidth, useContinuous]
  );

  const centerPositionContinuous =
    containerWidth > 0 ? scrollX + containerWidth / 2 - sidePadding : 0;
  const centeredValueContinuous = clamp(
    min + (centerPositionContinuous / CONTINUOUS_CONTENT_WIDTH) * range,
    min,
    max
  );
  const centeredValueRounded = roundToStep(centeredValueContinuous, step);
  const isMajorAtCenterContinuous = isMultipleOf(centeredValueRounded, majorStep);

  const centerIndexContinuous = containerWidth > 0 ? scrollX / ITEM_WIDTH : selectedIndex;
  const centeredIndex = Math.round(centerIndexContinuous);
  const clampedCenteredIndex = Math.max(0, Math.min(values.length - 1, centeredIndex));
  const centeredValue = values[clampedCenteredIndex];
  const isMajorAtCenter = isMultipleOf(centeredValue, majorStep);

  const effectiveCenteredValue = useContinuous ? centeredValueRounded : centeredValue;
  const effectiveIsMajor = useContinuous ? isMajorAtCenterContinuous : isMajorAtCenter;

  React.useEffect(() => {
    onCenterChange(effectiveCenteredValue, effectiveIsMajor);
  }, [effectiveCenteredValue, effectiveIsMajor, onCenterChange]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const maxScrollXContinuous = React.useMemo(
    () => Math.max(0, CONTINUOUS_CONTENT_WIDTH + 2 * sidePadding - (containerWidth || 0)),
    [sidePadding, containerWidth]
  );

  React.useEffect(() => {
    if (useContinuous && containerWidth > 0) {
      const targetX = ((clamp(value, min, max) - min) / range) * CONTINUOUS_CONTENT_WIDTH;
      const clampedX = Math.max(0, Math.min(maxScrollXContinuous, targetX));
      if (!isScrollingRef.current && scrollRef.current) {
        scrollRef.current.scrollTo({ x: clampedX, animated: false });
        setScrollX(clampedX);
        initialScrollSyncedRef.current = true;
      }
    } else if (!useContinuous && !isScrollingRef.current && scrollRef.current && values.length > 0) {
      const targetX = selectedIndex * ITEM_WIDTH;
      scrollRef.current.scrollTo({ x: targetX, animated: false });
      setScrollX(targetX);
      initialScrollSyncedRef.current = true;
    }
  }, [useContinuous, value, min, max, range, containerWidth, selectedIndex, values.length, maxScrollXContinuous]);

  const snapToNearest = React.useCallback(
    (offsetX: number) => {
      if (useContinuous) {
        const centerPos = offsetX + (containerWidth > 0 ? containerWidth / 2 - sidePadding : 0);
        const rawValue = min + (centerPos / CONTINUOUS_CONTENT_WIDTH) * range;
        const snapped = clamp(roundToStep(rawValue, step), min, max);
        const targetX = ((snapped - min) / range) * CONTINUOUS_CONTENT_WIDTH;
        const clampedX = Math.max(0, Math.min(maxScrollXContinuous, targetX));
        if (scrollRef.current) {
          isScrollingRef.current = true;
          scrollRef.current.scrollTo({ x: clampedX, animated: true });
          setScrollX(clampedX);
        }
        const normalized = Number(roundToStep(snapped, step).toFixed(step < 1 ? 1 : 0));
        if (normalized !== value) onChange(normalized);
        setTimeout(() => { isScrollingRef.current = false; }, 320);
      } else {
        const rawIndex = Math.round(offsetX / ITEM_WIDTH);
        const index = Math.max(0, Math.min(values.length - 1, rawIndex));
        if (scrollRef.current) {
          isScrollingRef.current = true;
          scrollRef.current.scrollTo({ x: index * ITEM_WIDTH, animated: true });
          setScrollX(index * ITEM_WIDTH);
        }
        const newValue = clamp(values[index], min, max);
        const normalized = Number(roundToStep(newValue, step).toFixed(step < 1 ? 1 : 0));
        if (normalized !== value) onChange(normalized);
        setTimeout(() => { isScrollingRef.current = false; }, 320);
      }
    },
    [useContinuous, values, min, max, range, step, value, onChange, containerWidth, sidePadding, maxScrollXContinuous]
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    // Evita que o primeiro frame (scroll nativo em 0) sobrescreva o valor correto antes do scrollTo programático
    if (useContinuous && !initialScrollSyncedRef.current && offsetX < 10 && value > min) return;
    initialScrollSyncedRef.current = true;
    setScrollX(offsetX);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    snapToNearest(event.nativeEvent.contentOffset.x);
  };

  /** Altura fixa dos ticks para todos os cards iguais ao modelo Altura: traços curtos e finos, major um pouco maior */
  const getUniformTickHeight = (isMajor: boolean, isMedium: boolean) =>
    isMajor ? 24 : isMedium ? 14 : 10;

  if (useContinuous) {
    const tickPositions = displayValues.map((tickValue) => ({
      value: tickValue,
      x: ((tickValue - min) / range) * CONTINUOUS_CONTENT_WIDTH,
      isMajor: isMultipleOf(tickValue, majorStep),
      isMedium: !isMultipleOf(tickValue, majorStep) && isMultipleOf(tickValue, mediumStep),
    }));
    return (
      <View style={styles.rulerContainer} onLayout={handleLayout}>
        <View pointerEvents="none" style={styles.rulerTrack} />
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          contentContainerStyle={{
            paddingHorizontal: sidePadding,
            width: CONTINUOUS_CONTENT_WIDTH + 2 * sidePadding,
            minWidth: CONTINUOUS_CONTENT_WIDTH + 2 * sidePadding,
          }}
          onScroll={handleScroll}
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
        >
          <View style={[styles.continuousRuler, { width: CONTINUOUS_CONTENT_WIDTH }]}>
            {tickPositions.map(({ value: tickValue, x, isMajor, isMedium }) => {
              const height = getUniformTickHeight(isMajor, isMedium);
              return (
                <View
                  key={tickValue}
                  style={[styles.continuousTickWrap, { left: x - 1.5 }]}
                >
                  <View style={styles.tickWrapper}>
                    <View style={[styles.tick, { height }]} />
                  </View>
                  {isMajor && (
                    <Text style={styles.tickLabel}>
                      {formatValue ? formatValue(tickValue) : tickValue}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
        <View pointerEvents="none" style={styles.centerLine} />
      </View>
    );
  }

  return (
    <View style={styles.rulerContainer} onLayout={handleLayout}>
      <View pointerEvents="none" style={styles.rulerTrack} />
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={ITEM_WIDTH}
        snapToAlignment="center"
        contentContainerStyle={{ paddingHorizontal: sidePadding }}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
      >
        {values.map((tickValue, index) => {
          const isMajor = isMultipleOf(tickValue, majorStep);
          const isMedium = !isMajor && isMultipleOf(tickValue, mediumStep);
          const height = getUniformTickHeight(isMajor, isMedium);

          return (
            <View key={`${tickValue}-${index}`} style={styles.tickItem}>
              <View style={styles.tickWrapper}>
                <View style={[styles.tick, { height }]} />
              </View>
              {isMajor && (
                <Text style={styles.tickLabel}>
                  {formatValue ? formatValue(tickValue) : tickValue}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
      <View pointerEvents="none" style={styles.centerLine} />
    </View>
  );
}

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
  displayStep,
  formatValue,
}: BodyMetricPickerProps) {
  const [displayValue, setDisplayValue] = React.useState(value);
  const [isMajorAtCenter, setIsMajorAtCenter] = React.useState(false);
  const lastEmittedRef = React.useRef<number>(value);
  const latestDisplayRef = React.useRef<number>(value);

  React.useEffect(() => {
    setDisplayValue(value);
    lastEmittedRef.current = value;
    latestDisplayRef.current = value;
  }, [value]);

  const handleCenterChange = React.useCallback(
    (v: number, isMajor: boolean) => {
      setDisplayValue(v);
      latestDisplayRef.current = v;
      setIsMajorAtCenter(isMajor);
    },
    []
  );

  // Evita persistir valor "espúrio" quando a régua ainda está em scroll 0 (valor = min)
  // e o store tem um valor real (ex: peso 75) — evita que "35 kg" apareça na tela de metas.
  const isSpuriousMin = (v: number) => v === min && value > min + 1;

  // O picker atualiza `displayValue` continuamente, mas o `onChange` só dispara no "snap" do scroll.
  // Se o usuário navegar rápido (ex.: apertar Continuar com o scroll ainda em movimento),
  // o valor visto na UI pode não ter sido persistido no store. Garantimos a persistência:
  // 1) com debounce curto durante a interação
  // 2) no unmount (troca de tela) como fallback final
  // Não persistir valor mínimo espúrio (régua em 0 antes do scroll inicial).
  React.useEffect(() => {
    if (displayValue === lastEmittedRef.current) return;
    if (isSpuriousMin(displayValue)) return;

    const t = setTimeout(() => {
      const v = latestDisplayRef.current;
      if (v !== lastEmittedRef.current && !isSpuriousMin(v)) {
        lastEmittedRef.current = v;
        onChange(v);
      }
    }, 120);

    return () => clearTimeout(t);
  }, [displayValue, onChange, min, value]);

  React.useEffect(() => {
    return () => {
      const v = latestDisplayRef.current;
      if (v !== lastEmittedRef.current && !isSpuriousMin(v)) {
        lastEmittedRef.current = v;
        onChange(v);
      }
    };
  }, [onChange, min, value]);

  const displayStr = React.useMemo(() => {
    if (formatValue) return formatValue(displayValue);
    const isInteger =
      Number.isInteger(step) && Number.isInteger(displayValue);
    return isInteger ? `${Math.round(displayValue)}` : displayValue.toFixed(1);
  }, [displayValue, step, formatValue]);

  return (
    <View style={styles.card}>
      <View
        pointerEvents="none"
        style={[
          styles.cardCentroidLine,
          isMajorAtCenter && styles.cardCentroidLineGlow,
        ]}
      />
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>{label}</Text>
        <View style={styles.valueRow}>
          <Text style={styles.valueText}>{displayStr}</Text>
          <Text style={styles.valueUnit}>{unit}</Text>
        </View>
      </View>
      <RulerPicker
        min={min}
        max={max}
        step={step}
        value={value}
        majorStep={majorStep}
        mediumStep={mediumStep}
        onChange={onChange}
        formatValue={formatValue}
        onCenterChange={handleCenterChange}
        displayStep={displayStep}
      />
    </View>
  );
}

const CENTROID_LINE_WIDTH = 2;

const styles = StyleSheet.create({
  card: {
    position: "relative",
    minHeight: 152,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardCentroidLine: {
    position: "absolute",
    left: "50%",
    marginLeft: -CENTROID_LINE_WIDTH / 2,
    top: 0,
    bottom: 0,
    width: CENTROID_LINE_WIDTH,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  cardCentroidLineGlow: {
    ...(Platform.OS === "ios"
      ? {
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.7,
          shadowRadius: 10,
        }
      : {
          elevation: 8,
          shadowColor: Colors.primary,
        }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  cardLabel: {
    ...Typography.label,
    color: Colors.text,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.xs,
  },
  valueText: {
    ...Typography.h1,
    fontSize: 24,
    color: Colors.primary,
  },
  valueUnit: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
  },
  rulerContainer: {
    position: "relative",
    height: 56,
    justifyContent: "center",
  },
  rulerTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
    top: 32,
  },
  tickItem: {
    alignItems: "center",
    justifyContent: "flex-start",
    width: ITEM_WIDTH,
  },
  tickWrapper: {
    height: 32,
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
  },
  tick: {
    width: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.border,
  },
  tickLabel: {
    ...Typography.caption,
    marginTop: 4,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  centerLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    borderRadius: 1,
    backgroundColor: Colors.primary,
    alignSelf: "center",
  },
  continuousRuler: {
    position: "relative",
    height: 56,
  },
  continuousTickWrap: {
    position: "absolute",
    width: 3,
    alignItems: "center",
    justifyContent: "flex-start",
    top: 0,
  },
});
