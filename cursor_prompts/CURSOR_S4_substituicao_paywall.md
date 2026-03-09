# SESSÃO 4 — FoodSubstituteSheet + Paywall

> Cole este prompt no Cursor.
> Pré-requisito: Sessões 1, 2 e 3 concluídas.

---

## CONTEXTO

Nutrift — React Native + Expo SDK 54. Leia `AGENTES.md` antes de implementar.
Design: bg #111111 · primary #CAFF66 · surface #1C1C1C · texto sobre #CAFF66 SEMPRE PRETO.

## TAREFA 1 — Componente FoodSubstituteSheet

Crie `components/home/FoodSubstituteSheet.tsx`:

```tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, ActivityIndicator, Animated
} from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { supabase } from '@/services/supabase';
import { useUserStore } from '@/stores/useUserStore';

interface FoodSuggestion {
  name: string;
  quantity_g: number;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  reason?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  foodName: string;
  quantityG: number;
  mealFoodId: string;           // plan_meal_foods.id
  onConfirm: (newFood: FoodSuggestion) => void;
}

export function FoodSubstituteSheet({
  visible, onClose, foodName, quantityG, mealFoodId, onConfirm
}: Props) {
  const [activeTab, setActiveTab] = useState<'ia' | 'manual'>('ia');
  const [iaSuggestions, setIaSuggestions] = useState<FoodSuggestion[]>([]);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaError, setIaError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [historyResults, setHistoryResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodSuggestion | null>(null);
  const [customQty, setCustomQty] = useState(String(quantityG));
  const searchTimeout = useRef<any>(null);
  const user = useUserStore(s => s.user);

  // Buscar sugestões IA ao abrir na aba ia
  useEffect(() => {
    if (visible && activeTab === 'ia' && iaSuggestions.length === 0) {
      fetchIaSuggestions();
    }
  }, [visible, activeTab]);

  // Busca manual com debounce
  useEffect(() => {
    if (activeTab !== 'manual') return;
    clearTimeout(searchTimeout.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(() => fetchManualSearch(searchQuery), 400);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  // Carregar histórico ao abrir aba manual
  useEffect(() => {
    if (activeTab === 'manual') fetchHistory();
  }, [activeTab]);

  async function fetchIaSuggestions() {
    setIaLoading(true);
    setIaError('');
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/substituir-alimento`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            food_name: foodName,
            quantity_g: quantityG,
            goal: user?.goal,
            diet_type: user?.diet_type,
            restrictions: user?.restrictions,
          }),
        }
      );
      const data = await res.json();
      setIaSuggestions(data.suggestions ?? []);
    } catch {
      setIaError('Não foi possível carregar sugestões. Tente novamente.');
    } finally {
      setIaLoading(false);
    }
  }

  async function fetchManualSearch(query: string) {
    setSearchLoading(true);
    const { data } = await supabase
      .from('foods')
      .select('id, name, calories, protein, carbs, fat, portion_grams')
      .ilike('name', `%${query}%`)
      .limit(10);
    setSearchResults(data ?? []);
    setSearchLoading(false);
  }

  async function fetchHistory() {
    const { data } = await supabase
      .from('daily_food_logs')
      .select('food_name, quantity_g, kcal, protein_g, carbo_g, fat_g')
      .eq('user_id', user?.id)
      .order('logged_at', { ascending: false })
      .limit(5);
    setHistoryResults(data ?? []);
  }

  function handleSelectFood(food: any, fromHistory = false) {
    setSelectedFood({
      name: food.name ?? food.food_name,
      quantity_g: fromHistory ? food.quantity_g : quantityG,
      calories_per_100g: food.calories ?? Math.round((food.kcal / food.quantity_g) * 100),
      protein_per_100g: food.protein ?? Math.round((food.protein_g / food.quantity_g) * 100),
      carbs_per_100g: food.carbs ?? Math.round((food.carbo_g / food.quantity_g) * 100),
      fat_per_100g: food.fat ?? Math.round((food.fat_g / food.quantity_g) * 100),
    });
    setCustomQty(String(fromHistory ? food.quantity_g : quantityG));
  }

  function handleConfirm() {
    if (!selectedFood) return;
    onConfirm({ ...selectedFood, quantity_g: Number(customQty) || selectedFood.quantity_g });
    onClose();
  }

  const macroText = (food: FoodSuggestion, qty: number) => {
    const factor = qty / 100;
    return `${Math.round(food.calories_per_100g * factor)} kcal · P${Math.round(food.protein_per_100g * factor)}g · C${Math.round(food.carbs_per_100g * factor)}g · G${Math.round(food.fat_per_100g * factor)}g`;
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoint={0.85}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.handle} />
        <Text style={styles.title}>Substituir alimento</Text>
        <Text style={styles.subtitle}>Substituindo: <Text style={styles.foodName}>{foodName}</Text></Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['ia', 'manual'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'ia' ? '✨ IA Sugere' : '🔍 Busca manual'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Aba IA */}
        {activeTab === 'ia' && (
          <View style={styles.tabContent}>
            {iaLoading && <ActivityIndicator color="#CAFF66" style={{ marginTop: 32 }} />}
            {iaError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{iaError}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchIaSuggestions}>
                  <Text style={styles.retryText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={iaSuggestions}
                keyExtractor={(_, i) => String(i)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.suggestionCard, selectedFood?.name === item.name && styles.suggestionSelected]}
                    onPress={() => handleSelectFood(item)}
                  >
                    <Text style={styles.suggestionName}>{item.name}</Text>
                    <Text style={styles.suggestionMacros}>{macroText(item, item.quantity_g)} ({item.quantity_g}g)</Text>
                    {item.reason && <Text style={styles.suggestionReason}>💡 {item.reason}</Text>}
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        )}

        {/* Aba Manual */}
        {activeTab === 'manual' && (
          <View style={styles.tabContent}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar alimento..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {historyResults.length > 0 && !searchQuery && (
              <>
                <Text style={styles.sectionLabel}>Já consumidos</Text>
                {historyResults.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.suggestionCard, selectedFood?.name === item.food_name && styles.suggestionSelected]}
                    onPress={() => handleSelectFood(item, true)}
                  >
                    <View style={styles.suggestionRow}>
                      <Text style={styles.suggestionName}>{item.food_name}</Text>
                      <View style={styles.alreadyBadge}>
                        <Text style={styles.alreadyBadgeText}>✓ Já comi</Text>
                      </View>
                    </View>
                    <Text style={styles.suggestionMacros}>{item.quantity_g}g · {item.kcal} kcal</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
            {searchLoading && <ActivityIndicator color="#CAFF66" style={{ marginTop: 16 }} />}
            {searchResults.length > 0 && (
              <FlatList
                data={searchResults}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.suggestionCard, selectedFood?.name === item.name && styles.suggestionSelected]}
                    onPress={() => handleSelectFood(item)}
                  >
                    <Text style={styles.suggestionName}>{item.name}</Text>
                    <Text style={styles.suggestionMacros}>{item.calories} kcal/100g</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        )}

        {/* Confirmar seleção */}
        {selectedFood && (
          <View style={styles.confirmContainer}>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Quantidade (g)</Text>
              <TextInput
                style={styles.qtyInput}
                value={customQty}
                onChangeText={setCustomQty}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>
            <Text style={styles.confirmMacros}>{macroText(selectedFood, Number(customQty) || selectedFood.quantity_g)}</Text>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirmar substituição</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#444', alignSelf: 'center', marginBottom: 16 },
  title: { color: '#FFF', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#888', fontSize: 14, marginBottom: 20 },
  foodName: { color: '#CAFF66', fontWeight: '600' },
  tabs: { flexDirection: 'row', backgroundColor: '#1C1C1C', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#CAFF66' },
  tabText: { color: '#888', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#111111' },
  tabContent: { flex: 1 },
  suggestionCard: { backgroundColor: '#1C1C1C', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  suggestionSelected: { borderColor: '#CAFF66', backgroundColor: 'rgba(202,255,102,0.06)' },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  suggestionName: { color: '#FFF', fontSize: 15, fontWeight: '600', flex: 1 },
  suggestionMacros: { color: '#888', fontSize: 13, marginTop: 4 },
  suggestionReason: { color: '#CAFF66', fontSize: 12, marginTop: 6 },
  alreadyBadge: { backgroundColor: 'rgba(202,255,102,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  alreadyBadgeText: { color: '#CAFF66', fontSize: 11, fontWeight: '700' },
  sectionLabel: { color: '#666', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  searchInput: { backgroundColor: '#1C1C1C', borderRadius: 12, padding: 14, color: '#FFF', fontSize: 15, borderWidth: 1, borderColor: '#333', marginBottom: 12 },
  errorContainer: { alignItems: 'center', marginTop: 32, gap: 12 },
  errorText: { color: '#888', fontSize: 15, textAlign: 'center' },
  retryButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, backgroundColor: '#1C1C1C', borderWidth: 1, borderColor: '#CAFF66' },
  retryText: { color: '#CAFF66', fontSize: 14, fontWeight: '600' },
  confirmContainer: { borderTopWidth: 1, borderColor: '#2A2A2A', paddingTop: 16, paddingBottom: 8 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  confirmLabel: { color: '#888', fontSize: 14 },
  qtyInput: { backgroundColor: '#1C1C1C', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, color: '#FFF', fontSize: 16, fontWeight: '600', borderWidth: 1, borderColor: '#333', width: 80, textAlign: 'center' },
  confirmMacros: { color: '#888', fontSize: 13, marginBottom: 14 },
  confirmButton: { backgroundColor: '#CAFF66', borderRadius: 100, paddingVertical: 16, alignItems: 'center' },
  confirmButtonText: { color: '#111111', fontSize: 16, fontWeight: '700' },
});
```

## TAREFA 2 — Tela de Assinatura (perfil/assinatura.tsx)

Crie ou substitua `app/perfil/assinatura.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useIsPro } from '@/hooks/useUserPlan';

const FEATURES_FREE = [
  '✓ Registro manual de alimentos',
  '✓ Acompanhamento de calorias e macros',
  '✓ Histórico limitado (7 dias)',
  '✗ Plano alimentar com IA',
  '✗ Substituição de alimentos',
  '✗ Regeneração semanal',
];

const FEATURES_PRO = [
  '✓ Registro manual de alimentos',
  '✓ Acompanhamento de calorias e macros',
  '✓ Histórico ilimitado',
  '✓ Plano alimentar personalizado com IA',
  '✓ Substituição de alimentos por IA',
  '✓ Renovação automática todo domingo',
];

export default function AssinaturaScreen() {
  const isPro = useIsPro();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.badge}>✨ NUTRIFT PRO</Text>
        <Text style={styles.title}>Deixe a IA cuidar da sua nutrição</Text>
        <Text style={styles.subtitle}>Plano personalizado, atualizado toda semana, sem esforço.</Text>

        {/* Planos */}
        <View style={styles.plansRow}>
          {/* Free */}
          <View style={styles.planCard}>
            <Text style={styles.planLabel}>Free</Text>
            <Text style={styles.planPrice}>Grátis</Text>
            <View style={styles.divider} />
            {FEATURES_FREE.map((f, i) => (
              <Text key={i} style={[styles.feature, f.startsWith('✗') && styles.featureDisabled]}>{f}</Text>
            ))}
          </View>

          {/* Pro */}
          <View style={[styles.planCard, styles.planCardPro]}>
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>⭐ MAIS POPULAR</Text>
            </View>
            <Text style={[styles.planLabel, styles.planLabelPro]}>Pro</Text>
            <View style={styles.pricingToggle}>
              <TouchableOpacity
                style={[styles.toggle, selectedPlan === 'monthly' && styles.toggleActive]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <Text style={[styles.toggleText, selectedPlan === 'monthly' && styles.toggleTextActive]}>Mensal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggle, selectedPlan === 'annual' && styles.toggleActive]}
                onPress={() => setSelectedPlan('annual')}
              >
                <Text style={[styles.toggleText, selectedPlan === 'annual' && styles.toggleTextActive]}>Anual</Text>
              </TouchableOpacity>
            </View>
            {selectedPlan === 'annual' ? (
              <>
                <Text style={styles.planPrice}>R$14,90<Text style={styles.planPriceSuffix}>/mês</Text></Text>
                <Text style={styles.planPriceNote}>R$179,00/ano · Economize 40%</Text>
              </>
            ) : (
              <Text style={styles.planPrice}>R$24,90<Text style={styles.planPriceSuffix}>/mês</Text></Text>
            )}
            <View style={styles.divider} />
            {FEATURES_PRO.map((f, i) => (
              <Text key={i} style={[styles.feature, styles.featurePro]}>{f}</Text>
            ))}
          </View>
        </View>

        {/* Trial banner */}
        {!isPro && (
          <View style={styles.trialBanner}>
            <Text style={styles.trialText}>🎁 7 dias grátis — sem cartão de crédito</Text>
          </View>
        )}

        {/* CTA */}
        {!isPro ? (
          <>
            <TouchableOpacity style={styles.ctaButton} onPress={() => { /* handleSubscribe */ }}>
              <Text style={styles.ctaText}>
                {selectedPlan === 'annual' ? 'Assinar anual — R$179,00' : 'Assinar mensal — R$24,90/mês'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.trialButton} onPress={() => { /* handleTrial */ }}>
              <Text style={styles.trialButtonText}>Começar 7 dias grátis</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.activeCard}>
            <Text style={styles.activeText}>✓ Você já é Pro</Text>
          </View>
        )}

        <Text style={styles.legal}>Cancele a qualquer momento. Cobra automaticamente até cancelar.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  scroll: { padding: 20, paddingBottom: 48 },
  backButton: { marginBottom: 24 },
  backText: { color: '#FFF', fontSize: 24 },
  badge: { color: '#CAFF66', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '800', marginBottom: 8, lineHeight: 34 },
  subtitle: { color: '#888', fontSize: 16, marginBottom: 32, lineHeight: 22 },
  plansRow: { gap: 12, marginBottom: 24 },
  planCard: { backgroundColor: '#1C1C1C', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  planCardPro: { borderColor: '#CAFF66', borderWidth: 2 },
  popularBadge: { backgroundColor: '#CAFF66', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12 },
  popularText: { color: '#111', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  planLabel: { color: '#888', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  planLabelPro: { color: '#FFF' },
  planPrice: { color: '#FFF', fontSize: 36, fontWeight: '800' },
  planPriceSuffix: { fontSize: 16, fontWeight: '400', color: '#888' },
  planPriceNote: { color: '#CAFF66', fontSize: 13, marginTop: 2, marginBottom: 4 },
  pricingToggle: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 10, padding: 3, gap: 3, marginBottom: 8 },
  toggle: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 8 },
  toggleActive: { backgroundColor: '#CAFF66' },
  toggleText: { color: '#666', fontSize: 13, fontWeight: '600' },
  toggleTextActive: { color: '#111111' },
  divider: { height: 1, backgroundColor: '#2A2A2A', marginVertical: 16 },
  feature: { color: '#888', fontSize: 14, marginBottom: 8, lineHeight: 20 },
  featureDisabled: { color: '#444' },
  featurePro: { color: '#CCC' },
  trialBanner: { backgroundColor: 'rgba(202,255,102,0.1)', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(202,255,102,0.3)' },
  trialText: { color: '#CAFF66', fontSize: 15, fontWeight: '600' },
  ctaButton: { backgroundColor: '#CAFF66', borderRadius: 100, paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  ctaText: { color: '#111111', fontSize: 17, fontWeight: '800' },
  trialButton: { borderRadius: 100, paddingVertical: 17, alignItems: 'center', borderWidth: 1, borderColor: '#CAFF66', marginBottom: 16 },
  trialButtonText: { color: '#CAFF66', fontSize: 16, fontWeight: '700' },
  activeCard: { backgroundColor: 'rgba(202,255,102,0.1)', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  activeText: { color: '#CAFF66', fontSize: 17, fontWeight: '700' },
  legal: { color: '#444', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
```

## REGRAS

- Texto sobre #CAFF66 SEMPRE PRETO
- Não altere outros arquivos além dos citados
- Rodar `npx tsc --noEmit` após as alterações
