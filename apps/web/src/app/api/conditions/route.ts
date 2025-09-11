import { prisma } from "@lib/prisma";

export async function GET() {
  const items = await prisma.condition.findMany({
    orderBy: { name: "asc" },
    take: 200
  });
  return Response.json(items);
}

export async function POST(req: Request) {
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