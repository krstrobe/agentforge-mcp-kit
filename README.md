# ⚡ AgentForge MCP Guardrails

**Protocol-level safety guardrails for Model Context Protocol (MCP) servers and autonomous AI agents.**

[![Live Interactive Simulator](https://img.shields.io/badge/Live_Demo-Interactive_MCP_Guardrail_Simulator-10b981?style=for-the-badge)](https://krstrobe.github.io/agentforge-mcp-kit/)
[![Node 22+ Native TypeScript](https://img.shields.io/badge/Node_22+-Zero_Dependencies-6366f1?style=for-the-badge)](https://krstrobe.github.io/agentforge-mcp-kit/)

> **Try the live browser simulator:** **[https://krstrobe.github.io/agentforge-mcp-kit/](https://krstrobe.github.io/agentforge-mcp-kit/)**

---

## Why AgentForge?

Most MCP tutorials wire an LLM straight into PostgreSQL, Stripe, GitHub, or Slack with zero protocol-level boundaries. That works for a weekend demo, but in production a single hallucinated tool call can:
- Run an unbounded `DELETE` or `DROP TABLE` against your database
- Issue an unauthorized \$2,500 Stripe refund without human sign-off
- Leak live API keys in a pull request review
- Post unredacted customer SSNs or credit card numbers to Slack

**AgentForge** intercepts dangerous tool calls deterministically at the JSON-RPC 2.0 boundary **before** they ever reach your infrastructure.

---

## 60-Second Quickstart (Community Edition)

This repository includes the **AgentForge Core MCP Server Engine** (`src/core/mcp-server.ts`) and the **Guarded SQL Database Inspector MCP Server** (`src/mcp-servers/database-inspector/index.ts`) with zero external dependencies on Node 22+:

```bash
git clone https://github.com/krstrobe/agentforge-mcp-kit.git
cd agentforge-mcp-kit
npm test
```

---

## Edition Comparison: Community vs. Pro & Agency Kit

| Feature / MCP Server | Community (MIT) | Pro Developer Kit (\$149) | Agency Unlimited (\$249) |
| :--- | :---: | :---: | :---: |
| **Core JSON-RPC 2.0 MCP Engine + Rate Limiter + Audit Logs** | ✅ | ✅ | ✅ |
| **1. Guarded Database Inspector MCP** (`DROP`/`DELETE` blocker) | ✅ | ✅ | ✅ |
| **2. Stripe Revenue & Autonomous Refund Dollar-Cap MCP** | ❌ | ✅ | ✅ |
| **3. GitHub PR Diff Secret-Leak Scanner & Issue Triage MCP** | ❌ | ✅ | ✅ |
| **4. B2B Web HTML-to-Markdown & Email Lead Extractor MCP** | ❌ | ✅ | ✅ |
| **5. PII-Scrubbing Slack/Discord/Webhook Dispatcher MCP** | ❌ | ✅ | ✅ |
| **Multi-Agent Workflow Orchestrator + Docker Compose Setup** | ❌ | ✅ | ✅ |
| **Claude Desktop, Cursor & Windsurf Ready Configs** | ✅ | ✅ | ✅ |
| **Unlimited Paid Client Deployments + White-Label Rights** | ❌ | ❌ | ✅ |
| **B2B Agency \$3,500–\$7,500 Client SOW Proposal Template** | ❌ | ❌ | ✅ |

👉 **[Get the Complete Pro or Agency Kit on Gumroad (`strobeck.gumroad.com/l/agentforge-mcp-kit`) →](https://strobeck.gumroad.com/l/agentforge-mcp-kit)**  
👉 **[Try the Interactive Live Browser Simulator →](https://krstrobe.github.io/agentforge-mcp-kit/)**
