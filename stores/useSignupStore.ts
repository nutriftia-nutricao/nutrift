import { create } from "zustand";

interface SignupState {
  email: string;
  password: string;
  setCredentials: (email: string, password: string) => void;
  clearCredentials: () => void;
  hasCredentials: () => boolean;
}

export const useSignupStore = create<SignupState>((set, get) => ({
  email: "",
  password: "",
  setCredentials: (email, password) => set({ email: email.trim().toLowerCase(), password }),
  clearCredentials: () => set({ email: "", password: "" }),
  hasCredentials: () => {
    const { email, password } = get();
    return email.length > 0 && password.length > 0;
  },
}));
