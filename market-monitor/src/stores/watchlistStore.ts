import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WatchlistState {
  idsList: string[]
  toggle: (id: string) => void
  has: (id: string) => boolean
  add: (id: string) => void
  remove: (id: string) => void
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      idsList: [],
      toggle: (id) => {
        const list = get().idsList
        const next = list.includes(id)
          ? list.filter((x) => x !== id)
          : [...list, id]
        set({ idsList: next })
      },
      has: (id) => get().idsList.includes(id),
      add: (id) => {
        const list = get().idsList
        if (list.includes(id)) return
        set({ idsList: [...list, id] })
      },
      remove: (id) =>
        set({ idsList: get().idsList.filter((x) => x !== id) }),
    }),
    {
      name: 'mm-watchlist',
      version: 1,
    },
  ),
)
