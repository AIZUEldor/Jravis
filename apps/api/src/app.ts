import Fastify from "fastify";
import cors from "@fastify/cors";
import { approvalInputSchema, commandInputSchema } from "@jravis/contracts";
import { createFakeProvider, McpGateway } from "@jravis/mcp-gateway";
import { Orchestrator } from "./services/orchestrator.js";
import { MemoryStore } from "./services/store.js";

export type AppOptions = { logger?: boolean };

export async function buildApp(options: AppOptions = {}) {
  const app = Fastify({ logger: options.logger ?? true });
  await app.register(cors, { origin: process.env.CORS_ORIGIN?.split(",") ?? true });
  const gateway = new McpGateway(); gateway.register(createFakeProvider());
  const orchestrator = new Orchestrator(new MemoryStore(), gateway);

  app.get("/health", async () => ({ status: "ok", service: "jravis-api", version: "0.1.0" }));
  app.get("/ready", async () => ({ status: "ready", providers: ["fake.local"] }));

  app.post("/v1/commands", async (request, reply) => {
    const parsed = commandInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: { code: "VALIDATION_ERROR", message: "Invalid command", details: parsed.error.flatten() } });
    return reply.code(202).send(orchestrator.createCommand(parsed.data));
  });

  app.get("/v1/plans", async () => ({ data: orchestrator.listPlans() }));
  app.get<{ Params: { planId: string } }>("/v1/plans/:planId", async (request, reply) => {
    const plan = orchestrator.getPlan(request.params.planId);
    return plan ? plan : reply.code(404).send({ error: { code: "PLAN_NOT_FOUND", message: "Plan not found" } });
  });

  app.post<{ Params: { planId: string } }>("/v1/plans/:planId/decision", async (request, reply) => {
    const parsed = approvalInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: { code: "VALIDATION_ERROR", message: "Invalid decision" } });
    try { return await orchestrator.decide(request.params.planId, parsed.data.approved); }
    catch (error) {
      const code = error instanceof Error ? error.message : "EXECUTION_ERROR";
      const status = code === "PLAN_NOT_FOUND" ? 404 : code === "PLAN_EXPIRED" ? 410 : 409;
      return reply.code(status).send({ error: { code, message: code.replaceAll("_", " ").toLowerCase() } });
    }
  });

  app.get("/v1/audit-events", async () => ({ data: orchestrator.getAudit() }));
  return app;
}

