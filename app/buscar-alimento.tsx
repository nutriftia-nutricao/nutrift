import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../constants/colors";
import { Radius } from "../constants/radius";
import { Spacing } from "../constants/spacing";
import { Typography } from "../constants/typography";

interface TacoFood {
  id: string;
  name: string;
  kcal: number;
  protein_g: number;
  carbo_g: number;
  fat_g: number;
  category: string;
}

/** Dados mock de alimentos recentes (será substituído por AsyncStorage/Supabase). */
function getMockRecentFoods(): TacoFood[] {
  return [
    { id: "1", name: "Arroz Integral Cozido", kcal: 124, protein_g: 2.6, carbo_g: 25.8, fat_g: 1.0, category: "Cereais" },
    { id: "2", name: "Frango Grelhado", kcal: 165, protein_g: 31, carbo_g: 0, fat_g: 3.6, category: "Carnes" },
    { id: "3", name: "Banana Prata", kcal: 98, protein_g: 1.3, carbo_g: 26, fat_g: 0.1, category: "Frutas" },
  ];
}

/** Dados mock de alimentos favoritos (será substituído por Supabase). */
function getMockFavoriteFoods(): TacoFood[] {
  return [
    { id: "4", name: "Batata Doce Cozida", kcal: 77, protein_g: 0.6, carbo_g: 18.4, fat_g: 0.1, category: "Tubérculos" },
    { id: "5", name: "Ovo Cozido", kcal: 155, protein_g: 13, carbo_g: 1.1, fat_g: 11, category: "Ovos" },
    { id: "6", name: "Abacate", kcal: 96, protein_g: 1.2, carbo_g: 6, fat_g: 8.4, category: "Frutas" },
  ];
}

export default function BuscarAlimentoScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TacoFood[]>([]);

  const recentFoods = getMockRecentFoods();
  const favoriteFoods = getMockFavoriteFoods();

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // TODO: Buscar na base TACO via Supabase
    // Simulação de busca
    setTimeout(() => {
      const mockResults: TacoFood[] = [
        { id: "7", name: "Arroz Branco Cozido", kcal: 130, protein_g: 2.5, carbo_g: 28.1, fat_g: 0.2, category: "Cereais" },
        { id: "8", name: "Feijão Preto Cozido", kcal: 77, protein_g: 4.5, carbo_g: 14, fat_g: 0.5, category: "Leguminosas" },
        { id: "9", name: "Peito de Frango", kcal: 159, protein_g: 32, carbo_g: 0, fat_g: 3.1, category: "Carnes" },
      ];
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 500);
  };

  const handleSelectFood = (food: TacoFood) => {
    // TODO: Retornar o alimento selecionado para a tela anterior
    console.log("Alimento selecionado:", food.name);
    router.back();
  };

  const renderFoodItem = (food: TacoFood, showCategory: boolean = false) => (
    <Pressable
      key={food.id}
      style={({ pressed }) => [
        styles.foodItem,
        pressed && styles.foodItemPressed,
      ]}
      onPress={() => handleSelectFood(food)}
    >
      <View style={styles.foodIcon}>
        <Ionicons name="nutrition-outline" size={20} color={Colors.greenDark} />
      </View>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{food.name}</Text>
        {showCategory && (
          <Text style={styles.foodCategory}>{food.category}</Text>
        )}
        <View style={styles.foodMacros}>
          <Text style={styles.foodMacroText}>
            <Text style={styles.foodMacroLabel}>P: </Text>
            <Text style={styles.foodMacroProtein}>{food.protein_g}g</Text>
          </Text>
          <Text style={styles.foodMacroText}>
            <Text style={styles.foodMacroLabel}>C: </Text>
            <Text style={styles.foodMacroCarbo}>{food.carbo_g}g</Text>
          </Text>
          <Text style={styles.foodMacroText}>
            <Text style={styles.foodMacroLabel}>G: </Text>
            <Text style={styles.foodMacroFat}>{food.fat_g}g</Text>
          </Text>
        </View>
      </View>
      <Text style={styles.foodKcal}>{food.kcal} kcal</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Buscar Alimento</Text>
        <View style={styles.backButton} />
      </View>

      {/* Barra de busca */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={20}
            color={Colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar na base TACO..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => handleSearch("")}
              hitSlop={10}
            >
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Resultados da busca */}
        {searchQuery.length >= 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Resultados {isSearching && "(buscando...)"}
            </Text>
            {isSearching ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={Colors.greenDark} />
              </View>
            ) : searchResults.length > 0 ? (
              <View style={styles.foodList}>
                {searchResults.map((food) => renderFoodItem(food, true))}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                Nenhum alimento encontrado para "{searchQuery}"
              </Text>
            )}
          </View>
        )}

        {/* Recentes */}
        {searchQuery.length < 2 && recentFoods.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.sectionTitle}>Recentes</Text>
            </View>
            <View style={styles.foodList}>
              {recentFoods.map((food) => renderFoodItem(food))}
            </View>
          </View>
        )}

        {/* Favoritos */}
        {searchQuery.length < 2 && favoriteFoods.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={20} color={Colors.warning} />
              <Text style={styles.sectionTitle}>Favoritos</Text>
            </View>
            <View style={styles.foodList}>
              {favoriteFoods.map((food) => renderFoodItem(food))}
            </View>
          </View>
        )}

        {/* Estado vazio */}
        {searchQuery.length < 2 && recentFoods.length === 0 && favoriteFoods.length === 0 && (
          <View style={styles.emptyStateWrap}>
            <Ionicons name="search-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyStateTitle}>Busque um alimento</Text>
            <Text style={styles.emptyStateText}>
              Digite o nome de um alimento para buscar na base TACO
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    height: "100%",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  foodList: {
    gap: Spacing.sm,
  },
  foodItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  foodItemPressed: {
    backgroundColor: Colors.greenLight,
    borderColor: Colors.green,
  },
  foodIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  foodInfo: {
    flex: 1,
    gap: 4,
  },
  foodName: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.text,
  },
  foodCategory: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  foodMacros: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  foodMacroText: {
    ...Typography.caption,
    fontSize: 11,
  },
  foodMacroLabel: {
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  foodMacroProtein: {
    color: Colors.protein,
    fontWeight: "600",
  },
  foodMacroCarbo: {
    color: Colors.carbo,
    fontWeight: "600",
  },
  foodMacroFat: {
    color: Colors.fat,
    fontWeight: "600",
  },
  foodKcal: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  loadingWrap: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
  emptyStateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyStateTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },
});
