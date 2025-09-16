import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth";
import { prisma } from "@lib/prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// CREATE
async function addSpecialty(formData: FormData): Promise<void> {
  "use server";
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  if (!slug || !name) return;
  await prisma.specialty.upsert({
    where: { slug },
    update: { name },
    create: { slug, name }
  });
  revalidatePath("/admin/catalog");
}

async function addCondition(formData: FormData): Promise<void> {
  "use server";
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const specialtySlug = String(formData.get("specialtySlug") || "").trim().toLowerCase();
  const isCommon = String(formData.get("isCommon") || "") === "on";
  if (!slug || !name || !specialtySlug) return;
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
  revalidatePath("/admin/catalog");
}

async function addProcedure(formData: FormData): Promise<void> {
  "use server";
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const specialtySlug = String(formData.get("specialtySlug") || "").trim().toLowerCase();
  if (!slug || !name || !specialtySlug) return;
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
  revalidatePath("/admin/catalog");
}

// UPDATE
async function updateSpecialty(formData: FormData): Promise<void> {
  "use server";
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!id || !name) return;
  await prisma.specialty.update({ where: { id }, data: { name } });
  revalidatePath("/admin/catalog");
}
async function updateCondition(formData: FormData): Promise<void> {
  "use server";
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const isCommon = String(formData.get("isCommon") || "") === "on";
  if (!id || !name) return;
  await prisma.condition.update({ where: { id }, data: { name, isCommon } });
  revalidatePath("/admin/catalog");
}
async function updateProcedure(formData: FormData): Promise<void> {
  "use server";
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!id || !name) return;
  await prisma.procedure.update({ where: { id }, data: { name } });
  revalidatePath("/admin/catalog");
}

// DELETE
async function deleteSpecialty(formData: FormData): Promise<void> {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.specialty.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/catalog");
}
async function deleteCondition(formData: FormData): Promise<void> {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.condition.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/catalog");
}
async function deleteProcedure(formData: FormData): Promise<void> {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.procedure.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/catalog");
}

type Paging = { take: number; skip: number; page: number; q: string | null };

function pagingParams(total: number, pageParam: string | undefined, q: string | null, defaultSize = 20): Paging & { pages: number } {
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const take = defaultSize;
  const skip = (page - 1) * take;
  const pages = Math.max(1, Math.ceil(total / take));
  return { take, skip, page, q, pages };
}

