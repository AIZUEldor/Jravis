import { z } from "zod";

export const commandSourceSchema = z.enum(["text", "voice"]);
export const intentKindSchema = z.enum(["task", "reminder", "note", "automation", "media", "message"]);
export const riskLevelSchema = z.enum(["L0", "L1", "L2", "L3", "L4", "L5"]);
export const approvalModeSchema = z.enum(["DENY", "ASK_ONCE", "ASK_EVERY_TIME", "ALLOW_SESSION", "ALLOW_RULE"]);
export const planStatusSchema = z.enum(["awaiting_approval", "approved", "running", "succeeded", "failed", "denied"]);

export const commandInputSchema = z.object({
  text: z.string().trim().min(1).max(4000),
  source: commandSourceSchema.default("text"),
  locale: z.string().trim().min(2).max(35).default("uz-UZ"),
  timezone: z.string().trim().min(1).max(100).default("Asia/Tashkent")
});

export const capabilitySchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9_]*)+$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  risk: riskLevelSchema,
  description: z.string().min(1),
  supportsDryRun: z.boolean()
});

export const planStepSchema = z.object({
  id: z.string().uuid(),
  capability: capabilitySchema,
  input: z.record(z.string(), z.unknown()),
  description: z.string().min(1),
  approvalMode: approvalModeSchema,
  status: z.enum(["pending", "approved", "running", "succeeded", "failed", "denied"])
});

export const executionPlanSchema = z.object({
  id: z.string().uuid(),
  commandId: z.string().uuid(),
  intent: intentKindSchema,
  summary: z.string(),
  status: planStatusSchema,
  steps: z.array(planStepSchema).min(1),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime()
});

export const approvalInputSchema = z.object({ approved: z.boolean(), confirmationText: z.string().max(500).optional() });

export type CommandInput = z.infer<typeof commandInputSchema>;
export type IntentKind = z.infer<typeof intentKindSchema>;
export type RiskLevel = z.infer<typeof riskLevelSchema>;
export type ApprovalMode = z.infer<typeof approvalModeSchema>;
export type Capability = z.infer<typeof capabilitySchema>;
export type PlanStep = z.infer<typeof planStepSchema>;
export type ExecutionPlan = z.infer<typeof executionPlanSchema>;
export type ApprovalInput = z.infer<typeof approvalInputSchema>;

export type CommandResult = { id: string; plan: ExecutionPlan; status: "planned"; createdAt: string };
export type ToolExecutionResult = { executionId: string; provider: string; output: Record<string, unknown>; verified: boolean; completedAt: string };
export type AuditEvent = {
  id: string;
  type: "command.created" | "plan.approved" | "plan.denied" | "tool.started" | "tool.succeeded" | "tool.failed";
  actorId: string;
  commandId: string;
  planId: string;
  stepId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

