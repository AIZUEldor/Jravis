import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

async function register(
  app: Awaited<ReturnType<typeof buildApp>>,
  email = "test@example.com",
) {
  const response = await app.inject({
    method: "POST",
    url: "/v1/auth/register",
    payload: { name: "Test User", email, password: "Securepass123" },
  });
  return response.json().token as string;
}

describe("Jravis API", () => {
  it("reports health", async () => {
    const app = await buildApp({ logger: false });
    expect(
      (await app.inject({ method: "GET", url: "/health" })).statusCode,
    ).toBe(200);
    await app.close();
  });

  it("creates, approves and executes a safe plan", async () => {
    const app = await buildApp({ logger: false });
    const token = await register(app);
    const headers = { authorization: `Bearer ${token}` };
    const created = await app.inject({
      method: "POST",
      url: "/v1/commands",
      headers,
      payload: { text: "Ertaga soat 05:00 ga budilnik qo‘y" },
    });
    expect(created.statusCode).toBe(202);
    const planId = created.json().plan.id as string;
    expect(created.json().plan.intent).toBe("reminder");
    expect(created.json().plan.status).toBe("awaiting_approval");
    const executed = await app.inject({
      method: "POST",
      url: `/v1/plans/${planId}/decision`,
      headers,
      payload: { approved: true },
    });
    expect(executed.json().status).toBe("succeeded");
    const audit = await app.inject({
      method: "GET",
      url: "/v1/audit-events",
      headers,
    });
    expect(
      audit.json().data.map((event: { type: string }) => event.type),
    ).toContain("tool.succeeded");
    await app.close();
  });

  it("requires every-time approval for messages", async () => {
    const app = await buildApp({ logger: false });
    const token = await register(app);
    const response = await app.inject({
      method: "POST",
      url: "/v1/commands",
      headers: { authorization: `Bearer ${token}` },
      payload: { text: "Telegramda @example_user ga xabar yubor" },
    });
    expect(response.json().plan.steps[0].approvalMode).toBe("ASK_EVERY_TIME");
    await app.close();
  });

  it("rejects invalid input", async () => {
    const app = await buildApp({ logger: false });
    const token = await register(app);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/v1/commands",
          headers: { authorization: `Bearer ${token}` },
          payload: { text: "" },
        })
      ).statusCode,
    ).toBe(400);
    await app.close();
  });

  it("authenticates and isolates user plans", async () => {
    const app = await buildApp({ logger: false });
    const first = await register(app, "first@example.com");
    const second = await register(app, "second@example.com");
    await app.inject({
      method: "POST",
      url: "/v1/commands",
      headers: { authorization: `Bearer ${first}` },
      payload: { text: "Vazifa yarat" },
    });
    const plans = await app.inject({
      method: "GET",
      url: "/v1/plans",
      headers: { authorization: `Bearer ${second}` },
    });
    expect(plans.json().data).toHaveLength(0);
    await app.close();
  });

  it("returns clarification instead of guessing", async () => {
    const app = await buildApp({ logger: false });
    const token = await register(app);
    const response = await app.inject({
      method: "POST",
      url: "/v1/commands",
      headers: { authorization: `Bearer ${token}` },
      payload: { text: "Telegramda xabar yubor" },
    });
    expect(response.json().status).toBe("clarification_required");
    expect(response.json().brain.missingFields).toContain("recipient");
    await app.close();
  });

  it("receives external video artifacts and forwards them to the publish step", async () => {
    const app = await buildApp({ logger: false });
    const token = await register(app);
    const headers = { authorization: `Bearer ${token}` };
    const command = await app.inject({
      method: "POST",
      url: "/v1/commands",
      headers,
      payload: { text: "Rasmlardan video qil va Instagramga joyla" },
    });
    const planId = command.json().plan.id as string;
    await app.inject({
      method: "POST",
      url: `/v1/plans/${planId}/decision`,
      headers,
      payload: { approved: true },
    });
    const executions = await app.inject({
      method: "GET",
      url: `/v1/plans/${planId}/executions`,
      headers,
    });
    expect(executions.statusCode).toBe(200);
    expect(executions.json().data[0].artifacts[0].kind).toBe("video");
    expect(
      executions.json().data[1].output.input.upstreamArtifacts[0].kind,
    ).toBe("video");
    await app.close();
  });
});
