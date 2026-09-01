import type { Capability, CommandInput, ExecutionPlan, IntentKind } from "@jravis/contracts";

const catalog: Record<IntentKind, Capability> = {
  task: { name: "tasks.create", version: "1.0.0", risk: "L1", description: "Create a local task", supportsDryRun: true },
  note: { name: "notes.create", version: "1.0.0", risk: "L1", description: "Create a local note", supportsDryRun: true },
  reminder: { name: "clock.alarm.create", version: "1.0.0", risk: "L2", description: "Create an alarm", supportsDryRun: true },
  automation: { name: "automation.create", version: "1.0.0", risk: "L2", description: "Create a deterministic workflow", supportsDryRun: true },
  media: { name: "media.render_video", version: "1.0.0", risk: "L2", description: "Render selected media", supportsDryRun: true },
  message: { name: "messaging.telegram.send", version: "1.0.0", risk: "L3", description: "Send a Telegram message", supportsDryRun: true }
};

export function detectIntent(text: string): IntentKind {
  const value = text.toLocaleLowerCase("uz");
  if (/telegram|xabar yubor|jo['‘’]?nat/.test(value)) return "message";
  if (/rasm|video|galereya|instagram/.test(value)) return "media";
  if (/eslat|budilnik|soat|ertaga|bugun/.test(value)) return "reminder";
  if (/avtomat|har safar|agar/.test(value)) return "automation";
  if (/qayd|yozib qo['‘’]?y|saqla/.test(value)) return "note";
  return "task";
}

export function createPlan(commandId: string, input: CommandInput): ExecutionPlan {
  const intent = detectIntent(input.text);
  const capability = catalog[intent];
  const now = new Date();
  return {
    id: crypto.randomUUID(), commandId, intent, summary: input.text, status: "awaiting_approval",
    steps: [{ id: crypto.randomUUID(), capability, input: { text: input.text, locale: input.locale, timezone: input.timezone }, description: capability.description, approvalMode: capability.risk === "L3" ? "ASK_EVERY_TIME" : "ASK_ONCE", status: "pending" }],
    createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + 15 * 60_000).toISOString()
  };
}

