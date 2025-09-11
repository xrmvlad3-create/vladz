export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const endpoint = "https://api.groq.com/openai/v1/chat/completions";

export async function chat({
  messages,
  model = process.env.GROQ_MODEL || "llama-3.1-70b-versatile",
  temperature = 0.2,
  max_tokens = 1024
}: {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not set");
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens,
      messages
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API error (${res.status}): ${text}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content ?? "";
  return { content, raw: json };
}