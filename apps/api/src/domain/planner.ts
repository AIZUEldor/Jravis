import type {
  BrainDecision,
  Capability,
  CommandInput,
  ExecutionPlan,
} from "@jravis/contracts";
import { routeCommand } from "@jravis/brain-core";

const catalog: Record<string, Capability> = {
  "tasks.create": {
    name: "tasks.create",
    version: "1.0.0",
    risk: "L1",
    description: "Create a local task",
    supportsDryRun: true,
    executionTarget: "local_core",
    dataEgress: "none",
  },
  "notes.create": {
    name: "notes.create",
    version: "1.0.0",
    risk: "L1",
    description: "Create a local note",
    supportsDryRun: true,
    executionTarget: "local_core",
    dataEgress: "none",
  },
  "clock.alarm.create": {
    name: "clock.alarm.create",
    version: "1.0.0",
    risk: "L2",
    description: "Create an alarm on the user device",
    supportsDryRun: true,
    executionTarget: "device_bridge",
    dataEgress: "metadata_only",
  },
  "automation.create": {
    name: "automation.create",
    version: "1.0.0",
    risk: "L2",
    description: "Create a deterministic workflow",
    supportsDryRun: true,
    executionTarget: "local_core",
    dataEgress: "none",
  },
  "media.video.generate": {
    name: "media.video.generate",
    version: "1.0.0",
    risk: "L2",
    description: "Generate video through an external AI MCP provider",
    supportsDryRun: true,
    executionTarget: "remote_mcp",
    dataEgress: "selected_content",
  },
  "social.instagram.publish": {
    name: "social.instagram.publish",
    version: "1.0.0",
    risk: "L3",
    description: "Publish approved artifact through an external MCP provider",
    supportsDryRun: true,
    executionTarget: "remote_mcp",
    dataEgress: "selected_content",
  },
  "messaging.telegram.send": {
    name: "messaging.telegram.send",
    version: "1.0.0",
    risk: "L3",
    description: "Send a Telegram message through an external MCP provider",
    supportsDryRun: true,
    executionTarget: "remote_mcp",
    dataEgress: "selected_content",
  },
};

export function createPlan(
  commandId: string,
  input: CommandInput,
): { plan: ExecutionPlan; brain: BrainDecision } {
  const brain = routeCommand(input);
  const now = new Date();
  const needsClarification = brain.missingFields.length > 0;
  const steps = brain.capabilityNames.map((name) => {
    const capability = catalog[name];
    if (!capability) throw new Error(`UNSUPPORTED_CAPABILITY:${name}`);
    return {
      id: crypto.randomUUID(),
      capability,
      input: {
        text: input.text,
        locale: input.locale,
        timezone: input.timezone,
        ...brain.entities,
      },
      description: capability.description,
      approvalMode:
        capability.risk === "L3" || capability.risk === "L4"
          ? ("ASK_EVERY_TIME" as const)
          : ("ASK_ONCE" as const),
      status: "pending" as const,
    };
  });
  return {
    brain,
    plan: {
      id: crypto.randomUUID(),
      commandId,
      intent: brain.intent,
      summary: input.text,
      status: needsClarification
        ? "clarification_required"
        : "awaiting_approval",
      steps,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 15 * 60_000).toISOString(),
    },
  };
}
