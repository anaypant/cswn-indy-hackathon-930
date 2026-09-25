import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DOCTORS, byDateDesc, fmtDate, resetDemo, useStore, type Patient } from "@/lib/data";
import { getPatientInsight } from "@/lib/insights.functions";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { title: "Clinician Dashboard — Symptom Advocate" },
      { name: "description", content: "Review patient symptom diaries and AI pattern flags for ACS risk." },
      { property: "og:title", content: "Clinician Dashboard — Symptom Advocate" },
      { property: "og:description", content: "Review patient symptom diaries and AI pattern flags." },
    ],
  }),
  component: DoctorPortal,
});

const SESSION = "sa-doctor";

function DoctorPortal() {
  const [did, setDid] = useState<string | null>(null);
  const [sel, setSel] = useState(DOCTORS[0]?.id ?? "");
  useEffect(() => setDid(sessionStorage.getItem(SESSION)), []);
  const doctor = DOCTORS.find((d) => d.id === did);
  const logout = () => { sessionStorage.removeItem(SESSION); setDid(null); };

  return (
    <div className="min-h-screen">
      <AppHeader portal="doctor" who={doctor?.name} onLogout={doctor ? logout : undefined} />
      {!doctor ? (
        <main className="mx-auto max-w-md px-5">
          <div className="card-paper rise mt-6 p-6">
            <p className="eyebrow">Clinician access</p>
            <h1 className="mt-2 font-display text-3xl font-medium">Doctor login</h1>
            <select value={sel} onChange={(e) => setSel(e.target.value)} className="mt-6 w-full rounded-2xl border bg-paper px-4 py-3.5">
              {DOCTORS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <button onClick={() => { sessionStorage.setItem(SESSION, sel); setDid(sel); }}
              className="mt-4 w-full rounded-full bg-primary py-3.5 font-semibold text-primary-foreground">Sign in</button>
          </div>
        </main>
      ) : (
        <Dashboard doctorId={doctor.id} patientIds={doctor.patient_ids} />
      )}
    </div>
  );
}

function Dashboard({ doctorId, patientIds }: { doctorId: string; patientIds: string[] }) {
  const { patients, entries, ready } = useStore();
  const mine = patients.filter((p) => patientIds.includes(p.id));
  const [active, setActive] = useState(patientIds[0] ?? "");
  const patient = mine.find((p) => p.id === active);
  if (!ready) return null;

  return (
    <main className="mx-auto flex max-w-[1400px] gap-6 px-5 pb-16 lg:px-10">
      <aside className="w-[260px] shrink-0">
        <div className="card-paper sticky top-6 p-4">
          <p className="eyebrow px-2">Patients · {mine.length}</p>
          <ul className="mt-3 space-y-1">
            {mine.map((p) => (
              <li key={p.id}>
                <button onClick={() => setActive(p.id)}
                  className={`w-full rounded-2xl px-3 py-3 text-left transition ${p.id === active ? "bg-primary/12 outline outline-primary/25" : "hover:bg-muted"}`}>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.age ? `${p.age} y` : "Age not set"}</p>
                </button>
              </li>
            ))}
          </ul>
          <button onClick={resetDemo} className="mt-4 w-full px-2 text-left text-xs text-muted-foreground underline">Reset demo data</button>
        </div>
      </aside>
      {patient && <Detail key={patient.id} doctorId={doctorId} patient={patient} entries={entries.filter((e) => e.patient_id === patient.id)} />}
    </main>
  );
}

function Detail({ doctorId, patient, entries }: { doctorId: string; patient: Patient; entries: ReturnType<typeof useStore>["entries"] }) {
  const [desc, setDesc] = useState(true);
  const rows = [...entries].sort(byDateDesc);
  if (!desc) rows.reverse();

  return (
    <div className="min-w-0 flex-1 space-y-6">
      <section className="card-paper flex flex-wrap items-end justify-between gap-6 p-6">
        <div>
          <p className="eyebrow">Patient</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">{patient.name}</h1>
        </div>
        <dl className="flex gap-8">
          {[["Age", patient.age ?? "—"], ["Height", patient.height ?? "—"], ["Weight", patient.weight ?? "—"], ["Entries", entries.length]].map(([k, v]) => (
            <div key={k as string}><dt className="eyebrow">{k}</dt><dd className="font-display text-xl font-medium">{v}</dd></div>
          ))}
        </dl>
      </section>

      <InsightPanel doctorId={doctorId} patientId={patient.id} />

      <section className="card-paper p-2">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-display text-lg font-semibold">Log history</h2>
          <button onClick={() => setDesc(!desc)} className="rounded-full px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10">
            Date {desc ? "↓ newest first" : "↑ oldest first"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="eyebrow">
                <th className="px-4 py-2">Date</th><th className="px-4 py-2">Symptoms</th><th className="px-4 py-2">Severity</th>
                <th className="px-4 py-2">Sleep</th><th className="px-4 py-2">Cycle</th><th className="px-4 py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((e) => (
                <tr key={e.id} className={/chest pain|chest pressure/i.test(e.symptoms_text) ? "bg-accent/8" : ""}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{fmtDate(e.date)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.symptoms_text || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-14 rounded-full bg-muted"><span className={`block h-1.5 rounded-full ${e.severity >= 5 ? "bg-accent" : "bg-primary-soft"}`} style={{ width: `${e.severity * 10}%` }} /></span>
                      <span className={`font-display font-semibold ${e.severity >= 5 ? "text-accent" : "text-primary-soft"}`}>{e.severity}</span>
                    </span>
                  </td>
                  <td className={`px-4 py-3 ${e.sleep_hours < 5 ? "font-semibold text-accent" : "text-muted-foreground"}`}>{e.sleep_hours}h</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {e.menstrual_phase !== "Not tracking" ? `${e.menstrual_phase}${e.menstrual_day ? ` · day ${e.menstrual_day}` : ""}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function InsightPanel({ doctorId, patientId }: { doctorId: string; patientId: string }) {
  const fetchInsight = useServerFn(getPatientInsight);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["insight", doctorId, patientId],
    queryFn: () => fetchInsight({ data: { doctorId, patientId } }),
  });
  const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

  return (
    <section className="card-insight rise p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-full bg-primary/15"><span className="size-2.5 rounded-full bg-primary" /></span>
          <h2 className="font-display text-xl font-semibold text-primary">AI Insight</h2>
        </div>
        {data && (
          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${data.level === "elevated" ? "bg-destructive/12 text-destructive" : "bg-primary/12 text-primary"}`}>
            {data.level === "elevated" ? "Pattern flagged" : "No urgent flag"}
          </span>
        )}
      </div>
      {isLoading && <p className="mt-3 text-muted-foreground">Analyzing diary…</p>}
      {isError && <p className="mt-3 text-destructive">Couldn't load the insight.</p>}
      {data && (
        <>
          <p className="mt-3 max-w-3xl text-pretty text-[15px] leading-relaxed">{data.summary}</p>
          {data.supporting.length > 0 && (
            <div className="mt-4">
              <p className="eyebrow">Supporting entries</p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {data.supporting.map((s) => (
                  <li key={s.daysAgo} className="rounded-xl bg-paper/70 px-3 py-2 text-[13px] outline outline-border">
                    <span className="font-semibold">{fmtDate(daysAgo(s.daysAgo))}</span> — <span className="text-muted-foreground">{s.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      <p className="mt-5 border-t border-primary/20 pt-3 text-[12px] font-semibold text-muted-foreground">
        AI-generated pattern flag for clinician review — not a diagnosis
      </p>
    </section>
  );
}