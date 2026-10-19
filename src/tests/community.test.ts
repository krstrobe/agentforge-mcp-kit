import test from "node:test";
import assert from "node:assert/strict";
import { validateSafeSql, createDatabaseInspectorServer } from "../mcp-servers/database-inspector/index.ts";

test("Community Edition: Database Inspector blocks destructive SQL and allows safe SELECT", async () => {
  assert.equal(validateSafeSql("DROP TABLE users;").safe, false);
  assert.equal(validateSafeSql("DELETE FROM users;").safe, false);
  assert.equal(validateSafeSql("SELECT id, email FROM users WHERE active = true").safe, true);

  const server = createDatabaseInspectorServer();
  const res = await server.executeTool("execute_safe_query", {
    query: "SELECT id, email FROM users",
    maxRows: 10,
  });
  assert.equal(res.isError ?? false, false);
});
