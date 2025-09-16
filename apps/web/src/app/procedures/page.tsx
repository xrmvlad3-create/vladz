import { prisma } from "@lib/prisma";
import type { Prisma } from "@prisma/client";

async function getData(q: string | null, limit = 200) {
  try {
    const insensitive: Prisma.QueryMode = "insensitive";
    const where: Prisma.ProcedureWhereInput | undefined = q
      ? {
          OR: [
            { name: { contains: q, mode: insensitive } },
            { slug: { contains: q, mode: insensitive } }
          ]
        }
      : undefined;
    const [items, total] = await Promise.all([
      prisma.procedure.findMany({
        where,
        orderBy: [{ name: "asc" }],
        take: limit,
        include: { specialty: true }
      }),
      prisma.procedure.count({ where })
    ]);
    return { items, total, ok: true };
  } catch {
    return { items: [], total: 0, ok: false };
  }
}

export default async function ProceduresPage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = searchParams?.q?.trim() || null;
  const { items, total, ok } = await getData(q);

  return (
    <main>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Proceduri</h2>
      {!ok && (
        <div style={{ color: "#b91c1c", marginBottom: 12 }}>
          Baza de date nu este conectată. Setați DATABASE_URL și rulați migrațiile.
        </div>
      )}
      <form style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="Caută după nume sau slug…"
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
        {items.map((p) => (
          <div key={p.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div className="tag" style={{ fontSize: 12, color: "#374151" }}>
                {p.specialty?.name ?? "General"}
              </div>
            </div>
            <div style={{ color: "#6b7280", fontSize: 12 }}>slug: {p.slug}</div>
          </div>
        ))}
      </div>
    </main>
  );
}