import type {
  Capability,
  ExecutionTarget,
  ToolExecutionResult,
} from "@jravis/contracts";

export type ToolProvider = {
  id: string;
  trusted: boolean;
  executionTarget: ExecutionTarget;
  capabilities: readonly Capability[];
  execute(
    capability: string,
    input: Record<string, unknown>,
    idempotencyKey: string,
  ): Promise<ToolExecutionResult>;
};

export class McpGateway {
  private readonly providers = new Map<string, ToolProvider>();

  register(provider: ToolProvider): void {
    if (!provider.trusted)
      throw new Error(`Refusing untrusted provider: ${provider.id}`);
    for (const capability of provider.capabilities) {
      if (capability.executionTarget !== provider.executionTarget)
        throw new Error(`Execution target mismatch for ${capability.name}`);
      if (this.providers.has(capability.name))
        throw new Error(`Capability already registered: ${capability.name}`);
      this.providers.set(capability.name, provider);
    }
  }

  has(capability: string): boolean {
    return this.providers.has(capability);
  }
  isTrusted(capability: string): boolean {
    return this.providers.get(capability)?.trusted === true;
  }
  providerIds(): string[] {
    return [
      ...new Set([...this.providers.values()].map((provider) => provider.id)),
    ];
  }

  async execute(
    capability: string,
    input: Record<string, unknown>,
    idempotencyKey: string,
  ): Promise<ToolExecutionResult> {
    const provider = this.providers.get(capability);
    if (!provider) throw new Error(`No provider for capability: ${capability}`);
    return provider.execute(capability, structuredClone(input), idempotencyKey);
  }
}

export function createDevelopmentProviders(): ToolProvider[] {
  const local: ToolProvider = {
    id: "development.local-core",
    trusted: true,
    executionTarget: "local_core",
    capabilities: [
      capability(
        "tasks.create",
        "L1",
        "Create a local task",
        "local_core",
        "none",
      ),
      capability(
        "notes.create",
        "L1",
        "Create a local note",
        "local_core",
        "none",
      ),
      capability(
        "automation.create",
        "L2",
        "Create a deterministic workflow",
        "local_core",
        "none",
      ),
    ],
    execute: simulatedExecution("development.local-core"),
  };
  const device: ToolProvider = {
    id: "development.device-bridge",
    trusted: true,
    executionTarget: "device_bridge",
    capabilities: [
      capability(
        "clock.alarm.create",
        "L2",
        "Create an alarm on the user device",
        "device_bridge",
        "metadata_only",
      ),
    ],
    execute: simulatedExecution("development.device-bridge"),
  };
  const remoteMcp: ToolProvider = {
    id: "development.remote-mcp",
    trusted: true,
    executionTarget: "remote_mcp",
    capabilities: [
      capability(
        "media.video.generate",
        "L2",
        "Generate video with an external AI service",
        "remote_mcp",
        "selected_content",
      ),
      capability(
        "social.instagram.publish",
        "L3",
        "Publish approved artifact to Instagram",
        "remote_mcp",
        "selected_content",
      ),
      capability(
        "messaging.telegram.send",
        "L3",
        "Send Telegram message",
        "remote_mcp",
        "selected_content",
      ),
    ],
    async execute(capabilityName, input, idempotencyKey) {
      const executionId = crypto.randomUUID();
      const isVideo = capabilityName === "media.video.generate";
      return {
        executionId,
        provider: "development.remote-mcp",
        output: {
          capability: capabilityName,
          input,
          idempotencyKey,
          simulatedRemoteMcp: true,
        },
        artifacts: isVideo
          ? [
              {
                id: crypto.randomUUID(),
                kind: "video",
                mimeType: "video/mp4",
                uri: `mcp+artifact://development.remote-mcp/${executionId}/result.mp4`,
                expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
              },
            ]
          : [],
        verified: true,
        completedAt: new Date().toISOString(),
      };
    },
  };
  return [local, device, remoteMcp];
}

function capability(
  name: string,
  risk: Capability["risk"],
  description: string,
  executionTarget: ExecutionTarget,
  dataEgress: Capability["dataEgress"],
): Capability {
  return {
    name,
    version: "1.0.0",
    risk,
    description,
    supportsDryRun: true,
    executionTarget,
    dataEgress,
  };
}
function simulatedExecution(provider: string): ToolProvider["execute"] {
  return async (capabilityName, input, idempotencyKey) => ({
    executionId: crypto.randomUUID(),
    provider,
    output: {
      capability: capabilityName,
      input,
      idempotencyKey,
      simulated: true,
    },
    artifacts: [],
    verified: true,
    completedAt: new Date().toISOString(),
  });
}
