"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface QueryResult {
  data: any[]
  tableName: string
}

interface PortfolioState {
  queryResults: Record<string, QueryResult | null>
  queryHistory: string[]
  currentQuery: string
  showResults: Record<string, boolean>
  error: Record<string, string>
}

interface PortfolioContextType {
  state: PortfolioState
  setQueryResult: (tableName: string, result: QueryResult | null) => void
  setShowResults: (tableName: string, show: boolean) => void
  setError: (tableName: string, error: string) => void
  addToHistory: (query: string) => void
  setCurrentQuery: (query: string) => void
  clearState: (tableName: string) => void
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined)

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortfolioState>({
    queryResults: {},
    queryHistory: [],
    currentQuery: "SELECT * FROM personal_info;",
    showResults: {},
    error: {},
  })

  const setQueryResult = (tableName: string, result: QueryResult | null) => {
    setState((prev) => ({
      ...prev,
      queryResults: { ...prev.queryResults, [tableName]: result },
    }))
  }

  const setShowResults = (tableName: string, show: boolean) => {
    setState((prev) => ({
      ...prev,
      showResults: { ...prev.showResults, [tableName]: show },
    }))
  }

  const setError = (tableName: string, error: string) => {
    setState((prev) => ({
      ...prev,
      error: { ...prev.error, [tableName]: error },
    }))
  }

  const addToHistory = (query: string) => {
    setState((prev) => ({
      ...prev,
      queryHistory: [query, ...prev.queryHistory.filter((q) => q !== query)].slice(0, 10),
    }))
  }

  const setCurrentQuery = (query: string) => {
    setState((prev) => ({ ...prev, currentQuery: query }))
  }

  const clearState = (tableName: string) => {
    setState((prev) => ({
      ...prev,
      queryResults: { ...prev.queryResults, [tableName]: null },
      showResults: { ...prev.showResults, [tableName]: false },
      error: { ...prev.error, [tableName]: "" },
    }))
  }

  return (
    <PortfolioContext.Provider
      value={{
        state,
        setQueryResult,
        setShowResults,
        setError,
        addToHistory,
        setCurrentQuery,
        clearState,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  )
}

export function usePortfolio() {
  const context = useContext(PortfolioContext)
  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider")
  }
  return context
}
