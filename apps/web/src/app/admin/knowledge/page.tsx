import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth";
import { prisma } from "@lib/prisma";
import { revalidatePath } from "next/cache";
import { DocStatus, Language, Visibility } from "@prisma/client";

async function upsertConditionText(formData: FormData) {
  "use server";
  const conditionSlug = String(formData.get("conditionSlug") || "").trim().toLowerCase();
  const language = (String(formData.get("language") || "ro") as "ro" | "en");
  const version = parseInt(String(formData.get("version") || "1"), 10) || 1;
  const visibility = (String(formData.get("visibility") || "official") as "private" | "team" | "public" | "official");
  const teamSlug = String(formData.get("teamSlug") || "").trim().toLowerCase();
  const title = String(formData.get("title") || "").trim() || null;
  const summaryMd = String(formData.get("summaryMd") || "").trim() || null;
  const clinicalMd = String(formData.get("clinicalMd") || "").trim() || null;
  const diagnosticsMd = String(formData.get("diagnosticsMd") || "").trim() || null;
  const managementMd = String(formData.get("managementMd") || "").trim() || null;
  const treatmentsMd = String(formData.get("treatmentsMd") || "").trim() || null;
  const referencesRaw = String(formData.get("references") || "").trim();

  const cond = await prisma.condition.findUnique({ where: { slug: conditionSlug } });
  if (!cond) return { ok: false, error: "condition not found" };
  const team = teamSlug ? await prisma.team.findUnique({ where: { slug: teamSlug } }) : null;

  let references: any = null;
  if (referencesRaw) {
    try { references = JSON.parse(referencesRaw); } catch { references = null; }
  }

  await prisma.conditionText.upsert({
    where: { conditionId_language_version: { conditionId: cond.id, language: language === "ro" ? Language.ro : Language.en, version } },
    update: {
      visibility: visibility as any,
      teamId: team?.id ?? null,
      title, summaryMd, clinicalMd, diagnosticsMd, managementMd, treatmentsMd,
      references
    },
    create: {
      conditionId: cond.id,
      language: language === "ro" ? Language.ro : Language.en,
      version,
      status: DocStatus.draft,
      visibility: visibility as any,
      teamId: team?.id ?? null,
      title, summaryMd, clinicalMd, diagnosticsMd, managementMd, treatmentsMd,
      references
    }
  });

  revalidatePath("/admin/knowledge");
  return { ok: true };
}

async function upsertProcedureText(formData: FormData) {
  "use server";
  const procedureSlug = String(formData.get("procedureSlug") || "").trim().toLowerCase();
  const language = (String(formData.get("language") || "ro") as "ro" | "en");
  const version = parseInt(String(formData.get("version") || "1"), 10) || 1;
  const visibility = (String(formData.get("visibility") || "official") as "private" | "team" | "public" | "official");
  const teamSlug = String(formData.get("teamSlug") || "").trim().toLowerCase();
  const title = String(formData.get("title") || "").trim() || null;
  const indicationsMd = String(formData.get("indicationsMd") || "").trim() || null;
  const contraindicationsMd = String(formData.get("contraindicationsMd") || "").trim() || null;
  const materialsMd = String(formData.get("materialsMd") || "").trim() || null;
  const preparationMd = String(formData.get("preparationMd") || "").trim() || null;
  const stepsMd = String(formData.get("stepsMd") || "").trim() || null;
  const aftercareMd = String(formData.get("aftercareMd") || "").trim() || null;
  const complicationsMd = String(formData.get("complicationsMd") || "").trim() || null;
  const notesMd = String(formData.get("notesMd") || "").trim() || null;
  const referencesRaw = String(formData.get("references") || "").trim();

  const proc = await prisma.procedure.findUnique({ where: { slug: procedureSlug } });
  if (!proc) return { ok: false, error: "procedure not found" };
  const team = teamSlug ? await prisma.team.findUnique({ where: { slug: teamSlug } }) : null;

  let references: any = null;
  if (referencesRaw) {
    try { references = JSON.parse(referencesRaw); } catch { references = null; }
  }

  await prisma.procedureText.upsert({
    where: { procedureId_language_version: { procedureId: proc.id, language: language === "ro" ? Language.ro : Language.en, version } },
    update: {
      visibility: visibility as any,
      teamId: team?.id ?? null,
      title, indicationsMd, contraindicationsMd, materialsMd, preparationMd, stepsMd, aftercareMd, complicationsMd, notesMd,
      references
    },
    create: {
      procedureId: proc.id,
      language: language === "ro" ? Language.ro : Language.en,
      version,
      status: DocStatus.draft,
      visibility: visibility as any,
      teamId: team?.id ?? null,
      title, indicationsMd, contraindicationsMd, materialsMd, preparationMd, stepsMd, aftercareMd, complicationsMd, notesMd,
      references
    }
  });

  revalidatePath("/admin/knowledge");
  return { ok: true };
}

