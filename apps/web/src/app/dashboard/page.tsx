import { prisma } from "@lib/prisma";
import { hasDatabaseUrl, missingDatabaseMessage } from "@lib/env";

export const dynamic = "force-dynamic";

type Stats = { specialties: number; conditions: number; procedures: number; courses: number; ok: boolean };

async function getCounts(): Promise<Stats> {
  if (!hasDatabaseUrl()) {
    return { specialties: 0, conditions: 0, procedures: 0, courses: 0, ok: false };
  }

  try {
    const [specialties, conditions, procedures, courses] = await Promise.all([
      prisma.specialty.count(),
      prisma.condition.count(),
      prisma.procedure.count(),
      prisma.course.count()
    ]);
    return { specialties, conditions, procedures, courses, ok: true };
  } catch (e) {
    console.warn("dashboard:getCounts", e instanceof Error ? e.message : e);
    return { specialties: 0, conditions: 0, procedures: 0, courses: 0, ok: false };
  }
}

export default async function DashboardPage() {
  const stats = await getCounts();

  return (
    <main>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Dashboard</h2>
        {!stats.ok && (
          <p style={{ color: "#b91c1c", marginTop: 8 }}>
            {missingDatabaseMessage()} Configure migrations cu <code>npx prisma migrate deploy</code> si seed cu <code>npm run seed</code> dupa ce setezi conexiunea.
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        <Card title="Specialitati" value={stats.specialties} />
        <Card title="Afectiuni" value={stats.conditions} />
        <Card title="Proceduri" value={stats.procedures} />
        <Card title="Cursuri" value={stats.courses} />
      </div>

      <section style={{ marginTop: 24 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Resurse</h3>
        <ul style={{ listStyle: "disc", marginLeft: 18 }}>
          <li>API de sanatate: <a href="/api/health" style={{ color: "#2563eb" }}>/api/health</a></li>
          <li>Seed API (protejat cu SEED_SECRET): <code>/api/seed</code></li>
        </ul>
      </section>
    </main>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
      <div style={{ color: "#6b7280", fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
