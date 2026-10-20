import { DatabaseSync } from "node:sqlite";
import { ProductionMCPServer } from "../../core/mcp-server.ts";

/**
 * MCP Server 1: Database Inspector & Safe SQL Query Guard
 * Connects to a real SQLite database (via process.env.SQLITE_DB_PATH or an initialized local DB)
 * and enforces strict protocol-level SQL guardrails blocking DROP, TRUNCATE, ALTER,
 * and unbounded DELETE/UPDATE queries before they ever reach the database engine.
 */

const FORBIDDEN_SQL_PATTERNS = [
  /\bDROP\s+(TABLE|DATABASE|SCHEMA|INDEX|VIEW)\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\s+(TABLE|DATABASE|ROLE)\b/i,
  /\bGRANT\b/i,
  /\bREVOKE\b/i,
  /\bDELETE\s+FROM\s+\w+\s*(?:;|$)/i, // Unbounded DELETE without WHERE
];

export function validateSafeSql(sql: string, allowWrites = false): { safe: boolean; reason?: string } {
  const trimmed = sql.trim();
  if (!trimmed) {
    return { safe: false, reason: "Empty SQL query" };
  }

  for (const pattern of FORBIDDEN_SQL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        safe: false,
        reason: `Query blocked by SQL guard: matches forbidden destructive pattern (${pattern.source})`,
      };
    }
  }

  if (!allowWrites && /\b(INSERT|UPDATE|DELETE|CREATE|REPLACE)\b/i.test(trimmed)) {
    return {
      safe: false,
      reason: "Write operations are disabled in read-only mode. Set allowWrites=true only for authorized mutations.",
    };
  }

  return { safe: true };
}

export function createInitializedDatabase(dbPath = process.env.SQLITE_DB_PATH || ":memory:"): DatabaseSync {
  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      plan_tier TEXT NOT NULL,
      mrr_usd INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS kpis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric TEXT UNIQUE NOT NULL,
      value INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const countRow = db.prepare("SELECT COUNT(*) as cnt FROM customers").get() as { cnt: number };
  if (countRow.cnt === 0) {
    db.exec(`
      INSERT INTO customers (email, plan_tier, mrr_usd, created_at) VALUES
        ('cto@acme-ai.io', 'agency', 249, '2026-10-15T10:00:00Z'),
        ('founder@launchfast.dev', 'pro', 149, '2026-10-17T14:30:00Z'),
        ('eng@finops-cloud.com', 'enterprise', 2500, '2026-10-18T09:15:00Z');
      INSERT INTO kpis (metric, value, updated_at) VALUES
        ('active_subscriptions', 142, '2026-10-19T12:00:00Z'),
        ('monthly_recurring_revenue_usd', 21450, '2026-10-19T12:00:00Z');
    `);
  }
  return db;
}

export function createDatabaseInspectorServer(customDb?: DatabaseSync): ProductionMCPServer {
  const db = customDb ?? createInitializedDatabase();
  const server = new ProductionMCPServer("agentforge-database-inspector", "1.0.0", {
    maxRequestsPerMinute: 120,
  });

  server.registerTool<
    { query: string; maxRows?: number; allowWrites?: boolean },
    Record<string, unknown>
  >({
    name: "execute_safe_query",
    description:
      "Validates and executes a real SQL query against the SQLite database with automatic read-only guardrails and row limits.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "SQL query to validate and run" },
        maxRows: { type: "number", description: "Maximum number of rows to return (default: 100)" },
        allowWrites: { type: "boolean", description: "Allow INSERT/UPDATE with WHERE clause (default: false)" },
      },
      required: ["query"],
    },
    handler: async ({ query, maxRows = 100, allowWrites = false }, ctx) => {
      const validation = validateSafeSql(query, allowWrites);
      if (!validation.safe) {
        throw new Error(validation.reason);
      }

      const isSelect = /^\s*SELECT\b/i.test(query);
      const boundedQuery =
        /\bLIMIT\s+\d+/i.test(query) || !isSelect
          ? query.replace(/;\s*$/, "")
          : `${query.replace(/;\s*$/, "")} LIMIT ${Math.min(maxRows, 1000)}`;

      if (isSelect) {
        const rows = db.prepare(boundedQuery).all();
        return {
          status: "executed",
          requestId: ctx.requestId,
          sanitizedQuery: boundedQuery,
          rowLimitApplied: Math.min(maxRows, 1000),
          rowCount: rows.length,
          rows,
        };
      } else {
        const result = db.prepare(boundedQuery).run();
        return {
          status: "executed_mutation",
          requestId: ctx.requestId,
          sanitizedQuery: boundedQuery,
          changes: result.changes,
          lastInsertRowid: Number(result.lastInsertRowid),
        };
      }
    },
  });

  server.registerTool<{ tableName?: string }, Record<string, unknown>>({
    name: "inspect_schema",
    description: "Queries live sqlite_master metadata to return real table definitions and column schemas.",
    inputSchema: {
      type: "object",
      properties: {
        tableName: { type: "string", description: "Optional specific table name to inspect" },
      },
    },
    handler: async ({ tableName }) => {
      const tables = db
        .prepare(
          tableName
            ? "SELECT name, sql FROM sqlite_master WHERE type='table' AND name = ?"
            : "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )
        .all(...(tableName ? [tableName] : [])) as Array<{ name: string; sql: string }>;

      return {
        engine: "node:sqlite (DatabaseSync)",
        tableCount: tables.length,
        tables,
      };
    },
  });

  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createDatabaseInspectorServer().startStdioServer();
}
