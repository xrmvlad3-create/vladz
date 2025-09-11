import { prisma } from "@lib/prisma";
import bcrypt from "bcryptjs";

async function runSeed() {
  // Specialty
  const derm = await prisma.specialty.upsert({
    where: { slug: "dermatologie" },
    update: {},
    create: { slug: "dermatologie", name: "Dermatologie" }
  });

  // Conditions
  const conditions = [
    { slug: "acnee-vulgara", name: "Acnee vulgară", isCommon: true },
    { slug: "psoriazis", name: "Psoriazis", isCommon: true },
    { slug: "dermatita-atopica", name: "Dermatită atopică", isCommon: true },
    { slug: "dermatita-seboreica", name: "Dermatită seboreică", isCommon: true }
  ];

  for (const c of conditions) {
    await prisma.condition.upsert({
      where: { slug: c.slug },
      update: { name: c.name, isCommon: c.isCommon, specialtyId: derm.id },
      create: { ...c, specialtyId: derm.id }
    });
  }

  // Admin user
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
    return new Response(`error: ${e?.message ?? "unknown"}`, { status: 500 });
  }
}