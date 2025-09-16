import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth";
import { prisma } from "@lib/prisma";
import { revalidatePath } from "next/cache";
import { DocStatus, Language, Visibility } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

async function upsertConditionText(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session) return;

  const conditionSlug = String(formData.get("conditionSlug") || "").trim().toLowerCase();
  const language = (String(formData.get("language") || "ro") as "ro" | "en");
  const version = parseInt(String(formData.get("version") || "1"), 10) || 1;
  const visibility = (String(formData.get("visibility") || "team") as "private" | "team" | "public" | "official");
  const teamSlug = String(formData.get("teamSlug") || "").trim().toLowerCase();
  const title = String(formData.get("title") || "").trim() || null;
  const summaryMd = String(formData.get("summaryMd") || "").trim() || null;
  const clinicalMd = String(formData.get("clinicalMd") || "").trim() || null;
  const diagnosticsMd = String(formData.get("diagnosticsMd") || "").trim() || null;
  const managementMd = String(formData.get("managementMd") || "").trim() || null;
  const treatmentsMd = String(formData.get("treatmentsMd") || "").trim() || null;

  const cond = await prisma.condition.findUnique({ where: { slug: conditionSlug } });
  if (!cond) return;

  let teamId: string | null = null;
  if (teamSlug) {
    const team = await prisma.team.findUnique({ where: { slug: teamSlug }, include: { members: true, owner: true } });
    if (!team) return;
    const me = await prisma.user.findUnique({ where: { email: session.user?.email || "" } });
    if (!me) return;
    const allowed = team.ownerId === me.id || team.members.some(m => m.userId === me.id);
    if (!allowed) return;
    teamId = team.id;
  }

  const me = await prisma.user.findUnique({ where: { email: session.user?.email || "" } });
  if (!me) return;

  const languageEnum = language === "ro" ? Language.ro : Language.en;
  const visibilityEnum = Visibility[visibility];

  await prisma.conditionText.upsert({
    where: { conditionId_language_version: { conditionId: cond.id, language: languageEnum, version } },
    update: {
      visibility: visibilityEnum,
      teamId,
      title, summaryMd, clinicalMd, diagnosticsMd, managementMd, treatmentsMd
    },
    create: {
      conditionId: cond.id,
      language: languageEnum,
      version,
      status: DocStatus.draft,
      visibility: visibilityEnum,
      teamId,
      title, summaryMd, clinicalMd, diagnosticsMd, managementMd, treatmentsMd,
      authorId: me.id
    }
  });

  revalidatePath("/author/knowledge");
}

export default async function AuthorKnowledgePage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <main>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Conținut medical — echipe</h2>
        <p style={{ marginTop: 8 }}>
          Te rugăm să te <a href="/login?callbackUrl=/author/knowledge" style={{ color: "#2563eb" }}>autentifici</a>.
        </p>
      </main>
    );
  }

  const me = await prisma.user.findUnique({ where: { email: session.user?.email || "" } });
  if (!me) return <main><p>Eroare utilizator.</p></main>;

  const teams = await prisma.team.findMany({
    where: {
      OR: [{ ownerId: me.id }, { members: { some: { userId: me.id } } }]
    },
    orderBy: { name: "asc" }
  });

  const cq = typeof searchParams?.cq === "string" ? searchParams?.cq : "";
  const insensitive: Prisma.QueryMode = "insensitive";
  const conditionFilter: Prisma.ConditionWhereInput | undefined = cq
    ? {
        OR: [
          { name: { contains: cq, mode: insensitive } },
          { slug: { contains: cq, mode: insensitive } }
        ]
      }
    : undefined;

  const conditions = await prisma.condition.findMany({
    where: conditionFilter,
    orderBy: [{ isCommon: "desc" }, { name: "asc" }],
    take: 50,
    include: {
      texts: {
        where: {
          OR: [
            { visibility: "public" },
            { visibility: "official" },
            { team: { members: { some: { userId: me.id } } } },
            { team: { ownerId: me.id } },
            { authorId: me.id }
          ]
        },
        orderBy: [{ language: "asc" }, { version: "desc" }],
        select: { language: true, version: true, visibility: true, status: true }
      }
    }
  });

  return (
    <main>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Conținut medical — echipe</h2>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff", marginBottom: 12 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Creează/actualizează text pentru o afecțiune</h3>
        <form method="GET" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input name="cq" defaultValue={cq} placeholder="Caută afecțiuni…" style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
          <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 12px", fontWeight: 600 }}>Caută</button>
        </form>

        <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 8 }}>
          Ești membru în: {teams.map(t => t.slug).join(", ") || "—"}
        </div>

        {conditions.map(c => (
          <details key={c.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <summary style={{ cursor: "pointer" }}>
              <strong>{c.name}</strong> <span style={{ color: "#6b7280" }}>({c.slug})</span> — texte: {c.texts.map(t => `${t.language}:${t.version}/${t.visibility}/${t.status}`).join(" • ") || "—"}
            </summary>
            <form action={upsertConditionText} style={{ display: "grid", gap: 8, marginTop: 8 }}>
              <input type="hidden" name="conditionSlug" value={c.slug} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <select name="language" defaultValue="ro" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }}>
                  <option value="ro">ro</option>
                  <option value="en">en</option>
                </select>
                <input name="version" defaultValue="1" placeholder="versiune" style={{ width: 120, border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
                <select name="visibility" defaultValue="team" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }}>
                  <option value="team">team</option>
                  <option value="private">private</option>
                  <option value="public">public</option>
                </select>
                <select name="teamSlug" defaultValue="" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }}>
                  <option value="">(fără echipă)</option>
                  {teams.map(t => <option key={t.id} value={t.slug}>{t.slug}</option>)}
                </select>
              </div>
              <input name="title" placeholder="titlu (opțional)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
              <textarea name="summaryMd" placeholder="rezumat (markdown)" rows={3} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
              <textarea name="clinicalMd" placeholder="manifestări clinice (markdown)" rows={4} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
              <textarea name="diagnosticsMd" placeholder="diagnostic (markdown)" rows={4} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
              <textarea name="managementMd" placeholder="management (markdown)" rows={4} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
              <textarea name="treatmentsMd" placeholder="tratamente (markdown)" rows={4} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
              <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>Salvează text</button>
            </form>
          </details>
        ))}
      </section>
    </main>
  );
}