import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth";

export default async function AuthorHome() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <main>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Spațiu autori</h2>
        <p style={{ marginTop: 8 }}>
          Te rugăm să te <a href="/login?callbackUrl=/author" style={{ color: "#2563eb" }}>autentifici</a> cu contul tău de medic.
        </p>
      </main>
    );
  }

  return (
    <main>
      <h2 style={{ fontSize: 18, fontWeight: 600 }}>Spațiu autori</h2>
      <p style={{ marginTop: 8 }}>Bun venit, {session.user?.name ?? session.user?.email}. Creează echipe, redactează conținut și cursuri.</p>
      <ul style={{ marginTop: 12, listStyle: "disc", marginLeft: 18 }}>
        <li><a href="/author/teams" style={{ color: "#2563eb" }}>Echipele mele</a></li>
        <li><a href="/author/knowledge" style={{ color: "#2563eb" }}>Conținut medical — echipe</a></li>
        <li><a href="/author/courses" style={{ color: "#2563eb" }}>Cursurile mele</a></li>
      </ul>
    </main>
  );
}