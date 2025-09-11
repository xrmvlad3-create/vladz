import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth";
import { prisma } from "@lib/prisma";

async function addSpecialty(formData: FormData) {
  "use server";
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  if (!slug || !name) return { ok: false, error: "slug și name sunt obligatorii" };
  await prisma.specialty.upsert({
    where: { slug },
    update: { name },
    create: { slug, name }
  });
  return { ok: true };
}

async function addCondition(formData: FormData) {
  "use server";
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const specialtySlug = String(formData.get("specialtySlug") || "").trim().toLowerCase();
  const isCommon = String(formData.get("isCommon") || "") === "on";
  if (!slug || !name || !specialtySlug) return { ok: false, error: "slug, name, specialtySlug sunt obligatorii" };
  const sp = await prisma.specialty.upsert({
    where: { slug: specialtySlug },
    update: {},
    create: { slug: specialtySlug, name: specialtySlug }
  });
  await prisma.condition.upsert({
    where: { slug },
    update: { name, isCommon, specialtyId: sp.id },
    create: { slug, name, isCommon, specialtyId: sp.id }
  });
  return { ok: true };
}

async function addProcedure(formData: FormData) {
  "use server";
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const specialtySlug = String(formData.get("specialtySlug") || "").trim().toLowerCase();
  if (!slug || !name || !specialtySlug) return { ok: false, error: "slug, name, specialtySlug sunt obligatorii" };
  const sp = await prisma.specialty.upsert({
    where: { slug: specialtySlug },
    update: {},
    create: { slug: specialtySlug, name: specialtySlug }
  });
  await prisma.procedure.upsert({
    where: { slug },
    update: { name, specialtyId: sp.id },
    create: { slug, name, specialtyId: sp.id }
  });
  return { ok: true };
}

export default async function AdminCatalogPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role ?? "guest";
  if (!session || role !== "admin") {
    return (
      <main>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Acces administrare catalog</h2>
        <p style={{ marginTop: 8 }}>
          Te rugăm să te <a href="/login?callbackUrl=/admin/catalog" style={{ color: "#2563eb" }}>autentifici</a> ca administrator.
        </p>
      </main>
    );
  }

  const [specialties, conditions, procedures] = await Promise.all([
    prisma.specialty.findMany({ orderBy: { name: "asc" } }),
    prisma.condition.findMany({ orderBy: [{ isCommon: "desc" }, { name: "asc" }], take: 50, include: { specialty: true } }),
    prisma.procedure.findMany({ orderBy: { name: "asc" }, take: 50, include: { specialty: true } })
  ]);

  return (
    <main>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Catalog — Administrare</h2>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff" }}>
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Specialități</h3>
          <form action={addSpecialty} style={{ display: "grid", gap: 8, marginBottom: 12 }}>
            <input name="slug" placeholder="slug (ex: dermatologie)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
            <input name="name" placeholder="nume (ex: Dermatologie)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
            <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>Salvează</button>
          </form>
          <ul style={{ listStyle: "disc", marginLeft: 18 }}>
            {specialties.map(s => <li key={s.id}>{s.name} <span style={{ color: "#6b7280" }}>({s.slug})</span></li>)}
          </ul>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff" }}>
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Afecțiuni</h3>
          <form action={addCondition} style={{ display: "grid", gap: 8, marginBottom: 12 }}>
            <input name="slug" placeholder="slug (ex: acnee-vulgara)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
            <input name="name" placeholder="nume (ex: Acnee vulgară)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
            <input name="specialtySlug" placeholder="specialtySlug (ex: dermatologie)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" name="isCommon" /> Comun
            </label>
            <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>Salvează</button>
          </form>
          <ul style={{ listStyle: "disc", marginLeft: 18 }}>
            {conditions.map(c => <li key={c.id}><strong>{c.name}</strong> — <span style={{ color: "#6b7280" }}>{c.slug}</span> • {c.specialty?.name ?? "General"} {c.isCommon ? "• Comun" : ""}</li>)}
          </ul>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff" }}>
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Proceduri</h3>
          <form action={addProcedure} style={{ display: "grid", gap: 8, marginBottom: 12 }}>
            <input name="slug" placeholder="slug (ex: prp)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
            <input name="name" placeholder="nume (ex: PRP)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
            <input name="specialtySlug" placeholder="specialtySlug (ex: dermatologie)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
            <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>Salvează</button>
          </form>
          <ul style={{ listStyle: "disc", marginLeft: 18 }}>
            {procedures.map(p => <li key={p.id}><strong>{p.name}</strong> — <span style={{ color: "#6b7280" }}>{p.slug}</span> • {p.specialty?.name ?? "General"}</li>)}
          </ul>
        </div>
      </section>
    </main>
  );
}