import { prisma } from "@lib/prisma";
import { hasDatabaseUrl } from "@lib/env";

export async function GET() {
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

  let dbOk = false;
  if (hasDatabaseUrl()) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch (e) {
      console.warn("api/health", e instanceof Error ? e.message : e);
      dbOk = false;
    }
  }

  const body = JSON.stringify({
    status: "healthy",
    db: dbOk ? "ok" : hasDatabaseUrl() ? "error" : "not-configured",
    ai: hasGroq ? "configured" : "not-configured",
    redis: hasRedis ? "configured" : "not-configured",
    time: new Date().toISOString()
  });

  return new Response(body, {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
