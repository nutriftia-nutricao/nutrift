import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/radius';

type Height = 'thin' | 'md' | 'thick';

interface ProgressBarProps {
  progress: number; // 0–1
  height?: Height;
  color?: string;
  style?: ViewStyle;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  height = 'md',
  color = Colors.primary,
  style,
  animated = true,
}: ProgressBarProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const clamped = Math.min(1, Math.max(0, progress));
    if (animated) {
      Animated.timing(anim, {
        toValue: clamped,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      anim.setValue(clamped);
    }
  }, [progress]);

  const heights = { thin: 4, md: 6, thick: 10 };

  return (
    <View style={[styles.track, { height: heights[height] }, style]}>
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: anim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
