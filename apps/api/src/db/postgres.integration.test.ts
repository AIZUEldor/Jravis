import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { migrate } from "./migrate.js";
import { PostgresStore } from "./postgres-store.js";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("PostgreSQL persistence", () => {
  it("keeps users and sessions across app restarts", async () => {
    await migrate(url);
    const email = `integration-${crypto.randomUUID()}@example.com`;
    const firstStore = new PostgresStore(url!);
    const firstApp = await buildApp({ logger: false, persistence: firstStore });
    const registered = await firstApp.inject({
      method: "POST",
      url: "/v1/auth/register",
      payload: { name: "Persistent User", email, password: "Securepass123" },
    });
    expect(registered.statusCode).toBe(201);
    const token = registered.json().token as string;
    await firstApp.close();

    const secondStore = new PostgresStore(url!);
    const secondApp = await buildApp({
      logger: false,
      persistence: secondStore,
    });
    const me = await secondApp.inject({
      method: "GET",
      url: "/v1/auth/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().email).toBe(email);
    await secondStore.pool.query("DELETE FROM users WHERE email=$1", [email]);
    await secondApp.close();
  });
});
