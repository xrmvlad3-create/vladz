import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role ?? "guest";

  if (!session) {
    return (
      <main>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Acces restrictionat</h2>
        <p style={{ marginTop: 8 }}>
          Te rugam sa te <a href="/login?callbackUrl=/admin" style={{ color: "#2563eb" }}>autentifici</a> pentru a continua.
        </p>
      </main>
    );
  }

  if (role !== "admin") {
    return (
      <main>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Permisiuni insuficiente</h2>
        <p style={{ marginTop: 8 }}>Aceasta zona este rezervata administratorilor.</p>
      </main>
    );
  }

  return (
    <main>
      <h2 style={{ fontSize: 18, fontWeight: 600 }}>Admin</h2>
      <p style={{ marginTop: 8 }}>Bun venit, {session.user?.name ?? session.user?.email}.</p>
      <ul style={{ marginTop: 12, listStyle: "disc", marginLeft: 18 }}>
        <li><a href="/admin/catalog" style={{ color: "#2563eb" }}>Administrare catalog</a></li>
        <li><a href="/admin/knowledge" style={{ color: "#2563eb" }}>Continut medical RO/EN</a></li>
        <li><a href="/admin/courses" style={{ color: "#2563eb" }}>Administrare cursuri</a></li>
        <li><a href="/admin/teams" style={{ color: "#2563eb" }}>Grupuri (teams)</a></li>
        <li><a href="/admin/users" style={{ color: "#2563eb" }}>Administrare utilizatori</a></li>
        <li><a href="/admin/requests" style={{ color: "#2563eb" }}>Cereri de acces</a></li>
        <li>Gestionare seed: <code>POST /api/seed</code> cu antet <code>x-seed-secret</code></li>
        <li>Cron: ruleaza la 15 minute la <code>/api/cron/every-15m</code></li>
      </ul>
    </main>
  );
}
