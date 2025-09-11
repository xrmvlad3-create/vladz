import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth";
import { prisma } from "@lib/prisma";
import { revalidatePath } from "next/cache";

async function createTeam(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const ownerEmail = String(formData.get("ownerEmail") || "").trim().toLowerCase();
  if (!name || !slug || !ownerEmail) return { ok: false, error: "name, slug, ownerEmail" };
  const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!owner) return { ok: false, error: "Owner user not found" };
  const team = await prisma.team.upsert({
    where: { slug },
    update: { name, ownerId: owner.id },
    create: { name, slug, ownerId: owner.id }
  });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: owner.id } },
    update: { role: "owner" },
    create: { teamId: team.id, userId: owner.id, role: "owner" }
  });
  revalidatePath("/admin/teams");
  return { ok: true };
}

async function addMember(formData: FormData) {
  "use server";
  const teamSlug = String(formData.get("teamSlug") || "").trim().toLowerCase();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "member");
  if (!teamSlug || !email) return { ok: false };
  const team = await prisma.team.findUnique({ where: { slug: teamSlug } });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!team || !user) return { ok: false, error: "team or user missing" };
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: user.id } },
    update: { role },
    create: { teamId: team.id, userId: user.id, role }
  });
  revalidatePath("/admin/teams");
  return { ok: true };
}

async function removeMember(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false };
  await prisma.teamMember.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/teams");
  return { ok: true };
}

export default async function TeamsAdminPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role ?? "guest";
  if (!session || role !== "admin") {
    return (
      <main>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Administrare grupuri (team)</h2>
        <p style={{ marginTop: 8 }}>
          Te rugăm să te <a href="/login?callbackUrl=/admin/teams" style={{ color: "#2563eb" }}>autentifici</a> ca administrator.
        </p>
      </main>
    );
  }

  const teams = await prisma.team.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { email: true, name: true } },
      members: {
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: "asc" }
      }
    }
  });

  return (
    <main>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Grupuri clinice</h2>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff", marginBottom: 12 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Creează/actualizează grup</h3>
        <form action={createTeam} style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
          <input name="name" placeholder="Nume grup (ex: Grup Dermatologie)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
          <input name="slug" placeholder="Slug (ex: clinica-derma)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
          <input name="ownerEmail" placeholder="Email owner" type="email" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
          <div style={{ gridColumn: "1 / -1" }}>
            <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>Salvează</button>
          </div>
        </form>
      </section>

      <section>
        {teams.map(t => (
          <div key={t.slug} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{t.name} <span style={{ color: "#6b7280" }}>({t.slug})</span></div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>Owner: {t.owner.name || t.owner.email}</div>
              </div>
              <form action={addMember} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="hidden" name="teamSlug" value={t.slug} />
                <input name="email" placeholder="email membru" type="email" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
                <select name="role" defaultValue="member" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }}>
                  <option value="member">member</option>
                  <option value="admin">admin</option>
                </select>
                <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "6px 10px", fontWeight: 600 }}>Adaugă</button>
              </form>
            </div>

            <ul style={{ listStyle: "none", paddingLeft: 0, marginTop: 8 }}>
              {t.members.map(m => (
                <li key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <div>
                    <strong>{m.user.email}</strong> {m.user.name ? <span style={{ color: "#6b7280" }}>• {m.user.name}</span> : null} <span style={{ color: "#6b7280" }}>({m.role})</span>
                  </div>
                  <form action={removeMember}>
                    <input type="hidden" name="id" value={m.id} />
                    <button style={{ color: "#b91c1c" }}>Elimină</button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}