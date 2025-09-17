import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth";
import { prisma } from "@lib/prisma";
import { revalidatePath } from "next/cache";
import { DocStatus, Language, Visibility } from "@prisma/client";
import TranslateClient from "./TranslateClient";

async function upsertConditionText(formData: FormData): Promise<void> {
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
  if (!cond) {
    console.warn("admin:knowledge", "condition not found", conditionSlug);
    return;
  }
  const team = teamSlug ? await prisma.team.findUnique({ where: { slug: teamSlug } }) : null;

  let references: unknown = null;
  if (referencesRaw) {
    try {
      references = JSON.parse(referencesRaw);
    } catch (err) {
      console.warn("admin:knowledge", "invalid references JSON", err);
    }
  }

  await prisma.conditionText.upsert({
    where: { conditionId_language_version: { conditionId: cond.id, language: language === "ro" ? Language.ro : Language.en, version } },
    update: {
      visibility: visibility as Visibility,
      teamId: team?.id ?? null,
      title,
      summaryMd,
      clinicalMd,
      diagnosticsMd,
      managementMd,
      treatmentsMd,
      references: references as any
    },
    create: {
      conditionId: cond.id,
      language: language === "ro" ? Language.ro : Language.en,
      version,
      status: DocStatus.draft,
      visibility: visibility as Visibility,
      teamId: team?.id ?? null,
      title,
      summaryMd,
      clinicalMd,
      diagnosticsMd,
      managementMd,
      treatmentsMd,
      references: references as any
    }
  });

  revalidatePath("/admin/knowledge");
}

async function upsertProcedureText(formData: FormData): Promise<void> {
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
  if (!proc) {
    console.warn("admin:knowledge", "procedure not found", procedureSlug);
    return;
  }
  const team = teamSlug ? await prisma.team.findUnique({ where: { slug: teamSlug } }) : null;

  let references: unknown = null;
  if (referencesRaw) {
    try {
      references = JSON.parse(referencesRaw);
    } catch (err) {
      console.warn("admin:knowledge", "invalid references JSON", err);
    }
  }

  await prisma.procedureText.upsert({
    where: { procedureId_language_version: { procedureId: proc.id, language: language === "ro" ? Language.ro : Language.en, version } },
    update: {
      visibility: visibility as Visibility,
      teamId: team?.id ?? null,
      title,
      indicationsMd,
      contraindicationsMd,
      materialsMd,
      preparationMd,
      stepsMd,
      aftercareMd,
      complicationsMd,
      notesMd,
      references: references as any
    },
    create: {
      procedureId: proc.id,
      language: language === "ro" ? Language.ro : Language.en,
      version,
      status: DocStatus.draft,
      visibility: visibility as Visibility,
      teamId: team?.id ?? null,
      title,
      indicationsMd,
      contraindicationsMd,
      materialsMd,
      preparationMd,
      stepsMd,
      aftercareMd,
      complicationsMd,
      notesMd,
      references: references as any
    }
  });

  revalidatePath("/admin/knowledge");
}

export default async function KnowledgeAdminPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role ?? "guest";
  if (!session || role !== "admin") {
    return (
      <main>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Continut medical</h2>
        <p style={{ marginTop: 8 }}>
          Te rugam sa te <a href="/login?callbackUrl=/admin/knowledge" style={{ color: "#2563eb" }}>autentifici</a> ca administrator.
        </p>
      </main>
    );
  }
