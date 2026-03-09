import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const SIGNUP_STORAGE_KEY = "nutrift_signup_credentials";

/** Só persiste no browser (sessionStorage), para não perder e-mail/senha ao recarregar durante o onboarding. */
function getSignupStorage(): ReturnType<typeof createJSONStorage<Pick<SignupState, "email" | "password">>> {
  const isWebWithStorage =
    typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
  if (!isWebWithStorage) {
    return createJSONStorage(() => ({
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }));
  }
  return createJSONStorage(() => ({
    getItem: (name) => {
      try {
        const raw = window.sessionStorage.getItem(SIGNUP_STORAGE_KEY);
        return raw;
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        window.sessionStorage.setItem(SIGNUP_STORAGE_KEY, value);
      } catch {
        // quota ou privado
      }
    },
    removeItem: (name) => {
      try {
        window.sessionStorage.removeItem(SIGNUP_STORAGE_KEY);
      } catch {}
    },
  }));
}

interface SignupState {
  email: string;
  password: string;
  setCredentials: (email: string, password: string) => void;
  clearCredentials: () => void;
  hasCredentials: () => boolean;
}

export const useSignupStore = create<SignupState>()(
  persist(
    (set, get) => ({
      email: "",
      password: "",
      setCredentials: (email, password) =>
        set({ email: email.trim().toLowerCase(), password }),
      clearCredentials: () => set({ email: "", password: "" }),
      hasCredentials: () => {
        const { email, password } = get();
        return email.length > 0 && password.length > 0;
      },
    }),
    {
      name: SIGNUP_STORAGE_KEY,
      storage: getSignupStorage(),
      partialize: (state) => ({ email: state.email, password: state.password }),
    }
  )
);
