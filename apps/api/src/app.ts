import Fastify from "fastify";
import cors from "@fastify/cors";
import { commandInputSchema, type CommandResult, type Intent } from "@jravis/contracts";

export function detectIntent(text: string): Intent {
  const value = text.toLocaleLowerCase("uz");
  if (/eslat|soat|ertaga|bugun/.test(value)) return "reminder";
  if (/avtomat|har safar|agar/.test(value)) return "automation";
  if (/qayd|yozib qo'y|saqla/.test(value)) return "note";
  return "task";
}

export async function buildApp() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  app.get("/health", async () => ({ status: "ok", service: "jravis-api" }));
  app.post("/v1/commands", async (request, reply) => {
    const parsed = commandInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Noto‘g‘ri buyruq", details: parsed.error.flatten() });
    const result: CommandResult = {
      id: crypto.randomUUID(),
      intent: detectIntent(parsed.data.text),
      summary: parsed.data.text,
      status: "accepted",
      createdAt: new Date().toISOString()
    };
    return reply.code(202).send(result);
  });
  return app;
}

