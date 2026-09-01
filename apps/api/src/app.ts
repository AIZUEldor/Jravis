import Fastify from "fastify";
import cors from "@fastify/cors";
import {
  approvalInputSchema,
  commandInputSchema,
  loginInputSchema,
  registerInputSchema,
  type User,
} from "@jravis/contracts";
import { createDevelopmentProviders, McpGateway } from "@jravis/mcp-gateway";
import { Orchestrator } from "./services/orchestrator.js";
import { AuthService } from "./services/auth.js";
import type { Persistence } from "./services/persistence.js";
import { createPersistence } from "./db/create-persistence.js";

export type AppOptions = { logger?: boolean; persistence?: Persistence };

export async function buildApp(options: AppOptions = {}) {
  const app = Fastify({ logger: options.logger ?? true });
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(",") ?? true,
  });
  const persistence = options.persistence ?? createPersistence();
  const gateway = new McpGateway();
  createDevelopmentProviders().forEach((provider) =>
    gateway.register(provider),
  );
  const orchestrator = new Orchestrator(persistence, gateway);
  const auth = new AuthService(persistence);
  app.addHook("onClose", async () => persistence.close());

  function actor(authorization: string | undefined): Promise<User | undefined> {
    return auth.authenticate(authorization);
  }

  app.get("/health", async () => ({
    status: "ok",
    service: "jravis-api",
    version: "0.1.0",
  }));
  app.get("/ready", async (_request, reply) => {
    try {
      await persistence.ping();
      return { status: "ready", providers: gateway.providerIds() };
    } catch {
      return reply.code(503).send({ status: "not_ready" });
    }
  });

  app.post("/v1/auth/register", async (request, reply) => {
    const parsed = registerInputSchema.safeParse(request.body);
    if (!parsed.success)
      return reply.code(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid registration",
          details: parsed.error.flatten(),
        },
      });
    try {
      return reply.code(201).send(await auth.register(parsed.data));
    } catch (error) {
      const code = error instanceof Error ? error.message : "AUTH_ERROR";
      return reply
        .code(code === "ACCOUNT_EXISTS" ? 409 : 400)
        .send({ error: { code, message: "Registration failed" } });
    }
  });

  app.post("/v1/auth/login", async (request, reply) => {
    const parsed = loginInputSchema.safeParse(request.body);
    if (!parsed.success)
      return reply.code(400).send({
        error: { code: "VALIDATION_ERROR", message: "Invalid login" },
      });
    try {
      return await auth.login(
        parsed.data,
        `${request.ip}:${parsed.data.email}`,
      );
    } catch (error) {
      const code = error instanceof Error ? error.message : "AUTH_ERROR";
      return reply
        .code(code === "RATE_LIMITED" ? 429 : 401)
        .send({ error: { code, message: "Login failed" } });
    }
  });

  app.get("/v1/auth/me", async (request, reply) => {
    const user = await actor(request.headers.authorization);
    return user
      ? user
      : reply.code(401).send({
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        });
  });

  app.post("/v1/auth/logout", async (request, reply) => {
    await auth.logout(request.headers.authorization);
    return reply.code(204).send();
  });

  app.post("/v1/commands", async (request, reply) => {
    const user = await actor(request.headers.authorization);
    if (!user)
      return reply.code(401).send({
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    const parsed = commandInputSchema.safeParse(request.body);
    if (!parsed.success)
      return reply.code(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid command",
          details: parsed.error.flatten(),
        },
      });
    return reply
      .code(202)
      .send(await orchestrator.createCommand(user.id, parsed.data));
  });

  app.get("/v1/plans", async (request, reply) => {
    const user = await actor(request.headers.authorization);
    return user
      ? { data: await orchestrator.listPlans(user.id) }
      : reply.code(401).send({ error: { code: "UNAUTHORIZED" } });
  });
  app.get<{ Params: { planId: string } }>(
    "/v1/plans/:planId",
    async (request, reply) => {
      const user = await actor(request.headers.authorization);
      if (!user)
        return reply.code(401).send({ error: { code: "UNAUTHORIZED" } });
      const plan = await orchestrator.getPlan(user.id, request.params.planId);
      return plan
        ? plan
        : reply.code(404).send({
            error: { code: "PLAN_NOT_FOUND", message: "Plan not found" },
          });
    },
  );

  app.post<{ Params: { planId: string } }>(
    "/v1/plans/:planId/decision",
    async (request, reply) => {
      const user = await actor(request.headers.authorization);
      if (!user)
        return reply.code(401).send({ error: { code: "UNAUTHORIZED" } });
      const parsed = approvalInputSchema.safeParse(request.body);
      if (!parsed.success)
        return reply.code(400).send({
          error: { code: "VALIDATION_ERROR", message: "Invalid decision" },
        });
      try {
        return await orchestrator.decide(
          user.id,
          request.params.planId,
          parsed.data.approved,
        );
      } catch (error) {
        const code = error instanceof Error ? error.message : "EXECUTION_ERROR";
        const status =
          code === "PLAN_NOT_FOUND" ? 404 : code === "PLAN_EXPIRED" ? 410 : 409;
        return reply.code(status).send({
          error: { code, message: code.replaceAll("_", " ").toLowerCase() },
        });
      }
    },
  );

  app.get<{ Params: { planId: string } }>(
    "/v1/plans/:planId/executions",
    async (request, reply) => {
      const user = await actor(request.headers.authorization);
      if (!user)
        return reply.code(401).send({ error: { code: "UNAUTHORIZED" } });
      const plan = await orchestrator.getPlan(user.id, request.params.planId);
      if (!plan)
        return reply.code(404).send({ error: { code: "PLAN_NOT_FOUND" } });
      return { data: await orchestrator.getExecutions(user.id, plan.id) };
    },
  );

  app.get("/v1/audit-events", async (request, reply) => {
    const user = await actor(request.headers.authorization);
    return user
      ? { data: await orchestrator.getAudit(user.id) }
      : reply.code(401).send({ error: { code: "UNAUTHORIZED" } });
  });
  return app;
}
