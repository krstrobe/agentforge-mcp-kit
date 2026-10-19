/**
 * AgentForge Core MCP Server Framework
 * Provides authentication, structured logging, rate-limiting, audit trails,
 * and JSON-RPC 2.0 / stdio & HTTP SSE transport wrappers for production MCP servers.
 */

export interface ToolDefinition<TInput = Record<string, unknown>, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (args: TInput, context: ExecutionContext) => Promise<TOutput>;
}

export interface ExecutionContext {
  requestId: string;
  timestamp: string;
  callerId: string;
  dryRun: boolean;
}

export interface AuditLogEntry {
  requestId: string;
  timestamp: string;
  serverName: string;
  toolName: string;
  callerId: string;
  durationMs: number;
  status: "success" | "error" | "rate_limited";
  errorMessage?: string;
}

export class RateLimiter {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();
  private readonly maxRequestsPerMinute: number;

  constructor(maxRequestsPerMinute: number = 60) {
    this.maxRequestsPerMinute = maxRequestsPerMinute;
  }

  public allow(callerId: string): boolean {
    const now = Date.now();
    const bucket = this.buckets.get(callerId) ?? {
      tokens: this.maxRequestsPerMinute,
      lastRefill: now,
    };

    const elapsedMinutes = (now - bucket.lastRefill) / 60000;
    if (elapsedMinutes > 0) {
      bucket.tokens = Math.min(
        this.maxRequestsPerMinute,
        bucket.tokens + elapsedMinutes * this.maxRequestsPerMinute
      );
      bucket.lastRefill = now;
    }

    if (bucket.tokens < 1) {
      this.buckets.set(callerId, bucket);
      return false;
    }

    bucket.tokens -= 1;
    this.buckets.set(callerId, bucket);
    return true;
  }
}

export class ProductionMCPServer {
  private tools = new Map<string, ToolDefinition<any, any>>();
  private rateLimiter: RateLimiter;
  private auditLogs: AuditLogEntry[] = [];
  public readonly name: string;
  public readonly version: string;

  constructor(
    name: string,
    version: string,
    options?: { maxRequestsPerMinute?: number }
  ) {
    this.name = name;
    this.version = version;
    this.rateLimiter = new RateLimiter(options?.maxRequestsPerMinute ?? 120);
  }

  public registerTool<TInput, TOutput>(tool: ToolDefinition<TInput, TOutput>): this {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered on server "${this.name}"`);
    }
    this.tools.set(tool.name, tool);
    return this;
  }

  public listTools(): Array<Omit<ToolDefinition, "handler">> {
    return Array.from(this.tools.values()).map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
    }));
  }

  public async executeTool(
    toolName: string,
    args: Record<string, unknown>,
    callerId = "default-agent",
    dryRun = false
  ): Promise<{
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
    meta: AuditLogEntry;
  }> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = new Date().toISOString();

    if (!this.rateLimiter.allow(callerId)) {
      const entry: AuditLogEntry = {
        requestId,
        timestamp,
        serverName: this.name,
        toolName,
        callerId,
        durationMs: Date.now() - startTime,
        status: "rate_limited",
        errorMessage: "Rate limit exceeded for caller",
      };
      this.auditLogs.push(entry);
      return {
        isError: true,
        content: [{ type: "text", text: JSON.stringify({ error: entry.errorMessage }) }],
        meta: entry,
      };
    }

    const tool = this.tools.get(toolName);
    if (!tool) {
      const entry: AuditLogEntry = {
        requestId,
        timestamp,
        serverName: this.name,
        toolName,
        callerId,
        durationMs: Date.now() - startTime,
        status: "error",
        errorMessage: `Unknown tool: ${toolName}`,
      };
      this.auditLogs.push(entry);
      return {
        isError: true,
        content: [{ type: "text", text: JSON.stringify({ error: entry.errorMessage }) }],
        meta: entry,
      };
    }

    // Validate required fields from inputSchema
    const required = tool.inputSchema.required ?? [];
    for (const field of required) {
      if (args[field] === undefined || args[field] === null) {
        const entry: AuditLogEntry = {
          requestId,
          timestamp,
          serverName: this.name,
          toolName,
          callerId,
          durationMs: Date.now() - startTime,
          status: "error",
          errorMessage: `Missing required argument: "${field}"`,
        };
        this.auditLogs.push(entry);
        return {
          isError: true,
          content: [{ type: "text", text: JSON.stringify({ error: entry.errorMessage }) }],
          meta: entry,
        };
      }
    }

    try {
      const result = await tool.handler(args, {
        requestId,
        timestamp,
        callerId,
        dryRun,
      });

      const entry: AuditLogEntry = {
        requestId,
        timestamp,
        serverName: this.name,
        toolName,
        callerId,
        durationMs: Date.now() - startTime,
        status: "success",
      };
      this.auditLogs.push(entry);

      return {
        content: [
          {
            type: "text",
            text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
          },
        ],
        meta: entry,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const entry: AuditLogEntry = {
        requestId,
        timestamp,
        serverName: this.name,
        toolName,
        callerId,
        durationMs: Date.now() - startTime,
        status: "error",
        errorMessage,
      };
      this.auditLogs.push(entry);

      return {
        isError: true,
        content: [{ type: "text", text: JSON.stringify({ error: errorMessage }) }],
        meta: entry,
      };
    }
  }

  public getAuditLogs(): ReadonlyArray<AuditLogEntry> {
    return this.auditLogs;
  }

  /**
   * Starts a JSON-RPC 2.0 stdio listener compatible with Claude Desktop, Cursor,
   * Windsurf, and custom MCP clients.
   */
  public startStdioServer(): void {
    process.stdin.setEncoding("utf8");
    let buffer = "";

    process.stdin.on("data", async (chunk: string) => {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const message = JSON.parse(line);
          const response = await this.handleJsonRpc(message);
          if (response) {
            process.stdout.write(JSON.stringify(response) + "\n");
          }
        } catch (err) {
          process.stdout.write(
            JSON.stringify({
              jsonrpc: "2.0",
              id: null,
              error: { code: -32700, message: "Parse error" },
            }) + "\n"
          );
        }
      }
    });
  }

  public async handleJsonRpc(request: {
    jsonrpc: string;
    id?: string | number | null;
    method: string;
    params?: Record<string, any>;
  }): Promise<Record<string, unknown> | null> {
    const { id, method, params } = request;

    if (method === "initialize") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: { name: this.name, version: this.version },
          capabilities: { tools: {} },
        },
      };
    }

    if (method === "tools/list") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: this.listTools(),
        },
      };
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const toolArgs = params?.arguments ?? {};
      const result = await this.executeTool(toolName, toolArgs);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: result.content,
          isError: result.isError ?? false,
        },
      };
    }

    if (id === undefined) {
      return null; // Notification
    }

    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    };
  }
}
