import { prisma } from "@lib/prisma";
import type { Prisma } from "@prisma/client";

async function getData(q: string | null, limit = 200) {
  try {
    const insensitive: Prisma.QueryMode = "insensitive";
    const where: Prisma.CourseWhereInput | undefined = q
      ? {
          OR: [
            { title: { contains: q, mode: insensitive } },
            { provider: { contains: q, mode: insensitive } }
          ]
        }
      : undefined;
    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        take: limit,
        include: { specialty: true }
      }),
      prisma.course.count({ where })
    ]);
    return { items, total, ok: true };
  } catch {
    return { items: [], total: 0, ok: false };
  }
}

export default async function CoursesPage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = searchParams?.q?.trim() || null;
  const { items, total, ok } = await getData(q);

  return (
    <main>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Cursuri</h2>
      {!ok && (
        <div style={{ color: "#b91c1c", marginBottom: 12 }}>
          Baza de date nu este conectată. Setați DATABASE_URL și rulați migrațiile.
        </div>
      )}
      <form style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="Caută după titlu sau provider…"
          style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px" }}
        />
        <button
          type="submit"
          style={{ backgroundColor: "#111827", color: "white", borderRadius: 8, padding: "10px 14px", fontWeight: 600 }}
        >
          Caută
        </button>
      </form>

      <div style={{ color: "#6b7280", marginBottom: 8 }}>Rezultate: {total}</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        {items.map((c) => (
          <div key={c.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 600 }}>{c.title}</div>
            <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
              {c.provider} • {c.language?.toUpperCase() || "RO"} • {c.specialty?.name ?? "General"}
            </div>
            {c.url ? (
              <div style={{ marginTop: 8 }}>
                <a href={c.url} target="_blank" style={{ color: "#2563eb" }} rel="noreferrer">
                  Deschide pagina cursului →
                </a>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </main>
  );
}