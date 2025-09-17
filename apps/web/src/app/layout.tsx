export const metadata = {
  title: "IzaManagement",
  description: "Medical knowledge base and AI assistant preview built with Next.js"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body style={{ fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "24px" }}>
          <header style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 20, fontWeight: 600 }}>IzaManagement</h1>
            <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="/" style={{ color: "#2563eb" }}>Home</a>
              <a href="/request-access" style={{ color: "#2563eb" }}>Cere acces</a>
              <a href="/dashboard" style={{ color: "#2563eb" }}>Dashboard</a>
              <a href="/conditions" style={{ color: "#2563eb" }}>Afectiuni</a>
              <a href="/procedures" style={{ color: "#2563eb" }}>Proceduri</a>
              <a href="/courses" style={{ color: "#2563eb" }}>Cursuri</a>
              <a href="/ai" style={{ color: "#2563eb" }}>AI</a>
              <a href="/author" style={{ color: "#2563eb" }}>Author</a>
              <a href="/preview" style={{ color: "#2563eb" }}>Preview</a>
              <a href="/api/health" style={{ color: "#2563eb" }}>Health</a>
            </nav>
          </header>
          {children}
          <footer style={{ marginTop: 32, color: "#6b7280", fontSize: 12 }}>
            Next.js fullstack scaffold. Conecteaza Postgres (Neon sau Vercel Postgres) prin variabila DATABASE_URL.
          </footer>
        </div>
      </body>
    </html>
  );
}
