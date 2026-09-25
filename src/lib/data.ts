// Shared, patient-safe data. Contains NO AI insight content.
import { useEffect, useState } from "react";

export const SYMPTOMS = [
  "Chest pain/pressure",
  "Shortness of breath",
  "Fatigue",
  "Nausea",
  "Jaw/back pain",
  "Palpitations",
  "Dizziness",
  "Cold sweats",
] as const;

export type Patient = {
  id: string;
  name: string;
  age: number | null;
  height: string | null;
  weight: string | null;
  assigned_doctor_id: string;
};
export type Doctor = { id: string; name: string; patient_ids: string[] };
export type LogEntry = {
  id: string;
  patient_id: string;
  date: string; // YYYY-MM-DD
  symptoms: string[];
  other: string;
  severity: number;
  sleep_hours: number;
  notes: string;
};

export const DOCTORS: Doctor[] = [
  { id: "d1", name: "Dr. Priya Raman", patient_ids: ["p1", "p2", "p3"] },
];

const SEED_PATIENTS: Patient[] = [
  { id: "p1", name: "Denise Carter", age: 52, height: "165 cm", weight: "74 kg", assigned_doctor_id: "d1" },
  { id: "p2", name: "Maria Gonzalez", age: 38, height: "160 cm", weight: "61 kg", assigned_doctor_id: "d1" },
  { id: "p3", name: "Aisha Bello", age: null, height: null, weight: null, assigned_doctor_id: "d1" },
];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

type Seed = [number, string[], number, number, string];
const denise: Seed[] = [
  [13, ["Fatigue"], 2, 6, "A bit tired after work."],
  [12, ["Fatigue"], 3, 5.5, "Slept poorly, restless."],
  [11, ["Fatigue"], 3, 5, "Needed a nap in the afternoon."],
  [10, ["Fatigue", "Nausea"], 3, 6, "Mild queasiness at lunch."],
  [9, ["Fatigue", "Shortness of breath"], 4, 5, "Winded on the stairs."],
  [8, ["Fatigue", "Shortness of breath"], 4, 5.5, "Winded carrying groceries."],
  [7, ["Fatigue", "Jaw/back pain"], 5, 4.5, "Ache between shoulder blades."],
  [6, ["Fatigue", "Shortness of breath", "Chest pain/pressure"], 6, 4.5, "Tight feeling in chest for ~10 min in the morning."],
  [5, ["Fatigue", "Shortness of breath"], 5, 5, "Very tired all day."],
  [4, ["Fatigue", "Shortness of breath", "Cold sweats"], 6, 5, "Woke up sweaty."],
  [3, ["Fatigue", "Shortness of breath", "Chest pain/pressure", "Nausea"], 7, 4, "Pressure in chest walking to car, went away after resting."],
  [2, ["Fatigue", "Shortness of breath", "Dizziness"], 6, 5, "Lightheaded standing up."],
];
const maria: Seed[] = [
  [9, ["Fatigue"], 2, 7, "Long day."],
  [6, ["Dizziness"], 2, 7.5, "Brief, after skipping breakfast."],
  [3, ["Fatigue"], 1, 8, "Feeling mostly fine."],
  [1, ["Nausea"], 2, 7, "Mild, after spicy dinner."],
];
const aisha: Seed[] = [
  [5, ["Palpitations"], 2, 7, "After two coffees."],
  [2, ["Fatigue"], 2, 6.5, "Busy week."],
];

function build(pid: string, s: Seed[]): LogEntry[] {
  return s.map(([d, sym, sev, sleep, notes], i) => ({
    id: `${pid}-e${i}`, patient_id: pid, date: daysAgo(d), symptoms: sym, other: "", severity: sev, sleep_hours: sleep, notes,
  }));
}

const KEY = "symptom-advocate-v1";
type State = { patients: Patient[]; entries: LogEntry[] };
const seed = (): State => ({
  patients: SEED_PATIENTS,
  entries: [...build("p1", denise), ...build("p2", maria), ...build("p3", aisha)],
});

let state: State = seed();
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = JSON.parse(raw);
  } catch { /* ignore */ }
}
function commit(next: State) {
  state = next;
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function useStore() {
  const [, force] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    load();
    setReady(true);
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return { ...state, ready };
}

export function addEntry(e: Omit<LogEntry, "id">) {
  commit({ ...state, entries: [...state.entries, { ...e, id: crypto.randomUUID() }] });
}
export function updatePatient(id: string, patch: Partial<Patient>) {
  commit({ ...state, patients: state.patients.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
}
export function resetDemo() {
  commit(seed());
}

export const byDateDesc = (a: LogEntry, b: LogEntry) => b.date.localeCompare(a.date);
export const fmtDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
