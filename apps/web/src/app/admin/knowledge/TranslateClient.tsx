"use client";

import { useState } from "react";

export default function TranslateClient() {
  const [ro, setRo] = useState("");
  const [en, setEn] = useState("");
  const [busy, setBusy] = useState<"ro2en" | "en2ro" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function translate(direction: "ro2en" | "en2ro") {
    try {
      setBusy(direction);
      setErr(null);
      const from = direction === "ro2en" ? "ro" : "en";
      const to = direction === "ro2en" ? "en" : "ro";
      const markdown = direction === "ro2en" ? ro : en;

      const res = await fetch("/api/ai-assistant/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, markdown })
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (direction === "ro2en") {
        setEn(String(data.content || ""));
      } else {
        setRo(String(data.content || ""));
      }
    } catch (e: any) {
      setErr(e?.message || "Eroare necunoscută");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 8 }}>
        Traducere asistată (păstrează structura Markdown). Nu salvează automat — editați și copiați manual în formularele de mai jos.
      </div>
      {err && <div style={{ color: "#b91c1c", marginBottom: 8 }}>{err}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>RO</div>
          <textarea
            value={ro}
            onChange={(e) => setRo(e.target.value)}
            rows={14}
            placeholder="Introduceți textul în română (Markdown)…"
            style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", minHeight: 220 }}
          />
          <div style={{ marginTop: 6 }}>
            <button
              onClick={() => translate("ro2en")}
              disabled={busy !== null}
              style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "6px 10px", fontWeight: 600, opacity: busy ? 0.7 : 1 }}
            >
              Translate RO → EN
            </button>
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>EN</div>
          <textarea
            value={en}
            onChange={(e) => setEn(e.target.value)}
            rows={14}
            placeholder="Paste English text (Markdown)…"
            style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", minHeight: 220 }}
          />
          <div style={{ marginTop: 6 }}>
            <button
              onClick={() => translate("en2ro")}
              disabled={busy !== null}
              style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "6px 10px", fontWeight: 600, opacity: busy ? 0.7 : 1 }}
            >
              Translate EN → RO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}