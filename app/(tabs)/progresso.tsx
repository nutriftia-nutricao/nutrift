import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useRef, useState } from "react";
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";
import { useTheme } from "../../hooks/useTheme";
import { useUserStore } from "../../stores/useUserStore";

type PeriodTab = "Semana" | "Mês" | "Semestre";

// Mês: escala de 0 a 30 (7 pontos: 0, 5, 10, 15, 20, 25, 30).
const MES_DIAS = [0, 5, 10, 15, 20, 25, 30];
const MES_ESCALA_5_DIAS_WEIGHT = MES_DIAS.map((day, i) => ({
  day: String(day),
  value: Math.round((73 - (i * 0.35) + (Math.sin(i) * 0.15)) * 10) / 10,
}));
const MES_ESCALA_5_DIAS_CAL = MES_DIAS.map((day, i) => ({
  day: String(day),
  value: 1920 + Math.round(Math.sin(i * 0.8) * 180) + i * 15,
}));
const MES_ESCALA_5_DIAS_HYDRATION = MES_DIAS.map((day, i) => ({
  day: String(day),
  value: 2050 + Math.round(Math.cos(i * 0.7) * 250) + i * 30,
}));

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
  Mês: MES_ESCALA_5_DIAS_WEIGHT,
  Semestre: [
    { day: "Jan", value: 76.0 },
    { day: "Fev", value: 75.2 },
    { day: "Mar", value: 74.5 },
    { day: "Abr", value: 73.8 },
    { day: "Mai", value: 73.2 },
    { day: "Jun", value: 72.8 },
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
  Mês: MES_ESCALA_5_DIAS_CAL,
  Semestre: [
    { day: "Jan", value: 2200 },
    { day: "Fev", value: 2100 },
    { day: "Mar", value: 2050 },
    { day: "Abr", value: 1980 },
    { day: "Mai", value: 2000 },
    { day: "Jun", value: 2150 },
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
  Mês: MES_ESCALA_5_DIAS_HYDRATION,
  Semestre: [
    { day: "Jan", value: 1800 },
    { day: "Fev", value: 2000 },
    { day: "Mar", value: 2100 },
    { day: "Abr", value: 2200 },
    { day: "Mai", value: 2300 },
    { day: "Jun", value: 2400 },
  ],
};

// ─── Gráfico de linha (Peso) ──────────────────────────────────────────────────
interface LineChartProps {
  data: { day: string; value: number }[];
  targetValue: number;
  color?: string;
  width: number;
  height?: number;
}

const HIT_RADIUS = 28;
const KG_STEP = 0.5;

/** Escala em 0,5 kg: inclui dados + peso meta (onboarding), mín/máx em múltiplos de 0,5. */
function weightScaleMinMax(
  values: number[],
  targetValue: number
): { minVal: number; maxVal: number; ticks: number[] } {
  const all = [...values, targetValue];
  const minRaw = Math.min(...all) - 0.5;
  const maxRaw = Math.max(...all) + 0.5;
  const minVal = Math.floor(minRaw / KG_STEP) * KG_STEP;
  const maxVal = Math.ceil(maxRaw / KG_STEP) * KG_STEP;
  const range = maxVal - minVal || 1;
  const count = Math.round(range / KG_STEP);
  const ticks = Array.from({ length: count + 1 }, (_, i) => minVal + i * KG_STEP);
  return { minVal, maxVal, ticks };
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function LineChart({
  data,
  targetValue,
  color = Colors.error,
  width,
  height = 160,
}: LineChartProps) {
  const [touchedIndex, setTouchedIndex] = useState<number | null>(null);

  if (width <= 0) return <View style={{ height }} />;
  if (!data.length) {
    return (
      <View style={{ height, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>
          Sem dados para exibir
        </Text>
      </View>
    );
  }

  const svgW = Math.max(1, Math.floor(width));
  const svgH = height;
  const padL = 40;
  const padR = 12;
  const padT = 12;
  const padB = 28;

  const innerW = svgW - padL - padR;
  const innerH = svgH - padT - padB;

  const values = data.map((d) => d.value);
  const { minVal, maxVal, ticks } = weightScaleMinMax(values, targetValue);
  const range = maxVal - minVal || 1;
  const labelStep = ticks.length > 14 ? 1 : KG_STEP;
  const ticksToShow =
    labelStep === 1 ? ticks.filter((t) => Number.isInteger(t)) : ticks;

  const toX = (i: number) => padL + (i / Math.max(1, data.length - 1)) * innerW;
  const toY = (v: number) => padT + innerH - ((v - minVal) / range) * innerH;

  const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));

  const handleTouch = useCallback(
    (ev: { nativeEvent: { locationX: number; locationY: number } }) => {
      const x = ev.nativeEvent.locationX;
      const y = ev.nativeEvent.locationY;
      let bestI = 0;
      let bestD = 1e9;
      pts.forEach((p, i) => {
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < bestD) {
          bestD = d;
          bestI = i;
        }
      });
      if (Math.sqrt(bestD) <= HIT_RADIUS) setTouchedIndex(bestI);
    },
    [pts]
  );

  const clearTouch = useCallback(() => setTouchedIndex(null), []);

  // Bezier suave
  let linePath = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpX = ((prev.x + curr.x) / 2).toFixed(2);
    linePath += ` C ${cpX} ${prev.y.toFixed(2)}, ${cpX} ${curr.y.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
  }

  const bottom = (padT + innerH).toFixed(2);
  const fillPath =
    linePath +
    ` L ${pts[pts.length - 1].x.toFixed(2)} ${bottom}` +
    ` L ${pts[0].x.toFixed(2)} ${bottom} Z`;

  const targetY = toY(targetValue);

  return (
    <View
      style={{ width: svgW, height: svgH }}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onTouchEnd={clearTouch}
      onTouchCancel={clearTouch}
    >
      <Svg width={svgW} height={svgH}>
        <Defs>
          <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </SvgGradient>
        </Defs>

        {/* Escala em 0,5 kg: linhas de grade e rótulos no eixo Y */}
        {ticksToShow.map((tick) => {
          const y = toY(tick);
          return (
            <React.Fragment key={tick}>
              {tick !== targetValue && (
                <Line
                  x1={padL}
                  y1={y}
                  x2={svgW - padR}
                  y2={y}
                  stroke={Colors.border}
                  strokeWidth={1}
                  strokeDasharray="2,2"
                />
              )}
              <SvgText
                x={padL - 6}
                y={y + 4}
                fontSize={9}
                fill={Colors.textSecondary}
                textAnchor="end"
              >
                {tick % 1 === 0 ? tick : tick.toFixed(1)}
              </SvgText>
            </React.Fragment>
          );
        })}

        <Path d={fillPath} fill="url(#areaGrad)" />

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

        <Path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {pts.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={5}
            fill={color}
          />
        ))}

        {(() => {
          const step = data.length > 12 ? Math.max(1, Math.floor(data.length / 6)) : 1;
          const indicesToShow = data.length > 12
            ? [...new Set([
                ...Array.from({ length: 6 }, (_, k) => Math.min(k * step, data.length - 1)),
                data.length - 1,
              ])].sort((a, b) => a - b)
            : data.map((_, i) => i);
          return indicesToShow.map((i) => (
            <SvgText
              key={i}
              x={toX(i)}
              y={svgH - 4}
              fontSize={10}
              fill={Colors.textSecondary}
              textAnchor="middle"
            >
              {data[i].day}
            </SvgText>
          ));
        })()}
      </Svg>

      {/* Tooltip: peso do dia (valor real), não a meta */}
      {touchedIndex !== null && data[touchedIndex] && (
        <View
          style={[
            styles.weightTooltip,
            {
              left: clamp(pts[touchedIndex].x - 28, 0, Math.max(0, svgW - 56)),
              top: clamp(pts[touchedIndex].y - 32, 4, Math.max(4, svgH - 44)),
            },
          ]}
        >
          <Text style={styles.weightTooltipDay}>{data[touchedIndex].day}</Text>
          <Text style={styles.weightTooltipValue}>
            {data[touchedIndex].value.toFixed(1)} kg
          </Text>
        </View>
      )}
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

function BarChart({ data, highlightIndex, color = Colors.error, unit = "" }: BarChartProps) {
  const chartHeight = 160;
  if (!data.length) {
    return (
      <View style={{ height: chartHeight, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>
          Sem dados para exibir
        </Text>
      </View>
    );
  }
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

      {/* Labels: para muitos pontos (ex.: 30 dias) mostra só uma amostra para não sobrepor */}
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
        {data.map((d, i) => {
          const step = data.length > 12 ? Math.max(1, Math.floor(data.length / 6)) : 1;
          const show = data.length <= 12 || i % step === 0 || i === data.length - 1;
          return (
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
              {show ? d.day : ""}
            </Text>
          );
        })}
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
  const tabs: PeriodTab[] = ["Semana", "Mês", "Semestre"];
  return (
    <View style={[styles.periodTabsWrap, { backgroundColor: C.background }]}>
      {tabs.map((t) => (
        <Pressable
          key={t}
          style={[styles.periodTab, active === t && [styles.periodTabActive, { backgroundColor: C.primary }]]}
          onPress={() => onChange(t)}
        >
          <Text
            style={[
              styles.periodTabText,
              { color: C.textSecondary },
              active === t && [styles.periodTabTextActive, { color: Colors.textInverse }],
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
  const insets = useSafeAreaInsets();
  const user = useUserStore((s) => s.user);
  const [weightPeriod, setWeightPeriod] = useState<PeriodTab>("Semana");
  const [calHydPeriod, setCalHydPeriod] = useState<PeriodTab>("Semana");
  const [chartMode, setChartMode] = useState<"calorias" | "hidratacao">("calorias");
  const calHydScrollRef = useRef<ScrollView>(null);
  const [weightChartWidth, setWeightChartWidth] = useState(0);
  const [calHydWidth, setCalHydWidth] = useState(0);
  /** Override da semana para peso adicionado manualmente (modo Free). */
  const [weightWeekOverride, setWeightWeekOverride] = useState<
    { day: string; value: number }[] | null
  >(null);
  const [showAddWeightModal, setShowAddWeightModal] = useState(false);
  const [manualWeightInput, setManualWeightInput] = useState("");

  const weightData =
    weightPeriod === "Semana" && weightWeekOverride
      ? weightWeekOverride
      : WEIGHT_DATA[weightPeriod];
  const calData = CALORIES_DATA[calHydPeriod];
  const hydData = HYDRATION_DATA[calHydPeriod];

  const currentWeight = weightData[weightData.length - 1]?.value ?? 0;
  const firstWeight = weightData[0]?.value ?? 0;
  const weightDiff = currentWeight - firstWeight;
  const weightDiffLabel =
    weightDiff > 0
      ? `+${weightDiff.toFixed(1)} kg`
      : `${weightDiff.toFixed(1)} kg`;

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

  const scrollBottomPadding = 20 + 64 + 24 + insets.bottom;

  const handleSaveManualWeight = () => {
    const v = parseFloat(manualWeightInput.replace(",", "."));
    if (!Number.isFinite(v) || v <= 0 || v >= 300) return;
    const base = weightWeekOverride ?? WEIGHT_DATA.Semana;
    const updated = [...base.slice(0, -1), { ...base[base.length - 1], value: v }];
    setWeightWeekOverride(updated);
    setManualWeightInput("");
    setShowAddWeightModal(false);
  };

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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scrollBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Insights — card verde-limão (novo marco) */}
        <Text style={[styles.sectionLabel, { color: C.text }]}>Insights Importantes</Text>
        <View style={[styles.insightCard, styles.insightCardLime]}>
          <View style={styles.insightBadgeRow}>
            <Ionicons name="flash" size={14} color={Colors.textInverse} />
            <Text style={styles.insightBadgeTextLime}>NOVO MARCO</Text>
          </View>
          <Text style={styles.insightTitleLime}>
            Você atingiu sua meta de passos por 5 dias seguidos!
          </Text>
          <Text style={styles.insightSubLime}>
            Mantenha o ritmo para desbloquear a medalha 'Madrugador'.
          </Text>
        </View>

        {/* Card Peso (déficit calórico = vermelho da paleta) */}
        <View style={[styles.card, { backgroundColor: C.surface }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.errorBg }]}>
              <Ionicons name="scale-outline" size={20} color={C.error} />
            </View>
            <Text style={[styles.cardTitle, { color: C.text }]}>Peso</Text>
            <View style={{ flex: 1 }} />
            <Pressable
              style={[styles.addWeightBtnTop, { backgroundColor: C.primary }]}
              onPress={() => setShowAddWeightModal(true)}
              hitSlop={8}
            >
              <Ionicons name="add" size={18} color={Colors.textInverse} />
            </Pressable>
            <View style={{ alignItems: "flex-end", marginLeft: Spacing.sm }}>
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

          <View
            style={{ width: "100%" }}
            onLayout={(e) => setWeightChartWidth(e.nativeEvent.layout.width)}
          >
            {weightChartWidth > 0 ? (
              <LineChart
                data={weightData}
                targetValue={targetWeight}
                color={Colors.error}
                width={weightChartWidth}
              />
            ) : (
              <View style={{ height: 160 }} />
            )}
          </View>
        </View>

        <Modal
          visible={showAddWeightModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddWeightModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowAddWeightModal(false)}
          >
            <Pressable style={[styles.modalBox, { backgroundColor: C.surface }]} onPress={(e) => e.stopPropagation()}>
              <Text style={[styles.modalTitle, { color: C.text }]}>Adicionar peso</Text>
              <Text style={[styles.modalSubtitle, { color: C.textSecondary }]}>
                Registre seu peso atual (kg). Atualiza o último dia da semana.
              </Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: C.background, color: C.text, borderColor: C.border }]}
                placeholder="Ex: 72.5"
                placeholderTextColor={C.textDisabled}
                keyboardType="decimal-pad"
                value={manualWeightInput}
                onChangeText={setManualWeightInput}
              />
              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalBtn, { backgroundColor: C.border }]}
                  onPress={() => setShowAddWeightModal(false)}
                >
                  <Text style={[styles.modalBtnText, { color: C.text }]}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: C.primary }]}
                  onPress={handleSaveManualWeight}
                >
                  <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary, { color: Colors.textInverse }]}>
                    Salvar
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Seletor Calorias / Hidratação e período (fora do card); card só com o gráfico */}
        <View style={[styles.calHydTabsWrap, { backgroundColor: C.background }]}>
          {(["calorias", "hidratacao"] as const).map((mode) => (
            <Pressable
              key={mode}
              style={[
                styles.periodTab,
                { flexDirection: "row" },
                chartMode === mode && [
                  styles.calHydTabActive,
                  { backgroundColor: C.primary },
                ],
              ]}
              onPress={() => {
                setChartMode(mode);
                if (calHydWidth > 0) {
                  calHydScrollRef.current?.scrollTo({
                    x: mode === "calorias" ? 0 : calHydWidth,
                    animated: true,
                  });
                }
              }}
            >
              <Ionicons
                name={mode === "calorias" ? "flame-outline" : "water-outline"}
                size={16}
                color={chartMode === mode ? Colors.textInverse : C.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.periodTabText,
                  { color: C.textSecondary },
                  chartMode === mode && [
                    styles.periodTabTextActive,
                    { color: Colors.textInverse, fontWeight: "700" },
                  ],
                ]}
              >
                {mode === "calorias" ? "Calorias" : "Hidratação"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.periodTabsWrapOuter, { backgroundColor: C.background }]}>
          <PeriodTabs active={calHydPeriod} onChange={setCalHydPeriod} C={C} />
        </View>

        <View style={[styles.card, { backgroundColor: C.surface }]}>
          <View
            style={{ width: "100%" }}
            onLayout={(e) => setCalHydWidth(e.nativeEvent.layout.width)}
          >
            {calHydWidth > 0 ? (
              <ScrollView
                ref={calHydScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={{ width: calHydWidth }}
                contentContainerStyle={{ flexDirection: "row" }}
                onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                  const x = e.nativeEvent.contentOffset.x;
                  const index = Math.round(x / calHydWidth);
                  setChartMode(index === 0 ? "calorias" : "hidratacao");
                }}
                scrollEventThrottle={16}
              >
                <View style={[styles.calHydPage, { width: calHydWidth }]}>
                  <BarChart
                    data={calData}
                    highlightIndex={calHighlight}
                    color={Colors.error}
                  />
                </View>
                <View style={[styles.calHydPage, { width: calHydWidth }]}>
                  <BarChart
                    data={hydData}
                    highlightIndex={hydHighlight}
                    color={C.blue}
                  />
                </View>
              </ScrollView>
            ) : (
              <View style={{ height: 160 }} />
            )}
          </View>
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
    gap: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.h4,
    marginBottom: -Spacing.sm,
  },
  insightCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  insightCardLime: {
    backgroundColor: Colors.primary,
  },
  insightBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  insightBadgeText: {
    ...Typography.label,
    color: Colors.primary,
    fontSize: 11,
  },
  insightBadgeTextLime: {
    ...Typography.label,
    color: Colors.textInverse,
    fontSize: 11,
  },
  insightTitle: {
    ...Typography.h4,
    color: "#FFFFFF",
    lineHeight: 24,
  },
  insightTitleLime: {
    ...Typography.h4,
    color: Colors.textInverse,
    lineHeight: 24,
  },
  insightSub: {
    ...Typography.bodySmall,
    color: "#BDBDBD",
    lineHeight: 18,
  },
  insightSubLime: {
    ...Typography.bodySmall,
    color: "rgba(0,0,0,0.7)",
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
    overflow: "hidden",
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
  weightTooltip: {
    position: "absolute",
    width: 56,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  weightTooltipDay: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  weightTooltipValue: {
    ...Typography.label,
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  addWeightBtnTop: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalBox: {
    width: "100%",
    maxWidth: 320,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  modalTitle: {
    ...Typography.h3,
  },
  modalSubtitle: {
    ...Typography.caption,
    lineHeight: 18,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnPrimary: {},
  modalBtnText: {
    ...Typography.label,
  },
  modalBtnTextPrimary: {
    color: Colors.textInverse,
  },
  calHydTabsWrap: {
    flexDirection: "row",
    borderRadius: Radius.lg,
    padding: 3,
    gap: 2,
    marginBottom: Spacing.sm,
  },
  calHydTabActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  periodTabsWrapOuter: {
    marginBottom: Spacing.md,
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
  calHydPage: {
    paddingTop: Spacing.sm,
  },
});
