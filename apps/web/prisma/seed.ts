import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const derm = await prisma.specialty.upsert({
    where: { slug: "dermatologie" },
    update: {},
    create: { slug: "dermatologie", name: "Dermatologie" }
  });

  const conditions = [
    { slug: "acnee-vulgara", name: "Acnee vulgară", isCommon: true },
    { slug: "psoriazis", name: "Psoriazis", isCommon: true },
    { slug: "dermatita-atopica", name: "Dermatită atopică", isCommon: true },
    { slug: "dermatita-seboreica", name: "Dermatită seboreică", isCommon: true },
    { slug: "rozacee", name: "Rozacee", isCommon: true },
    { slug: "eczema-de-contact", name: "Eczemă de contact", isCommon: true }
  ];

  for (const c of conditions) {
    await prisma.condition.upsert({
      where: { slug: c.slug },
      update: { name: c.name, isCommon: c.isCommon, specialtyId: derm.id },
      create: { ...c, specialtyId: derm.id }
    });
  }

  const procedures = [
    { slug: "prp", name: "PRP (Plasmă bogată în trombocite)" },
    { slug: "biopsie-cutanata", name: "Biopsie cutanată" },
    { slug: "crioterapie", name: "Crioterapie" },
    { slug: "electrocauterizare", name: "Electrocauterizare" }
  ];

  for (const p of procedures) {
    await prisma.procedure.upsert({
      where: { slug: p.slug },
      update: { name: p.name, specialtyId: derm.id },
      create: { ...p, specialtyId: derm.id }
    });
  }

  await prisma.course.upsert({
    where: { id: "eadv-derm-intro" },
    update: {
      title: "EADV e-learning: Dermatology Essentials",
      provider: "EADV",
      url: "https://eadv.org/learn",
      specialtyId: derm.id
    },
    create: {
      id: "eadv-derm-intro",
      title: "EADV e-learning: Dermatology Essentials",
      provider: "EADV",
      url: "https://eadv.org/learn",
      specialtyId: derm.id
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed complete.");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });