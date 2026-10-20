# ⚡ AgentForge: Production AI Agent & MCP Server Starter Kit

**Engineered by Strobeck Media — 5 Production-Hardened Model Context Protocol (MCP) Servers & Multi-Agent Orchestrator in Strict TypeScript.**

[![Live Interactive Simulator](https://img.shields.io/badge/Live_Demo-Interactive_MCP_Guardrail_Simulator-10b981?style=for-the-badge)](https://krstrobe.github.io/agentforge-mcp-kit/)
[![Get Instant Access](https://img.shields.io/badge/Download_Full_Kit-Strobeck_Media_Gumroad-6366f1?style=for-the-badge)](https://strobeckmedia.gumroad.com/l/agentforge-mcp-kit)

> **Try the Live Browser Guardrail Simulator:** **[https://krstrobe.github.io/agentforge-mcp-kit/](https://krstrobe.github.io/agentforge-mcp-kit/)**  
> **Download the Complete TypeScript Source Code:** **[https://strobeckmedia.gumroad.com/l/agentforge-mcp-kit](https://strobeckmedia.gumroad.com/l/agentforge-mcp-kit)**

---

## Why AgentForge?

Most MCP tutorials wire an LLM straight into PostgreSQL/SQLite, Stripe, GitHub, or Slack with zero protocol-level boundaries. That works for a weekend demo, but in production a single hallucinated tool call can:
- Run an unbounded `DELETE` or `DROP TABLE` against your database
- Issue an unauthorized \$2,500 Stripe refund without human sign-off
- Leak live API keys in a pull request review
- Post unredacted customer SSNs or credit card numbers to Slack

**AgentForge** intercepts dangerous tool calls deterministically at the JSON-RPC 2.0 boundary **before** they ever reach your infrastructure.

---

## What's Inside the Complete Starter Kit (`.zip`)

| Module / MCP Server | Capabilities & Built-In Protocol Guardrails |
| :--- | :--- |
| **Core JSON-RPC 2.0 MCP Engine** | `stdio` transport for Claude Desktop, Cursor & Windsurf + Token-Bucket Rate Limiter + Audit Telemetry |
| **1. Guarded Database Inspector MCP** | Connects to SQLite/SQL via native `node:sqlite`, auto-appends row `LIMIT`s, and deterministically blocks `DROP`, `TRUNCATE`, `ALTER`, and unbounded `DELETE` queries |
| **2. Stripe Revenue & Refund Cap MCP** | Live revenue telemetry + autonomous refund execution capped at your custom threshold (e.g. \$50 max; larger refunds escalate to human approval) |
| **3. GitHub PR Secret Scanner MCP** | Scans unified PR diffs for accidentally committed AWS keys, Stripe live secret keys, OpenAI keys, GitHub PATs, and RSA private keys + auto-labeled issue triage |
| **4. B2B Web & Lead Extractor MCP** | Zero-dependency HTML-to-clean-Markdown converter that extracts B2B contact emails and outbound links |
| **5. PII-Scrubbing Comms Dispatcher MCP** | Automatically redacts SSNs (`[REDACTED-SSN]`) and 16-digit credit card numbers (`[REDACTED-CARD]`) before posting alerts to Slack/Discord/Webhooks |
| **Multi-Agent Orchestrator + Docker** | Chain multiple MCP servers in deterministic pipelines + production `Dockerfile` & `docker-compose.yml` |
| **Agency \$3.5k–\$7.5k SOW Proposal Pack** | *(Agency Tier)* Complete B2B Client Statement of Work (SOW), pricing template, and security architecture overview |

---

## Licensing & Instant Download

- **Developer Kit (\$149):** Full TypeScript source code for all 5 MCP servers, Multi-Agent Orchestrator, 7/7 automated verification test suite, Docker setup, and unlimited internal deployments.
- **Agency Unlimited License (\$249):** Everything in the Developer Kit + unlimited paid client deployments, white-label rights, and the \$3,500 B2B Client SOW Proposal Template.
- **48-Hour Custom MCP Sprint (\$2,500):** Done-for-you custom engineering — we build, test, and deploy 3 custom guardrailed MCP servers tailored to your stack in 48 hours.

👉 **[Get Instant Access on Gumroad →](https://strobeckmedia.gumroad.com/l/agentforge-mcp-kit)**
