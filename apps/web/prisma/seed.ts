import { PrismaClient, Language, Visibility, DocStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const adminEmail = "admin@izamanagement.ro";
  const adminName = "Administrator";
  const plain = process.env.ADMIN_PASSWORD || "admin1234";
  const hash = await bcrypt.hash(plain, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "admin", name: adminName, password: hash },
    create: { email: adminEmail, role: "admin", name: adminName, password: hash }
  });

  // Team (Group) sample
  const team = await prisma.team.upsert({
    where: { slug: "clinica-derma" },
    update: { name: "Clinica Derma", ownerId: admin.id },
    create: { slug: "clinica-derma", name: "Clinica Derma", ownerId: admin.id }
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: admin.id } },
    update: { role: "owner" },
    create: { teamId: team.id, userId: admin.id, role: "owner" }
  });

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
    { slug: "dermatita-seboreica", name: "Dermatită seboreică", isCommon: true },
    { slug: "rozacee", name: "Rozacee", isCommon: true },
    { slug: "eczema-de-contact", name: "Eczemă de contact", isCommon: true }
  ];

  for (const c of conditions) {
    const cond = await prisma.condition.upsert({
      where: { slug: c.slug },
      update: { name: c.name, isCommon: c.isCommon, specialtyId: derm.id },
      create: { ...c, specialtyId: derm.id }
    });

    if (c.slug === "acnee-vulgara") {
      // Add codes and synonyms (illustrative, not exhaustive)
      await prisma.conditionCode.upsert({
        where: { id: `${cond.id}-icd10-l70.0` },
        update: { system: "ICD-10", code: "L70.0" },
        create: { id: `${cond.id}-icd10-l70.0`, conditionId: cond.id, system: "ICD-10", code: "L70.0" }
      }).catch(async () => {
        await prisma.conditionCode.create({ data: { conditionId: cond.id, system: "ICD-10", code: "L70.0" } }).catch(() => {});
      });
      await prisma.conditionSynonym.createMany({
        data: [
          { conditionId: cond.id, term: "Acnee juvenilă", language: Language.ro },
          { conditionId: cond.id, term: "Acne vulgaris", language: Language.en }
        ],
        skipDuplicates: true
      });

      // RO text (official draft)
      await prisma.conditionText.upsert({
        where: {
          conditionId_language_version: { conditionId: cond.id, language: Language.ro, version: 1 }
        },
        update: {},
        create: {
          conditionId: cond.id,
          language: Language.ro,
          version: 1,
          status: DocStatus.draft,
          visibility: Visibility.official,
          title: "Acnee vulgară",
          summaryMd: "Acneea vulgară este o afecțiune inflamatorie cronică a unității pilosebacee, frecventă la adolescenți și adulți tineri.",
          clinicalMd: "- Leziuni non-inflamatorii: comedoane deschise/închise\n- Leziuni inflamatorii: papule, pustule, noduli; distribuție tipică față/torace/spate",
          diagnosticsMd: "- Diagnostic clinic\n- Investigații doar pentru forme atipice sau refractare",
          managementMd: "- Educație privind îngrijirea pielii\n- Tratament topic (retinoizi, benzoil peroxid, +/- antibiotic local)\n- Sistemic (doxiciclină, sare de minociclină; la femei: antiandrogeni; în forme severe: izotretinoină)",
          treatmentsMd: "- Retinoizi topici (adapalene, tretinoin)\n- Benzoil peroxid\n- Antibiotice topice (clindamicină) asociate cu benzoil peroxid\n- Antibiotice orale (doxiciclină)\n- Izotretinoină orală în forme nodulo-chistice\n- Proceduri: peelinguri chimice, lumină albastră (adjuvant)",
          references: [
            { title: "European evidence-based (S3) guideline for acne", link: "https://onlinelibrary.wiley.com/doi/10.1111/jdv.19280", year: 2024 },
            { title: "AAD Acne Guidelines", link: "https://www.aad.org/member/clinical-quality/guidelines/acne", year: 2023 }
          ],
          authorId: admin.id
        }
      });

      // EN text (draft translation)
      await prisma.conditionText.upsert({
        where: {
          conditionId_language_version: { conditionId: cond.id, language: Language.en, version: 1 }
        },
        update: {},
        create: {
          conditionId: cond.id,
          language: Language.en,
          version: 1,
          status: DocStatus.draft,
          visibility: Visibility.official,
          title: "Acne vulgaris",
          summaryMd: "Acne vulgaris is a chronic inflammatory disorder of the pilosebaceous unit, common in adolescents and young adults.",
          clinicalMd: "- Non-inflammatory lesions: open/closed comedones\n- Inflammatory lesions: papules, pustules, nodules; typical distribution face/chest/back",
          diagnosticsMd: "- Clinical diagnosis\n- Investigations reserved for atypical or refractory cases",
          managementMd: "- Skin care education\n- Topical therapy (retinoids, benzoyl peroxide, +/- topical antibiotics)\n- Systemic (doxycycline; in females consider antiandrogens; severe: isotretinoin)",
          treatmentsMd: "- Topical retinoids (adapalene, tretinoin)\n- Benzoyl peroxide\n- Topical antibiotics (clindamycin) combined with benzoyl peroxide\n- Oral antibiotics (doxycycline)\n- Isotretinoin for nodulocystic acne\n- Procedures: chemical peels, blue light (adjunctive)",
          references: [
            { title: "European evidence-based (S3) guideline for acne", link: "https://onlinelibrary.wiley.com/doi/10.1111/jdv.19280", year: 2024 }
          ],
          authorId: admin.id
        }
      });
    }
  }

  // Procedures texts (minimal examples)
  const prp = await prisma.procedure.upsert({
    where: { slug: "prp" },
    update: { name: "PRP (Plasmă bogată în trombocite)", specialtyId: derm.id },
    create: { slug: "prp", name: "PRP (Plasmă bogată în trombocite)", specialtyId: derm.id }
  });

  await prisma.procedureText.upsert({
    where: { procedureId_language_version: { procedureId: prp.id, language: Language.ro, version: 1 } },
    update: {},
    create: {
      procedureId: prp.id,
      language: Language.ro,
      version: 1,
      status: DocStatus.draft,
      visibility: Visibility.official,
      title: "PRP - Protocol de bază",
      indicationsMd: "- Alopecie androgenetică\n- Rejuvenare cutanată",
      contraindicationsMd: "- Tulburări de coagulare\n- Infecții active la locul injectării",
      preparationMd: "- Recoltare sânge, centrifugare conform kitului",
      stepsMd: "- Anestezie topică\n- Injectare intradermică/napaj după protocol",
      aftercareMd: "- Evitare soare 24-48h\n- Igienă locală",
      references: [{ title: "PRP in dermatology review", link: "https://pubmed.ncbi.nlm.nih.gov/", year: 2023 }],
      authorId: admin.id
    }
  });

  // Course with lesson, owned by admin and shared with team
  const course = await prisma.course.upsert({
    where: { slug: "derm-essentials" },
    update: {
      title: "Dermatologie esențială",
      description: "Curs introductiv pentru rezidenți și medici de familie.",
      language: Language.ro,
      visibility: Visibility.team,
      teamId: team.id,
      specialtyId: derm.id,
      ownerId: admin.id
    },
    create: {
      slug: "derm-essentials",
      title: "Dermatologie esențială",
      description: "Curs introductiv pentru rezidenți și medici de familie.",
      language: Language.ro,
      visibility: Visibility.team,
      teamId: team.id,
      specialtyId: derm.id,
      ownerId: admin.id
    }
  });

  await prisma.courseAuthor.upsert({
    where: { courseId_userId: { courseId: course.id, userId: admin.id } },
    update: {},
    create: { courseId: course.id, userId: admin.id }
  });

  await prisma.lesson.upsert({
    where: { id: `${course.id}-l1` },
    update: {
      title: "Noțiuni de bază",
      contentMd: "Structura pielii, funcții, evaluare clinică.",
      order: 1,
      courseId: course.id
    },
    create: {
      id: `${course.id}-l1`,
      courseId: course.id,
      title: "Noțiuni de bază",
      contentMd: "Structura pielii, funcții, evaluare clinică.",
      order: 1
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