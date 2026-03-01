import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Stop,
  Svg,
  Circle,
  Line,
  Text as SvgText,
} from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";
import { useTheme } from "../../hooks/useTheme";
import { useUserStore } from "../../stores/useUserStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type PeriodTab = "Semana" | "Mês" | "Ano";

// ─── Dados mock ──────────────────────────────────────────────────────────────
const WEIGHT_DATA: Record<PeriodTab, { day: string; value: number }[]> = {
  Semana: [
    { day: "Seg", value: 72.5 },
    { day: "Ter", value: 72.3 },
    { day: "Qua", value: 72.3 },
    { day: "Qui", value: 72.2 },
    { day: "Sex", value: 72.1 },
    { day: "Sáb", value: 72.0 },
    { day: "Dom", value: 71.9 },
  ],
  Mês: [
    { day: "S1", value: 73.0 },
    { day: "S2", value: 72.8 },
    { day: "S3", value: 72.4 },
    { day: "S4", value: 72.1 },
  ],
  Ano: [
    { day: "Jan", value: 76.0 },
    { day: "Fev", value: 75.2 },
    { day: "Mar", value: 74.5 },
    { day: "Abr", value: 73.8 },
    { day: "Mai", value: 73.2 },
    { day: "Jun", value: 72.8 },
    { day: "Jul", value: 72.4 },
    { day: "Ago", value: 72.1 },
  ],
};

const CALORIES_DATA: Record<PeriodTab, { day: string; value: number }[]> = {
  Semana: [
    { day: "Seg", value: 1850 },
    { day: "Ter", value: 2100 },
    { day: "Qua", value: 1950 },
    { day: "Qui", value: 2200 },
    { day: "Sex", value: 1800 },
    { day: "Sáb", value: 2400 },
    { day: "Dom", value: 2050 },
  ],
  Mês: [
    { day: "S1", value: 1900 },
    { day: "S2", value: 2050 },
    { day: "S3", value: 2100 },
    { day: "S4", value: 1980 },
  ],
  Ano: [
    { day: "Jan", value: 2200 },
    { day: "Fev", value: 2100 },
    { day: "Mar", value: 2050 },
    { day: "Abr", value: 1980 },
    { day: "Mai", value: 2000 },
    { day: "Jun", value: 2150 },
    { day: "Jul", value: 2050 },
    { day: "Ago", value: 2050 },
  ],
};

const HYDRATION_DATA: Record<PeriodTab, { day: string; value: number }[]> = {
  Semana: [
    { day: "Seg", value: 2100 },
    { day: "Ter", value: 1800 },
    { day: "Qua", value: 2400 },
    { day: "Qui", value: 2000 },
    { day: "Sex", value: 1900 },
    { day: "Sáb", value: 2800 },
    { day: "Dom", value: 2400 },
  ],
  Mês: [
    { day: "S1", value: 2000 },
    { day: "S2", value: 2200 },
    { day: "S3", value: 2100 },
    { day: "S4", value: 2300 },
  ],
  Ano: [
    { day: "Jan", value: 1800 },
    { day: "Fev", value: 2000 },
    { day: "Mar", value: 2100 },
    { day: "Abr", value: 2200 },
    { day: "Mai", value: 2300 },
    { day: "Jun", value: 2400 },
    { day: "Jul", value: 2200 },
    { day: "Ago", value: 2200 },
  ],
};

// ─── Gráfico de linha (Peso) ──────────────────────────────────────────────────
interface LineChartProps {
  data: { day: string; value: number }[];
  targetValue: number;
  color?: string;
}

