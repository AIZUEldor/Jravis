import "dotenv/config";
import { buildApp } from "./app.js";

const app = await buildApp({ logger: true });
const port = Number(process.env.PORT ?? 4000);
const shutdown = async (signal: string) => {
  app.log.info({ signal }, "Shutting down");
  await app.close();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
await app.listen({ port, host: "0.0.0.0" });
