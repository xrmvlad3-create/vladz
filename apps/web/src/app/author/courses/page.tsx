import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth";
import { prisma } from "@lib/prisma";
import { revalidatePath } from "next/cache";
import { Language, Visibility } from "@prisma/client";

async function createOrUpdateCourse(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session) return { ok: false };

  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const specialtySlug = String(formData.get("specialtySlug") || "").trim().toLowerCase();
  const language = (String(formData.get("language") || "ro") as "ro" | "en");
  const visibility = (String(formData.get("visibility") || "team") as "private" | "team" | "public");
  const teamSlug = String(formData.get("teamSlug") || "").trim().toLowerCase();

  if (!slug || !title || !specialtySlug) return { ok: false };

  const [me, sp, team] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user?.email || "" } }),
    prisma.specialty.findUnique({ where: { slug: specialtySlug } }),
    teamSlug ? prisma.team.findUnique({ where: { slug: teamSlug } }) : Promise.resolve(null)
  ]);

  if (!me || !sp) return { ok: false, error: "owner or specialty not found" };

  // verify membership if team set
  if (team) {
    const isMember = await prisma.teamMember.findFirst({ where: { teamId: team.id, userId: me.id } });
    const isOwner = team.ownerId === me.id;
    if (!isOwner && !isMember) return { ok: false, error: "nu ești membru al echipei" };
  }

  await prisma.course.upsert({
    where: { slug },
    update: {
      title,
      description: description || null,
      language: language === "ro" ? Language.ro : Language.en,
      visibility: visibility as any,
      teamId: team?.id ?? null,
      specialtyId: sp.id,
      ownerId: me.id
    },
    create: {
      slug,
      title,
      description: description || null,
      language: language === "ro" ? Language.ro : Language.en,
      visibility: visibility as any,
      teamId: team?.id ?? null,
      specialtyId: sp.id,
      ownerId: me.id
    }
  });

  revalidatePath("/author/courses");
  return { ok: true };
}

async function addLesson(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session) return { ok: false };
  const courseSlug = String(formData.get("courseSlug") || "").trim().toLowerCase();
  const title = String(formData.get("title") || "").trim();
  const contentMd = String(formData.get("contentMd") || "").trim();
  const order = parseInt(String(formData.get("order") || "1"), 10) || 1;
  if (!courseSlug || !title) return { ok: false };

  const me = await prisma.user.findUnique({ where: { email: session.user?.email || "" } });
  if (!me) return { ok: false };
  const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
  if (!course) return { ok: false, error: "course not found" };

  // only owner or team member if team visibility
  if (course.ownerId !== me.id) {
    if (!course.teamId) return { ok: false };
    const member = await prisma.teamMember.findFirst({ where: { teamId: course.teamId, userId: me.id } });
    const team = await prisma.team.findUnique({ where: { id: course.teamId } });
    const allowed = member || team?.ownerId === me.id;
    if (!allowed) return { ok: false };
  }

  await prisma.lesson.create({
    data: {
      courseId: course.id,
      title,
      contentMd: contentMd || null,
      order
    }
  });

  revalidatePath("/author/courses");
  return { ok: true };
}

async function deleteCourse(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session) return { ok: false };
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  if (!slug) return { ok: false };
  const me = await prisma.user.findUnique({ where: { email: session.user?.email || "" } });
  if (!me) return { ok: false };
  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) return { ok: false };
  if (course.ownerId !== me.id) return { ok: false, error: "doar owner poate șterge" };
  await prisma.course.delete({ where: { slug } }).catch(() => null);
  revalidatePath("/author/courses");
  return { ok: true };
}

export default async function AuthorCoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <main>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Cursurile mele</h2>
        <p style={{ marginTop: 8 }}>
          Te rugăm să te <a href="/login?callbackUrl=/author/courses" style={{ color: "#2563eb" }}>autentifici</a>.
        </p>
      </main>
    );
  }

  const me = await prisma.user.findUnique({ where: { email: session.user?.email || "" } });
  if (!me) return <main><p>Eroare utilizator.</p></main>;

  const teams = await prisma.team.findMany({
    where: { OR: [{ ownerId: me.id }, { members: { some: { userId: me.id } } }] },
    orderBy: { name: "asc" }
  });

  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { ownerId: me.id },
        { team: { ownerId: me.id } },
        { team: { members: { some: { userId: me.id } } } }
      ]
    },
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
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Cursurile mele</h2>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff", marginBottom: 12 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Creează/actualizează curs</h3>
        <form action={createOrUpdateCourse} style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
          <input name="slug" placeholder="slug (ex: derm-essentials)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
          <input name="title" placeholder="titlu" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
          <input name="specialtySlug" placeholder="specialtySlug (ex: dermatologie)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
          <select name="language" defaultValue="ro" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }}>
            <option value="ro">ro</option>
            <option value="en">en</option>
          </select>
          <select name="visibility" defaultValue="team" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }}>
            <option value="team">team</option>
            <option value="private">private</option>
            <option value="public">public</option>
          </select>
          <select name="teamSlug" defaultValue="" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }}>
            <option value="">(fără echipă)</option>
            {teams.map(t => <option key={t.id} value={t.slug}>{t.slug}</option>)}
          </select>
          <textarea name="description" placeholder="descriere (opțional)" rows={3} style={{ gridColumn: "1 / -1", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
          <div style={{ gridColumn: "1 / -1" }}>
            <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>Salvează</button>
          </div>
        </form>
      </section>

      {courses.map(c => (
        <section key={c.slug} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{c.title} <span style={{ color: "#6b7280" }}>({c.slug})</span></div>
              <div style={{ color: "#6b7280", fontSize: 12 }}>
                {c.specialty.name} • {c.language} • {c.visibility} {c.team ? `• team: ${c.team.slug}` : ""} • owner: {c.owner.name || c.owner.email}
              </div>
            </div>
            <form action={deleteCourse}>
              <input type="hidden" name="slug" value={c.slug} />
              <button style={{ color: "#b91c1c" }}>Șterge</button>
            </form>
          </div>

          {c.description && <p style={{ marginTop: 8 }}>{c.description}</p>}

          <div style={{ marginTop: 10 }}>
            <h4 style={{ fontWeight: 600, marginBottom: 6 }}>Lecții</h4>
            <ul style={{ listStyle: "disc", marginLeft: 18 }}>
              {c.lessons.map(l => <li key={l.id}><strong>{l.order}.</strong> {l.title}</li>)}
            </ul>
          </div>

          <form action={addLesson} style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <input type="hidden" name="courseSlug" value={c.slug} />
            <input name="title" placeholder="titlu lecție" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
            <textarea name="contentMd" placeholder="conținut (markdown, opțional)" rows={4} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
            <input name="order" placeholder="ordine (număr)" defaultValue="1" style={{ width: 120, border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
            <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "6px 10px", fontWeight: 600 }}>Adaugă lecție</button>
          </form>
        </section>
      ))}
    </main>
  );
}