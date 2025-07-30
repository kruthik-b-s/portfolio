import { supabase } from "./supabase"

export class DatabaseService {
  static async getTableData(tableName: string): Promise<any[]> {
    const { data, error } = await supabase.from(tableName).select("*")

    if (error) {
      throw new Error(`Failed to fetch ${tableName}: ${error.message}`)
    }

    return data || []
  }

  static async executeQuery(query: string): Promise<{ data: any[]; tableName: string }> {
    this.validateReadOnlyQuery(query)
    
    const parsedQuery = this.parseQuery(query)
    let data: any[] = []

    // Get base data
    data = await this.getTableData(parsedQuery.tableName)

    // Apply WHERE conditions
    if (parsedQuery.whereConditions.length > 0) {
      data = this.applyWhereConditions(data, parsedQuery.whereConditions)
    }

    // Apply ORDER BY
    if (parsedQuery.orderBy) {
      data = this.applySorting(data, parsedQuery.orderBy)
    }

    // Apply LIMIT
    if (parsedQuery.limit) {
      data = data.slice(0, parsedQuery.limit)
    }

    // Apply column selection
    if (parsedQuery.columns.length > 0 && !parsedQuery.columns.includes("*")) {
      data = data.map((row) => {
        const filteredRow: any = {}
        parsedQuery.columns.forEach((col) => {
          if (row.hasOwnProperty(col)) {
            filteredRow[col] = row[col]
          }
        })
        return filteredRow
      })
    }

    return { data, tableName: parsedQuery.tableName }
  }

  private static validateReadOnlyQuery(queryString: string): void {
    const trimmedQuery = queryString.trim().toLowerCase()
    
    // List of forbidden mutation keywords
    const mutationKeywords = [
      'insert', 'update', 'delete', 'drop', 'create', 'alter', 
      'truncate', 'replace', 'merge', 'upsert', 'grant', 'revoke',
      'commit', 'rollback', 'savepoint', 'set', 'declare', 'exec',
      'execute', 'call', 'pragma', 'begin', 'transaction'
    ]

    // Sarcastic error messages for mutation attempts
    const mutationErrors = [
      "Whoa there, cowboy! This is a READ-ONLY zone. Your destructive tendencies are not welcome here.",
      "Nice try, data destroyer! This isn't a playground where you can break things. SELECT only, please.",
      "ERROR: Mutation detected! I'm not your personal database demolition crew.",
      "Access Denied: You're about as welcome as a bull in a china shop. Stick to SELECT statements.",
      "Hold up! This isn't 'Destroy the Database 101'. Keep your grubby mutations to yourself.",
      "Mutation Alert! 🚨 I don't do destruction, only construction... of result sets.",
      "Nope! Your query has more red flags than a communist parade. READ-ONLY means READ-ONLY!",
      "Error 403: Forbidden. I'm a data reader, not a data wrecker. Try a SELECT statement instead.",
      "Mutation rejected! I have commitment issues with permanent changes.",
      "Access Violation: Your query is trying to be too handsy with my data. Keep it platonic with SELECT!",
    ]

    // Check for mutation keywords
    for (const keyword of mutationKeywords) {
      // Use word boundaries to avoid false positives (e.g., 'insert' in 'insertion_date')
      const regex = new RegExp(`\\b${keyword}\\b`, 'i')
      if (regex.test(trimmedQuery)) {
        throw new Error(mutationErrors[Math.floor(Math.random() * mutationErrors.length)])
      }
    }

    // Additional checks for sneaky attempts
    if (trimmedQuery.includes(';') && trimmedQuery.split(';').length > 2) {
      throw new Error("Multiple statements detected! What are you trying to pull here? One SELECT at a time, buddy.")
    }

    // Check for comment-based injection attempts
    if (trimmedQuery.includes('--') || trimmedQuery.includes('/*') || trimmedQuery.includes('*/')) {
      throw new Error("Comments in queries? How suspicious! I don't trust you anymore. Clean SELECT only.")
    }

    // Check for union-based attempts to bypass restrictions
    if (trimmedQuery.includes('union') && !trimmedQuery.match(/^select.*union.*select/)) {
      throw new Error("UNION detected! Are you trying to be clever? This isn't SQL injection 101, amateur.")
    }
  }

