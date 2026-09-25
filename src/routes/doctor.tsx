import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DOCTOR, byDateDesc, fmtDate, resetDemo, useStore, type LogEntry, type Patient } from "@/lib/data";
import { CITATIONS } from "@/lib/evidence";
import { getPatientInsight } from "@/lib/insights.functions";
import { levelGap, scoreFemale, scoreGeneric, type ConcernLevel, type ModelScore } from "@/lib/models";

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

function DoctorPortal() {
  return (
    <div className="min-h-screen">
      <AppHeader portal="doctor" who={DOCTOR.name} />
      <Dashboard patientIds={DOCTOR.patient_ids} />
    </div>
  );
}

function Dashboard({ patientIds }: { patientIds: string[] }) {
  const { patients, entries, ready } = useStore();
  const mine = patients.filter((p) => patientIds.includes(p.id));
  const [active, setActive] = useState(patientIds[0] ?? "");
  const patient = mine.find((p) => p.id === active);
  if (!ready) return null;

  return (
    <main className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 pb-16 lg:flex-row lg:px-10">
      <aside className="lg:w-[260px] lg:shrink-0">
        <div className="card-paper sticky top-6 p-4">
          <p className="eyebrow px-2">Patients · {mine.length}</p>
          <ul className="mt-3 space-y-1">
            {mine.map((p) => {
              const diary = entries.filter((e) => e.patient_id === p.id);
              const genericLevel = scoreGeneric(diary).level;
              const femaleLevel = scoreFemale(diary).level;
              return (
                <li key={p.id}>
                  <button onClick={() => setActive(p.id)}
                    className={`w-full rounded-2xl px-3 py-3 text-left transition ${p.id === active ? "bg-primary/12 outline outline-primary/25" : "hover:bg-muted"}`}>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.age ? `${p.age} years` : "Age not set"} · {diary.length} entries</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Generic {genericLevel} · Female {femaleLevel}</p>
                  </button>
                </li>
              );
            })}
          </ul>
          <button onClick={resetDemo} className="mt-4 w-full px-2 text-left text-xs text-muted-foreground underline">Reset demo data</button>
        </div>
      </aside>
      {patient && <Detail key={patient.id} patient={patient} entries={entries.filter((e) => e.patient_id === patient.id)} />}
    </main>
  );
}

