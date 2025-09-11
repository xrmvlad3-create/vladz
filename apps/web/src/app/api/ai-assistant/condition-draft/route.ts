import { chat, type AIMessage } from "@lib/groq";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, context } = body ?? {};
    if (!name) return new Response("name is required", { status: 400 });

    const prompt = [
      "Ești un asistent pentru conținut medical pentru clinicieni (limba română).",
      "Generează un draft concis și educațional pentru afecțiunea dată, cu următoarele secțiuni în format Markdown:",
      "1) Rezumat",
      "2) Manifestări clinice",
      "3) Diagnostic",
      "4) Management",
      "5) Tratamente",
      "6) Referințe (max 5, din ghiduri sau resurse recunoscute)",
      "Important: Conținut educațional pentru medici; nu este recomandare medicală pentru pacienți.",
    ].join("\n");

    const messagesRo: AIMessage[] = [
      { role: "system", content: prompt },
      { role: "user", content: JSON.stringify({ name, context }, null, 2) }
    ];

    const ro = await chat({ messages: messagesRo, max_tokens: 900 });

    const messagesEn: AIMessage[] = [
      {
        role: "system",
        content: "Translate the following Romanian medical draft to clear professional English while keeping the Markdown structure intact. Keep references intact and do not hallucinate."
      },
      { role: "user", content: ro.content }
    ];

    const en = await chat({ messages: messagesEn, max_tokens: 900 });

    return Response.json({ ro: ro.content, en: en.content });
  } catch (e: any) {
    const msg = e?.message || "unknown";
    if (msg.includes("GROQ_API_KEY")) {
      return new Response("AI not configured (set GROQ_API_KEY)", { status: 501 });
    }
    return new Response(`error: ${msg}`, { status: 500 });
  }
}