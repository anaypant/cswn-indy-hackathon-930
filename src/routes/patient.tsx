import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { CONTEXTS, MENSTRUAL_PHASES, SYMPTOMS, addEntry, byDateDesc, fmtDate, updatePatient, useStore, type MenstrualPhase, type Patient } from "@/lib/data";

// Patient portal: shows only the patient's own raw entries. No AI content is imported here.
export const Route = createFileRoute("/patient")({
  head: () => ({
    meta: [
      { title: "Patient Diary — Symptom Advocate" },
      { name: "description", content: "Log your daily symptoms, severity, and sleep." },
      { property: "og:title", content: "Patient Diary — Symptom Advocate" },
      { property: "og:description", content: "Log your daily symptoms, severity, and sleep." },
    ],
  }),
  component: PatientPortal,
});

const SESSION = "sa-patient";

function PatientPortal() {
  const { patients, ready } = useStore();
  const [pid, setPid] = useState<string | null>(null);
  useEffect(() => setPid(sessionStorage.getItem(SESSION)), []);
  const login = (id: string | null) => {
    if (id) sessionStorage.setItem(SESSION, id); else sessionStorage.removeItem(SESSION);
    setPid(id);
  };
  const patient = patients.find((p) => p.id === pid);

  return (
    <div className="min-h-screen">
      <AppHeader portal="patient" who={patient?.name} onLogout={patient ? () => login(null) : undefined} />
      <main className="mx-auto max-w-md px-5 pb-16">
        {!ready ? null : !patient ? (
          <PickPatient patients={patients} onPick={login} />
        ) : !patient.age || !patient.height || !patient.weight ? (
          <Onboard patient={patient} />
        ) : (
          <Diary patient={patient} />
        )}
      </main>
    </div>
  );
}

