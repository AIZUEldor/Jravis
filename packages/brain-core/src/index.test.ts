import { describe, expect, it } from "vitest";
import { routeCommand } from "./index.js";
const input = (text: string) => ({ text, source: "text" as const, locale: "uz-UZ", timezone: "Asia/Tashkent" });
describe("central brain router", () => {
  it("routes an alarm and extracts time", () => { const result = routeCommand(input("Soat 05:00 ga budilnik qo‘y")); expect(result.intent).toBe("reminder"); expect(result.entities.time).toBe("05:00"); });
  it("requests missing recipient", () => { const result = routeCommand(input("Telegramda xabar yubor")); expect(result.missingFields).toContain("recipient"); });
  it("creates a multi-step Instagram media route", () => expect(routeCommand(input("Rasmlardan video qil va Instagramga joyla")).capabilityNames).toEqual(["media.render_video", "social.instagram.publish"]));
  it("clarifies an unknown request", () => expect(routeCommand(input("Shuni qil")).missingFields).toContain("intent"));
});
