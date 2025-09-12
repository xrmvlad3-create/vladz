import { chat, type AIMessage } from "@lib/groq";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { from = "ro", to = "en", markdown = "", instruction = "" } = body ?? {};
    if (!markdown || (from !== "ro" && from !== "en") || (to !== "ro" && to !== "en")) {
      return new Response("invalid input", { status: 400 });
    }
    if (from === to) {
      return Response.json({ content: markdown });
    }

    const sys =
      "You are a professional medical translator for clinicians. " +
      "Translate between Romanian (ro) and English (en) carefully while keeping the original Markdown structure, lists, headings and references unchanged. " +
      "Do not add extra content. Preserve clinical meaning and terminology. " +
      (instruction ? `Additional instruction: ${instruction}` : "");

    const messages: AIMessage[] = [
      { role: "system", content: sys },
      { role: "user", content: markdown }
    ];

    const res = await chat({ messages, max_tokens: 1200 });
    return Response.json({ content: res.content });
  } catch (e: any) {
    const msg = e?.message || "unknown";
    if (msg.includes("GROQ_API_KEY")) {
      return new Response("AI not configured (set GROQ_API_KEY)", { status: 501 });
    }
    return new Response(`error: ${msg}`, { status: 500 });
  }
}