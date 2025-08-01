import { supabase } from "./supabase"
import { Parser } from 'node-sql-parser'

const parser = new Parser();

const MUTATION_ERROR_MSGS = [
  "Whoa there, cowboy! This is a READ-ONLY zone. Your destructive tendencies are not welcome here.",
  "Nice try, data destroyer! This isn't a playground where you can break things. SELECT only, please.",
  "Mutation detected! I'm not your personal database demolition crew.",
  "You're about as welcome as a bull in a china shop. Stick to SELECT statements.",
  "Hold up! This isn't 'Destroy the Database 101'. Keep your grubby mutations to yourself.",
  "Nope! Your query has more red flags than a communist parade. READ-ONLY means READ-ONLY!",
  "Mutation rejected! I have commitment issues with permanent changes.",
  "Your query is trying to be too handsy with my data. Keep it platonic with SELECT!",
]

const SYNTAX_ERROR_MSGS = [
  "Nice try, but that's not how SQL works. Maybe try with something else?",
  "Your query is as broken as my faith in humanity. Try again.",
  "Even my grandmother writes better SQL than that.",
  "I've seen better attempts from a rubber duck.",
  "That's not SQL, that's just wishful thinking.",
  "Nice query! Said no database ever. Try SELECT * FROM reality;",
  "Your SQL skills need more work than a fixer-upper house.",
]

const SCHEMA: Record<string, string[]> = {
  personal_info: ['id','name','designation','location','experience_years','email','github','linkedin','bio','created_at','updated_at'],
  skills: ['id','category','skill','created_at','updated_at'],
  blogs: ['id','title','published_date','category','read_time','views','url','status','created_at','updated_at'],
  experience: ['id','company','position','start_date','end_date','description','created_at','updated_at'],
};

interface TableSource { 
  table: string; 
  alias: string; 
}

interface ColumnRef {
  table?: string;
  column: string;
}

