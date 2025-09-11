export default function AuthorLayout({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
      <aside style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}>
        <div style={{ padding: 14, borderBottom: "1px solid #f3f4f6", fontWeight: 600 }}>
          Spațiu autori
        </div>
        <nav style={{ padding: 10, display: "grid", gap: 6 }}>
          <a href="/author" style={{ color: "#2563eb" }}>Prezentare generală</a>
          <div style={{ height: 1, background: "#f3f4f6", margin: "8px 0" }} />
          <a href="/author/knowledge" style={{ color: "#2563eb" }}>Conținut medical</a>
          <a href="/author/courses" style={{ color: "#2563eb" }}>Cursuri</a>
          <a href="/author/teams" style={{ color: "#2563eb" }}>Echipe</a>
          <div style={{ height: 1, background: "#f3f4f6", margin: "8px 0" }} />
          <a href="/ai" style={{ color: "#2563eb" }}>Asistent AI</a>
          <a href="/dashboard" style={{ color: "#2563eb" }}>Dashboard</a>
        </nav>
        <div style={{ padding: 10, color: "#6b7280", fontSize: 12 }}>
          Conținutul creat aici poate fi partajat cu echipa ta sau publicat.
        </div>
      </aside>
      <div>
        {children}
      </div>
    </section>
  );
}