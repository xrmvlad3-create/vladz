import { redis } from "@lib/redis";

/**
 * Simple IP-based sliding window limiter using Upstash Redis.
 * Falls back to always-allow if Redis is not configured (noop client).
 */
export async function rateLimit({
  key,
  limit,
  windowSeconds
}: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  // If redis is a noop (no UPSTASH_*), just allow
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { allowed: true, remaining: limit, reset: Math.floor(Date.now() / 1000) + windowSeconds };
  }

  const now = Math.floor(Date.now() / 1000);
  const bucketKey = `rl:${key}`;

  // Increment counter
  const currentRaw = await redis.get<number>(bucketKey);
  const current = typeof currentRaw === "number" ? currentRaw : 0;

  if (current >= limit) {
    const ttl = await redis.ttl(bucketKey as any).catch(() => -1 as any);
    const reset = ttl && ttl > 0 ? now + ttl : now + windowSeconds;
    return { allowed: false, remaining: 0, reset };
  }

  // First request sets TTL
  if (current === 0) {
    await redis.set(bucketKey, 1, { ex: windowSeconds });
  } else {
    await redis.set(bucketKey, current + 1);
  }

  return { allowed: true, remaining: Math.max(0, limit - (current + 1)), reset: now + windowSeconds };
}

/**
 * Resolve a best-effort client IP from request headers (Vercel-friendly).
 */
export function clientIpFromHeaders(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // take first IP in list
    const ip = forwardedFor.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}