export class DatabaseService {
  static async executeQuery(sql: string): Promise<{ data: any[]; tableName: string }> {
    try {
      let ast: any;
      try { 
        // Parse the incoming SQL query into as AST (tree obj)
        ast = parser.astify(sql); 
      } catch (error) { 
        throw new Error(random(SYNTAX_ERROR_MSGS)); 
      }

      const stmts = Array.isArray(ast) ? ast : [ast];
      if (stmts.length !== 1) {
        throw new Error("One query at a time, Sherlock.");
      }

      const stmt = stmts[0];
      if (stmt.type !== 'select') {
        throw new Error(random(MUTATION_ERROR_MSGS));
      }

      const sources: TableSource[] = [];
      if (stmt.from && stmt.from.length > 0) {
        stmt.from.forEach((fromItem: any) => {
          const tableName = fromItem.table;
          if (!SCHEMA[tableName]) {
            throw new Error(`What on earth is '${tableName}'?. Available tables: ${Object.keys(SCHEMA).join(', ')}`);
          }
          sources.push({ 
            table: tableName, 
            alias: fromItem.as || tableName 
          });
        });
      } else {
        throw new Error('Where FROM? your pocket?');
      }

      const mainTable = sources[0];

      // Handle alias to column names
      const aliasToColumns: Record<string, Set<string>> = {};
      sources.forEach(source => {
        const alias = source.alias.toLowerCase();
        aliasToColumns[alias] = new Set(SCHEMA[source.table]);
      });

      const columnRefs = this.collectColumnRefs(stmt);
      const nonStarRefs = columnRefs.filter(ref => ref.column !== '*');
      
      for (const ref of nonStarRefs) {
        const aliasToCheck = ref.table ? ref.table.toLowerCase() : mainTable.alias.toLowerCase();
        
        if (!aliasToColumns[aliasToCheck]) {
          throw new Error(`Table/alias '${aliasToCheck}' not found in query.`);
        }
        
        if (!aliasToColumns[aliasToCheck].has(ref.column)) {
          const availableCols = Array.from(aliasToColumns[aliasToCheck]).join(', ');
          throw new Error(`Column '${ref.column}' not found in table '${aliasToCheck}'. Available columns: ${availableCols}`);
        }
      }

      const tableData: Record<string, any[]> = {};
      
      for (const source of sources) {
        // Fetch all the data from the table at once
        const { data, error } = await supabase
          .from(source.table)
          .select('*');
          
        if (error) {
          throw new Error(`Failed to fetch data from ${source.table}: ${error.message}`);
        }
        
        const prefixedData = (data || []).map(row => {
          const prefixedRow: any = {};
          SCHEMA[source.table].forEach(columnName => {
            prefixedRow[`${source.alias}.${columnName}`] = (row as any)[columnName];
          });
          return prefixedRow;
        });
        
        tableData[source.alias] = prefixedData;
      }

      let resultRows = tableData[mainTable.alias] || [];
      
      // Handle join queries
      for (let i = 1; i < sources.length; i++) {
        const rightSource = sources[i];
        const joinClause = stmt.from[i];
        const rightData = tableData[rightSource.alias];
        
        const joinedRows: any[] = [];
        
        for (const leftRow of resultRows) {
          for (const rightRow of rightData) {
            const combinedRow = { ...leftRow, ...rightRow };
            
            if (joinClause.on) {
              if (this.evaluateExpression(joinClause.on, combinedRow, mainTable)) {
                joinedRows.push(combinedRow);
              }
            } else {
              joinedRows.push(combinedRow);
            }
          }
        }
        
        resultRows = joinedRows;
      }

      // Evaluate where conditions
      if (stmt.where) {
        console.log(stmt.where)
        resultRows = resultRows.filter(row => 
          this.evaluateExpression(stmt.where, row, mainTable)
        );
      }

      let processedRows = resultRows;
      
      // Handle group by clause
      if (stmt.groupby && stmt.groupby.length > 0) {
        const groupMap = new Map<string, any[]>();
        
        for (const row of resultRows) {
          const groupKey = stmt.groupby.map((col: any) => {
            const key = `${col.table || mainTable.alias}.${col.column}`;
            return row[key];
          }).join('|');
          
          if (!groupMap.has(groupKey)) {
            groupMap.set(groupKey, []);
          }
          groupMap.get(groupKey)!.push(row);
        }
        
        processedRows = [];
        for (const group of groupMap.values()) {
          const groupRow: any = {};
          
          if (stmt.columns) {
            for (const col of stmt.columns) {
              const isStarColumn = col.expr.type === 'star' || 
                                 col.expr.column === '*' || 
                                 (col.expr.type === 'column_ref' && col.expr.column === '*');
              
              if (isStarColumn) {
                SCHEMA[mainTable.table].forEach(columnName => {
                  const key = `${mainTable.alias}.${columnName}`;
                  groupRow[columnName] = group[0][key];
                });
              } else if (col.expr.type === 'aggr_func') {
                const alias = col.as || col.expr.name || 'result';
                groupRow[alias] = this.calculateAggregate(col.expr, group, mainTable);
              } else if (col.expr.type === 'column_ref') {
                const alias = col.as || col.expr.column;
                const key = `${col.expr.table || mainTable.alias}.${col.expr.column}`;
                groupRow[alias] = group[0][key];
              }
            }
          }
          
          processedRows.push(groupRow);
        }
      }

      // Handle having clause
      if (stmt.having) {
        processedRows = processedRows.filter(row => 
          this.evaluateExpression(stmt.having, row, mainTable)
        );
      }

      // Handle order by clause
      if (stmt.orderby && stmt.orderby.length > 0) {
        processedRows.sort((a, b) => {
          for (const orderCol of stmt.orderby) {
            const key = orderCol.expr.table 
              ? `${orderCol.expr.table}.${orderCol.expr.column}`
              : `${mainTable.alias}.${orderCol.expr.column}`;
            
            const aVal = a[key];
            const bVal = b[key];
            const direction = orderCol.type === 'DESC' ? -1 : 1;
            
            if (aVal < bVal) return -1 * direction;
            if (aVal > bVal) return 1 * direction;
          }
          return 0;
        });
      }

      // Handle limit
      if (stmt.limit) {
        const limitValue = typeof stmt.limit === 'object' ? stmt.limit.value[0].value : stmt.limit;
        processedRows = processedRows.slice(0, Number(limitValue));
      }

      let finalRows = processedRows;
      
      if (stmt.columns && stmt.columns.length > 0) {
        finalRows = processedRows.map(row => {
          const projectedRow: any = {};
          
          for (const col of stmt.columns) {
            const isStarColumn = col.expr.type === 'star' || 
                               col.expr.column === '*' || 
                               (col.expr.type === 'column_ref' && col.expr.column === '*');
            
            if (isStarColumn) {
              SCHEMA[mainTable.table].forEach(columnName => {
                projectedRow[columnName] = row[`${mainTable.alias}.${columnName}`];
              });
            } else if (col.expr.type === 'column_ref') {
              const alias = col.as || col.expr.column;
              const key = `${col.expr.table || mainTable.alias}.${col.expr.column}`;
              projectedRow[alias] = row[key];
            } else if (col.expr.type === 'aggr_func') {
              const alias = col.as || col.expr.name || 'result';
              projectedRow[alias] = row[alias];
            }
          }
          
          return projectedRow;
        });
      } else {
        finalRows = processedRows.map(row => {
          const projectedRow: any = {};
          SCHEMA[mainTable.table].forEach(columnName => {
            projectedRow[columnName] = row[`${mainTable.alias}.${columnName}`];
          });
          return projectedRow;
        });
      }

      if (finalRows.length === 0) {
        throw new Error("Ah! Maybe you are searching the worng thing at the right place. (Found nothing for this!");
      }

      return { 
        data: finalRows, 
        tableName: mainTable.table 
      };

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(random(SYNTAX_ERROR_MSGS));
    }
  }

