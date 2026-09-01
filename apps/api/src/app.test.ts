import { describe, expect, it } from "vitest";
import { buildApp, detectIntent } from "./app.js";

describe("command orchestration", () => {
  it("detects reminders", () => expect(detectIntent("Ertaga qo‘ng‘iroqni eslat")).toBe("reminder"));
  it("accepts a valid command", async () => {
    const app = await buildApp();
    const response = await app.inject({ method: "POST", url: "/v1/commands", payload: { text: "G‘oyani qayd qil", source: "text" } });
    expect(response.statusCode).toBe(202);
    await app.close();
  });
});

