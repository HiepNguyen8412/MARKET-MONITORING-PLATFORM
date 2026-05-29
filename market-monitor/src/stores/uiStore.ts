import { create } from 'zustand'

interface UiState {
  toastMessage: string | null
  showToast: (msg: string, ms?: number) => void
  clearToast: () => void
}

export const useUiStore = create<UiState>((set) => ({
  toastMessage: null,
  showToast: (msg, ms = 4500) => {
    set({ toastMessage: msg })
    window.setTimeout(() => set({ toastMessage: null }), ms)
  },
  clearToast: () => set({ toastMessage: null }),
}))
