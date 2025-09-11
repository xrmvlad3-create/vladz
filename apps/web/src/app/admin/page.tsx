import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role ?? "guest";

  if (!session) {
    return (
      <main>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Acces restricționat</h2>
        <p style={{ marginTop: 8 }}>
          Te rugăm să te <a href="/login?callbackUrl=/admin" style={{ color: "#2563eb" }}>autentifici</a>.
        </p>
      </main>
    );
  }

  if (role !== "admin") {
    return (
      <main>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Permisiune insuficientă</h2>
        <p style={{ marginTop: 8 }}>Acestă zonă este rezervată administratorilor.</p>
      </main>
    );
  }

  return (
    <main>
      <h2 style={{ fontSize: 18, fontWeight: 600 }}>Admin</h2>
      <p style={{ marginTop: 8 }}>Bun venit, {session.user?.name ?? session.user?.email}.</p>
      <ul style={{ marginTop: 12, listStyle: "disc", marginLeft: 18 }}>
        <li>Gestionare seed: <code>POST /api/seed</code> cu antet <code>x-seed-secret</code></li>
        <li>Cron: rulează la 15 minute la <code>/api/cron/every-15m</code></li>
      </ul>
    </main>
  );
}