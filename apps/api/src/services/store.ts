import type { AuditEvent, ExecutionPlan, ToolExecutionResult } from "@jravis/contracts";

export class MemoryStore {
  private readonly plans = new Map<string, ExecutionPlan>();
  private readonly executions = new Map<string, ToolExecutionResult[]>();
  private readonly events: AuditEvent[] = [];
  savePlan(plan: ExecutionPlan): void { this.plans.set(plan.id, structuredClone(plan)); }
  getPlan(id: string): ExecutionPlan | undefined { const plan = this.plans.get(id); return plan ? structuredClone(plan) : undefined; }
  listPlans(): ExecutionPlan[] { return [...this.plans.values()].map((plan) => structuredClone(plan)); }
  updatePlan(plan: ExecutionPlan): void { this.savePlan(plan); }
  addExecution(planId: string, result: ToolExecutionResult): void { this.executions.set(planId, [...(this.executions.get(planId) ?? []), structuredClone(result)]); }
  getExecutions(planId: string): ToolExecutionResult[] { return structuredClone(this.executions.get(planId) ?? []); }
  appendAudit(event: AuditEvent): void { this.events.push(structuredClone(event)); }
  listAudit(): AuditEvent[] { return structuredClone(this.events); }
}