export default async function AdminCatalogPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
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

  const spQ = typeof searchParams?.spq === "string" ? searchParams?.spq : "";
  const cpQ = typeof searchParams?.cpq === "string" ? searchParams?.cpq : "";
  const ppQ = typeof searchParams?.ppq === "string" ? searchParams?.ppq : "";

  const spPage = typeof searchParams?.spp === "string" ? searchParams?.spp : "1";
  const cpPage = typeof searchParams?.cpp === "string" ? searchParams?.cpp : "1";
  const ppPage = typeof searchParams?.ppp === "string" ? searchParams?.ppp : "1";

  // queries
  const insensitive: Prisma.QueryMode = "insensitive";

  const spWhere: Prisma.SpecialtyWhereInput | undefined = spQ
    ? {
        OR: [
          { name: { contains: spQ, mode: insensitive } },
          { slug: { contains: spQ, mode: insensitive } }
        ]
      }
    : undefined;
  const cpWhere: Prisma.ConditionWhereInput | undefined = cpQ
    ? {
        OR: [
          { name: { contains: cpQ, mode: insensitive } },
          { slug: { contains: cpQ, mode: insensitive } }
        ]
      }
    : undefined;
  const ppWhere: Prisma.ProcedureWhereInput | undefined = ppQ
    ? {
        OR: [
          { name: { contains: ppQ, mode: insensitive } },
          { slug: { contains: ppQ, mode: insensitive } }
        ]
      }
    : undefined;

  const [spCount, cpCount, ppCount] = await Promise.all([
    prisma.specialty.count({ where: spWhere }),
    prisma.condition.count({ where: cpWhere }),
    prisma.procedure.count({ where: ppWhere })
  ]);

  const sPg = pagingParams(spCount, spPage, spQ);
  const cPg = pagingParams(cpCount, cpPage, cpQ);
  const pPg = pagingParams(ppCount, ppPage, ppQ);

  const [specialties, conditions, procedures] = await Promise.all([
    prisma.specialty.findMany({ where: spWhere, orderBy: { name: "asc" }, take: sPg.take, skip: sPg.skip }),
    prisma.condition.findMany({ where: cpWhere, orderBy: [{ isCommon: "desc" }, { name: "asc" }], take: cPg.take, skip: cPg.skip, include: { specialty: true } }),
    prisma.procedure.findMany({ where: ppWhere, orderBy: { name: "asc" }, take: pPg.take, skip: pPg.skip, include: { specialty: true } })
  ]);

  const pager = (sectionKey: "s" | "c" | "p", page: number, pages: number, qParam: string, qVal: string) => {
    const prev = Math.max(1, page - 1);
    const next = Math.min(pages, page + 1);
    const pageParam = `${sectionKey}pp`;
    const base = "/admin/catalog";
    const qsPrev = `${qParam}=${encodeURIComponent(qVal || "")}&${pageParam}=${prev}`;
    const qsNext = `${qParam}=${encodeURIComponent(qVal || "")}&${pageParam}=${next}`;
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        <a href={`${base}?${qsPrev}`} style={{ color: "#2563eb", opacity: page <= 1 ? 0.5 : 1 }}>«</a>
        <span style={{ color: "#6b7280", fontSize: 12 }}>pagina {page} / {pages}</span>
        <a href={`${base}?${qsNext}`} style={{ color: "#2563eb", opacity: page >= pages ? 0.5 : 1 }}>»</a>
      </div>
    );
  };

  return (
    <main>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Catalog — Administrare</h2>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff" }}>
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Specialități</h3>
          <form action={addSpecialty} style={{ display: "grid", gap: 8, marginBottom: 12 }}>
            <input name="slug" placeholder="slug (ex: dermatologie)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
            <input name="name" placeholder="nume (ex: Dermatologie)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
            <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>Creează/Actualizează</button>
          </form>

          <form method="GET" style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input name="spq" defaultValue={spQ} placeholder="Căutare specialități…" style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
            <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>Caută</button>
          </form>

          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {specialties.map(s => (
              <li key={s.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 8, marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div><strong>{s.name}</strong> <span style={{ color: "#6b7280" }}>({s.slug})</span></div>
                  <form action={deleteSpecialty}>
                    <input type="hidden" name="id" value={s.id} />
                    <button style={{ color: "#b91c1c" }}>Șterge</button>
                  </form>
                </div>
                <form action={updateSpecialty} style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <input type="hidden" name="id" value={s.id} />
                  <input name="name" defaultValue={s.name} style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
                  <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "6px 10px", fontWeight: 600 }}>Salvează</button>
                </form>
              </li>
            ))}
          </ul>
          {pager("s", sPg.page, sPg.pages, "spq", spQ)}
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
            <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>Creează/Actualizează</button>
          </form>

          <form method="GET" style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input name="cpq" defaultValue={cpQ} placeholder="Căutare afecțiuni…" style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
            <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>Caută</button>
          </form>

          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {conditions.map(c => (
              <li key={c.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 8, marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div><strong>{c.name}</strong> <span style={{ color: "#6b7280" }}>({c.slug})</span> • {c.specialty?.name ?? "General"} {c.isCommon ? "• Comun" : ""}</div>
                  <form action={deleteCondition}>
                    <input type="hidden" name="id" value={c.id} />
                    <button style={{ color: "#b91c1c" }}>Șterge</button>
                  </form>
                </div>
                <form action={updateCondition} style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                  <input type="hidden" name="id" value={c.id} />
                  <input name="name" defaultValue={c.name} style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
                  <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#374151", fontSize: 12 }}>
                    <input type="checkbox" name="isCommon" defaultChecked={c.isCommon} /> Comun
                  </label>
                  <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "6px 10px", fontWeight: 600 }}>Salvează</button>
                </form>
              </li>
            ))}
          </ul>
          {pager("c", cPg.page, cPg.pages, "cpq", cpQ)}
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff" }}>
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Proceduri</h3>
          <form action={addProcedure} style={{ display: "grid", gap: 8, marginBottom: 12 }}>
            <input name="slug" placeholder="slug (ex: prp)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
            <input name="name" placeholder="nume (ex: PRP)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
            <input name="specialtySlug" placeholder="specialtySlug (ex: dermatologie)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
            <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>Creează/Actualizează</button>
          </form>

          <form method="GET" style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input name="ppq" defaultValue={ppQ} placeholder="Căutare proceduri…" style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
            <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>Caută</button>
          </form>

          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {procedures.map(p => (
              <li key={p.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 8, marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div><strong>{p.name}</strong> <span style={{ color: "#6b7280" }}>({p.slug})</span> • {p.specialty?.name ?? "General"}</div>
                  <form action={deleteProcedure}>
                    <input type="hidden" name="id" value={p.id} />
                    <button style={{ color: "#b91c1c" }}>Șterge</button>
                  </form>
                </div>
                <form action={updateProcedure} style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <input type="hidden" name="id" value={p.id} />
                  <input name="name" defaultValue={p.name} style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
                  <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "6px 10px", fontWeight: 600 }}>Salvează</button>
                </form>
              </li>
            ))}
          </ul>
          {pager("p", pPg.page, pPg.pages, "ppq", ppQ)}
        </div>
      </section>
    </main>
  );
}