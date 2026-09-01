import type { AuditEvent, ExecutionPlan, ToolExecutionResult } from "@jravis/contracts";

export class MemoryStore {
  private readonly plans = new Map<string, ExecutionPlan>();
  private readonly owners = new Map<string, string>();
  private readonly executions = new Map<string, ToolExecutionResult[]>();
  private readonly events: AuditEvent[] = [];
  savePlan(plan: ExecutionPlan, actorId: string): void { this.plans.set(plan.id, structuredClone(plan)); this.owners.set(plan.id, actorId); }
  getPlan(id: string, actorId: string): ExecutionPlan | undefined { const plan = this.owners.get(id) === actorId ? this.plans.get(id) : undefined; return plan ? structuredClone(plan) : undefined; }
  listPlans(actorId: string): ExecutionPlan[] { return [...this.plans.values()].filter((plan) => this.owners.get(plan.id) === actorId).map((plan) => structuredClone(plan)); }
  updatePlan(plan: ExecutionPlan, actorId: string): void { this.savePlan(plan, actorId); }
  addExecution(planId: string, result: ToolExecutionResult): void { this.executions.set(planId, [...(this.executions.get(planId) ?? []), structuredClone(result)]); }
  getExecutions(planId: string): ToolExecutionResult[] { return structuredClone(this.executions.get(planId) ?? []); }
  appendAudit(event: AuditEvent): void { this.events.push(structuredClone(event)); }
  listAudit(actorId: string): AuditEvent[] { return structuredClone(this.events.filter((event) => event.actorId === actorId)); }
}
