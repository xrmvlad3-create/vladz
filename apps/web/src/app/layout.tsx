export const metadata = {
  title: "IzaManagement",
  description: "Medical platform — Next.js preview",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body style={{ fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px" }}>
          <header style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ fontSize: 20, fontWeight: 600 }}>IzaManagement</h1>
            <nav style={{ display: "flex", gap: 12 }}>
              <a href="/" style={{ color: "#2563eb" }}>Dashboard</a>
              <a href="/api/health" style={{ color: "#2563eb" }}>Health</a>
            </nav>
          </header>
          {children}
          <footer style={{ marginTop: 32, color: "#6b7280", fontSize: 12 }}>
            Next.js fullstack scaffold. Connect Postgres (Neon/Vercel Postgres) via DATABASE_URL.
          </footer>
        </div>
      </body>
    </html>
  );
}