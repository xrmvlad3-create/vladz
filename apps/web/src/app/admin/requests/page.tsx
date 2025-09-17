import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth";
import { prisma } from "@lib/prisma";
import { revalidatePath } from "next/cache";

async function updateStatusAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "new");
  if (!id) return;
  await prisma.requestAccess.update({ where: { id }, data: { status } }).catch(() => {});
  revalidatePath("/admin/requests");
  return { ok: true };
}

async function deleteAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.requestAccess.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/requests");
  return { ok: true };
}

async function getData(q: string | null, status: string | null, page = 1, perPage = 20) {
  const where: any = {};
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { organization: { contains: q, mode: "insensitive" } }
    ];
  }
  if (status && status !== "all") {
    where.status = status;
  }
  const skip = (page - 1) * perPage;
  const [items, total] = await Promise.all([
    prisma.requestAccess.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage
    }),
    prisma.requestAccess.count({ where })
  ]);
  return { items, total, page, perPage };
}

export default async function AdminRequestsPage({ searchParams }: { searchParams?: { q?: string; status?: string; p?: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role ?? "guest";

  if (!session) {
    return (
      <main>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Acces restricționat</h2>
        <p style={{ marginTop: 8 }}>
          Te rugăm să te <a href="/login?callbackUrl=/admin/requests" style={{ color: "#2563eb" }}>autentifici</a>.
        </p>
      </main>
    );
  }

  if (role !== "admin") {
    return (
      <main>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Permisiune insuficientă</h2>
        <p style={{ marginTop: 8 }}>Această zonă este rezervată administratorilor.</p>
      </main>
    );
  }

  const q = searchParams?.q?.trim() || null;
  const status = searchParams?.status?.trim() || null;
  const p = parseInt(searchParams?.p || "1", 10) || 1;

  const { items, total, page, perPage } = await getData(q, status, p);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <main>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>Request Access</h2>

      <form style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="Caută după email, nume sau instituție…"
          style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px" }}
        />
        <select name="status" defaultValue={status || "all"} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px" }}>
          <option value="all">Toate</option>
          <option value="new">Noi</option>
          <option value="contacted">Contactat</option>
          <option value="closed">Închis</option>
        </select>
        <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "10px 14px", fontWeight: 700 }}>Filtrează</button>
      </form>

      <div style={{ color: "#6b7280", marginBottom: 8 }}>Rezultate: {total}</div>

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((r) => (
          <div key={r.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{r.name || r.email}</div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>
                  {r.email} • {r.role || "—"} • {r.organization || "—"}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#374151" }}>{new Date(r.createdAt).toLocaleString()}</div>
            </div>
            {r.message && <div style={{ marginTop: 8, color: "#374151" }}>{r.message}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <form action={updateStatusAction} style={{ display: "flex", gap: 6 }}>
                <input type="hidden" name="id" value={r.id} />
                <select name="status" defaultValue={r.status} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px" }}>
                  <option value="new">Nou</option>
                  <option value="contacted">Contactat</option>
                  <option value="closed">Închis</option>
                </select>
                <button style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", fontWeight: 600 }}>Salvează</button>
              </form>
              <form action={deleteAction}>
                <input type="hidden" name="id" value={r.id} />
                <button style={{ color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: 8, padding: "6px 10px", fontWeight: 600 }}>
                  Șterge
                </button>
              </form>
              <a href={`mailto:${r.email}`} style={{ color: "#2563eb", fontWeight: 600 }}>Trimite email</a>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <a
          href={`?${new URLSearchParams({ q: q || "", status: status || "all", p: String(Math.max(1, page - 1)) })}`}
          style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", color: "#111827" }}
        >
          ← Înapoi
        </a>
        <div style={{ color: "#6b7280", fontSize: 12 }}>
          Pagina {page} din {totalPages}
        </div>
        <a
          href={`?${new URLSearchParams({ q: q || "", status: status || "all", p: String(Math.min(totalPages, page + 1)) })}`}
          style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", color: "#111827" }}
        >
          Înainte →
        </a>
      </div>
    </main>
  );
}