function Detail({ patient, entries }: { patient: Patient; entries: LogEntry[] }) {
  const [desc, setDesc] = useState(true);
  const rows = [...entries].sort(byDateDesc);
  if (!desc) rows.reverse();

  return (
    <div className="min-w-0 flex-1 space-y-6">
      <section className="card-paper flex flex-wrap items-end justify-between gap-6 p-6">
        <div>
          <p className="eyebrow">Patient</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">{patient.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{patient.background}</p>
        </div>
        <dl className="flex gap-8">
          {[["Age", patient.age ?? "—"], ["Height", patient.height ?? "—"], ["Weight", patient.weight ?? "—"], ["Entries", entries.length]].map(([k, v]) => (
            <div key={k as string}><dt className="eyebrow">{k}</dt><dd className="font-display text-xl font-medium">{v}</dd></div>
          ))}
        </dl>
      </section>

      <InsightPanel patient={patient} entries={entries} />

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
                <th className="px-4 py-2">Date</th><th className="px-4 py-2">Doing</th><th className="px-4 py-2">Symptoms</th><th className="px-4 py-2">Severity</th>
                <th className="px-4 py-2">Sleep</th><th className="px-4 py-2">Cycle</th><th className="px-4 py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((e) => (
                <tr key={e.id} className={e.symptoms.includes("Chest pain/pressure") ? "bg-accent/8" : ""}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{fmtDate(e.date)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{e.context || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{[...e.symptoms, e.other].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-14 rounded-full bg-muted"><span className={`block h-1.5 rounded-full ${e.severity >= 5 ? "bg-accent" : "bg-primary-soft"}`} style={{ width: `${e.severity * 10}%` }} /></span>
                      <span className={`font-display font-semibold ${e.severity >= 5 ? "text-accent" : "text-primary-soft"}`}>{e.severity}</span>
                    </span>
                  </td>
                  <td className={`px-4 py-3 ${e.sleep_hours < 5 ? "font-semibold text-accent" : "text-muted-foreground"}`}>{e.sleep_hours}h</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {e.menstrual_phase && e.menstrual_phase !== "Not tracking" ? `${e.menstrual_phase}${e.menstrual_day ? ` · day ${e.menstrual_day}` : ""}` : "—"}
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

function tone(level: ConcernLevel) {
  if (level === "elevated") return "bg-destructive/12 text-destructive";
  if (level === "moderate") return "bg-accent/15 text-accent";
  return "bg-primary/12 text-primary";
}

function InsightPanel({ patient, entries }: { patient: Patient; entries: LogEntry[] }) {
  const fetchInsight = useServerFn(getPatientInsight);
  const genericScore = scoreGeneric(entries);
  const femaleScore = scoreFemale(entries);
  const gap = levelGap(genericScore.level, femaleScore.level);
  const signature = entries.map((entry) => `${entry.id}:${entry.date}:${entry.severity}:${entry.symptoms.join("+")}`).join("|");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["insight", patient.id, signature],
    retry: false,
    queryFn: () =>
      fetchInsight({
        data: {
          patient: {
            name: patient.name,
            age: patient.age,
            height: patient.height,
            weight: patient.weight,
            background: patient.background,
          },
          entries: entries.map((entry) => ({
            date: entry.date,
            symptoms: entry.symptoms,
            other: entry.other,
            severity: entry.severity,
            sleep_hours: entry.sleep_hours,
            context: entry.context ?? "",
            notes: entry.notes,
          })),
        },
      }),
  });
  const genericNote = data?.ok ? data.generic.narrative : null;
  const femaleNote = data?.ok ? data.female.narrative : null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${gap === 0 ? "bg-primary/12 text-primary" : "bg-accent/15 text-accent"}`}>
          {gap === 0 ? "Models agree" : gap > 0 ? "Generic model is lower" : "Generic model is higher"}
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ModelCard score={genericScore} narrative={genericNote} loading={isLoading} />
        <ModelCard score={femaleScore} narrative={femaleNote} loading={isLoading} informed />
      </div>
      {isError && <p className="text-destructive">The explanation request failed. The concern levels above still come from each model’s rule.</p>}
      {data && !data.ok && (
        <div>
          <p className="text-destructive">{data.message}</p>
          <button onClick={() => refetch()} className="mt-3 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">Try again</button>
        </div>
      )}
      <details className="card-paper p-4 text-sm">
        <summary className="cursor-pointer font-semibold">Sources in the female-informed model</summary>
        <p className="mt-2 text-muted-foreground">
          These papers are written into that model’s instructions.
        </p>
        <ul className="mt-3 space-y-2">
          {CITATIONS.map((item) => (
            <li key={item.id}>
              <a href={item.href} target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-2 hover:underline">{item.label}</a>
              <p className="text-muted-foreground">{item.finding}</p>
            </li>
          ))}
        </ul>
      </details>
      <p className="text-[12px] font-semibold text-muted-foreground">
        Simulated model disagreement for clinician review. Not a completed diagnosis, and not a substitute for emergency care.
      </p>
    </section>
  );
}

function ModelCard({
  score,
  narrative,
  loading,
  informed = false,
}: {
  score: ModelScore;
  narrative: { impression: string; pattern: string; clinicianNextStep: string } | null;
  loading: boolean;
  informed?: boolean;
}) {
  return (
    <article className={informed ? "card-insight p-5" : "card-paper p-5"}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl font-semibold">{score.name}</h3>
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${tone(score.level)}`}>
          {score.level}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{score.rule}</p>
      {score.counted.length > 0 && (
        <ul className="mt-3 space-y-1 text-[13px]">
          {score.counted.map((item) => (
            <li key={`${item.date}-${item.label}`}>
              <span className="font-semibold">{fmtDate(item.date)}</span>
              <span className="text-muted-foreground"> — {item.label}</span>
            </li>
          ))}
        </ul>
      )}
      {loading && !narrative && <p className="mt-4 text-sm text-muted-foreground">Writing the explanation…</p>}
      {narrative && (
        <div className="mt-4 border-t border-primary/15 pt-3 text-sm leading-relaxed">
          <p className="font-medium">{narrative.impression}</p>
          <p className="mt-2 text-muted-foreground">{narrative.pattern}</p>
          <p className="mt-2"><span className="font-semibold">Next step: </span>{narrative.clinicianNextStep}</p>
        </div>
      )}
    </article>
  );
}
