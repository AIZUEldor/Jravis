import type { Capability, ToolExecutionResult } from "@jravis/contracts";

export type ToolProvider = { id: string; trusted: boolean; capabilities: readonly Capability[]; execute(capability: string, input: Record<string, unknown>, idempotencyKey: string): Promise<ToolExecutionResult> };

export class McpGateway {
  private readonly providers = new Map<string, ToolProvider>();
  register(provider: ToolProvider): void {
    if (!provider.trusted) throw new Error(`Refusing untrusted provider: ${provider.id}`);
    for (const capability of provider.capabilities) {
      if (this.providers.has(capability.name)) throw new Error(`Capability already registered: ${capability.name}`);
      this.providers.set(capability.name, provider);
    }
  }
  has(capability: string): boolean { return this.providers.has(capability); }
  isTrusted(capability: string): boolean { return this.providers.get(capability)?.trusted === true; }
  async execute(capability: string, input: Record<string, unknown>, idempotencyKey: string): Promise<ToolExecutionResult> {
    const provider = this.providers.get(capability);
    if (!provider) throw new Error(`No provider for capability: ${capability}`);
    return provider.execute(capability, structuredClone(input), idempotencyKey);
  }
}

export function createFakeProvider(): ToolProvider {
  const capabilities: Capability[] = [
    { name: "tasks.create", version: "1.0.0", risk: "L1", description: "Create a local task", supportsDryRun: true },
    { name: "notes.create", version: "1.0.0", risk: "L1", description: "Create a local note", supportsDryRun: true },
    { name: "clock.alarm.create", version: "1.0.0", risk: "L2", description: "Create an alarm", supportsDryRun: true },
    { name: "automation.create", version: "1.0.0", risk: "L2", description: "Create a deterministic workflow", supportsDryRun: true },
    { name: "media.render_video", version: "1.0.0", risk: "L2", description: "Render video from selected media", supportsDryRun: true },
    { name: "messaging.telegram.send", version: "1.0.0", risk: "L3", description: "Send Telegram message", supportsDryRun: true }
  ];
  return { id: "fake.local", trusted: true, capabilities, async execute(capability, input, idempotencyKey) { return { executionId: crypto.randomUUID(), provider: "fake.local", output: { capability, input, idempotencyKey, simulated: true }, verified: true, completedAt: new Date().toISOString() }; } };
}

