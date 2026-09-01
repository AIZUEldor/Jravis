import type { AuditEvent, CommandInput, CommandResult, ExecutionPlan } from "@jravis/contracts";
import { evaluateCapability } from "@jravis/policy-engine";
import { McpGateway } from "@jravis/mcp-gateway";
import { createPlan } from "../domain/planner.js";
import { MemoryStore } from "./store.js";

export class Orchestrator {
  constructor(private readonly store: MemoryStore, private readonly gateway: McpGateway) {}

  createCommand(actorId: string, input: CommandInput): CommandResult {
    const commandId = crypto.randomUUID();
    const { plan, brain } = createPlan(commandId, input);
    for (const step of plan.steps) {
      const decision = evaluateCapability(step.capability, { actorId, grantedCapabilities: new Set([step.capability.name]), trustedProvider: this.gateway.isTrusted(step.capability.name) });
      step.approvalMode = decision.mode;
      if (decision.mode === "DENY") { plan.status = "denied"; step.status = "denied"; }
    }
    this.store.savePlan(plan, actorId);
    this.audit(actorId, "command.created", plan, undefined, { source: input.source, confidence: brain.confidence, missingFields: brain.missingFields });
    return { id: commandId, plan, brain, status: plan.status === "clarification_required" ? "clarification_required" : "planned", createdAt: plan.createdAt };
  }

  getPlan(actorId: string, id: string): ExecutionPlan | undefined { return this.store.getPlan(id, actorId); }
  listPlans(actorId: string): ExecutionPlan[] { return this.store.listPlans(actorId); }
  getAudit(actorId: string): AuditEvent[] { return this.store.listAudit(actorId); }

  async decide(actorId: string, planId: string, approved: boolean): Promise<ExecutionPlan> {
    const plan = this.store.getPlan(planId, actorId);
    if (!plan) throw new Error("PLAN_NOT_FOUND");
    if (plan.status === "clarification_required") throw new Error("CLARIFICATION_REQUIRED");
    if (plan.status !== "awaiting_approval") throw new Error("PLAN_NOT_APPROVABLE");
    if (new Date(plan.expiresAt).getTime() <= Date.now()) throw new Error("PLAN_EXPIRED");
    if (!approved) {
      plan.status = "denied"; plan.steps.forEach((step) => { step.status = "denied"; });
      this.store.updatePlan(plan, actorId); this.audit(actorId, "plan.denied", plan, undefined, {}); return plan;
    }
    plan.status = "approved"; plan.steps.forEach((step) => { step.status = "approved"; });
    this.store.updatePlan(plan, actorId); this.audit(actorId, "plan.approved", plan, undefined, {});
    return this.execute(actorId, plan);
  }

  private async execute(actorId: string, plan: ExecutionPlan): Promise<ExecutionPlan> {
    plan.status = "running"; this.store.updatePlan(plan, actorId);
    for (const step of plan.steps) {
      try {
        step.status = "running"; this.audit(actorId, "tool.started", plan, step.id, { capability: step.capability.name });
        const result = await this.gateway.execute(step.capability.name, step.input, `${plan.id}:${step.id}`);
        if (!result.verified) throw new Error("Provider result was not verified");
        this.store.addExecution(plan.id, result); step.status = "succeeded";
        this.audit(actorId, "tool.succeeded", plan, step.id, { capability: step.capability.name, executionId: result.executionId, provider: result.provider });
      } catch (error) {
        step.status = "failed"; plan.status = "failed";
        this.audit(actorId, "tool.failed", plan, step.id, { message: error instanceof Error ? error.message : "Unknown error" });
        this.store.updatePlan(plan, actorId); return plan;
      }
    }
    plan.status = "succeeded"; this.store.updatePlan(plan, actorId); return plan;
  }

  private audit(actorId: string, type: AuditEvent["type"], plan: ExecutionPlan, stepId: string | undefined, metadata: Record<string, unknown>): void {
    this.store.appendAudit({ id: crypto.randomUUID(), type, actorId, commandId: plan.commandId, planId: plan.id, ...(stepId ? { stepId } : {}), metadata, createdAt: new Date().toISOString() });
  }
}

