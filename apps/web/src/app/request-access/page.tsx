import { prisma } from "@lib/prisma";
import { hasDatabaseUrl, missingDatabaseMessage, warnIfNoDatabase } from "@lib/env";
import { revalidatePath } from "next/cache";

async function submit(formData: FormData): Promise<void> {
  "use server";
  if (!warnIfNoDatabase("request-access:submit")) {
    return;
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim() || null;
  const role = String(formData.get("role") || "").trim() || null;
  const organization = String(formData.get("organization") || "").trim() || null;
  const message = String(formData.get("message") || "").trim() || null;
  const source = String(formData.get("source") || "").trim() || null;

  if (!email) {
    return;
  }

  await prisma.requestAccess
    .create({ data: { email, name, role, organization, message, source: source || "direct" } })
    .catch((e) => {
      console.error("request-access", e instanceof Error ? e.message : e);
    });

  revalidatePath("/request-access");
}

export default function RequestAccessPage() {
  const hasDb = hasDatabaseUrl();

  return (
    <main>
      <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Cere acces</h2>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          Completeaza formularul de mai jos. Te contactam pentru activarea contului si setarile initiale.
        </p>

        {!hasDb && (
          <p style={{ color: "#b91c1c", fontSize: 13 }}>{missingDatabaseMessage()}</p>
        )}

        <form action={submit} style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
            <input name="name" placeholder="Nume complet" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px" }} />
            <input name="email" type="email" placeholder="Email (obligatoriu)" required style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px" }} />
          </div>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
            <input name="role" placeholder="Rol (ex: medic, rezident)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px" }} />
            <input name="organization" placeholder="Institutie sau clinica (optional)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px" }} />
          </div>
          <textarea name="message" rows={4} placeholder="Mesaj (scop, specialitate, estimare echipa)" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px" }} />
          <input type="hidden" name="source" value="landing" />
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "10px 14px", fontWeight: 700 }}>
              Trimite
            </button>
            <a href="/" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontWeight: 600, color: "#111827" }}>
              Inapoi
            </a>
          </div>
        </form>

        <div style={{ color: "#6b7280", fontSize: 12, marginTop: 12 }}>
          Alternativ, ne poti scrie direct: <a href="mailto:contact@izamanagement.ro" style={{ color: "#2563eb" }}>contact@izamanagement.ro</a>
        </div>
      </section>
    </main>
  );
}
