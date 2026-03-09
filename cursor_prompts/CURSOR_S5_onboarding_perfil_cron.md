# SESSÃO 5 — Onboarding Steps 8 e 9 + Perfil + Cron

> Cole este prompt no Cursor.
> Pré-requisito: Sessões 1 a 4 concluídas.

---

## CONTEXTO

Nutrift — React Native + Expo SDK 54. Leia `AGENTES.md` antes de implementar.
Design: bg #111111 · primary #CAFF66 · surface #1C1C1C · texto sobre #CAFF66 SEMPRE PRETO.
Padrão visual dos steps: barra progresso #CAFF66 4px · "PASSO X DE 9" topo direito · cards bg #1C1C1C borda #333333 · botão bg #CAFF66 texto PRETO.

---

## TAREFA 1 — Step 8: Estilo de dieta

Crie `app/(auth)/onboarding/step-8.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

const STEP = 8;
const TOTAL = 9;

const DIETAS = [
  { key: 'onivoro',      label: 'Onívoro',           emoji: '🥩', desc: 'Como de tudo, sem restrições' },
  { key: 'vegetariano',  label: 'Vegetariano',        emoji: '🥗', desc: 'Sem carnes, mas com ovos e laticínios' },
  { key: 'vegano',       label: 'Vegano',             emoji: '🌱', desc: 'Sem nenhum produto animal' },
  { key: 'low_carb',     label: 'Low Carb',           emoji: '🥑', desc: 'Poucos carboidratos, mais gordura boa' },
  { key: 'sem_gluten',   label: 'Sem Glúten',         emoji: '🌾', desc: 'Sem trigo, aveia, centeio ou cevada' },
  { key: 'sem_lactose',  label: 'Sem Lactose',        emoji: '🥛', desc: 'Sem leite, queijo ou derivados' },
];

export default function Step8() {
  const { data, setField } = useOnboardingStore();
  const selected = data.diet_type;

  function handleSelect(key: string) {
    setField('diet_type', key);
  }

  function handleContinue() {
    if (!selected) return;
    router.push('/onboarding/step-9');
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(STEP / TOTAL) * 100}%` }]} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View style={styles.stepInfo}>
          <Text style={styles.stepLabel}>PASSO {STEP} DE {TOTAL}</Text>
          <Text style={styles.stepName}>Estilo alimentar</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Como você prefere{'\n'}se alimentar?</Text>
        <Text style={styles.subtitle}>Isso ajuda a IA a montar um plano que você vai seguir de verdade.</Text>

        {DIETAS.map(d => (
          <TouchableOpacity
            key={d.key}
            style={[styles.card, selected === d.key && styles.cardSelected]}
            onPress={() => handleSelect(d.key)}
            activeOpacity={0.8}
          >
            <Text style={styles.cardEmoji}>{d.emoji}</Text>
            <View style={styles.cardText}>
              <Text style={[styles.cardLabel, selected === d.key && styles.cardLabelSelected]}>{d.label}</Text>
              <Text style={styles.cardDesc}>{d.desc}</Text>
            </View>
            {selected === d.key && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !selected && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selected}
        >
          <Text style={styles.buttonText}>Continuar →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  progressBar: { height: 4, backgroundColor: '#2A2A2A' },
  progressFill: { height: 4, backgroundColor: '#CAFF66', borderRadius: 2 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  back: { color: '#FFF', fontSize: 24 },
  stepInfo: { flex: 1, alignItems: 'flex-end' },
  stepLabel: { color: '#CAFF66', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  stepName: { color: '#FFF', fontSize: 13, fontWeight: '600', marginTop: 2 },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '800', marginBottom: 8, lineHeight: 34 },
  subtitle: { color: '#888', fontSize: 16, marginBottom: 24, lineHeight: 22 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#1C1C1C', borderRadius: 16, padding: 18,
    marginBottom: 10, borderWidth: 1, borderColor: '#333333',
  },
  cardSelected: { borderColor: '#CAFF66', backgroundColor: 'rgba(202,255,102,0.06)' },
  cardEmoji: { fontSize: 28, width: 36, textAlign: 'center' },
  cardText: { flex: 1 },
  cardLabel: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cardLabelSelected: { color: '#CAFF66' },
  cardDesc: { color: '#888', fontSize: 13, marginTop: 3 },
  checkmark: { color: '#CAFF66', fontSize: 18, fontWeight: '800' },
  footer: { padding: 20 },
  button: { backgroundColor: '#CAFF66', borderRadius: 100, paddingVertical: 18, alignItems: 'center' },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#111111', fontSize: 17, fontWeight: '800' },
});
```

---

## TAREFA 2 — Step 9: Resultado do plano

Crie `app/(auth)/onboarding/step-9.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { useUserStore } from '@/stores/useUserStore';
import { calculateMacros } from '@/utils/mifflin';
import { supabase } from '@/services/supabase';

export default function Step9() {
  const { data } = useOnboardingStore();
  const { setUser } = useUserStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Calcular macros a partir dos dados do onboarding
  const macros = calculateMacros({
    sex: data.sex,
    weight: data.weight_kg,
    height: data.height_cm,
    age: data.age,
    activity: data.activity_level,
    goal: data.goal,
  });

  const imc = data.weight_kg / Math.pow(data.height_cm / 100, 2);
  const imcLabel = imc < 18.5 ? 'Abaixo do peso' : imc < 25 ? 'Normal ✓' : imc < 30 ? 'Acima do peso' : 'Obesidade';
  const imcColor = imc < 25 && imc >= 18.5 ? '#45C588' : '#F59E0B';

  const weeklyLoss = data.weekly_rate ?? 0.5;
  const kgToLose = Math.abs((data.goal_weight_kg ?? data.weight_kg) - data.weight_kg);
  const weeksNeeded = kgToLose / weeklyLoss;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + Math.round(weeksNeeded * 7));
  const targetDateLabel = targetDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  async function handleStart() {
    setSaving(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Salvar perfil
      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        sex: data.sex,
        height_cm: data.height_cm,
        weight_kg: data.weight_kg,
        goal: data.goal,
        goal_weight_kg: data.goal_weight_kg,
        weekly_rate: data.weekly_rate,
        activity_level: data.activity_level,
        diet_type: data.diet_type,
        meals_per_day: data.meals_per_day,
      });

      // Salvar macros
      await supabase.from('user_macros').upsert({
        user_id: user.id,
        daily_kcal: macros.calories,
        protein_g: macros.protein,
        carbo_g: macros.carbs,
        fat_g: macros.fat,
      });

      // Marcar onboarding concluído
      await supabase.from('users').update({ onboarding_completed: true }).eq('id', user.id);

      router.replace('/(tabs)');
    } catch (e: any) {
      setError('Erro ao salvar. Tente novamente.');
      console.error('[Step9]', e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Badge */}
        <View style={styles.headerRow}>
          <View style={styles.successCircle}>
            <Text style={styles.successCheck}>✓</Text>
          </View>
          <Text style={styles.concluido}>CONCLUÍDO</Text>
        </View>

        <Text style={styles.title}>Seu plano está pronto, {data.name}!</Text>
        <Text style={styles.subtitle}>Calculamos tudo para você chegar lá.</Text>

        {/* Card hero — kcal e macros */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>META CALÓRICA DIÁRIA</Text>
          <Text style={styles.heroCalories}>{macros.calories}</Text>
          <Text style={styles.heroKcal}>kcal</Text>
          <View style={styles.heroDivider} />
          <View style={styles.macrosRow}>
            <MacroItem label="P" value={macros.protein} color="#FF6F43" />
            <MacroItem label="C" value={macros.carbs} color="#111111" />
            <MacroItem label="G" value={macros.fat} color="#111111" />
          </View>
        </View>

        {/* Data objetivo */}
        <Text style={styles.targetDate}>📅 Meta: {targetDateLabel}</Text>

        {/* IMC e meta de peso */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>IMC</Text>
            <Text style={styles.statValue}>{imc.toFixed(1)}</Text>
            <View style={[styles.statBadge, { backgroundColor: imcColor + '22', borderColor: imcColor }]}>
              <Text style={[styles.statBadgeText, { color: imcColor }]}>{imcLabel}</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>META DE PESO</Text>
            <Text style={styles.statValue}>{data.weight_kg}kg</Text>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeText}>→ {data.goal_weight_kg}kg</Text>
            </View>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleStart} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#111111" />
            : <Text style={styles.buttonText}>Começar agora →</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color, fontSize: 18, fontWeight: '800' }}>{label} {value}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  scroll: { padding: 24, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  successCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#CAFF66', alignItems: 'center', justifyContent: 'center' },
  successCheck: { color: '#111111', fontSize: 26, fontWeight: '900' },
  concluido: { color: '#CAFF66', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: '#FFF', fontSize: 26, fontWeight: '800', marginBottom: 6, lineHeight: 32 },
  subtitle: { color: '#888', fontSize: 16, marginBottom: 28 },
  heroCard: { backgroundColor: '#CAFF66', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 },
  heroLabel: { color: '#111111', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  heroCalories: { color: '#111111', fontSize: 60, fontWeight: '900', lineHeight: 64 },
  heroKcal: { color: '#111111', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  heroDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.15)', width: '100%', marginBottom: 16 },
  macrosRow: { flexDirection: 'row', gap: 20 },
  targetDate: { color: '#CAFF66', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  statCard: { flex: 1, backgroundColor: '#1C1C1C', borderRadius: 18, padding: 18, alignItems: 'center', gap: 8 },
  statLabel: { color: '#666', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  statValue: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  statBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(202,255,102,0.15)', borderWidth: 1, borderColor: '#CAFF66' },
  statBadgeText: { color: '#CAFF66', fontSize: 12, fontWeight: '700' },
  error: { color: '#EF4444', textAlign: 'center', marginBottom: 12 },
  button: { backgroundColor: '#CAFF66', borderRadius: 100, paddingVertical: 18, alignItems: 'center' },
  buttonText: { color: '#111111', fontSize: 17, fontWeight: '800' },
});
```

---

## TAREFA 3 — Adicionar calculateMacros em utils/mifflin.ts

Se a função `calculateMacros` não existir no arquivo, adicione:

```typescript
interface MacroInput {
  sex: 'M' | 'F';
  weight: number;
  height: number;
  age: number;
  activity: 'sedentary' | 'light' | 'moderate' | 'active';
  goal: 'fat_loss' | 'muscle_gain' | 'recomp_cut' | 'full_recomp';
}

export function calculateMacros(input: MacroInput) {
  const { sex, weight, height, age, activity, goal } = input;

  const tmb = sex === 'M'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
  const tdee = tmb * multipliers[activity];

  const adjustments = {
    fat_loss: -500, muscle_gain: 300, recomp_cut: -300, full_recomp: -400,
  };
  const rawCalories = tdee + adjustments[goal];

  const minCalories = sex === 'F' ? 1200 : 1500;
  const calories = Math.max(minCalories, Math.round(rawCalories));

  const macroRatios = {
    fat_loss:    { p: 0.35, c: 0.35, f: 0.30 },
    muscle_gain: { p: 0.30, c: 0.45, f: 0.25 },
    recomp_cut:  { p: 0.40, c: 0.30, f: 0.30 },
    full_recomp: { p: 0.40, c: 0.30, f: 0.30 },
  };

  const { p, c, f } = macroRatios[goal];
  return {
    calories,
    protein: Math.round((calories * p) / 4),
    carbs:   Math.round((calories * c) / 4),
    fat:     Math.round((calories * f) / 9),
  };
}
```

---

## TAREFA 4 — Cron job no Supabase (executar uma vez no SQL Editor)

```sql
-- Habilitar extensões (executar como superuser no SQL Editor do Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remover job anterior se existir
SELECT cron.unschedule('regenerar-planos-domingo');

-- Criar cron: toda segunda 01h UTC = domingo 22h BRT
SELECT cron.schedule(
  'regenerar-planos-domingo',
  '0 1 * * 1',
  format(
    $$
    SELECT net.http_post(
      url := '%s/functions/v1/gerar-plano',
      headers := '{"Content-Type":"application/json","Authorization":"Bearer %s"}'::jsonb,
      body := '{"is_cron":true,"regenerate_all":true}'::jsonb
    )
    $$,
    current_setting('app.supabase_url'),
    current_setting('app.service_role_key')
  )
);

-- Verificar cron registrado
SELECT * FROM cron.job;
```

**Alternativa mais simples (substituir URL e KEY manualmente):**
```sql
SELECT cron.schedule(
  'regenerar-planos-domingo',
  '0 1 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/gerar-plano',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer SUA_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{"is_cron":true,"regenerate_all":true}'::jsonb
  )
  $$
);
```

---

## TAREFA 5 — Deletar conta (LGPD)

Crie `supabase/functions/deletar-conta/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  const { data: { user }, error } =
    await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (error || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  // Cascade delete (ON DELETE CASCADE já cuida da maioria)
  // Deletar user do auth (remove tudo pelo trigger)
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
```

## REGRAS

- Texto sobre #CAFF66 SEMPRE PRETO #111111
- Não altere arquivos de steps já funcionando (1 a 7)
- Rodar `npx tsc --noEmit` após as alterações
- Após criar Step 8 e 9, verificar que `app/(auth)/onboarding/index.tsx` redireciona para step-1
