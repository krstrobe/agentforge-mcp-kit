# Legal Disclaimer, Limitation of Liability & Security Notice

**IMPORTANT — READ CAREFULLY BEFORE DEPLOYING TO PRODUCTION:**

1. **"AS IS" Software Boilerplate:**
   The AgentForge MCP Starter Kit ("Software") is provided as a developer reference template and starter kit **"AS IS" and "AS AVAILABLE"**, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, title, and non-infringement.

2. **Defense-in-Depth & Infrastructure Responsibility:**
   Protocol-level regex and heuristic guardrails (including SQL query filtering, Stripe refund dollar caps, GitHub diff secret scanning, and outbound PII redaction) are designed as an **additional layer** of defense—not a replacement for least-privilege infrastructure security. You are solely responsible for:
   - Connecting database MCP servers exclusively to **read-only database roles/credentials** in production.
   - Using restricted, least-privilege API keys (e.g., Stripe Restricted Keys, scoped GitHub Fine-Grained PATs).
   - Validating all configurations in an isolated staging/test environment before connecting live production systems or autonomous LLM agents.

3. **No Compliance or Legal Certification:**
   References to SOC2, PCI-DSS, HIPAA, GDPR, or security architecture best practices in documentation or SOW templates are for informational and architectural guidance only and do not constitute legal advice or formal compliance certification.

4. **Limitation of Liability:**
   In no event shall the authors, creators, or copyright holders be liable for any claim, direct or indirect damages, data loss, unauthorized financial transactions, API charges, security incidents, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the Software or the use or other dealings in the Software.
