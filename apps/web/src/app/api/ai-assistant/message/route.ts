import { chat, type AIMessage } from "@lib/groq";
import { rateLimit, clientIpFromHeaders } from "@lib/rate-limit";

export async function POST(req: Request) {
  try {
    // Basic rate limit: 30 requests / 5 minutes per IP (if Upstash configured)
    const ip = clientIpFromHeaders(req.headers);
    const rl = await rateLimit({ key: `ai:msg:${ip}`, limit: 30, windowSeconds: 300 });
    if (!rl.allowed) {
      return new Response("Rate limit exceeded. Try again later.", {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, rl.reset - Math.floor(Date.now() / 1000))) }
      });
    }

    const body = await req.json().catch(() => ({}));
    const { messages, temperature, max_tokens, model } = body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response("messages[] is required", { status: 400 });
    }

    const sys: AIMessage = {
      role: "system",
      content:
        "You are a helpful, careful medical assistant for Romanian clinicians. " +
        "You provide educational guidance, not medical advice for patients. " +
        "Always remind to consult clinical guidelines and use clinical judgment."
    };

    const normalized: AIMessage[] = [
      sys,
      ...messages.map((m: any): AIMessage => ({
        role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
        content: String(m.content ?? "")
      }))
    ];

    const result = await chat({
      messages: normalized,
      temperature: typeof temperature === "number" ? temperature : 0.2,
      max_tokens: typeof max_tokens === "number" ? max_tokens : 800,
      model: typeof model === "string" && model ? model : undefined
    });

    return Response.json({ content: result.content, model: model || process.env.GROQ_MODEL || "llama-3.1-70b-versatile" });
  } catch (e: any) {
    const msg = e?.message || "unknown";
    if (msg.includes("GROQ_API_KEY")) {
      return new Response("AI not configured (set GROQ_API_KEY)", { status: 501 });
    }
    return new Response(`error: ${msg}`, { status: 500 });
  }
}