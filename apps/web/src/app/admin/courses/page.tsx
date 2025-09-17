import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth";
import { prisma } from "@lib/prisma";
import { revalidatePath } from "next/cache";
import { Language, Visibility } from "@prisma/client";

async function createOrUpdateCourse(formData: FormData): Promise<void> {
  "use server";
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const specialtySlug = String(formData.get("specialtySlug") || "").trim().toLowerCase();
  const language = (String(formData.get("language") || "ro") as "ro" | "en");
  const visibility = (String(formData.get("visibility") || "private") as "private" | "team" | "public" | "official");
  const teamSlug = String(formData.get("teamSlug") || "").trim().toLowerCase();
  const ownerEmail = String(formData.get("ownerEmail") || "").trim().toLowerCase();

  if (!slug || !title || !specialtySlug || !ownerEmail) {
    return;
  }

  const [owner, sp, team] = await Promise.all([
    prisma.user.findUnique({ where: { email: ownerEmail } }),
    prisma.specialty.findUnique({ where: { slug: specialtySlug } }),
    teamSlug ? prisma.team.findUnique({ where: { slug: teamSlug } }) : Promise.resolve(null)
  ]);

  if (!owner || !sp) {
    console.warn("admin:courses", "owner or specialty missing");
    return;
  }

  await prisma.course.upsert({
    where: { slug },
    update: {
      title,
      description: description || null,
      language: language === "ro" ? Language.ro : Language.en,
      visibility: visibility as Visibility,
      teamId: team?.id ?? null,
      specialtyId: sp.id,
      ownerId: owner.id
    },
    create: {
      slug,
      title,
      description: description || null,
      language: language === "ro" ? Language.ro : Language.en,
      visibility: visibility as Visibility,
      teamId: team?.id ?? null,
      specialtyId: sp.id,
      ownerId: owner.id
    }
  });

  revalidatePath("/admin/courses");
}

async function addLesson(formData: FormData): Promise<void> {
  "use server";
  const courseSlug = String(formData.get("courseSlug") || "").trim().toLowerCase();
  const title = String(formData.get("title") || "").trim();
  const contentMd = String(formData.get("contentMd") || "").trim();
  const order = parseInt(String(formData.get("order") || "1"), 10) || 1;
  if (!courseSlug || !title) {
    return;
  }
  const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
  if (!course) {
    console.warn("admin:courses", "course not found", courseSlug);
    return;
  }
  await prisma.lesson.create({
    data: {
      courseId: course.id,
      title,
      contentMd: contentMd || null,
      order
    }
  });
  revalidatePath("/admin/courses");
}

async function deleteCourse(formData: FormData): Promise<void> {
  "use server";
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  if (!slug) return;
  await prisma.course.delete({ where: { slug } }).catch(() => null);
  revalidatePath("/admin/courses");
}

export default async function CoursesAdminPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role ?? "guest";
  if (!session || role !== "admin") {
    return (
      <main>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Administrare cursuri</h2>
        <p style={{ marginTop: 8 }}>
          Te rugam sa te <a href="/login?callbackUrl=/admin/courses" style={{ color: "#2563eb" }}>autentifici</a> ca administrator.
        </p>
      </main>
    );
  }

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      team: true,
      specialty: true,
      owner: { select: { email: true, name: true } },
      lessons: { orderBy: { order: "asc" } }
    }
  });

  return (
    <main>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Cursuri</h2>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff", marginBottom: 12 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Creeaza/actualizeaza curs</h3>
        <form action={createOrUpdateCourse} style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
          <input name="slug" placeholder="slug (ex: derm-essentials)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
          <input name="title" placeholder="titlu" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
          <input name="specialtySlug" placeholder="specialtySlug (ex: dermatologie)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
          <input name="ownerEmail" type="email" placeholder="owner email" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
          <select name="language" defaultValue="ro" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }}>
            <option value="ro">ro</option>
            <option value="en">en</option>
          </select>
          <select name="visibility" defaultValue="private" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }}>
            <option value="private">private</option>
            <option value="team">team</option>
            <option value="public">public</option>
            <option value="official">official</option>
          </select>
          <input name="teamSlug" placeholder="teamSlug (optional)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
          <textarea name="description" placeholder="descriere (optional)" rows={3} style={{ gridColumn: "1 / -1", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
          <div style={{ gridColumn: "1 / -1" }}>
            <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>Salveaza</button>
          </div>
        </form>
      </section>

      {courses.map((c) => (
        <section key={c.slug} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{c.title} <span style={{ color: "#6b7280" }}>({c.slug})</span></div>
              <div style={{ color: "#6b7280", fontSize: 12 }}>
                {c.specialty.name} - {c.language} - {c.visibility} {c.team ? `- team: ${c.team.slug}` : ""} - owner: {c.owner.name || c.owner.email}
              </div>
            </div>
            <form action={deleteCourse}>
              <input type="hidden" name="slug" value={c.slug} />
              <button style={{ color: "#b91c1c" }}>Sterge</button>
            </form>
          </div>

          {c.description && <p style={{ marginTop: 8 }}>{c.description}</p>}

          <div style={{ marginTop: 10 }}>
            <h4 style={{ fontWeight: 600, marginBottom: 6 }}>Lectii</h4>
            <ul style={{ listStyle: "disc", marginLeft: 18 }}>
              {c.lessons.map((l) => (
                <li key={l.id}><strong>{l.order}.</strong> {l.title}</li>
              ))}
            </ul>
          </div>

          <form action={addLesson} style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <input type="hidden" name="courseSlug" value={c.slug} />
            <input name="title" placeholder="titlu lectie" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
            <textarea name="contentMd" placeholder="continut (markdown, optional)" rows={4} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
            <input name="order" placeholder="ordine (numar)" defaultValue="1" style={{ width: 120, border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
            <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "6px 10px", fontWeight: 600 }}>Adauga lectie</button>
          </form>
        </section>
      ))}
    </main>
  );
}


