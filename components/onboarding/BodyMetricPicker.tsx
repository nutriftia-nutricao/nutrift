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
  const isProgrammaticSnapRef = React.useRef(false);
  const releaseProgrammaticSnapTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialScrollSyncedRef = React.useRef(false);
  const scrollXRef = React.useRef(0);

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

  const sidePadding = React.useMemo(
    () =>
      useContinuous && containerWidth > 0
        ? containerWidth / 2
        : containerWidth > 0
          ? (containerWidth - ITEM_WIDTH) / 2
          : 0,
    [containerWidth, useContinuous]
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const maxScrollXContinuous = React.useMemo(
    () => Math.max(0, CONTINUOUS_CONTENT_WIDTH + 2 * sidePadding - (containerWidth || 0)),
    [sidePadding, containerWidth]
  );

  React.useEffect(() => {
    if (useContinuous && containerWidth > 0) {
      if (range <= 0) return;
      const targetX = ((clamp(value, min, max) - min) / range) * CONTINUOUS_CONTENT_WIDTH;
      const clampedX = Math.max(0, Math.min(maxScrollXContinuous, targetX));
      if (scrollRef.current && Math.abs(clampedX - scrollXRef.current) > 0.5) {
        scrollRef.current.scrollTo({ x: clampedX, animated: false });
        scrollXRef.current = clampedX;
        initialScrollSyncedRef.current = true;
      }
    } else if (!useContinuous && scrollRef.current && values.length > 0) {
      const targetX = selectedIndex * ITEM_WIDTH;
      if (Math.abs(targetX - scrollXRef.current) > 0.5) {
        scrollRef.current.scrollTo({ x: targetX, animated: false });
        scrollXRef.current = targetX;
        initialScrollSyncedRef.current = true;
      }
    }
  }, [useContinuous, value, min, max, range, containerWidth, selectedIndex, values.length, maxScrollXContinuous]);

  const commitValueFromOffset = React.useCallback(
    (offsetX: number, alignVisualForContinuous: boolean) => {
      if (useContinuous) {
        if (range <= 0) return;
        const centerPos = offsetX + (containerWidth > 0 ? containerWidth / 2 - sidePadding : 0);
        const rawValue = min + (centerPos / CONTINUOUS_CONTENT_WIDTH) * range;
        const snapped = clamp(roundToStep(rawValue, step), min, max);
        const isMajor = isMultipleOf(snapped, majorStep);
        onCenterChange(snapped, isMajor);
        const normalized = Number(roundToStep(snapped, step).toFixed(step < 1 ? 1 : 0));
        if (normalized !== value) {
          onChange(normalized);
        }

        if (alignVisualForContinuous && scrollRef.current && range > 0) {
          const targetX = ((snapped - min) / range) * CONTINUOUS_CONTENT_WIDTH;
          const clampedX = Math.max(0, Math.min(maxScrollXContinuous, targetX));
          if (Math.abs(clampedX - offsetX) > 0.5) {
            isProgrammaticSnapRef.current = true;
            scrollRef.current.scrollTo({ x: clampedX, animated: true });
            scrollXRef.current = clampedX;
            if (releaseProgrammaticSnapTimerRef.current) {
              clearTimeout(releaseProgrammaticSnapTimerRef.current);
            }
            releaseProgrammaticSnapTimerRef.current = setTimeout(() => {
              isProgrammaticSnapRef.current = false;
            }, 180);
          }
        }
      } else {
        const rawIndex = Math.round(offsetX / ITEM_WIDTH);
        const index = Math.max(0, Math.min(values.length - 1, rawIndex));
        const newValue = clamp(values[index], min, max);
        const isMajor = isMultipleOf(newValue, majorStep);
        onCenterChange(newValue, isMajor);
        const normalized = Number(roundToStep(newValue, step).toFixed(step < 1 ? 1 : 0));
        if (normalized !== value) {
          onChange(normalized);
        }
      }
    },
    [
      useContinuous,
      containerWidth,
      sidePadding,
      min,
      max,
      range,
      step,
      maxScrollXContinuous,
      value,
      onChange,
      majorStep,
      onCenterChange,
      values,
    ]
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    if (useContinuous && !initialScrollSyncedRef.current && offsetX < 10 && value > min) return;
    initialScrollSyncedRef.current = true;
    scrollXRef.current = offsetX;

    if (isProgrammaticSnapRef.current) return;

    if (useContinuous && range > 0) {
      const centerPos = offsetX + (containerWidth > 0 ? containerWidth / 2 - sidePadding : 0);
      const rawValue = min + (centerPos / CONTINUOUS_CONTENT_WIDTH) * range;
      const preview = clamp(roundToStep(rawValue, step), min, max);
      onCenterChange(preview, isMultipleOf(preview, majorStep));
    } else {
      const rawIndex = Math.round(offsetX / ITEM_WIDTH);
      const index = Math.max(0, Math.min(values.length - 1, rawIndex));
      const preview = clamp(values[index], min, max);
      onCenterChange(preview, isMultipleOf(preview, majorStep));
    }
  };

  const handleScrollBeginDrag = () => {
    // reservado para futuras interações do gesto
  };

  const handleScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const velocityX = Math.abs(event.nativeEvent.velocity?.x ?? 0);
    if (velocityX < 0.05) {
      commitValueFromOffset(event.nativeEvent.contentOffset.x, useContinuous);
    }
  };

  const handleMomentumScrollBegin = () => {
    // evento mantido para sincronismo de ciclo de scroll
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isProgrammaticSnapRef.current) {
      isProgrammaticSnapRef.current = false;
      return;
    }
    commitValueFromOffset(event.nativeEvent.contentOffset.x, useContinuous);
  };

  React.useEffect(() => {
    return () => {
      if (releaseProgrammaticSnapTimerRef.current) {
        clearTimeout(releaseProgrammaticSnapTimerRef.current);
      }
    };
  }, []);

  /** Altura fixa dos ticks:
   * - major (10 em 10): 40
   * - medium (5 em 5): 25
   * - minor (1 em 1): 10
   */
  const getUniformTickHeight = (isMajor: boolean, isMedium: boolean) =>
    isMajor ? 40 : isMedium ? 25 : 10;

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
          onScrollBeginDrag={handleScrollBeginDrag}
          onMomentumScrollBegin={handleMomentumScrollBegin}
          onScroll={handleScroll}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
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
                  {(isMajor || isMedium) && (
                    <Text style={styles.tickLabel}>
                      {formatValue ? formatValue(tickValue) : tickValue}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
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
        disableIntervalMomentum={false}
        contentContainerStyle={{ paddingHorizontal: sidePadding }}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollBegin={handleMomentumScrollBegin}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
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
              {(isMajor || isMedium) && (
                <Text style={styles.tickLabel}>
                  {formatValue ? formatValue(tickValue) : tickValue}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
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
