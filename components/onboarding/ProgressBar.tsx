import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

import { Colors } from "../../constants/colors";
import { GradientColors } from "../../constants/gradients";

interface ProgressBarProps {
  progress: number; // 0 a 1
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const widthPercent = Math.min(100, Math.max(0, progress * 100));

  return (
    <View style={styles.container}>
      <View style={styles.track} />
      <View style={styles.fillWrapper}>
        <LinearGradient
          colors={GradientColors.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${widthPercent}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 4,
    backgroundColor: Colors.border,
    overflow: "hidden",
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
