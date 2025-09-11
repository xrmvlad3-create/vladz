/**
 * Importer for MONDO disease ontology into our database.
 * 
 * Prerequisites:
 * - Obtain MONDO JSON graph (CC-BY 4.0): https://github.com/monarch-initiative/mondo/releases
 *   Example file: mondo.json (OBO Graph JSON)
 * - This script consumes a simplified JSON you generate from mondo.json to reduce complexity:
 *   [
 *     {
 *       "id": "MONDO:0004992",
 *       "name": "acne vulgaris",
 *       "synonyms": ["acne", "acne vulgaris"],
 *       "xrefs": { "ICD10": ["L70.0"], "ICD11": [], "OMIM": [], "MeSH": [], "UMLS": [] }
 *     },
 *     ...
 *   ]
 * Create this simplified JSON with a pre-processing step (not included here) or use a small curated file.
 *
 * Usage:
 *   pnpm ts-node apps/web/scripts/import-mondo.ts ./path/to/simplified-mondo.json dermatologie
 *   NODE_OPTIONS="--no-warnings" npx ts-node apps/web/scripts/import-mondo.ts ./data/mondo-slim.json dermatologie
 *
 * Notes:
 * - This will upsert Condition, ConditionSynonym, and ConditionCode.
 * - All entries will be attached to the given specialtySlug.
 */

import fs from "node:fs";
import path from "node:path";
import { PrismaClient, Language } from "@prisma/client";

type SimplifiedNode = {
  id: string;
  name: string;
  synonyms?: string[];
  xrefs?: Record<string, string[]>;
};

async function main() {
  const [,, inputPath, specialtySlug] = process.argv;
  if (!inputPath || !specialtySlug) {
    console.error("Usage: ts-node apps/web/scripts/import-mondo.ts <simplified-json-path> <specialtySlug>");
    process.exit(1);
  }

  const resolved = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(resolved, "utf-8");
  const data: SimplifiedNode[] = JSON.parse(raw);

  const prisma = new PrismaClient();
  try {
    const specialty = await prisma.specialty.upsert({
      where: { slug: specialtySlug },
      update: {},
      create: { slug: specialtySlug, name: specialtySlug }
    });

    let count = 0;
    for (const node of data) {
      const slug = node.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const cond = await prisma.condition.upsert({
        where: { slug },
        update: { name: node.name, specialtyId: specialty.id },
        create: { slug, name: node.name, isCommon: false, specialtyId: specialty.id }
      });

      if (node.synonyms?.length) {
        const syns = Array.from(new Set(node.synonyms))
          .filter(Boolean)
          .slice(0, 20) // guard
          .map((term) => ({ conditionId: cond.id, term, language: Language.en }));
        if (syns.length) {
          await prisma.conditionSynonym.createMany({ data: syns, skipDuplicates: true });
        }
      }

      const xrefs = node.xrefs || {};
      for (const [system, codes] of Object.entries(xrefs)) {
        for (const code of codes) {
          if (!code) continue;
          await prisma.conditionCode.create({
            data: { conditionId: cond.id, system, code }
          }).catch(() => {});
        }
      }

      count++;
      if (count % 100 === 0) {
        console.log(`Imported ${count} conditions...`);
      }
    }

    console.log(`Done. Imported/updated ${count} conditions under specialty: ${specialtySlug}`);
  } finally {
    await new Promise((r) => setTimeout(r, 50));
    await (globalThis as any).prisma?.$disconnect?.().catch(() => {});
    process.exit(0);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});