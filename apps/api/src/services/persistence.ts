import type {
  AuditEvent,
  ExecutionPlan,
  ToolExecutionResult,
  User,
} from "@jravis/contracts";

export type PersistenceUser = User & { passwordHash: string };
export type PersistenceSession = { userId: string; expiresAt: string };

export interface Persistence {
  createUser(user: PersistenceUser): Promise<void>;
  findUserByEmail(email: string): Promise<PersistenceUser | undefined>;
  findUserById(id: string): Promise<PersistenceUser | undefined>;
  createSession(tokenHash: string, session: PersistenceSession): Promise<void>;
  findSession(tokenHash: string): Promise<PersistenceSession | undefined>;
  deleteSession(tokenHash: string): Promise<void>;
  savePlan(plan: ExecutionPlan, actorId: string): Promise<void>;
  getPlan(id: string, actorId: string): Promise<ExecutionPlan | undefined>;
  listPlans(actorId: string): Promise<ExecutionPlan[]>;
  addExecution(planId: string, result: ToolExecutionResult): Promise<void>;
  listExecutions(
    planId: string,
    actorId: string,
  ): Promise<ToolExecutionResult[]>;
  appendAudit(event: AuditEvent): Promise<void>;
  listAudit(actorId: string): Promise<AuditEvent[]>;
  ping(): Promise<void>;
  close(): Promise<void>;
}
