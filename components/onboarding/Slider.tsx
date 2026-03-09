import React, { useEffect } from "react";
import { LayoutChangeEvent, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";

const THUMB_SIZE = 32;
const TRACK_HEIGHT = 12;

interface SliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  unit: string;
  label: string;
  step?: number;
  width?: number;
  /** Quando fornecido, exibe um marcador fixo no centro indicando o valor atual de referência */
  centerValue?: number;
}

export function Slider({
  value,
  min,
  max,
  onChange,
  unit,
  label,
  step = 0.1,
  width: widthProp,
  centerValue,
}: SliderProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = React.useState(
    () => (widthProp ?? windowWidth - Spacing.xl * 2)
  );
  const width = widthProp ?? measuredWidth;

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && !widthProp) setMeasuredWidth(w);
  };
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const context = useSharedValue({ x: 0 });

  const trackWidth = width - THUMB_SIZE;

  useEffect(() => {
    const range = max - min;
    if (range <= 0) {
      translateX.value = 0;
      return;
    }
    const progress = (value - min) / range;
    const clampedProgress = Math.max(0, Math.min(1, progress));
    translateX.value = clampedProgress * trackWidth;
  }, [min, max, value, width]);

  const updateValue = (x: number) => {
    const range = max - min;
    const progress = x / trackWidth;
    const rawValue = min + progress * range;
    const newValue = Math.round(rawValue / step) * step;
    const fixedValue = Number(newValue.toFixed(1));
    onChange(fixedValue);
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value };
      scale.value = withSpring(1.2);
    })
    .onUpdate((e) => {
      let x = context.value.x + e.translationX;
      x = Math.max(0, Math.min(x, trackWidth));
      translateX.value = x;
      runOnJS(updateValue)(x);
    })
    .onEnd(() => {
      scale.value = withSpring(1);
    });

  const rThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  const rProgressStyle = useAnimatedStyle(() => ({
    width: translateX.value + THUMB_SIZE / 2,
  }));

  const rBubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Posição do marcador central (valor atual de referência)
  const centerProgress = centerValue !== undefined
    ? Math.max(0, Math.min(1, (centerValue - min) / (max - min)))
    : 0.5;
  const centerX = centerProgress * trackWidth + THUMB_SIZE / 2;

  return (
    <View
      style={[
        styles.sliderContainer,
        widthProp !== undefined ? { width: widthProp } : { width: "100%", alignSelf: "stretch" },
      ]}
      onLayout={handleLayout}
    >
      <Text style={styles.sliderLabel}>{label}</Text>
      <View style={[styles.trackContainer, { width }]}>
        <Animated.View style={[styles.bubbleWrapper, rBubbleStyle]}>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>
              {value.toFixed(1)} {unit}
            </Text>
          </View>
          <View style={styles.bubbleArrow} />
        </Animated.View>

        <View style={styles.trackBackground} />
        <Animated.View style={[styles.trackActive, rProgressStyle]} />

        {/* Marcador do valor atual (centro de referência) */}
        {centerValue !== undefined && (
          <View
            style={[
              styles.centerMark,
              { left: centerX - 1 },
            ]}
          />
        )}

        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.thumb, rThumbStyle]}>
            <View style={styles.thumbInner} />
          </Animated.View>
        </GestureDetector>
      </View>

      <View style={styles.rangeLabels}>
        <Text style={styles.rangeText}>{min.toFixed(1)}{unit}</Text>
        {centerValue !== undefined && (
          <View style={[styles.centerLabelWrapper, { left: centerX - 20 }]}>
            <Text style={styles.centerLabelText}>atual</Text>
            <Text style={styles.centerLabelValue}>{centerValue.toFixed(1)}{unit}</Text>
          </View>
        )}
        <Text style={styles.rangeText}>{max.toFixed(1)}{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderContainer: {
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  sliderLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    alignSelf: "flex-start",
  },
  trackContainer: {
    height: THUMB_SIZE,
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  bubbleWrapper: {
    position: "absolute",
    top: -50,
    left: 0,
    width: THUMB_SIZE,
    alignItems: "center",
    zIndex: 10,
  },
  bubble: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 60,
    alignItems: "center",
  },
  bubbleText: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: "700",
  },
  bubbleArrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 0,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: Colors.border,
    marginTop: -1,
  },
  trackBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trackActive: {
    position: "absolute",
    left: 0,
    height: TRACK_HEIGHT,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },
  thumb: {
    position: "absolute",
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.text,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbInner: {
    width: THUMB_SIZE / 2,
    height: THUMB_SIZE / 2,
    borderRadius: THUMB_SIZE / 4,
    backgroundColor: Colors.background,
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: Spacing.md,
    position: "relative",
    height: 32,
    alignItems: "flex-start",
  },
  rangeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  centerMark: {
    position: "absolute",
    width: 2,
    height: TRACK_HEIGHT + 4,
    backgroundColor: Colors.textSecondary,
    borderRadius: 1,
    top: (THUMB_SIZE - TRACK_HEIGHT - 4) / 2,
    opacity: 0.5,
  },
  centerLabelWrapper: {
    position: "absolute",
    alignItems: "center",
    width: 40,
  },
  centerLabelText: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textSecondary,
    opacity: 0.7,
  },
  centerLabelValue: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
});
