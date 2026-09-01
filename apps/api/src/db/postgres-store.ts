import { Pool } from "pg";
import type {
  AuditEvent,
  ExecutionPlan,
  ToolExecutionResult,
} from "@jravis/contracts";
import type {
  Persistence,
  PersistenceSession,
  PersistenceUser,
} from "../services/persistence.js";

export class PostgresStore implements Persistence {
  readonly pool: Pool;
  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: Number(process.env.DB_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl:
        process.env.DB_SSL === "true"
          ? { rejectUnauthorized: true }
          : undefined,
    });
  }
  async createUser(user: PersistenceUser): Promise<void> {
    await this.pool.query(
      "INSERT INTO users (id,name,email,password_hash,created_at) VALUES ($1,$2,$3,$4,$5)",
      [user.id, user.name, user.email, user.passwordHash, user.createdAt],
    );
  }
  async findUserByEmail(email: string): Promise<PersistenceUser | undefined> {
    const { rows } = await this.pool.query(
      "SELECT id,name,email,password_hash,created_at FROM users WHERE email=$1",
      [email],
    );
    return rows[0] ? mapUser(rows[0]) : undefined;
  }
  async findUserById(id: string): Promise<PersistenceUser | undefined> {
    const { rows } = await this.pool.query(
      "SELECT id,name,email,password_hash,created_at FROM users WHERE id=$1",
      [id],
    );
    return rows[0] ? mapUser(rows[0]) : undefined;
  }
  async createSession(
    tokenHash: string,
    session: PersistenceSession,
  ): Promise<void> {
    await this.pool.query(
      "INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,$3)",
      [tokenHash, session.userId, session.expiresAt],
    );
  }
  async findSession(
    tokenHash: string,
  ): Promise<PersistenceSession | undefined> {
    const { rows } = await this.pool.query(
      "SELECT user_id,expires_at FROM sessions WHERE token_hash=$1 AND expires_at>now()",
      [tokenHash],
    );
    return rows[0]
      ? {
          userId: rows[0].user_id,
          expiresAt: new Date(rows[0].expires_at).toISOString(),
        }
      : undefined;
  }
  async deleteSession(tokenHash: string): Promise<void> {
    await this.pool.query("DELETE FROM sessions WHERE token_hash=$1", [
      tokenHash,
    ]);
  }
  async savePlan(plan: ExecutionPlan, actorId: string): Promise<void> {
    await this.pool.query(
      "INSERT INTO plans (id,actor_id,command_id,document,created_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO UPDATE SET document=EXCLUDED.document,updated_at=now() WHERE plans.actor_id=EXCLUDED.actor_id",
      [plan.id, actorId, plan.commandId, plan, plan.createdAt],
    );
  }
  async getPlan(
    id: string,
    actorId: string,
  ): Promise<ExecutionPlan | undefined> {
    const { rows } = await this.pool.query(
      "SELECT document FROM plans WHERE id=$1 AND actor_id=$2",
      [id, actorId],
    );
    return rows[0]?.document as ExecutionPlan | undefined;
  }
  async listPlans(actorId: string): Promise<ExecutionPlan[]> {
    const { rows } = await this.pool.query(
      "SELECT document FROM plans WHERE actor_id=$1 ORDER BY created_at DESC LIMIT 100",
      [actorId],
    );
    return rows.map((row) => row.document as ExecutionPlan);
  }
  async addExecution(
    planId: string,
    result: ToolExecutionResult,
  ): Promise<void> {
    await this.pool.query(
      "INSERT INTO executions (id,plan_id,document,created_at) VALUES ($1,$2,$3,$4)",
      [result.executionId, planId, result, result.completedAt],
    );
  }
  async appendAudit(event: AuditEvent): Promise<void> {
    await this.pool.query(
      "INSERT INTO audit_events (id,actor_id,command_id,plan_id,step_id,event_type,metadata,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [
        event.id,
        event.actorId,
        event.commandId ?? null,
        event.planId ?? null,
        event.stepId ?? null,
        event.type,
        event.metadata,
        event.createdAt,
      ],
    );
  }
  async listAudit(actorId: string): Promise<AuditEvent[]> {
    const { rows } = await this.pool.query(
      "SELECT id,event_type,actor_id,command_id,plan_id,step_id,metadata,created_at FROM audit_events WHERE actor_id=$1 ORDER BY created_at DESC LIMIT 500",
      [actorId],
    );
    return rows.map((row) => ({
      id: row.id,
      type: row.event_type,
      actorId: row.actor_id,
      ...(row.command_id ? { commandId: row.command_id } : {}),
      ...(row.plan_id ? { planId: row.plan_id } : {}),
      ...(row.step_id ? { stepId: row.step_id } : {}),
      metadata: row.metadata,
      createdAt: new Date(row.created_at).toISOString(),
    })) as AuditEvent[];
  }
  async ping(): Promise<void> {
    await this.pool.query("SELECT 1");
  }
  async close(): Promise<void> {
    await this.pool.end();
  }
}

function mapUser(row: Record<string, unknown>): PersistenceUser {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}
