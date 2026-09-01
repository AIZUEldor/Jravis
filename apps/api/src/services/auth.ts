import {
  createHash,
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import type {
  AuthResult,
  LoginInput,
  RegisterInput,
  User,
} from "@jravis/contracts";
import type { Persistence, PersistenceUser } from "./persistence.js";

const scrypt = promisify(nodeScrypt);

export class AuthService {
  private readonly attempts = new Map<
    string,
    { count: number; resetAt: number }
  >();
  constructor(private readonly persistence: Persistence) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    if (await this.persistence.findUserByEmail(input.email))
      throw new Error("ACCOUNT_EXISTS");
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(input.password))
      throw new Error("WEAK_PASSWORD");
    const user: PersistenceUser = {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      createdAt: new Date().toISOString(),
    };
    try {
      await this.persistence.createUser(user);
    } catch (error) {
      if (isUniqueViolation(error)) throw new Error("ACCOUNT_EXISTS");
      throw error;
    }
    return this.createSession(user);
  }

  async login(input: LoginInput, clientKey: string): Promise<AuthResult> {
    this.checkRateLimit(clientKey);
    const user = await this.persistence.findUserByEmail(input.email);
    const valid = user
      ? await verifyPassword(input.password, user.passwordHash)
      : await burnPasswordTime(input.password);
    if (!user || !valid) {
      this.recordFailure(clientKey);
      throw new Error("INVALID_CREDENTIALS");
    }
    this.attempts.delete(clientKey);
    return this.createSession(user);
  }

  async authenticate(header: string | undefined): Promise<User | undefined> {
    if (!header?.startsWith("Bearer ")) return undefined;
    const key = digestToken(header.slice(7).trim());
    const session = await this.persistence.findSession(key);
    if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
      if (session) await this.persistence.deleteSession(key);
      return undefined;
    }
    const user = await this.persistence.findUserById(session.userId);
    return user ? publicUser(user) : undefined;
  }

  async logout(header: string | undefined): Promise<void> {
    if (header?.startsWith("Bearer "))
      await this.persistence.deleteSession(digestToken(header.slice(7).trim()));
  }

  private async createSession(user: PersistenceUser): Promise<AuthResult> {
    const token = `jrv_${randomBytes(32).toString("base64url")}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString();
    await this.persistence.createSession(digestToken(token), {
      userId: user.id,
      expiresAt,
    });
    return { token, expiresAt, user: publicUser(user) };
  }

  private checkRateLimit(key: string): void {
    const attempt = this.attempts.get(key);
    if (attempt && attempt.resetAt > Date.now() && attempt.count >= 5)
      throw new Error("RATE_LIMITED");
    if (attempt && attempt.resetAt <= Date.now()) this.attempts.delete(key);
  }
  private recordFailure(key: string): void {
    const current = this.attempts.get(key);
    this.attempts.set(key, {
      count: (current?.count ?? 0) + 1,
      resetAt: current?.resetAt ?? Date.now() + 15 * 60_000,
    });
  }
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}
async function verifyPassword(
  password: string,
  encoded: string,
): Promise<boolean> {
  const [, saltText, hashText] = encoded.split("$");
  if (!saltText || !hashText) return false;
  const expected = Buffer.from(hashText, "base64url");
  const actual = (await scrypt(
    password,
    Buffer.from(saltText, "base64url"),
    expected.length,
  )) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
async function burnPasswordTime(password: string): Promise<boolean> {
  await scrypt(password, Buffer.alloc(16, 7), 64);
  return false;
}
function digestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
function publicUser(user: PersistenceUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
