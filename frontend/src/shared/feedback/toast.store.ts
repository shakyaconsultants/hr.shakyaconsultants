import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  durationMs: number;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));

    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }));
    }, toast.durationMs);
  },
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }));
  },
}));

export function toastSuccess(title: string, description?: string) {
  useToastStore.getState().push({ variant: 'success', title, description, durationMs: 4000 });
}

export function toastError(title: string, description?: string) {
  useToastStore.getState().push({ variant: 'error', title, description, durationMs: 7000 });
}

export function toastInfo(title: string, description?: string) {
  useToastStore.getState().push({ variant: 'info', title, description, durationMs: 5000 });
}
