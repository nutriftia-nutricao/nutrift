import { create } from "zustand";

export interface AgenteMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface AgenteState {
  messages: AgenteMessage[];
  isTyping: boolean;
  addMessage: (msg: Omit<AgenteMessage, "id" | "createdAt">) => void;
  setTyping: (v: boolean) => void;
  clearMessages: () => void;
}

export const useAgenteStore = create<AgenteState>((set) => ({
  messages: [],
  isTyping: false,
  addMessage: (msg) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          ...msg,
          id: Math.random().toString(36).slice(2),
          createdAt: new Date(),
        },
      ],
    })),
  setTyping: (isTyping) => set({ isTyping }),
  clearMessages: () => set({ messages: [] }),
}));
