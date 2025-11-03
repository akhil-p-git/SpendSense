/**
 * UI Store
 * Manages active tab, loading states, modals
 */

import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface Modal {
  id: string;
  component: React.ReactNode;
  onClose?: () => void;
}

interface UIState {
  activeTab: string;
  loading: boolean;
  loadingMessage: string | null;
  toasts: Toast[];
  modals: Modal[];
  setActiveTab: (tab: string) => void;
  setLoading: (loading: boolean, message?: string) => void;
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  hideToast: (id: string) => void;
  showModal: (component: React.ReactNode, id?: string, onClose?: () => void) => void;
  hideModal: (id: string) => void;
  hideAllModals: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'recommendations',
  loading: false,
  loadingMessage: null,
  toasts: [],
  modals: [],
  setActiveTab: (tab) => set({ activeTab: tab }),
  setLoading: (loading, message) => set({ loading, loadingMessage: message || null }),
  showToast: (message, type = 'info', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type, duration }] }));
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
    return id;
  },
  hideToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  showModal: (component, id, onClose) => {
    const modalId = id || `modal-${Date.now()}`;
    set((state) => ({
      modals: [...state.modals, { id: modalId, component, onClose }],
    }));
    return modalId;
  },
  hideModal: (id) => {
    set((state) => {
      const modal = state.modals.find((m) => m.id === id);
      if (modal?.onClose) {
        modal.onClose();
      }
      return { modals: state.modals.filter((m) => m.id !== id) };
    });
  },
  hideAllModals: () => set({ modals: [] }),
}));

