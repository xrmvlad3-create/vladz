import { prisma } from "@lib/prisma";
import { hasDatabaseUrl, missingDatabaseMessage } from "@lib/env";

export const dynamic = "force-dynamic";

type Stats = {
  specialties: number;
  conditions: number;
  procedures: number;
  courses: number;
  ok: boolean;
};

async function getCounts(): Promise<Stats> {
  if (!hasDatabaseUrl()) {
    return { specialties: 0, conditions: 0, procedures: 0, courses: 0, ok: false };
  }

  try {
    const [specialties, conditions, procedures, courses] = await Promise.all([
      prisma.specialty.count(),
      prisma.condition.count(),
      prisma.procedure.count(),
      prisma.course.count()
    ]);
    return { specialties, conditions, procedures, courses, ok: true };
  } catch (e) {
    console.warn("home:getCounts", e instanceof Error ? e.message : e);
    return { specialties: 0, conditions: 0, procedures: 0, courses: 0, ok: false };
  }
}

export default async function HomePage() {
  const stats = await getCounts();

  return (
    <main>
      <section style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
            Biblioteca medicala RO/EN si asistent AI pentru clinicieni
          </h2>
          <p style={{ color: "#6b7280", marginTop: 10 }}>
            IzaManagement aduce o biblioteca clinica curata, redactare asistata, cursuri, echipe si acces bilingv intr-o platforma moderna.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <a href="/login" style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "10px 14px", fontWeight: 700 }}>
              Incepe acum
            </a>
            <a href="/ai" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontWeight: 600, color: "#111827" }}>
              Testeaza asistentul AI
            </a>
            <a href="/request-access" style={{ border: "1px solid #111827", borderRadius: 8, padding: "10px 14px", fontWeight: 700, color: "#111827" }}>
              Cere acces
            </a>
            <a href="/preview" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontWeight: 600, color: "#111827" }}>
              Vezi interfata
            </a>
          </div>
          {!stats.ok && (
            <div style={{ marginTop: 12, color: "#b91c1c", fontSize: 12 }}>{missingDatabaseMessage()}</div>
          )}
          <div style={{ display: "flex", gap: 16, marginTop: 12, color: "#6b7280", fontSize: 12 }}>
            <span>Specialitati: {stats.specialties}</span>
            <span>Afectiuni: {stats.conditions}</span>
            <span>Proceduri: {stats.procedures}</span>
            <span>Cursuri: {stats.courses}</span>
          </div>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Ce obtii:</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Biblioteca clinica structurata (RO/EN) cu surse citate</li>
            <li>Redactare asistata de AI cu structura Markdown pastrata</li>
            <li>Echipe si grupuri pentru partajare privata</li>
            <li>Creare cursuri si lectii partajate cu echipa</li>
            <li>Aplicatie rapida gazduita pe Vercel</li>
          </ul>
          <div style={{ color: "#6b7280", fontSize: 12, marginTop: 8 }}>
            Continut educational, nu recomandari destinate pacientilor. Editorii marcheaza materiale oficiale dupa review.
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12, marginBottom: 28 }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Exemplu: afectiuni</div>
          <p style={{ color: "#6b7280" }}>Cauta afectiuni, vezi rezumate si tratamente clare.</p>
          <a href="/conditions" style={{ color: "#2563eb" }}>Deschide &rarr;</a>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Exemplu: proceduri</div>
          <p style={{ color: "#6b7280" }}>Indicatii, contraindicatii, pasi si ingrijire post-procedura.</p>
          <a href="/procedures" style={{ color: "#2563eb" }}>Deschide &rarr;</a>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Exemplu: asistent AI</div>
          <p style={{ color: "#6b7280" }}>Drafturi RO/EN, traduceri rapide si suport educational.</p>
          <a href="/ai" style={{ color: "#2563eb" }}>Deschide &rarr;</a>
        </div>
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 16, marginBottom: 28 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Cum ajuta in practica</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Rezumat rapid si structura clara pentru garda, ambulatoriu si predare</li>
          <li>Organizezi cunostintele in echipa (profesor, rezidenti, colegi)</li>
          <li>Redactezi cursuri si le partajezi cu grupul tau</li>
          <li>Continut bilingv util pentru colaborari internationale</li>
        </ul>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Pret corect, fara surprize</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 16 }}>
            <div style={{ fontWeight: 700 }}>Individual</div>
            <div style={{ fontSize: 28, fontWeight: 800, margin: "6px 0" }}>14 EUR / luna</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Acces complet la biblioteca</li>
              <li>Asistent AI cu limite echilibrate</li>
              <li>Creare cursuri personale</li>
            </ul>
            <div style={{ marginTop: 10 }}>
              <a href="/login" style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 12px", fontWeight: 700 }}>Incepe</a>
            </div>
          </div>
          <div style={{ border: "2px solid #111827", borderRadius: 12, background: "#fff", padding: 16 }}>
            <div style={{ fontWeight: 700 }}>Echipa</div>
            <div style={{ fontSize: 28, fontWeight: 800, margin: "6px 0" }}>10 EUR / luna / medic</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Echipe si partajare privata</li>
              <li>Co-autorat cursuri si continut</li>
              <li>Control vizibilitate: private / team / public / official</li>
            </ul>
            <div style={{ marginTop: 10 }}>
              <a href="/author/teams" style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 12px", fontWeight: 700 }}>Creeaza echipa</a>
            </div>
          </div>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 16 }}>
            <div style={{ fontWeight: 700 }}>Academie sau spital</div>
            <div style={{ fontSize: 28, fontWeight: 800, margin: "6px 0" }}>Contact</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Branding si continut oficial</li>
              <li>Import structura si suport editorial</li>
              <li>Integrare SSO la cerere</li>
            </ul>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <a href="/request-access" style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "8px 12px", fontWeight: 700 }}>Cere acces</a>
              <a href="mailto:contact@izamanagement.ro" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontWeight: 700, color: "#111827" }}>Contacteaza-ne</a>
            </div>
          </div>
        </div>
        <div style={{ color: "#6b7280", fontSize: 12, marginTop: 8 }}>
          Preturile pot varia in functie de utilizarea AI. In perioada de lansare oferim migrare gratuita a continutului existent.
        </div>
      </section>

      <section style={{ textAlign: "center", padding: 18, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Incepe astazi si modernizeaza biblioteca</div>
        <div style={{ color: "#6b7280", marginBottom: 10 }}>Creeaza o echipa, redacteaza continut in RO/EN si partajeaza cu colegii.</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <a href="/login" style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "10px 14px", fontWeight: 700 }}>
            Autentificare sau inregistrare
          </a>
          <a href="/author/teams" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontWeight: 600, color: "#111827" }}>
            Creeaza echipa
          </a>
        </div>
      </section>
    </main>
  );
}
