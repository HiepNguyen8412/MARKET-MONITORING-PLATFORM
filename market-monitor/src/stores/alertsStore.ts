import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AlertRule } from '../types'

const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`

export type NewAlertInput = Omit<
  AlertRule,
  'id' | 'createdAt' | 'triggered' | 'notified' | 'triggeredAt'
>

interface AlertsState {
  alerts: AlertRule[]
  add: (payload: NewAlertInput) => void
  remove: (id: string) => void
  updateFromPrices: (
    getPrice: (id: string) => number | null,
  ) => { newTriggers: AlertRule[] }
  markNotified: (ids: string[]) => void
}

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set, get) => ({
      alerts: [],
      add: (payload) => {
        const a: AlertRule = {
          ...payload,
          id: genId(),
          triggered: false,
          notified: false,
          createdAt: Date.now(),
          triggeredAt: undefined,
        }
        set({ alerts: [a, ...get().alerts] })
      },
      remove: (id) =>
        set({ alerts: get().alerts.filter((a) => a.id !== id) }),
      updateFromPrices: (getPrice) => {
        const next: AlertRule[] = []
        const newTriggers: AlertRule[] = []
        for (const a of get().alerts) {
          let copy = { ...a }
          if (copy.triggered) {
            next.push(copy)
            continue
          }
          const price = getPrice(copy.coinId)
          if (price === null) {
            next.push(copy)
            continue
          }

          if (copy.condition === 'above' && price >= copy.target) {
            copy = {
              ...copy,
              triggered: true,
              triggeredAt: Date.now(),
            }
            newTriggers.push(copy)
          } else if (copy.condition === 'below' && price <= copy.target) {
            copy = {
              ...copy,
              triggered: true,
              triggeredAt: Date.now(),
            }
            newTriggers.push(copy)
          } else if (copy.condition === 'pct') {
            const move =
              copy.baselinePrice !== 0
                ? ((price - copy.baselinePrice) /
                    Math.abs(copy.baselinePrice)) *
                  100
                : 0
            if (Math.abs(move) >= copy.target) {
              copy = {
                ...copy,
                triggered: true,
                triggeredAt: Date.now(),
              }
              newTriggers.push(copy)
            }
          }

          next.push(copy)
        }
        set({ alerts: next })
        return { newTriggers }
      },
      markNotified: (ids) =>
        set({
          alerts: get().alerts.map((a) =>
            ids.includes(a.id) ? { ...a, notified: true } : a,
          ),
        }),
    }),
    {
      name: 'mm-alerts',
      version: 1,
    },
  ),
)
