import { prisma } from "@lib/prisma";

async function getStatus() {
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasRedis =
    !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return {
    db: dbOk ? "ok" : "not-configured",
    ai: hasGroq ? "configured" : "not-configured",
    redis: hasRedis ? "configured" : "not-configured",
    time: new Date().toISOString()
  };
}

export default async function PreviewPage() {
  const status = await getStatus();

  return (
    <main>
      <section style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
            Previzualizare IzaManagement
          </h2>
          <p style={{ color: "#6b7280", marginTop: 10 }}>
            Aceasta este o pagină de previzualizare rapidă care nu necesită configurarea completă.
            Poți verifica statusul serviciilor și poți naviga către zonele cheie ale aplicației.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <a href="/login" style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "10px 14px", fontWeight: 700 }}>
              Autentificare
            </a>
            <a href="/ai" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontWeight: 600, color: "#111827" }}>
              Asistent AI
            </a>
            <a href="/conditions" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontWeight: 600, color: "#111827" }}>
              Afecțiuni
            </a>
            <a href="/procedures" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontWeight: 600, color: "#111827" }}>
              Proceduri
            </a>
          </div>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Status servicii</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Bază de date: <strong>{status.db}</strong></li>
            <li>AI (Groq): <strong>{status.ai}</strong></li>
            <li>Redis (Upstash): <strong>{status.redis}</strong></li>
            <li>Ora server: <strong>{status.time}</strong></li>
          </ul>
          <div style={{ color: "#6b7280", fontSize: 12, marginTop: 8 }}>
            Dacă DB este „not-configured”, setează variabila DATABASE_URL și rulează migrațiile/seeding.
          </div>
        </div>
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Pași rapizi</div>
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          <li>Instalează dependențele: <code>npm install</code></li>
          <li>Rulează local: <code>npm run dev</code> și deschide <code>http://localhost:3000/preview</code></li>
          <li>Opțional: configurează <code>DATABASE_URL</code>, <code>NEXTAUTH_SECRET</code>, <code>SEED_SECRET</code></li>
        </ol>
      </section>
    </main>
  );
}