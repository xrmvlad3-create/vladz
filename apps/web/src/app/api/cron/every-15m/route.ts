import { redis } from "@lib/redis";

export async function GET() {
  try {
    const ts = new Date().toISOString();
    await redis.set("last_cron_run", ts);
    return new Response(`ok ${ts}`, { status: 200 });
  } catch (e: any) {
    return new Response(`error: ${e?.message ?? "unknown"}`, { status: 500 });
  }
}