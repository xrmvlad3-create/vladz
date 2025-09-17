import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth";
import { prisma } from "@lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

// CREATE
async function createUser(formData: FormData): Promise<void> {
  "use server";
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim() || "user";
  const password = String(formData.get("password") || "");
  if (!email || !password) return { ok: false, error: "email și parola sunt obligatorii" };
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, name: name || null, role, password: hash } }).catch(async (e) => {
    if (String(e?.message || "").includes("Unique constraint")) {
      await prisma.user.update({ where: { email }, data: { name: name || null, role, password: hash } });
    } else {
      throw e;
    }
  });
  revalidatePath("/admin/users");
  return { ok: true };
}

// UPDATE
async function updateUser(formData: FormData): Promise<void> {
  "use server";
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim() || "user";
  if (!id) return;
  await prisma.user.update({ where: { id }, data: { name: name || null, role } });
  revalidatePath("/admin/users");
  return { ok: true };
}

// RESET PASSWORD
async function resetPassword(formData: FormData): Promise<void> {
  "use server";
  const id = String(formData.get("id") || "");
  const password = String(formData.get("password") || "");
  if (!id || !password) return;
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { password: hash } });
  revalidatePath("/admin/users");
  return { ok: true };
}

// DELETE
async function deleteUser(formData: FormData): Promise<void> {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.user.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/users");
  return { ok: true };
}

// SEARCH + PAGINATION
type Paging = { take: number; skip: number; page: number; q: string | null; pages: number };
function paging(total: number, pageParam?: string, size = 20): Paging {
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const take = size;
  const skip = (page - 1) * take;
  const pages = Math.max(1, Math.ceil(total / take));
  return { take, skip, page, q: null, pages };
}

export default async function AdminUsersPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role ?? "guest";
  if (!session || role !== "admin") {
    return (
      <main>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Administrare utilizatori</h2>
        <p style={{ marginTop: 8 }}>
          Te rugăm să te <a href="/login?callbackUrl=/admin/users" style={{ color: "#2563eb" }}>autentifici</a> ca administrator.
        </p>
      </main>
    );
  }

  const q = typeof searchParams?.q === "string" ? searchParams?.q : "";
  const pp = typeof searchParams?.p === "string" ? searchParams?.p : "1";
  const where = q
    ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] }
    : {};

  const total = await prisma.user.count({ where });
  const { take, skip, page, pages } = paging(total, pp);

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take,
    skip,
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  });

  const nav = (p: number) => `/admin/users?q=${encodeURIComponent(q || "")}&p=${p}`;

  return (
    <main>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Administrare utilizatori</h2>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff", marginBottom: 12 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Creează/Actualizează utilizator</h3>
        <form action={createUser} style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(5, minmax(0,1fr))" }}>
          <input name="email" placeholder="email" style={{ gridColumn: "span 2", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
          <input name="name" placeholder="nume (opțional)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
          <select name="role" defaultValue="user" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <input name="password" placeholder="parola" type="password" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
          <div style={{ gridColumn: "1 / -1" }}>
            <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }}>Salvează</button>
          </div>
        </form>
      </section>

      <form method="GET" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input name="q" defaultValue={q} placeholder="Caută după email sau nume…" style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }} />
        <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 12px", fontWeight: 600 }}>Caută</button>
      </form>

      <div style={{ color: "#6b7280", marginBottom: 8 }}>Rezultate: {total}</div>

      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {users.map(u => (
          <li key={u.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, marginBottom: 8, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div>
                <div><strong>{u.email}</strong> {u.name ? <span style={{ color: "#6b7280" }}>• {u.name}</span> : null}</div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>rol: {u.role} • creat: {new Date(u.createdAt).toLocaleString()}</div>
              </div>
              <form action={deleteUser}>
                <input type="hidden" name="id" value={u.id} />
                <button style={{ color: "#b91c1c" }}>Șterge</button>
              </form>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <form action={updateUser} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="hidden" name="id" value={u.id} />
                <input name="name" defaultValue={u.name || ""} placeholder="nume" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
                <select name="role" defaultValue={u.role} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "6px 10px", fontWeight: 600 }}>Salvează</button>
              </form>

              <form action={resetPassword} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="hidden" name="id" value={u.id} />
                <input name="password" placeholder="parolă nouă" type="password" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" }} />
                <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "6px 10px", fontWeight: 600 }}>Resetează parola</button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        <a href={nav(Math.max(1, page - 1))} style={{ color: "#2563eb", opacity: page <= 1 ? 0.5 : 1 }}>«</a>
        <span style={{ color: "#6b7280", fontSize: 12 }}>pagina {page} / {pages}</span>
        <a href={nav(Math.min(pages, page + 1))} style={{ color: "#2563eb", opacity: page >= pages ? 0.5 : 1 }}>»</a>
      </div>
    </main>
  );
}