function PickPatient({ patients, onPick }: { patients: Patient[]; onPick: (id: string) => void }) {
  return (
    <div className="rise mt-6">
      <h1 className="font-display text-3xl font-medium">Who is checking in?</h1>
      <p className="mt-2 text-muted-foreground">No account. This diary stays in this browser session.</p>
      <div className="mt-5 space-y-3">
        {patients.map((patient) => (
          <button
            key={patient.id}
            onClick={() => onPick(patient.id)}
            className="card-paper block w-full p-5 text-left transition hover:-translate-y-0.5"
          >
            <p className="font-display text-2xl font-medium">{patient.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{patient.age} years</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function Onboard({ patient }: { patient: Patient }) {
  const [age, setAge] = useState(patient.age?.toString() ?? "");
  const [height, setHeight] = useState(patient.height ?? "");
  const [weight, setWeight] = useState(patient.weight ?? "");
  const ok = age && height && weight;
  return (
    <div className="card-paper rise mt-6 p-6">
      <h1 className="font-display text-3xl font-medium">Hi {patient.name}</h1>
      <p className="mt-2 text-muted-foreground">A few details first, so your doctor has the full picture.</p>
      {[
        ["Age", age, setAge, "e.g. 44"],
        ["Height", height, setHeight, "e.g. 165 cm"],
        ["Weight", weight, setWeight, "e.g. 68 kg"],
      ].map(([label, v, set, ph]) => (
        <label key={label as string} className="mt-4 block">
          <span className="eyebrow">{label as string}</span>
          <input value={v as string} placeholder={ph as string} onChange={(e) => (set as (s: string) => void)(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border bg-paper px-4 py-3 text-base" />
        </label>
      ))}
      <button disabled={!ok} onClick={() => updatePatient(patient.id, { age: Number(age), height, weight })}
        className="mt-6 w-full rounded-full bg-primary py-3.5 font-semibold text-primary-foreground disabled:opacity-40">
        Save and continue
      </button>
    </div>
  );
}

function Diary({ patient }: { patient: Patient }) {
  const { entries } = useStore();
  const mine = entries.filter((e) => e.patient_id === patient.id).sort(byDateDesc);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [other, setOther] = useState("");
  const [severity, setSeverity] = useState(3);
  const [sleep, setSleep] = useState("7");
  const [context, setContext] = useState<string>(CONTEXTS[0]);
  const [notes, setNotes] = useState("");
  const [menstrualDay, setMenstrualDay] = useState("");
  const [menstrualPhase, setMenstrualPhase] = useState<MenstrualPhase>("Not tracking");
  const [saved, setSaved] = useState(false);
  const toggle = (s: string) => setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  const today = new Date().toISOString().slice(0, 10);

  const save = () => {
    addEntry({
      patient_id: patient.id,
      date: today,
      symptoms,
      other,
      severity,
      sleep_hours: Number(sleep) || 0,
      context,
      notes,
      menstrual_day: menstrualDay ? Number(menstrualDay) : null,
      menstrual_phase: menstrualPhase,
    });
    setSymptoms([]); setOther(""); setSeverity(3); setNotes(""); setMenstrualDay(""); setMenstrualPhase("Not tracking");
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <section className="card-paper rise mt-2 p-5">
        <p className="eyebrow">{fmtDate(today)}</p>
        <h1 className="mt-3 font-display text-[30px] font-medium leading-tight">How are you today, {patient.name}?</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">A quiet two minutes to check in. Just your notes, kept close.</p>

        <p className="eyebrow mt-6">How does your body feel?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SYMPTOMS.map((s) => {
            const on = symptoms.includes(s);
            return (
              <button key={s} onClick={() => toggle(s)} aria-pressed={on}
                className={`rounded-full border px-3.5 py-2.5 text-[15px] font-medium transition active:scale-95 ${on ? "border-accent/40 bg-accent/15 text-accent" : "bg-paper/70 text-foreground/70"}`}>
                {s}
              </button>
            );
          })}
        </div>
        <input value={other} onChange={(e) => setOther(e.target.value)} placeholder="Something else? Describe it here"
          className="mt-3 w-full rounded-2xl border bg-paper/70 px-4 py-3 text-[15px]" />

        <div className="mt-6 flex items-baseline justify-between">
          <p className="eyebrow">Severity</p>
          <span className="font-display text-[28px] font-semibold text-accent">{severity}</span>
        </div>
        <input type="range" min={1} max={10} value={severity} onChange={(e) => setSeverity(+e.target.value)} className="sev mt-3" aria-label="Severity" />
        <div className="mt-1.5 flex justify-between text-[11px] font-medium text-muted-foreground"><span>1 · barely</span><span>10 · worst</span></div>

        <p className="eyebrow mt-6">What were you doing?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CONTEXTS.map((item) => (
            <button key={item} type="button" onClick={() => setContext(item)} aria-pressed={context === item}
              className={`rounded-full border px-3.5 py-2.5 text-[15px] font-medium ${context === item ? "border-accent/40 bg-accent/15 text-accent" : "bg-paper/70 text-foreground/70"}`}>
              {item}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-3">
          <label className="rounded-2xl border bg-paper/60 p-4">
            <span className="eyebrow">Sleep last night (hours)</span>
            <input type="number" min={0} max={24} step={0.5} value={sleep} onChange={(e) => setSleep(e.target.value)}
              className="mt-1 w-full bg-transparent font-display text-2xl font-medium focus:outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="rounded-2xl border bg-paper/60 p-4">
              <span className="eyebrow">Menstrual day</span>
              <input type="number" min={1} max={40} value={menstrualDay} onChange={(e) => setMenstrualDay(e.target.value)}
                placeholder="e.g. 14"
                className="mt-1 w-full bg-transparent font-display text-2xl font-medium focus:outline-none" />
            </label>
            <label className="rounded-2xl border bg-paper/60 p-4">
              <span className="eyebrow">Menstrual phase</span>
              <select value={menstrualPhase} onChange={(e) => setMenstrualPhase(e.target.value as MenstrualPhase)}
                className="mt-1 w-full bg-transparent text-[15px] font-medium focus:outline-none">
                {MENSTRUAL_PHASES.map((phase) => <option key={phase} value={phase}>{phase}</option>)}
              </select>
            </label>
          </div>
          <label className="rounded-2xl border bg-paper/60 p-4">
            <span className="eyebrow">Notes</span>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth remembering?"
              className="mt-1 w-full resize-none bg-transparent text-[15px] leading-relaxed focus:outline-none" />
          </label>
        </div>
        <button onClick={save} className="mt-5 w-full rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground active:scale-[.99]">
          {saved ? "Saved — thank you" : "Save Entry"}
        </button>
      </section>

      <section className="mt-8">
        <p className="eyebrow px-1">Your entries</p>
        <ul className="mt-3 space-y-2">
          {mine.map((e) => (
            <li key={e.id} className="card-paper p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{fmtDate(e.date)}</span>
                <span className="font-display text-base font-semibold text-accent">{e.severity}/10</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {[...e.symptoms, e.other].filter(Boolean).join(", ") || "No symptoms"} · {e.context || "No context"} · {e.sleep_hours}h sleep
                {e.menstrual_phase && e.menstrual_phase !== "Not tracking" ? ` · ${e.menstrual_phase}${e.menstrual_day ? ` (day ${e.menstrual_day})` : ""}` : ""}
              </p>
            </li>
          ))}
          {mine.length === 0 && <p className="px-1 text-sm text-muted-foreground">No entries yet.</p>}
        </ul>
      </section>
    </>
  );
}
