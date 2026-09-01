import type { BrainDecision, CommandInput, IntentKind } from "@jravis/contracts";

type Route = { intent: IntentKind; pattern: RegExp; confidence: number; capabilities: string[] };
const routes: Route[] = [
  { intent: "message", pattern: /telegram|xabar yubor|jo['‘’]?nat/, confidence: 0.96, capabilities: ["messaging.telegram.send"] },
  { intent: "media", pattern: /instagram.*(rasm|video)|(?:rasm|video).*instagram/, confidence: 0.96, capabilities: ["media.render_video", "social.instagram.publish"] },
  { intent: "media", pattern: /rasm|video|galereya/, confidence: 0.9, capabilities: ["media.render_video"] },
  { intent: "reminder", pattern: /eslat|budilnik|signal|soat/, confidence: 0.94, capabilities: ["clock.alarm.create"] },
  { intent: "automation", pattern: /avtomat|har safar|agar.+bo['‘’]?lsa/, confidence: 0.9, capabilities: ["automation.create"] },
  { intent: "note", pattern: /qayd|yozib qo['‘’]?y|saqla/, confidence: 0.9, capabilities: ["notes.create"] },
  { intent: "task", pattern: /vazifa|topshiriq|bajar/, confidence: 0.82, capabilities: ["tasks.create"] }
];

export function routeCommand(input: CommandInput): BrainDecision {
  const text = input.text.toLocaleLowerCase(input.locale.startsWith("uz") ? "uz" : undefined);
  const route = routes.find((candidate) => candidate.pattern.test(text)) ?? { intent: "task" as const, confidence: 0.45, capabilities: ["tasks.create"] };
  const entities: Record<string, string> = {};
  const time = text.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/)?.[0];
  const recipient = text.match(/@[a-zA-Z0-9_]{5,32}/)?.[0];
  if (time) entities.time = time;
  if (recipient) entities.recipient = recipient;
  const missingFields: string[] = [];
  if (route.intent === "reminder" && !time) missingFields.push("time");
  if (route.intent === "message" && !recipient) missingFields.push("recipient");
  if (route.confidence < 0.6) missingFields.push("intent");
  const clarificationQuestion = missingFields.includes("time") ? "Qaysi vaqtga o‘rnatay? Masalan, 17:00." : missingFields.includes("recipient") ? "Telegram recipientini @username ko‘rinishida ayting." : missingFields.includes("intent") ? "Bu buyruqdan qanday natija kutyapsiz?" : undefined;
  return { intent: route.intent, confidence: route.confidence, rationale: `Matched ${route.intent} route`, capabilityNames: route.capabilities, entities, missingFields, ...(clarificationQuestion ? { clarificationQuestion } : {}) };
}

