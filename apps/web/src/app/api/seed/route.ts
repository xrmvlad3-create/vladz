import { prisma } from "@lib/prisma";
import bcrypt from "bcryptjs";
import { warnIfNoDatabase, missingDatabaseMessage } from "@lib/env";

async function runSeed() {
  if (!warnIfNoDatabase("api:seed")) {
    throw new Error(missingDatabaseMessage());
  }

  const derm = await prisma.specialty.upsert({
    where: { slug: "dermatologie" },
    update: {},
    create: { slug: "dermatologie", name: "Dermatologie" }
  });

  const conditions = [
    { slug: "acnee-vulgara", name: "Acnee vulgara", isCommon: true },
    { slug: "psoriazis", name: "Psoriazis", isCommon: true },
    { slug: "dermatita-atopica", name: "Dermatita atopica", isCommon: true },
    { slug: "dermatita-seboreica", name: "Dermatita seboreica", isCommon: true }
  ];

  for (const c of conditions) {
    await prisma.condition.upsert({
      where: { slug: c.slug },
      update: { name: c.name, isCommon: c.isCommon, specialtyId: derm.id },
      create: { ...c, specialtyId: derm.id }
    });
  }

  const adminEmail = "admin@izamanagement.ro";
  const adminName = "Administrator";
  const plain = process.env.ADMIN_PASSWORD || "admin1234";
  const hash = await bcrypt.hash(plain, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "admin", name: adminName, password: hash },
    create: { email: adminEmail, role: "admin", name: adminName, password: hash }
  });
}

export async function POST(req: Request) {
  const secret = process.env.SEED_SECRET;
  const provided = req.headers.get("x-seed-secret") ?? "";
  if (!secret || provided !== secret) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    await runSeed();
    return new Response("ok", { status: 200 });
  } catch (e: any) {
    const message = e?.message || missingDatabaseMessage();
    return new Response(`error: ${message}`, { status: 500 });
  }
}
