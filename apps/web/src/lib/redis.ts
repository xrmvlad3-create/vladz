import { Redis } from "@upstash/redis";

/**
 * Create a Redis client if Upstash credentials are configured.
 * Falls back to a no-op client so endpoints (e.g. cron) won't fail
 * when UPSTASH_* env vars are not set in non-production environments.
 */
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

type NoopRedis = {
  get: (key: string) => Promise<null>;
  set: (...args: any[]) => Promise<"OK">;
  del: (...args: any[]) => Promise<number>;
};

const noop: NoopRedis = {
  async get() { return null; },
  async set() { return "OK"; },
  async del() { return 0; }
};

export const redis = url && token ? new Redis({ url, token }) : (noop as unknown as Redis);