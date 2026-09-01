import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("Jravis API", () => {
  it("reports health", async () => {
    const app = await buildApp({ logger: false });
    expect((await app.inject({ method: "GET", url: "/health" })).statusCode).toBe(200);
    await app.close();
  });

  it("creates, approves and executes a safe plan", async () => {
    const app = await buildApp({ logger: false });
    const created = await app.inject({ method: "POST", url: "/v1/commands", payload: { text: "Ertaga soat 5:00 ga budilnik qo‘y" } });
    expect(created.statusCode).toBe(202);
    const planId = created.json().plan.id as string;
    expect(created.json().plan.intent).toBe("reminder");
    expect(created.json().plan.status).toBe("awaiting_approval");
    const executed = await app.inject({ method: "POST", url: `/v1/plans/${planId}/decision`, payload: { approved: true } });
    expect(executed.json().status).toBe("succeeded");
    const audit = await app.inject({ method: "GET", url: "/v1/audit-events" });
    expect(audit.json().data.map((event: { type: string }) => event.type)).toContain("tool.succeeded");
    await app.close();
  });

  it("requires every-time approval for messages", async () => {
    const app = await buildApp({ logger: false });
    const response = await app.inject({ method: "POST", url: "/v1/commands", payload: { text: "Telegramda userga xabar yubor" } });
    expect(response.json().plan.steps[0].approvalMode).toBe("ASK_EVERY_TIME");
    await app.close();
  });

  it("rejects invalid input", async () => {
    const app = await buildApp({ logger: false });
    expect((await app.inject({ method: "POST", url: "/v1/commands", payload: { text: "" } })).statusCode).toBe(400);
    await app.close();
  });
});
