import { chat, type AIMessage } from "@lib/groq";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { symptoms = [], age, gender, context } = body ?? {};

    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return new Response("symptoms[] is required", { status: 400 });
    }

    const prompt = [
      "Ești un asistent pentru diagnostic diferențial. Primești simptome, vârstă, sex și opțional context.",
      "Returnează:",
      "1) 5-8 diagnostice diferențiale probabile (cu probabilitate aproximativă)",
      "2) Red flags / criterii de gravitate",
      "3) Întrebări suplimentare utile",
      "4) Investigații inițiale recomandate (de clasă generală, nu branduri)",
      "5) Trimiteri / când este indicată",
      "",
      "Important: Acesta este conținut educațional, nu recomandare medicală pentru pacienți."
    ].join("\n");

    const messages: AIMessage[] = [
      { role: "system", content: prompt },
      {
        role: "user",
        content: JSON.stringify({ symptoms, age, gender, context }, null, 2)
      }
    ];

    const result = await chat({ messages, max_tokens: 900 });
    return Response.json({ content: result.content });
  } catch (e: any) {
    const msg = e?.message || "unknown";
    if (msg.includes("GROQ_API_KEY")) {
      return new Response("AI not configured (set GROQ_API_KEY)", { status: 501 });
    }
    return new Response(`error: ${msg}`, { status: 500 });
  }
}