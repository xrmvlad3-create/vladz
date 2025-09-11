import { prisma } from "@lib/prisma";

async function getCounts() {
  try {
    const [specialties, conditions, procedures, courses] = await Promise.all([
      prisma.specialty.count(),
      prisma.condition.count(),
      prisma.procedure.count(),
      prisma.course.count()
    ]);
    return { specialties, conditions, procedures, courses, ok: true };
  } catch (e) {
    return { specialties: 0, conditions: 0, procedures: 0, courses: 0, ok: false };
  }
}

export default async function HomePage() {
  const stats = await getCounts();

  return (
    <main>
      {/* Hero */}
      <section style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
            Biblioteca medicală RO/EN + Asistent AI pentru clinicieni
          </h2>
          <p style={{ color: "#6b7280", marginTop: 10 }}>
            IzaManagement te ajută să practici mai bine, mai rapid: bibliotecă clinică curată, redactare asistată,
            cursuri, echipe pentru Rezidenți și colegi — totul bilingv, pe o platformă modernă.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <a href="/login" style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "10px 14px", fontWeight: 700 }}>
              Începe acum
            </a>
            <a href="/ai" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontWeight: 600, color: "#111827" }}>
              Încearcă asistentul AI
            </a>
            <a href="/request-access" style={{ border: "1px solid #111827", borderRadius: 8, padding: "10px 14px", fontWeight: 700, color: "#111827" }}>
              Cere acces
            </a>
            <a href="/preview" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontWeight: 600, color: "#111827" }}>
              Vezi interfața
            </a>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 12, color: "#6b7280", fontSize: 12 }}>
            <span>Specialități: {stats.specialties}</span>
            <span>Afecțiuni: {stats.conditions}</span>
            <span>Proceduri: {stats.procedures}</span>
            <span>Cursuri: {stats.courses}</span>
          </div>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Ce obții:</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Bibliotecă clinică structurată (RO/EN), cu referințe</li>
            <li>Redactare asistată de AI, cu păstrarea structurii Markdown</li>
            <li>Echipe/grupuri pentru partajare internă (rezidenți, colegi)</li>
            <li>Creare cursuri + lecții, partajare cu echipa</li>
            <li>Aplicație rapidă, găzduită pe Vercel</li>
          </ul>
          <div style={{ color: "#6b7280", fontSize: 12, marginTop: 8 }}>
            Conținut educațional, nu recomandare pentru pacienți. Editorii pot marca „official/public” după review.
          </div>
        </div>
      </section>

      {/* Examples */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12, marginBottom: 28 }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Exemplu: Afecțiuni</div>
          <p style={{ color: "#6b7280" }}>Caută afecțiuni, vezi rezumate și tratamente.</p>
          <a href="/conditions" style={{ color: "#2563eb" }}>Deschide →</a>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Exemplu: Proceduri</div>
          <p style={{ color: "#6b7280" }}>Indicații, contraindicații, pași, îngrijire post-procedură.</p>
          <a href="/procedures" style={{ color: "#2563eb" }}>Deschide →</a>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Exemplu: Asistent AI</div>
          <p style={{ color: "#6b7280" }}>Drafturi RO/EN, traduceri, diagnostic diferențial (educațional).</p>
          <a href="/ai" style={{ color: "#2563eb" }}>Deschide →</a>
        </div>
      </section>

      {/* How it helps */}
      <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 16, marginBottom: 28 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Cum te ajută în practică</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Rezumat rapid + structură clară pentru ședințe, gardă, ambulatoriu</li>
          <li>Îți organizezi cunoștințele în echipă (profesor → rezidenți, colegi)</li>
          <li>Redactezi cursuri și le partajezi cu grupul</li>
          <li>Conținut bilingv RO/EN, util pentru colaborări internaționale</li>
        </ul>
      </section>

      {/* Pricing */}
      <section style={{ marginBottom: 28 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Preț corect, fără surprize</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 16 }}>
            <div style={{ fontWeight: 700 }}>Individual</div>
            <div style={{ fontSize: 28, fontWeight: 800, margin: "6px 0" }}>14€ / lună</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Acces complet la bibliotecă</li>
              <li>Asistent AI (limitat corect)</li>
              <li>Creare cursuri personale</li>
            </ul>
            <div style={{ marginTop: 10 }}>
              <a href="/login" style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 12px", fontWeight: 700 }}>Începe</a>
            </div>
          </div>
          <div style={{ border: "2px solid #111827", borderRadius: 12, background: "#fff", padding: 16 }}>
            <div style={{ fontWeight: 700 }}>Echipă (rezidenți/clinică)</div>
            <div style={{ fontSize: 28, fontWeight: 800, margin: "6px 0" }}>10€ / lună / medic</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Echipe și partajare privată</li>
              <li>Co-autorat cursuri și conținut</li>
              <li>Control vizibilitate: private / team / public / official</li>
            </ul>
            <div style={{ marginTop: 10 }}>
              <a href="/author/teams" style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 12px", fontWeight: 700 }}>Creează echipă</a>
            </div>
          </div>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 16 }}>
            <div style={{ fontWeight: 700 }}>Academia / Spital</div>
            <div style={{ fontSize: 28, fontWeight: 800, margin: "6px 0" }}>Contact</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Branding și conținut oficial</li>
              <li>Import structură + suport editorial</li>
              <li>Integrare SSO (la cerere)</li>
            </ul>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <a href="/request-access" style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 12px", fontWeight: 700 }}>Cere acces</a>
              <a href="mailto:contact@izamanagement.ro" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontWeight: 700, color: "#111827" }}>Contactează-ne</a>
            </div>
          </div>
        </div>
        <div style={{ color: "#6b7280", fontSize: 12, marginTop: 8 }}>
          Prețurile pot ajusta în funcție de utilizarea AI. În perioada de lansare, oferim migrare gratuită a conținutului existent.
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: 18, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Începe azi — modernizează-ți biblioteca</div>
        <div style={{ color: "#6b7280", marginBottom: 10 }}>Creează o echipă, redactează conținut în RO/EN, partajează cu colegii.</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <a href="/login" style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "10px 14px", fontWeight: 700 }}>
            Autentificare / Înregistrare
          </a>
          <a href="/author/teams" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontWeight: 600, color: "#111827" }}>
            Creează echipă
          </a>
        </div>
      </section>
    </main>
  );
}