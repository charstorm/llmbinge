import { create } from "zustand";
import { generateId } from "@/lib/id";

export interface ToastItem {
  id: string;
  message: string;
  type: "info" | "error" | "success";
}

interface ConfirmDialog {
  message: string;
  onConfirm: () => void;
}

interface UIState {
  toasts: ToastItem[];
  confirmDialog: ConfirmDialog | null;
  selectedText: string | null;

  addToast: (message: string, type?: ToastItem["type"]) => void;
  dismissToast: (id: string) => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
  dismissConfirm: () => void;
  setSelectedText: (text: string | null) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  toasts: [],
  confirmDialog: null,
  selectedText: null,

  addToast: (message, type = "info") => {
    const id = generateId();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  showConfirm: (message, onConfirm) => {
    set({ confirmDialog: { message, onConfirm } });
  },

  dismissConfirm: () => {
    set({ confirmDialog: null });
  },

  setSelectedText: (text) => {
    set({ selectedText: text });
  },
}));
