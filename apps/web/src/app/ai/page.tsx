"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function AIPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Salut! Sunt asistentul AI IzaManagement. Cum te pot ajuta?" }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!input.trim() || busy) return;
    setError(null);
    const next = [...messages, { role: "user", content: input.trim() } as Msg];
    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/ai-assistant/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: String(data.content || "") }]);
    } catch (e: any) {
      setError(e?.message || "Eroare necunoscută");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>AI Assistant</h2>
      <p style={{ color: "#6b7280", marginBottom: 12 }}>
        Chat educațional pentru clinicieni (Groq). Configurează GROQ_API_KEY pentru răspunsuri reale.
      </p>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, minHeight: 320 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{m.role === "user" ? "Tu" : "Asistent"}</div>
            <div>{m.content}</div>
          </div>
        ))}
        {busy && <div style={{ color: "#6b7280" }}>Se generează răspunsul…</div>}
      </div>

      {error && <div style={{ color: "#b91c1c", marginTop: 8 }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Scrie mesajul…"
          style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px" }}
        />
        <button
          onClick={send}
          disabled={busy}
          style={{
            backgroundColor: "#111827",
            color: "white",
            borderRadius: 8,
            padding: "10px 14px",
            fontWeight: 600,
            opacity: busy ? 0.7 : 1
          }}
        >
          Trimite
        </button>
      </div>
    </main>
  );
}