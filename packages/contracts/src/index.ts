import { z } from "zod";

export const commandInputSchema = z.object({
  text: z.string().trim().min(1).max(4000),
  source: z.enum(["text", "voice"]).default("text"),
  locale: z.string().default("uz-UZ")
});

export type CommandInput = z.infer<typeof commandInputSchema>;
export type Intent = "task" | "reminder" | "note" | "automation";
export type CommandResult = {
  id: string;
  intent: Intent;
  summary: string;
  status: "accepted";
  createdAt: string;
};

