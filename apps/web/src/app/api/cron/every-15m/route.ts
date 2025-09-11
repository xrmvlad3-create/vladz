import { redis } from "@lib/redis";

export async function GET(req: Request) {
  try {
    const configuredSecret = process.env.CRON_SECRET;
    if (configuredSecret) {
      const provided = req.headers.get("x-cron-secret") ?? "";
      if (provided !== configuredSecret) {
        return new Response("Forbidden", { status: 403 });
      }
    }

    const ts = new Date().toISOString();
    await redis.set("last_cron_run", ts);
    return new Response(`ok ${ts}`, { status: 200 });
  } catch (e: any) {
    return new Response(`error: ${e?.message ?? "unknown"}`, { status: 500 });
  }
}