  static async getTableCounts(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    
    for (const tableName of Object.keys(SCHEMA)) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
          
        counts[tableName] = error ? 0 : (count || 0);
      } catch (error) {
        counts[tableName] = 0;
      }
    }
    
    return counts;
  }

  private static collectColumnRefs(node: any): ColumnRef[] {
    const refs: ColumnRef[] = [];
    
    if (!node || typeof node !== 'object') {
      return refs;
    }
    
    if (node.type === 'column_ref') {
      refs.push({
        table: node.table,
        column: node.column
      });
    }
    
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          refs.push(...this.collectColumnRefs(item));
        }
      } else if (value && typeof value === 'object') {
        refs.push(...this.collectColumnRefs(value));
      }
    }
    
    return refs;
  }

  private static evaluateExpression(expr: any, row: Record<string, any>, mainTable: TableSource): any {
    if (!expr) return true;
    
    switch (expr.type) {
      case 'binary_expr':
        const left = this.evaluateExpression(expr.left, row, mainTable);
        const right = this.evaluateExpression(expr.right, row, mainTable);
        
        switch (expr.operator.toUpperCase()) {
          case '=': return left == right;
          case '!=':
          case '<>': return left != right;
          case '>': return left > right;
          case '<': return left < right;
          case '>=': return left >= right;
          case '<=': return left <= right;
          case 'AND': return Boolean(left) && Boolean(right);
          case 'OR': return Boolean(left) || Boolean(right);
          case 'LIKE':
            const pattern = right.toString().replace(/%/g, '.*').replace(/_/g, '.');
            return new RegExp(`^${pattern}$`, 'i').test(left.toString());
          case 'IN':
            if (Array.isArray(right)) {
              return right.some(val => val == left);
            }
            return false;
          case 'NOT IN':
            if (Array.isArray(right)) {
              return !right.some(val => val == left);
            }
            return true;
          default: return false;
        }
        
      case 'column_ref':
        const key = expr.table ? `${expr.table}.${expr.column}` : `${mainTable.alias}.${expr.column}`;
        console.log(`Column lookup: ${key}, available keys:`, Object.keys(row));
        return row[key];
        
      case 'number':
        return Number(expr.value);
        
      case 'string':
        return expr.value;
        
      case 'single_quote_string':
        return expr.value;
        
      case 'bool':
        return Boolean(expr.value);
        
      case 'expr_list':
        return expr.value.map((item: any) => this.evaluateExpression(item, row, mainTable));
        
      case 'unary_expr':
        const operand = this.evaluateExpression(expr.expr, row, mainTable);
        switch (expr.operator.toUpperCase()) {
          case 'NOT': return !Boolean(operand);
          case '-': return -Number(operand);
          case '+': return +Number(operand);
          default: return operand;
        }
        
      default:
        return null;
    }
  }

  private static calculateAggregate(aggr: any, group: any[], mainTable: TableSource): any {
    const funcName = aggr.name.toLowerCase();
    
    if (funcName === 'count') {
      if (aggr.args.expr.column === '*') {
        return group.length;
      }
      
      const columnKey = `${aggr.args.expr.table || mainTable.alias}.${aggr.args.expr.column}`;
      const values = group.map(row => row[columnKey]).filter(val => val != null);
      return values.length;
    }
    
    const columnKey = `${aggr.args.expr.table || mainTable.alias}.${aggr.args.expr.column}`;
    const numericValues = group
      .map(row => row[columnKey])
      .filter(val => val != null && !isNaN(Number(val)))
      .map(val => Number(val));
    
    if (numericValues.length === 0) return null;
    
    switch (funcName) {
      case 'sum':
        return numericValues.reduce((sum, val) => sum + val, 0);
      case 'avg':
        return numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
      case 'min':
        return Math.min(...numericValues);
      case 'max':
        return Math.max(...numericValues);
      default:
        return null;
    }
  }
}

function random(arr: string[]): string { 
  return arr[Math.floor(Math.random() * arr.length)]; 
}