  private static parseQuery(queryString: string) {
    const trimmedQuery = queryString.trim().toLowerCase()
    const sarcasticErrors = [
      "Nice try, but that's not how SQL works. Maybe try a SELECT statement?",
      "ERROR: Your query is as broken as my faith in humanity. Try again.",
      "Syntax Error: Even my grandmother writes better SQL than that.",
      "Invalid Query: I've seen better attempts from a rubber duck.",
      "Query Failed: That's not SQL, that's just wishful thinking.",
      "Error 404: Valid SQL syntax not found in your query.",
      "Nice query! Said no database ever. Try SELECT * FROM reality;",
      "Your SQL skills need more work than a fixer-upper house.",
    ]

    // Basic SQL query validation
    if (!trimmedQuery.startsWith("select")) {
      throw new Error(sarcasticErrors[Math.floor(Math.random() * sarcasticErrors.length)])
    }

    // Extract columns
    const selectMatch = trimmedQuery.match(/select\s+(.*?)\s+from/)
    const columns = selectMatch ? selectMatch[1].split(",").map((col) => col.trim()) : ["*"]

    // Extract table name
    const fromMatch = trimmedQuery.match(/from\s+(\w+)/)
    if (!fromMatch) {
      throw new Error("FROM clause missing. Where exactly do you want me to get this data from, thin air?")
    }

    const tableName = fromMatch[1]
    const validTables = ["personal_info", "skills", "blogs", "experience"]

    if (!validTables.includes(tableName)) {
      throw new Error(`Table '${tableName}' doesn't exist. Try one of: ${validTables.join(", ")}`)
    }

    // Parse WHERE conditions
    const whereConditions: Array<{ field: string; operator: string; value: string }> = []
    const whereMatch = trimmedQuery.match(/where\s+(.+?)(?:\s+order\s+by|\s+limit|$)/)
    if (whereMatch) {
      const whereClause = whereMatch[1]
      // Simple parsing for basic conditions
      const conditionRegex = /(\w+)\s*(=|!=|>|<|>=|<=)\s*['"](.*?)['"]|(\w+)\s*(=|!=|>|<|>=|<=)\s*(\d+)/g
      let match
      while ((match = conditionRegex.exec(whereClause)) !== null) {
        if (match[1]) {
          whereConditions.push({
            field: match[1],
            operator: match[2],
            value: match[3],
          })
        } else if (match[4]) {
          whereConditions.push({
            field: match[4],
            operator: match[5],
            value: match[6],
          })
        }
      }
    }

    // Parse ORDER BY
    let orderBy: { field: string; direction: "asc" | "desc" } | null = null
    const orderMatch = trimmedQuery.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/)
    if (orderMatch) {
      orderBy = {
        field: orderMatch[1],
        direction: (orderMatch[2] as "asc" | "desc") || "asc",
      }
    }

    // Parse LIMIT
    let limit: number | null = null
    const limitMatch = trimmedQuery.match(/limit\s+(\d+)/)
    if (limitMatch) {
      limit = Number.parseInt(limitMatch[1])
    }

    return {
      columns,
      tableName,
      whereConditions,
      orderBy,
      limit,
    }
  }

  private static applyWhereConditions(
    data: any[],
    conditions: Array<{ field: string; operator: string; value: string }>,
  ) {
    return data.filter((row) => {
      return conditions.every((condition) => {
        const fieldValue = row[condition.field]
        const conditionValue = condition.value

        switch (condition.operator) {
          case "=":
            return String(fieldValue).toLowerCase() === conditionValue.toLowerCase()
          case "!=":
            return String(fieldValue).toLowerCase() !== conditionValue.toLowerCase()
          case ">":
            return Number(fieldValue) > Number(conditionValue)
          case "<":
            return Number(fieldValue) < Number(conditionValue)
          case ">=":
            return Number(fieldValue) >= Number(conditionValue)
          case "<=":
            return Number(fieldValue) <= Number(conditionValue)
          default:
            return true
        }
      })
    })
  }

  private static applySorting(data: any[], orderBy: { field: string; direction: "asc" | "desc" }) {
    return [...data].sort((a, b) => {
      let aVal = a[orderBy.field]
      let bVal = b[orderBy.field]

      // Handle dates
      if (orderBy.field.includes("date")) {
        aVal = new Date(aVal || "1900-01-01").getTime()
        bVal = new Date(bVal || "1900-01-01").getTime()
      }

      // Handle numbers
      if (typeof aVal === "number" && typeof bVal === "number") {
        return orderBy.direction === "desc" ? bVal - aVal : aVal - bVal
      }

      // Handle strings
      const comparison = String(aVal).localeCompare(String(bVal))
      return orderBy.direction === "desc" ? -comparison : comparison
    })
  }

  static async getTableCounts() {
    const tables = ["personal_info", "skills", "blogs", "experience"]
    const counts: Record<string, number> = {}

    for (const table of tables) {
      try {
        const { count } = await supabase.from(table).select("*", { count: "exact", head: true })
        counts[table] = count || 0
      } catch (error) {
        counts[table] = 0
      }
    }

    return counts
  }
}
