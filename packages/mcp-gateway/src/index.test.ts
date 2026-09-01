import { describe, expect, it } from "vitest";
import { createDevelopmentProviders, McpGateway } from "./index.js";
describe("MCP gateway", () => {
  it("routes allowlisted capabilities", async () => {
    const gateway = setup();
    expect(
      (await gateway.execute("notes.create", { text: "hello" }, "key-1"))
        .verified,
    ).toBe(true);
  });
  it("returns an external video artifact", async () => {
    const gateway = setup();
    const result = await gateway.execute(
      "media.video.generate",
      { assets: [] },
      "key-video",
    );
    expect(result.provider).toBe("development.remote-mcp");
    expect(result.artifacts[0]?.kind).toBe("video");
  });
  it("rejects unknown capabilities", async () => {
    const gateway = setup();
    await expect(gateway.execute("unknown.run", {}, "key-2")).rejects.toThrow(
      "No provider",
    );
  });
});
function setup() {
  const gateway = new McpGateway();
  createDevelopmentProviders().forEach((provider) =>
    gateway.register(provider),
  );
  return gateway;
}
