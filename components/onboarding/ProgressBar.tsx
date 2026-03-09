import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";

import { Colors } from "../../constants/colors";
import { GradientColors } from "../../constants/gradients";

interface ProgressBarProps {
  progress: number; // 0 a 1
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const widthPercent = Math.min(100, Math.max(0, progress * 100));
  const fillWidth = containerWidth > 0 ? (containerWidth * widthPercent) / 100 : 0;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.track} />
      <View style={styles.fillWrapper}>
        <LinearGradient
          colors={GradientColors.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: fillWidth }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 6,
    backgroundColor: Colors.border,
    overflow: "hidden",
    borderRadius: 3,
  },
  track: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.border,
  },
  fillWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});
