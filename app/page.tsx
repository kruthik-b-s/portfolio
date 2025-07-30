"use client"

import { useState, useEffect } from "react"
import {
  Play,
  Terminal,
  User,
  Code,
  BookOpen,
  Loader2,
  RefreshCw,
  Download,
  History,
  Menu,
  Database,
  PanelRightOpen,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AlertDescription } from "@/components/ui/alert"
import { DatabaseService } from "@/lib/database"
import { PortfolioProvider, usePortfolio } from "@/lib/portfolio-context"
import { Avatar } from "@/components/ui/avatar"

interface TableInfo {
  name: string
  icon: any
  records: number
}

const defaultTables = [
  { name: "personal_info", icon: User, records: 0 },
  { name: "skills", icon: Code, records: 0 },
  { name: "blogs", icon: BookOpen, records: 0 },
  { name: "experience", icon: Terminal, records: 0 },
]

function SQLPortfolioContent() {
  const { state, setQueryResult, setShowResults, setError, addToHistory, setCurrentQuery, clearState } = usePortfolio()
  const [tables, setTables] = useState<TableInfo[]>(defaultTables)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isLoadingCounts, setIsLoadingCounts] = useState(true)
  const [activeTab, setActiveTab] = useState("personal_info")
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(true);

  // Load table counts on component mount
  useEffect(() => {
    loadTableCounts()
  }, [])

  const loadTableCounts = async () => {
    setIsLoadingCounts(true)
    try {
      const counts = await DatabaseService.getTableCounts()
      setTables(
        defaultTables.map((table) => ({
          ...table,
          records: counts[table.name] || 0,
        })),
      )
    } catch (error) {
      console.error("Failed to load table counts:", error)
    } finally {
      setIsLoadingCounts(false)
    }
  }

  const executeQuery = async (queryToExecute?: string, targetTab?: string) => {
    const queryText = queryToExecute || state.currentQuery
    const tabToUpdate = targetTab || activeTab

    if (!queryText.trim()) return

    setIsExecuting(true)
    setError(tabToUpdate, "")
    setShowResults(tabToUpdate, false)

    try {
      const result = await DatabaseService.executeQuery(queryText)
      setQueryResult(tabToUpdate, result)
      setShowResults(tabToUpdate, true)
      addToHistory(queryText)
    } catch (err: any) {
      setError(tabToUpdate, err.message)
      setQueryResult(tabToUpdate, null)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleTableClick = (tableName: string) => {
    // Clear previous results for this tab
    clearState(tableName)
    setActiveTab(tableName)

    let defaultQuery = ""
    switch (tableName) {
      case "personal_info":
        defaultQuery = "SELECT * FROM personal_info;"
        break
      case "skills":
        defaultQuery = "SELECT * FROM skills ORDER BY proficiency DESC;"
        break
      case "blogs":
        defaultQuery = "SELECT * FROM blogs ORDER BY published_date DESC;"
        break
      case "experience":
        defaultQuery = "SELECT * FROM experience ORDER BY start_date DESC;"
        break
    }
    setCurrentQuery(defaultQuery)
    setIsMobileSidebarOpen(false)
  }

  const handleQuickQuery = (query: string, targetTable: string) => {
    // Clear previous results for target tab
    clearState(targetTable)
    // Set the active tab to match the query's target table
    setActiveTab(targetTable)
    setCurrentQuery(query)
    // Execute immediately with the target tab
    executeQuery(query, targetTable)
  }

  const handleHistoryQuery = (query: string) => {
    setCurrentQuery(query)
    executeQuery(query)
  }

  const exportResults = () => {
    const result = state.queryResults[activeTab]
    if (!result?.data) return

    const csvContent = [
      Object.keys(result.data[0]).join(","),
      ...result.data.map((row: any) =>
        Object.values(row)
          .map((val) => `"${val}"`)
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${result.tableName}_results.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderTableResults = () => {
    const result = state.queryResults[activeTab]
    if (!result || !result.data.length) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-400 font-mono">No results found</div>
        </div>
      )
    }

    const data = result.data
    const columns = Object.keys(data[0])

    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-400 font-mono">
            ({data.length} row{data.length !== 1 ? "s" : ""} returned)
          </div>
          <Button
            onClick={exportResults}
            size="sm"
            variant="outline"
            className="bg-gray-800 border-gray-600 hover:bg-gray-700 hover:text-gray-100"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="overflow-x-auto max-w-full">
          <div className="min-w-full inline-block align-middle">
            <table className="w-full text-sm font-mono border-collapse">
              <thead>
                <tr className="border-b-2 border-green-400">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="text-left p-2 sm:p-3 text-green-400 font-bold uppercase tracking-wider whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row: any, index: number) => (
                  <tr key={index} className="border-b border-gray-700 hover:bg-gray-800/30">
                    {columns.map((col) => (
                      <td key={col} className="p-2 sm:p-3 text-gray-300 max-w-xs">
                        {col === "url" && row[col] ? (
                          <a
                            href={row[col]}
                            className="text-blue-400 hover:underline break-all"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {row[col]}
                          </a>
                        ) : col === "proficiency" && typeof row[col] === "number" ? (
                          `${row[col]}%`
                        ) : col === "description" || col === "bio" ? (
                          <div className="max-w-xs truncate" title={String(row[col] || "NULL")}>
                            {String(row[col] || "NULL")}
                          </div>
                        ) : (
                          <div className="break-words">{String(row[col] || "NULL")}</div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const currentResult = state.queryResults[activeTab]
  const currentError = state.error[activeTab]
  const showCurrentResults = state.showResults[activeTab]

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      <div className="flex h-screen">
        {/* Sidebar */}
        <aside
          className={`w-64 bg-gray-900 border-r border-gray-700 h-full p-4 fixed left-0 top-0 z-50 transform transition-transform duration-300 ease-in-out ${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 lg:static lg:z-10 flex flex-col`}
        >
          {/* Close button for mobile */}
          <Button
            onClick={() => setIsMobileSidebarOpen(false)}
            size="sm"
            variant="ghost"
            className="lg:hidden absolute bottom-4 right-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800"
          >
            <PanelRightOpen className="w-4 h-4" />
          </Button>

          {/* Header in sidebar */}
          <div className="mb-4 pb-4 border-b border-gray-700 flex-shrink-0">

            <div className="lg:flex items-center gap-3 mb-3 hidden">
              <Avatar size="md" />
              <div className="flex-1">
                <div className="flex items-center">
                  <h1 className="text-lg font-bold text-green-400 font-mono">Kruthik BS</h1>
                </div>
                <p className="text-xs text-gray-400">Full Stack Developer</p>
              </div>
            </div>
            {/* Connection Status */}
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-800 p-2 rounded">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Connected via Supabase</span>
            </div>
          </div>

          {/* Tables section */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Tables</h3>
              <Button
                onClick={loadTableCounts}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-gray-800"
                disabled={isLoadingCounts}
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingCounts ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <div className="space-y-2">
              {tables.map((table) => (
                <button
                  key={table.name}
                  onClick={() => handleTableClick(table.name)}
                  className={`w-full flex items-center gap-3 p-1 rounded-lg text-left transition-colors hover:bg-gray-800 hover:text-gray-100 ${
                    activeTab === table.name
                      ? "bg-green-900/30 text-green-400 border border-green-700"
                      : "text-gray-300"
                  }`}
                >
                  <table.icon className="w-4 h-4" />
                  <div className="flex-1">
                    <p className="font-mono text-sm">{table.name}</p>
                    <p className="text-xs text-gray-500">{isLoadingCounts ? "..." : `${table.records} records`}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick queries */}
          <div className="mt-4 pt-4 border-t border-gray-700 flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Queries</h3>
            <div className="space-y-2 text-xs">
              <button
                onClick={() =>
                  handleQuickQuery(
                    "SELECT skill FROM skills WHERE category = 'Backend';",
                    "skills",
                  )
                }
                className="block w-full text-left p-2 rounded bg-gray-800 hover:bg-gray-700 hover:text-gray-100 text-gray-300 font-mono"
              >
                Backend Skills
              </button>
              <button
                onClick={() => handleQuickQuery("SELECT title, views FROM blogs ORDER BY views DESC LIMIT 5;", "blogs")}
                className="block w-full text-left p-2 rounded bg-gray-800 hover:bg-gray-700 hover:text-gray-100 text-gray-300 font-mono"
              >
                Top Blogs
              </button>
              <button
                onClick={() =>
                  handleQuickQuery("SELECT company, position, start_date, end_date FROM experience ORDER BY start_date DESC;", "experience")
                }
                className="block w-full text-left p-2 rounded bg-gray-800 hover:bg-gray-700 hover:text-gray-100 text-gray-300 font-mono"
              >
                Career Path
              </button>
            </div>
          </div>

          {/* Query History - Always expanded with constrained height */}
          <div className="mt-4 pt-4 border-t border-gray-700 flex-1 min-h-0">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex-shrink-0">
              <History className="w-3 h-3 inline mr-1" />
              History ({state.queryHistory.length})
            </h3>
            <div className="space-y-1 text-xs overflow-y-scroll h-80">
              {state.queryHistory.length > 0 ? (
                state.queryHistory.map((historyQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryQuery(historyQuery)}
                    className="block w-full text-left p-2 rounded bg-gray-800 hover:bg-gray-700 hover:text-gray-100 text-gray-300 font-mono truncate"
                    title={historyQuery}
                  >
                    {historyQuery}
                  </button>
                ))
              ) : (
                <p className="text-gray-500 p-2">No queries executed yet</p>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 p-3 sm:p-6 overflow-y-auto h-full">
          {/* Mobile Header */}
          <div className="lg:hidden mb-4 flex items-center justify-between bg-gray-900 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3">
              <Avatar size="sm" />
              <div>
                <div className="flex items-center">
                  <h1 className="text-sm font-bold text-green-400">Kruthik BS</h1>
                </div>
                <p className="text-xs text-gray-400">Full Stack Developer</p>
              </div>
            </div>
            <Button
              onClick={() => setIsMobileSidebarOpen(true)}
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-600 hover:bg-gray-700 hover:text-gray-100"
            >
              <Menu className="w-4 h-4 mr-2" />
              Tables
            </Button>
          </div>

          {isWelcomeVisible && (
            <div className="inline-flex justify-between w-full p-4 mb-6 bg-green-900/30 text-green-400 border border-green-700 rounded-lg shadow-xl">
              <div>
                <div className="text-sm font-mono text-gray-300 leading-relaxed">
                  <p className="text-green-400">Welcome to my portfolio database!</p>
                  <br />
                  This idea is something that crossed my mind when i was finding a theme for my portfolio. 
                  <br /> Go ahead and give it a try!!!
                </div>
                <div className="inline-flex">
                  <AlertDescription className="mt-1">
                    <strong>Heads up!</strong> The error messages are intentionally sarcastic and humorous.
                    Don't take them personally - it's all in good fun! 😄
                  </AlertDescription>
                </div>
              </div>
              <Button
                onClick={() => setIsWelcomeVisible(false)}
                size="sm"
                variant="ghost"
                className="top-4 right-4 text-gray-400 hover:text-gray-100 hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Query Input */}
          <div className="mb-6">
            <div className="bg-gray-900 border border-gray-700 rounded-lg">
              <div className="flex items-center justify-between p-3 border-b border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400">Query Editor</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setCurrentQuery("")
                      clearState(activeTab)
                    }}
                    size="sm"
                    variant="outline"
                    className="bg-gray-800 border-gray-600 hover:bg-gray-700 hover:text-gray-100"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={() => executeQuery()}
                    disabled={isExecuting || !state.currentQuery.trim()}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isExecuting ? "Executing..." : "Execute"}
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <textarea
                  value={state.currentQuery}
                  onChange={(e) => setCurrentQuery(e.target.value)}
                  className="w-full bg-transparent text-green-400 font-mono text-sm resize-none focus:outline-none min-h-[80px]"
                  placeholder="Enter your SQL query here..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      executeQuery()
                    }
                  }}
                />
                <div className="text-xs text-gray-500 mt-2">
                  Press Ctrl+Enter to execute • Supports SELECT, WHERE, ORDER BY, LIMIT
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-gray-400">Query Results</h3>
              {showCurrentResults && currentResult && (
                <div className="text-xs text-gray-500">Table: {currentResult.tableName}</div>
              )}
            </div>
            <div className="p-6">
              {isExecuting ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-green-400 animate-spin mr-3" />
                  <span className="text-gray-400 font-mono">Executing query...</span>
                </div>
              ) : currentError ? (
                <div className="text-center py-8">
                  <div className="text-red-400 font-mono text-lg mb-2">Query Error</div>
                  <div className="text-red-300 font-mono bg-red-900/20 p-4 rounded border border-red-700">
                    {currentError}
                  </div>
                </div>
              ) : showCurrentResults ? (
                renderTableResults()
              ) : (
                <div className="text-center py-8">
                  <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">Welcome to My Portfolio Database</h3>
                  <p className="text-gray-500 mb-4">
                    Execute a query to explore my professional data. Try clicking on a table or use the quick queries.
                  </p>
                  <div className="text-sm text-gray-600 font-mono">
                    <p>Available tables: personal_info, skills, blogs, experience</p>
                    <p>Supported: SELECT, WHERE, ORDER BY, LIMIT</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function SQLPortfolio() {
  return (
    <PortfolioProvider>
      <SQLPortfolioContent />
    </PortfolioProvider>
  )
}
