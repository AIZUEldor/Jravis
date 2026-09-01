import type { BrainDecision, Capability, CommandInput, ExecutionPlan } from "@jravis/contracts";
import { routeCommand } from "@jravis/brain-core";

const catalog: Record<string, Capability> = {
  "tasks.create": { name: "tasks.create", version: "1.0.0", risk: "L1", description: "Create a local task", supportsDryRun: true },
  "notes.create": { name: "notes.create", version: "1.0.0", risk: "L1", description: "Create a local note", supportsDryRun: true },
  "clock.alarm.create": { name: "clock.alarm.create", version: "1.0.0", risk: "L2", description: "Create an alarm", supportsDryRun: true },
  "automation.create": { name: "automation.create", version: "1.0.0", risk: "L2", description: "Create a deterministic workflow", supportsDryRun: true },
  "media.render_video": { name: "media.render_video", version: "1.0.0", risk: "L2", description: "Render selected media", supportsDryRun: true },
  "social.instagram.publish": { name: "social.instagram.publish", version: "1.0.0", risk: "L3", description: "Publish approved media to Instagram", supportsDryRun: true },
  "messaging.telegram.send": { name: "messaging.telegram.send", version: "1.0.0", risk: "L3", description: "Send a Telegram message", supportsDryRun: true }
};

export function createPlan(commandId: string, input: CommandInput): { plan: ExecutionPlan; brain: BrainDecision } {
  const brain = routeCommand(input);
  const now = new Date();
  const needsClarification = brain.missingFields.length > 0;
  const steps = brain.capabilityNames.map((name) => {
    const capability = catalog[name];
    if (!capability) throw new Error(`UNSUPPORTED_CAPABILITY:${name}`);
    return {
      id: crypto.randomUUID(), capability,
      input: { text: input.text, locale: input.locale, timezone: input.timezone, ...brain.entities },
      description: capability.description,
      approvalMode: capability.risk === "L3" || capability.risk === "L4" ? "ASK_EVERY_TIME" as const : "ASK_ONCE" as const,
      status: "pending" as const
    };
  });
  return {
    brain,
    plan: { id: crypto.randomUUID(), commandId, intent: brain.intent, summary: input.text, status: needsClarification ? "clarification_required" : "awaiting_approval", steps, createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + 15 * 60_000).toISOString() }
  };
}

