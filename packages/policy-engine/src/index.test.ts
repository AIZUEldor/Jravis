import { describe, expect, it } from "vitest";
import { evaluateCapability } from "./index.js";
const base = {
  name: "media.search",
  version: "1.0.0",
  risk: "L0" as const,
  description: "Search selected media",
  supportsDryRun: true,
  executionTarget: "device_bridge" as const,
  dataEgress: "none" as const,
};
describe("policy engine", () => {
  it("denies untrusted providers", () =>
    expect(
      evaluateCapability(base, {
        actorId: "u1",
        grantedCapabilities: new Set([base.name]),
        trustedProvider: false,
      }).mode,
    ).toBe("DENY"));
  it("allows granted L0 capability", () =>
    expect(
      evaluateCapability(base, {
        actorId: "u1",
        grantedCapabilities: new Set([base.name]),
        trustedProvider: true,
      }).allowed,
    ).toBe(true));
  it("always denies L5", () =>
    expect(
      evaluateCapability(
        { ...base, risk: "L5" },
        {
          actorId: "u1",
          grantedCapabilities: new Set([base.name]),
          trustedProvider: true,
        },
      ).mode,
    ).toBe("DENY"));
});
