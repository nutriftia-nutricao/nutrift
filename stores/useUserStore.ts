import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "../types/user";

interface UserState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User) => void;
  updateUser: (partial: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

const storage = createJSONStorage(() => ({
  getItem: async (key: string) => {
    const isSecureStoreAvailable = await SecureStore.isAvailableAsync();
    if (!isSecureStoreAvailable) {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    const isSecureStoreAvailable = await SecureStore.isAvailableAsync();
    if (!isSecureStoreAvailable) {
      await AsyncStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    const isSecureStoreAvailable = await SecureStore.isAvailableAsync();
    if (!isSecureStoreAvailable) {
      await AsyncStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
}));

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : state.user,
        })),
      setLoading: (isLoading) => set({ isLoading }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: "nutrift-user",
      storage,
    }
  )
);
