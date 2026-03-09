import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Colors } from "../../constants/colors";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";

export interface GradientBarSegment {
  color: string;
  flex: number;
  label: string;
}

interface GradientBarProps {
  title: string;
  value: number;
  targetValue?: number;
  unit: string;
  classification: string;
  targetClassification?: string;
  min: number;
  max: number;
  segments: GradientBarSegment[];
  /** Rótulos numéricos exibidos abaixo da barra */
  ticks: number[];
}

const TRACK_HEIGHT = 10;
const THUMB_SIZE = 22;

function getPositionPct(value: number, min: number, max: number) {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export function GradientBar({
  title,
  value,
  targetValue,
  unit,
  classification,
  targetClassification,
  min,
  max,
  segments,
  ticks,
}: GradientBarProps) {
  const valuePct = getPositionPct(value, min, max);
  const targetPct = targetValue !== undefined ? getPositionPct(targetValue, min, max) : null;

  // Cor do segmento onde o valor atual cai
  const getSegmentColor = (pct: number) => {
    let accumulated = 0;
    const total = segments.reduce((s, seg) => s + seg.flex, 0);
    for (const seg of segments) {
      accumulated += seg.flex / total;
      if (pct <= accumulated) return seg.color;
    }
    return segments[segments.length - 1].color;
  };

  const valueColor = getSegmentColor(valuePct);
  const targetColor = targetPct !== null ? getSegmentColor(targetPct) : null;

  return (
    <View style={styles.container}>
      {/* Título + valor atual */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.valueRow}>
        <Text style={[styles.mainValue, { color: valueColor }]}>{value.toFixed(1)}</Text>
        <Text style={[styles.classification, { color: valueColor }]}>{classification}</Text>
        {targetValue !== undefined && targetColor && (
          <>
            <Text style={styles.arrow}>→</Text>
            <Text style={[styles.mainValue, { color: targetColor }]}>{targetValue.toFixed(1)}</Text>
            <Text style={[styles.classification, { color: targetColor }]}>{targetClassification}</Text>
          </>
        )}
      </View>

      {/* Barra gradiente */}
      <View style={styles.trackWrapper}>
        <View style={styles.track}>
          <LinearGradient
            colors={segments.map((s) => s.color) as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Marcador do valor atual */}
          <View
            style={[
              styles.thumb,
              {
                left: `${valuePct * 100}%` as unknown as number,
                marginLeft: -(THUMB_SIZE / 2),
                borderColor: valueColor,
              },
            ]}
          />

          {/* Marcador da meta (se diferente) */}
          {targetPct !== null && Math.abs(targetPct - valuePct) > 0.01 && (
            <View
              style={[
                styles.thumbTarget,
                {
                  left: `${targetPct * 100}%` as unknown as number,
                  marginLeft: -(THUMB_SIZE / 2),
                  borderColor: targetColor!,
                },
              ]}
            />
          )}
        </View>
      </View>

      {/* Ticks */}
      <View style={styles.ticks}>
        {ticks.map((tick) => (
          <View
            key={tick}
            style={[
              styles.tickWrapper,
              { left: `${getPositionPct(tick, min, max) * 100}%` as unknown as number },
            ]}
          >
            <Text style={styles.tickLabel}>{tick}</Text>
          </View>
        ))}
      </View>

      {/* Legenda dos segmentos */}
      <View style={styles.legend}>
        {segments.map((seg) => (
          <View key={seg.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
            <Text style={styles.legendText}>{seg.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  header: {
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.label,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    flexWrap: "wrap",
  },
  mainValue: {
    ...Typography.h2,
    fontSize: 28,
    fontWeight: "700",
  },
  classification: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: "600",
  },
  arrow: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 16,
    marginHorizontal: 2,
  },
  trackWrapper: {
    height: THUMB_SIZE + 4,
    justifyContent: "center",
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: "visible",
    position: "relative",
  },
  thumb: {
    position: "absolute",
    top: -(THUMB_SIZE - TRACK_HEIGHT) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.background,
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbTarget: {
    position: "absolute",
    top: -(THUMB_SIZE - TRACK_HEIGHT) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderStyle: "dashed",
    opacity: 0.7,
  },
  ticks: {
    position: "relative",
    height: 20,
    marginTop: Spacing.xs,
  },
  tickWrapper: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -10 }],
  },
  tickLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
