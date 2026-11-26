
'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export interface WatchlistItem {
  id: string
  symbol: string
  optionType: string
  strike: number
  expiration: string
  premium: number
  score?: number | null
  riskLevel?: string | null
  daysToExpiration?: number | null
  tradeSummary?: string | null
  addedAt: string
}

interface WatchlistItemInput {
  id: string
  symbol: string
  optionType: string
  strike: number
  expiration: string
  premium: number
  score?: number | null
  riskLevel?: string | null
  daysToExpiration?: number | null
  tradeSummary?: string | null
}

interface WatchlistContextValue {
  items: WatchlistItem[]
  isReady: boolean
  addItem: (item: WatchlistItemInput) => void
  removeItem: (id: string) => void
  isOnWatchlist: (id: string) => boolean
}

const STORAGE_KEY = 'options-trader:watchlist'
const WatchlistContext = createContext<WatchlistContextValue | undefined>(undefined)

const parseStoredItems = (rawValue: string | null): WatchlistItem[] => {
  if (!rawValue) return []

  try {
    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is WatchlistItem =>
      Boolean(item && typeof item === 'object' && item.id && item.symbol && item.expiration && item.optionType)
    )
  } catch (error) {
    console.warn('Failed to parse watchlist from storage', error)
    return []
  }
}

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    try {
      setItems(parseStoredItems(window.localStorage.getItem(STORAGE_KEY)))
    } catch (error) {
      console.warn('Unable to load watchlist from local storage', error)
    } finally {
      setIsReady(true)
    }
  }, [])

  useEffect(() => {
    if (!isReady) return

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.warn('Unable to save watchlist to local storage', error)
    }
  }, [items, isReady])

  const addItem = useCallback((item: WatchlistItemInput) => {
    setItems((previous) => {
      const existing = previous.find((entry) => entry.id === item.id)

      if (existing) {
        return previous.map((entry) =>
          entry.id === item.id
            ? { ...existing, ...item, addedAt: existing.addedAt }
            : entry
        )
      }

      return [...previous, { ...item, addedAt: new Date().toISOString() }]
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((previous) => previous.filter((item) => item.id !== id))
  }, [])

  const idSet = useMemo(() => new Set(items.map((item) => item.id)), [items])
  const isOnWatchlist = useCallback((id: string) => idSet.has(id), [idSet])

  const value = useMemo<WatchlistContextValue>(() => ({
    items,
    isReady,
    addItem,
    removeItem,
    isOnWatchlist,
  }), [items, isReady, addItem, removeItem, isOnWatchlist])

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  )
}

export function useWatchlist() {
  const context = useContext(WatchlistContext)

  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider')
  }

  return context
}
