"use client";

import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const callbackUrl = params.get("callbackUrl") || "/";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl
    });
    if (res?.error) {
      setError("Email sau parolă incorecte.");
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <main>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Autentificare</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
        <label>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Email</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="admin@izamanagement.ro"
            style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 6, padding: "10px 12px" }}
          />
        </label>
        <label>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Parolă</div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="••••••••"
            style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 6, padding: "10px 12px" }}
          />
        </label>
        {error && <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div>}
        <button
          type="submit"
          style={{
            backgroundColor: "#111827",
            color: "white",
            borderRadius: 6,
            padding: "10px 12px",
            fontWeight: 600
          }}
        >
          Intră în cont
        </button>
      </form>

      <div style={{ marginTop: 12, color: "#6b7280", fontSize: 13 }}>
        Nu ai cont? <a href="/request-access" style={{ color: "#2563eb", fontWeight: 600 }}>Cere acces</a>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main>Se încarcă…</main>}>
      <LoginForm />
    </Suspense>
  );
}