function LineChart({ data, targetValue, color = "#C8E63C" }: LineChartProps) {
  const svgW = SCREEN_WIDTH - Spacing.xl * 2 - Spacing.lg * 2;
  const svgH = 160;
  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 28;

  const innerW = svgW - padL - padR;
  const innerH = svgH - padT - padB;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values) - 0.4;
  const maxVal = Math.max(...values) + 0.4;
  const range = maxVal - minVal || 1;

  const toX = (i: number) => padL + (i / (data.length - 1)) * innerW;
  const toY = (v: number) => padT + innerH - ((v - minVal) / range) * innerH;

  const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));

  // Bezier suave
  let linePath = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpX = ((prev.x + curr.x) / 2).toFixed(2);
    linePath += ` C ${cpX} ${prev.y.toFixed(2)}, ${cpX} ${curr.y.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
  }

  // Área preenchida
  const bottom = (padT + innerH).toFixed(2);
  const fillPath =
    linePath +
    ` L ${pts[pts.length - 1].x.toFixed(2)} ${bottom}` +
    ` L ${pts[0].x.toFixed(2)} ${bottom} Z`;

  const targetY = toY(targetValue);

  return (
    <View>
      <Svg width={svgW} height={svgH}>
        <Defs>
          <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </SvgGradient>
        </Defs>

        {/* Área preenchida */}
        <Path d={fillPath} fill="url(#areaGrad)" />

        {/* Linha tracejada da meta */}
        <Line
          x1={padL}
          y1={targetY}
          x2={svgW - padR}
          y2={targetY}
          stroke={Colors.textMuted}
          strokeWidth={1}
          strokeDasharray="4,4"
        />
        <SvgText
          x={padL - 2}
          y={targetY - 3}
          fontSize={10}
          fill={Colors.textMuted}
          textAnchor="end"
        >
          {targetValue.toFixed(1)}
        </SvgText>
        <SvgText
          x={svgW - padR + 2}
          y={targetY - 3}
          fontSize={10}
          fill={Colors.textMuted}
          textAnchor="start"
        >
          Me
        </SvgText>

        {/* Linha principal */}
        <Path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pontos */}
        {pts.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={5}
            fill={color}
          />
        ))}

        {/* Labels dos dias */}
        {data.map((d, i) => (
          <SvgText
            key={i}
            x={toX(i)}
            y={svgH - 4}
            fontSize={10}
            fill={Colors.textSecondary}
            textAnchor="middle"
          >
            {d.day}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

// ─── Gráfico de barras ────────────────────────────────────────────────────────
interface BarChartProps {
  data: { day: string; value: number }[];
  highlightIndex?: number;
  color?: string;
  unit?: string;
}

function BarChart({ data, highlightIndex, color = "#C8E63C", unit = "" }: BarChartProps) {
  const chartHeight = 160;
  const maxVal = Math.max(...data.map((d) => d.value));

  return (
    <View style={{ height: chartHeight }}>
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          paddingBottom: 24,
          gap: 4,
        }}
      >
        {data.map((d, i) => {
          const isHighlight = i === highlightIndex;
          const barH = Math.max(8, ((d.value / maxVal) * (chartHeight - 48)));
          return (
            <View
              key={i}
              style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}
            >
              {/* Valor rotacionado dentro da barra */}
              <View
                style={{
                  width: "100%",
                  height: barH,
                  backgroundColor: isHighlight ? color : Colors.border,
                  borderRadius: Radius.sm,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <Text
                  style={{
                    ...Typography.caption,
                    fontSize: 9,
                    fontWeight: "700",
                    color: isHighlight ? Colors.text : Colors.textSecondary,
                    transform: [{ rotate: "-90deg" }],
                    width: barH,
                    textAlign: "center",
                  }}
                  numberOfLines={1}
                >
                  {d.value}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Labels */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {data.map((d, i) => (
          <Text
            key={i}
            style={{
              ...Typography.caption,
              fontSize: 10,
              color: Colors.textSecondary,
              flex: 1,
              textAlign: "center",
            }}
          >
            {d.day}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── Tabs de período ──────────────────────────────────────────────────────────
interface PeriodTabsProps {
  active: PeriodTab;
  onChange: (t: PeriodTab) => void;
  C: ReturnType<typeof useTheme>["C"];
}

function PeriodTabs({ active, onChange, C }: PeriodTabsProps) {
  const tabs: PeriodTab[] = ["Semana", "Mês", "Ano"];
  return (
    <View style={[styles.periodTabsWrap, { backgroundColor: C.background }]}>
      {tabs.map((t) => (
        <Pressable
          key={t}
          style={[styles.periodTab, active === t && [styles.periodTabActive, { backgroundColor: C.surface }]]}
          onPress={() => onChange(t)}
        >
          <Text
            style={[
              styles.periodTabText,
              { color: C.textSecondary },
              active === t && [styles.periodTabTextActive, { color: C.text }],
            ]}
          >
            {t}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function ProgressoScreen() {
  const { C } = useTheme();
  const user = useUserStore((s) => s.user);
  const [weightPeriod, setWeightPeriod] = useState<PeriodTab>("Semana");
  const [calPeriod, setCalPeriod] = useState<PeriodTab>("Semana");
  const [hydPeriod, setHydPeriod] = useState<PeriodTab>("Semana");

  const weightData = WEIGHT_DATA[weightPeriod];
  const calData = CALORIES_DATA[calPeriod];
  const hydData = HYDRATION_DATA[hydPeriod];

  const currentWeight = weightData[weightData.length - 1].value;
  const firstWeight = weightData[0].value;
  const weightDiff = currentWeight - firstWeight;
  const weightDiffLabel =
    weightDiff > 0
      ? `+${weightDiff.toFixed(1)}kg esta semana`
      : `${weightDiff.toFixed(1)}kg esta semana`;

  const calAvg = Math.round(
    calData.reduce((s, d) => s + d.value, 0) / calData.length
  );
  const hydAvgMl = Math.round(
    hydData.reduce((s, d) => s + d.value, 0) / hydData.length
  );
  const hydAvgL = (hydAvgMl / 1000).toFixed(1);

  const calHighlight = calData.reduce(
    (maxI, d, i, arr) => (d.value > arr[maxI].value ? i : maxI),
    0
  );
  const hydHighlight = hydData.reduce(
    (maxI, d, i, arr) => (d.value > arr[maxI].value ? i : maxI),
    0
  );

  const targetWeight = user?.target_weight ?? 72.0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={[styles.headerBtn, { backgroundColor: C.surface }]}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.text }]}>Seu Progresso</Text>
        <Pressable style={[styles.headerBtn, { backgroundColor: C.surface }]}>
          <Ionicons name="calendar-outline" size={22} color={C.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Insights */}
        <Text style={[styles.sectionLabel, { color: C.text }]}>Insights Importantes</Text>
        <View style={styles.insightCard}>
          <View style={styles.insightBadgeRow}>
            <Ionicons name="flash" size={14} color="#C8E63C" />
            <Text style={styles.insightBadgeText}>NOVO MARCO</Text>
          </View>
          <Text style={styles.insightTitle}>
            Você atingiu sua meta de passos por 5 dias seguidos!
          </Text>
          <Text style={styles.insightSub}>
            Mantenha o ritmo para desbloquear a medalha 'Madrugador'.
          </Text>
        </View>

        {/* Card Peso */}
        <View style={[styles.card, { backgroundColor: C.surface }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.greenLight }]}>
              <Ionicons name="scale-outline" size={20} color={C.carbo} />
            </View>
            <Text style={[styles.cardTitle, { color: C.text }]}>Peso</Text>
            <View style={{ flex: 1 }} />
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.weightValue, { color: C.text }]}>{currentWeight.toFixed(1)} kg</Text>
              <Text
                style={[
                  styles.weightDiff,
                  { color: weightDiff <= 0 ? C.greenDark : C.error },
                ]}
              >
                {weightDiffLabel}
              </Text>
            </View>
          </View>

          <PeriodTabs active={weightPeriod} onChange={setWeightPeriod} C={C} />

          <LineChart
            data={weightData}
            targetValue={targetWeight}
            color="#C8E63C"
          />
        </View>

        {/* Card Calorias Queimadas */}
        <View style={[styles.card, { backgroundColor: C.surface }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.carboBg }]}>
              <Ionicons name="flame-outline" size={20} color="#FF7043" />
            </View>
            <Text style={[styles.cardTitle, { color: C.text }]}>Calorias Queimadas</Text>
            <View style={{ flex: 1 }} />
            <Text style={[styles.avgLabel, { color: C.textSecondary }]}>Média: {calAvg} kcal</Text>
          </View>

          <BarChart
            data={calData}
            highlightIndex={calHighlight}
            color="#C8E63C"
          />
        </View>

        {/* Card Hidratação */}
        <View style={[styles.card, { backgroundColor: C.surface }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.blueBg }]}>
              <Ionicons name="water-outline" size={20} color={C.blue} />
            </View>
            <Text style={[styles.cardTitle, { color: C.text }]}>Hidratação</Text>
            <View style={{ flex: 1 }} />
            <Text style={[styles.avgLabel, { color: C.textSecondary }]}>Média: {hydAvgL}L</Text>
          </View>

          <BarChart
            data={hydData}
            highlightIndex={hydHighlight}
            color={C.blue}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    ...Typography.h3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
    gap: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.h4,
    marginBottom: -Spacing.sm,
  },
  insightCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  insightBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  insightBadgeText: {
    ...Typography.label,
    color: "#C8E63C",
    fontSize: 11,
  },
  insightTitle: {
    ...Typography.h4,
    color: "#FFFFFF",
    lineHeight: 24,
  },
  insightSub: {
    ...Typography.bodySmall,
    color: "#BDBDBD",
    lineHeight: 18,
  },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    ...Typography.h4,
  },
  weightValue: {
    ...Typography.h3,
    fontSize: 22,
  },
  weightDiff: {
    ...Typography.caption,
    fontWeight: "600",
    fontSize: 12,
  },
  avgLabel: {
    ...Typography.caption,
    fontWeight: "600",
  },
  periodTabsWrap: {
    flexDirection: "row",
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: 3,
    gap: 2,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  periodTabActive: {
    backgroundColor: Colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  periodTabText: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  periodTabTextActive: {
    color: Colors.text,
    fontWeight: "700",
  },
});
