import type { ApprovalMode, Capability, RiskLevel } from "@jravis/contracts";

const decisions: Record<RiskLevel, ApprovalMode> = { L0: "ALLOW_SESSION", L1: "ASK_ONCE", L2: "ASK_ONCE", L3: "ASK_EVERY_TIME", L4: "ASK_EVERY_TIME", L5: "DENY" };
export type PolicyContext = { actorId: string; grantedCapabilities: ReadonlySet<string>; trustedProvider: boolean };
export type PolicyDecision = { mode: ApprovalMode; allowed: boolean; reason: string };

export function evaluateCapability(capability: Capability, context: PolicyContext): PolicyDecision {
  if (capability.risk === "L5") return { mode: "DENY", allowed: false, reason: "L5 operations are disabled" };
  if (!context.trustedProvider) return { mode: "DENY", allowed: false, reason: "Provider is not trusted" };
  if (!context.grantedCapabilities.has(capability.name)) return { mode: "ASK_ONCE", allowed: false, reason: `Missing grant for ${capability.name}` };
  const mode = decisions[capability.risk];
  return { mode, allowed: mode === "ALLOW_SESSION" || mode === "ALLOW_RULE", reason: `Risk policy ${capability.risk}` };
}

