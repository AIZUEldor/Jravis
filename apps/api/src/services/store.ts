import type {
  AuditEvent,
  ExecutionPlan,
  ToolExecutionResult,
} from "@jravis/contracts";
import type {
  Persistence,
  PersistenceSession,
  PersistenceUser,
} from "./persistence.js";

export class MemoryStore implements Persistence {
  private readonly usersByEmail = new Map<string, PersistenceUser>();
  private readonly usersById = new Map<string, PersistenceUser>();
  private readonly sessions = new Map<string, PersistenceSession>();
  private readonly plans = new Map<string, ExecutionPlan>();
  private readonly owners = new Map<string, string>();
  private readonly executions = new Map<string, ToolExecutionResult[]>();
  private readonly events: AuditEvent[] = [];

  async createUser(user: PersistenceUser): Promise<void> {
    if (this.usersByEmail.has(user.email))
      throw Object.assign(new Error("duplicate user"), { code: "23505" });
    this.usersByEmail.set(user.email, structuredClone(user));
    this.usersById.set(user.id, structuredClone(user));
  }
  async findUserByEmail(email: string): Promise<PersistenceUser | undefined> {
    const user = this.usersByEmail.get(email);
    return user ? structuredClone(user) : undefined;
  }
  async findUserById(id: string): Promise<PersistenceUser | undefined> {
    const user = this.usersById.get(id);
    return user ? structuredClone(user) : undefined;
  }
  async createSession(
    tokenHash: string,
    session: PersistenceSession,
  ): Promise<void> {
    this.sessions.set(tokenHash, structuredClone(session));
  }
  async findSession(
    tokenHash: string,
  ): Promise<PersistenceSession | undefined> {
    const session = this.sessions.get(tokenHash);
    return session ? structuredClone(session) : undefined;
  }
  async deleteSession(tokenHash: string): Promise<void> {
    this.sessions.delete(tokenHash);
  }
  async savePlan(plan: ExecutionPlan, actorId: string): Promise<void> {
    this.plans.set(plan.id, structuredClone(plan));
    this.owners.set(plan.id, actorId);
  }
  async getPlan(
    id: string,
    actorId: string,
  ): Promise<ExecutionPlan | undefined> {
    const plan =
      this.owners.get(id) === actorId ? this.plans.get(id) : undefined;
    return plan ? structuredClone(plan) : undefined;
  }
  async listPlans(actorId: string): Promise<ExecutionPlan[]> {
    return [...this.plans.values()]
      .filter((plan) => this.owners.get(plan.id) === actorId)
      .map((plan) => structuredClone(plan));
  }
  async addExecution(
    planId: string,
    result: ToolExecutionResult,
  ): Promise<void> {
    this.executions.set(planId, [
      ...(this.executions.get(planId) ?? []),
      structuredClone(result),
    ]);
  }
  async listExecutions(
    planId: string,
    actorId: string,
  ): Promise<ToolExecutionResult[]> {
    return this.owners.get(planId) === actorId
      ? structuredClone(this.executions.get(planId) ?? [])
      : [];
  }
  async appendAudit(event: AuditEvent): Promise<void> {
    this.events.push(structuredClone(event));
  }
  async listAudit(actorId: string): Promise<AuditEvent[]> {
    return structuredClone(
      this.events.filter((event) => event.actorId === actorId),
    );
  }
  async ping(): Promise<void> {}
  async close(): Promise<void> {}
}