export default async function KnowledgeAdminPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role ?? "guest";
  if (!session || role !== "admin") {
    return (
      <main>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Administrare conținut medical</h2>
        <p style={{ marginTop: 8 }}>
          Te rugăm să te <a href="/login?callbackUrl=/admin/knowledge" style={{ color: "#2563eb" }}>autentifici</a> ca administrator.
        </p>
      </main>
    );
  }

  const cq = typeof searchParams?.cq === "string" ? searchParams?.cq : "";
  const pq = typeof searchParams?.pq === "string" ? searchParams?.pq : "";

  const [conditions, procedures] = await Promise.all([
    prisma.condition.findMany({
      where: cq ? { OR: [{ name: { contains: cq, mode: "insensitive" } }, { slug: { contains: cq, mode: "insensitive" } }] } : {},
      orderBy: [{ isCommon: "desc" }, { name: "asc" }],
      take: 50,
      include: {
        texts: {
          orderBy: [{ language: "asc" }, { version: "desc" }],
          select: { language: true, version: true, status: true, visibility: true }
        }
      }
    }),
    prisma.procedure.findMany({
      where: pq ? { OR: [{ name: { contains: pq, mode: "insensitive" } }, { slug: { contains: pq, mode: "insensitive" } }] } : {},
      orderBy: [{ name: "asc" }],
      take: 50,
      include: {
        texts: {
          orderBy: [{ language: "asc" }, { version: "desc" }],
          select: { language: true, version: true, status: true, visibility: true }
        }
      }
    })
  ]);

  return (
    <main>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Conținut medical (RO/EN)</h2>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff" }}>
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Afecțiuni</h3>
          <form method="GET" style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input name="cq" defaultValue={cq} placeholder="Căutare condiții…" style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
            <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>Caută</button>
          </form>

          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {conditions.map(c => (
              <li key={c.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>{c.name} <span style={{ color: "#6b7280" }}>({c.slug})</span></div>
                <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 8 }}>
                  Texte: {c.texts.map(t => `${t.language}:${t.version}/${t.status}/${t.visibility}`).join(" • ") || "—"}
                </div>
                <details>
                  <summary style={{ cursor: "pointer", color: "#2563eb" }}>Editează text</summary>
                  <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                    <form action={upsertConditionText} style={{ display: "grid", gap: 8 }}>
                      <input type="hidden" name="conditionSlug" value={c.slug} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <select name="language" defaultValue="ro" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }}>
                          <option value="ro">ro</option>
                          <option value="en">en</option>
                        </select>
                        <input name="version" defaultValue="1" placeholder="versiune" style={{ width: 120, border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
                        <select name="visibility" defaultValue="official" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }}>
                          <option value="official">official</option>
                          <option value="public">public</option>
                          <option value="team">team</option>
                          <option value="private">private</option>
                        </select>
                        <input name="teamSlug" placeholder="teamSlug (opțional)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
                      </div>
                      <input name="title" placeholder="titlu (opțional)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
                      <textarea name="summaryMd" placeholder="rezumat (markdown)" rows={3} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
                      <textarea name="clinicalMd" placeholder="manifestări clinice (markdown)" rows={4} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
                      <textarea name="diagnosticsMd" placeholder="diagnostic (markdown)" rows={4} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
                      <textarea name="managementMd" placeholder="management (markdown)" rows={4} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
                      <textarea name="treatmentsMd" placeholder="tratamente (markdown)" rows={4} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
                      <textarea name="references" placeholder='referințe JSON (ex: [{"title":"...", "link":"..."}])' rows={3} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
                      <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>Salvează text</button>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff" }}>
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Proceduri</h3>
          <form method="GET" style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input name="pq" defaultValue={pq} placeholder="Căutare proceduri…" style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
            <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>Caută</button>
          </form>

          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {procedures.map(p => (
              <li key={p.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>{p.name} <span style={{ color: "#6b7280" }}>({p.slug})</span></div>
                <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 8 }}>
                  Texte: {p.texts.map(t => `${t.language}:${t.version}/${t.status}/${t.visibility}`).join(" • ") || "—"}
                </div>
                <details>
                  <summary style={{ cursor: "pointer", color: "#2563eb" }}>Editează text</summary>
                  <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                    <form action={upsertProcedureText} style={{ display: "grid", gap: 8 }}>
                      <input type="hidden" name="procedureSlug" value={p.slug} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <select name="language" defaultValue="ro" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }}>
                          <option value="ro">ro</option>
                          <option value="en">en</option>
                        </select>
                        <input name="version" defaultValue="1" placeholder="versiune" style={{ width: 120, border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
                        <select name="visibility" defaultValue="official" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }}>
                          <option value="official">official</option>
                          <option value="public">public</option>
                          <option value="team">team</option>
                          <option value="private">private</option>
                        </select>
                        <input name="teamSlug" placeholder="teamSlug (opțional)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
                      </div>
                      <input name="title" placeholder="titlu (opțional)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
                      <textarea name="indicationsMd" placeholder="indicații (markdown)" rows={3} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
                      <textarea name="contraindicationsMd" placeholder="contraindicații (markdown)" rows={3} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
                      <textarea name="materialsMd" placeholder="materiale (markdown)" rows={3} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
                      <textarea name="preparationMd" placeholder="pregătire (markdown)" rows={3} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
                      <textarea name="stepsMd" placeholder="pași (markdown)" rows={3} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
                      <textarea name="aftercareMd" placeholder="îngrijire post-procedură (markdown)" rows={3} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
                      <textarea name="complicationsMd" placeholder="complicații (markdown)" rows={3} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
                      <textarea name="notesMd" placeholder="note (markdown)" rows={3} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
                      <textarea name="references" placeholder='referințe JSON (ex: [{"title":"...", "link":"..."}])' rows={3} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
                      <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>Salvează text</button>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}