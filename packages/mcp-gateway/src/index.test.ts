import { describe, expect, it } from "vitest";
import { createFakeProvider, McpGateway } from "./index.js";
describe("MCP gateway", () => {
  it("routes allowlisted capabilities", async () => { const gateway = new McpGateway(); gateway.register(createFakeProvider()); expect((await gateway.execute("notes.create", { text: "hello" }, "key-1")).verified).toBe(true); });
  it("rejects unknown capabilities", async () => { const gateway = new McpGateway(); gateway.register(createFakeProvider()); await expect(gateway.execute("unknown.run", {}, "key-2")).rejects.toThrow("No provider"); });
});

