import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ITEM_WIDTH = 60; // Largura de cada item na régua
const ITEM_SPACING = 10; // Espaçamento visual
const SEGMENT_WIDTH = 2; // Largura do traço
const SEGMENT_HEIGHT = 40; // Altura do traço normal
const SEGMENT_HEIGHT_ACTIVE = 60; // Altura do traço ativo

interface RulerPickerProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  unit: string;
  onChange: (value: number) => void;
  label?: string;
}

export function RulerPicker({
  min,
  max,
  step = 1,
  value,
  unit,
  onChange,
  label,
}: RulerPickerProps) {
  const scrollViewRef = useRef<Animated.FlatList<number>>(null);
  const scrollX = useSharedValue(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // Gera array de valores baseados no min, max e step
  const data = React.useMemo(() => {
    const items = [];
    for (let i = min; i <= max; i += step) {
      items.push(parseFloat(i.toFixed(1)));
    }
    return items;
  }, [min, max, step]);

  // Espaçadores para centralizar o primeiro e último item
  const spacerWidth = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

  // Calcula o índice inicial baseado no valor atual
  const initialIndex = Math.round((value - min) / step);

  useEffect(() => {
    // Scroll inicial para a posição correta
    if (scrollViewRef.current && !isScrolling) {
      // Pequeno delay para garantir que a lista foi renderizada
      setTimeout(() => {
        scrollViewRef.current?.scrollToOffset({
          offset: initialIndex * ITEM_WIDTH,
          animated: false,
        });
      }, 100);
    }
  }, []);

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
    onMomentumEnd: (event) => {
      const index = Math.round(event.contentOffset.x / ITEM_WIDTH);
      const newValue = min + index * step;
      const clampedValue = Math.max(min, Math.min(max, newValue));
      runOnJS(onChange)(parseFloat(clampedValue.toFixed(1)));
      runOnJS(setIsScrolling)(false);
    },
    onBeginDrag: () => {
      runOnJS(setIsScrolling)(true);
    },
  });

  // Função para snap manual ao soltar o dedo (se não tiver momentum suficiente)
  const handleScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!e.nativeEvent.velocity?.x) {
      const index = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
      const newValue = min + index * step;
      const clampedValue = Math.max(min, Math.min(max, newValue));
      onChange(parseFloat(clampedValue.toFixed(1)));
      setIsScrolling(false);
    }
  };

  const renderItem = ({ item, index }: { item: number; index: number }) => {
    // Lógica de animação poderia ser adicionada aqui baseada em scrollX
    // Por simplicidade e performance, vamos manter estático por enquanto
    // e focar na funcionalidade correta
    
    // Verifica se é um valor inteiro para destacar visualmente
    const isInteger = Number.isInteger(item);

    return (
      <View style={{ width: ITEM_WIDTH, alignItems: "center", justifyContent: "center" }}>
        <View
          style={[
            styles.segment,
            {
              height: isInteger ? SEGMENT_HEIGHT : SEGMENT_HEIGHT * 0.6,
              backgroundColor: isInteger ? Colors.textSecondary : Colors.border,
              width: isInteger ? 2 : 1,
            },
          ]}
        />
        {isInteger && (
          <Text style={styles.segmentLabel}>{item}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>{value}</Text>
        <Text style={styles.unitText}>{unit}</Text>
      </View>

      <View style={styles.pickerContainer}>
        {/* Indicador Central Fixo */}
        <View style={styles.indicatorContainer}>
          <View style={styles.indicator} />
        </View>

        <Animated.FlatList
          ref={scrollViewRef}
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          bounces={false}
          contentContainerStyle={{
            paddingHorizontal: spacerWidth,
          }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={() => {}} // Tratado no useAnimatedScrollHandler
          onScrollEndDrag={handleScrollEndDrag}
          getItemLayout={(_, index) => ({
            length: ITEM_WIDTH,
            offset: ITEM_WIDTH * index,
            index,
          })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    gap: 4,
  },
  valueText: {
    ...Typography.h1,
    fontSize: 48,
    color: Colors.primary,
    fontWeight: "700",
  },
  unitText: {
    ...Typography.h3,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  pickerContainer: {
    height: 100,
    justifyContent: "center",
  },
  indicatorContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    pointerEvents: "none", // Permite passar toques para a lista
  },
  indicator: {
    width: 4,
    height: 70,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },
  segment: {
    borderRadius: Radius.pill,
    marginBottom: 24, // Espaço para o texto abaixo
  },
  segmentLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    position: "absolute",
    bottom: 0,
  },
});
