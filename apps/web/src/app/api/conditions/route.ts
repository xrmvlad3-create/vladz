import { prisma } from "@lib/prisma";
import { hasDatabaseUrl, missingDatabaseMessage, warnIfNoDatabase } from "@lib/env";

export async function GET() {
  if (!hasDatabaseUrl()) {
    return new Response(JSON.stringify({ error: missingDatabaseMessage() }), {
      status: 503,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }

  const items = await prisma.condition.findMany({
    orderBy: { name: "asc" },
    take: 200
  });
  return Response.json(items);
}

export async function POST(req: Request) {
  if (!warnIfNoDatabase("api:conditions:post")) {
    return new Response(missingDatabaseMessage(), { status: 503 });
  }

  const data = await req.json().catch(() => ({}));
  if (!data?.name || !data?.slug || !data?.specialtySlug) {
    return new Response("name, slug, specialtySlug required", { status: 400 });
  }
  const sp = await prisma.specialty.upsert({
    where: { slug: data.specialtySlug },
    update: {},
    create: { slug: data.specialtySlug, name: data.specialtySlug }
  });
  const c = await prisma.condition.create({
    data: {
      name: data.name,
      slug: data.slug,
      isCommon: !!data.isCommon,
      specialtyId: sp.id
    }
  });
  return Response.json(c, { status: 201 });
}
