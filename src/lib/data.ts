// Shared, patient-safe data. Contains NO AI insight content.
// Each browser session keeps its own copy. Nothing is written to a server.
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
  "Upper abdominal discomfort",
] as const;

export const MENSTRUAL_PHASES = ["Not tracking", "Menstrual", "Follicular", "Ovulation", "Luteal"] as const;
export type MenstrualPhase = (typeof MENSTRUAL_PHASES)[number];

export const CONTEXTS = [
  "Resting",
  "Sitting",
  "Walking",
  "Climbing stairs",
  "Exercising",
  "After meals",
  "Household tasks",
] as const;

export type Patient = {
  id: string;
  name: string;
  age: number | null;
  height: string | null;
  weight: string | null;
  assigned_doctor_id: string;
  background: string;
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
  context: string;
  notes: string;
  menstrual_day: number | null;
  menstrual_phase: MenstrualPhase;
};

export const DOCTOR: Doctor = {
  id: "d1",
  name: "Dr. Raghav Kodiyalam",
  patient_ids: ["p1", "p2", "p3", "p4", "p5", "p6", "p7"],
};

const SEED_PATIENTS: Patient[] = [
  {
    id: "p1",
    name: "User A",
    age: 54,
    height: "165 cm",
    weight: "74 kg",
    assigned_doctor_id: "d1",
    background:
      "Postmenopausal. Treated hypertension and high cholesterol. Preeclampsia in her 30s. Mother had a heart attack at 61. Never smoked. No known coronary disease. Fourteen days ago an urgent-care visit called the same symptoms anxiety and did not ask what she was doing when they started.",
  },
  {
    id: "p2",
    name: "User B",
    age: 36,
    height: "168 cm",
    weight: "63 kg",
    assigned_doctor_id: "d1",
    background:
      "No hypertension, diabetes, cholesterol treatment, or known heart disease. No early family history. Drinks about three coffees on work mornings. Runs or cycles most weeks. The last month has been a high-pressure product launch.",
  },
  {
    id: "p3",
    name: "User C",
    age: 47,
    height: "162 cm",
    weight: "70 kg",
    assigned_doctor_id: "d1",
    background:
      "Perimenopausal, with night sweats. Longstanding reflux. No hypertension, diabetes, smoking, or known heart disease. She walks daily. Symptoms she has logged cluster after meals, when lying down, or after lifting — not on those walks.",
  },
  {
    id: "p4",
    name: "User D",
    age: 62,
    height: "160 cm",
    weight: "71 kg",
    assigned_doctor_id: "d1",
    background:
      "Postmenopausal. Treated hypertension and high cholesterol. Father had a heart attack at 58. Never smoked. She walks most mornings. For three weeks the walk has forced her to stop with chest pressure, and the pressure eases after she rests.",
  },
  {
    id: "p5",
    name: "User E",
    age: 28,
    height: "170 cm",
    weight: "64 kg",
    assigned_doctor_id: "d1",
    background:
      "No hypertension, diabetes, cholesterol treatment, smoking, or family history of early heart disease. Training for a 10K. Two coffees on workdays. The diary is brief flutters at her desk. Runs and walks stay easy.",
  },
  {
    id: "p6",
    name: "User F",
    age: 44,
    height: "166 cm",
    weight: "76 kg",
    assigned_doctor_id: "d1",
    background:
      "Reflux for several years, worse with late or spicy meals. Lifts weights twice a week and walks the dog daily. No hypertension, diabetes, or known heart disease. Chest burning shows up after dinner, and those same days the workout is comfortable.",
  },
  {
    id: "p7",
    name: "User G",
    age: 51,
    height: "163 cm",
    weight: "68 kg",
    assigned_doctor_id: "d1",
    background:
      "Postmenopausal. No hypertension, diabetes, smoking, or known heart disease. Mother had a heart attack at 64. She has not sought care yet. Two recent walks and stair climbs brought on new breathlessness and nausea. There is no chest pain, and the diary is only ten days long.",
  },
];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

type Seed = {
  daysAgo: number;
  symptoms: string[];
  severity: number;
  sleep: number;
  context: string;
  notes: string;
};

// User A: four weeks of an exertional, multi-symptom prodrome that a single
// visit already mislabeled as anxiety. This is the diary a 10-minute intake misses.
const userA: Seed[] = [
  { daysAgo: 27, symptoms: ["Fatigue"], severity: 3, sleep: 6.5, context: "Working", notes: "Tired after a normal day at my desk. I don't usually feel this drained." },
  { daysAgo: 25, symptoms: ["Fatigue"], severity: 3, sleep: 6, context: "Walking", notes: "Heavy legs just walking in from the parking lot." },
  { daysAgo: 23, symptoms: ["Fatigue"], severity: 4, sleep: 6, context: "Household tasks", notes: "Had to sit down while folding laundry. One flight of stairs at home felt harder than last month." },
  { daysAgo: 21, symptoms: ["Fatigue", "Shortness of breath"], severity: 4, sleep: 5.5, context: "Climbing stairs", notes: "Winded on the stairs at work. I take these every day and never used to stop." },
  { daysAgo: 19, symptoms: ["Fatigue", "Shortness of breath"], severity: 5, sleep: 5, context: "Walking", notes: "Stopped halfway across the grocery lot with the bags. Rested, then finished the walk." },
  { daysAgo: 17, symptoms: ["Fatigue", "Jaw/back pain"], severity: 5, sleep: 5, context: "Walking", notes: "Ache in my jaw while walking the dog. It faded after I stopped. I was not upset or rushing." },
  { daysAgo: 15, symptoms: ["Fatigue", "Shortness of breath", "Jaw/back pain"], severity: 5, sleep: 4.5, context: "Climbing stairs", notes: "Burning between my shoulder blades on the stairs, with the jaw ache again. Both eased after I sat." },
  { daysAgo: 14, symptoms: ["Fatigue"], severity: 4, sleep: 6, context: "Resting", notes: "Urgent care said this is anxiety. They did not ask whether it happens on the stairs. I felt calm in the waiting room." },
  { daysAgo: 12, symptoms: ["Fatigue", "Shortness of breath", "Nausea"], severity: 6, sleep: 5, context: "Walking", notes: "Queasy and short of breath walking to the car. Not after eating. Sat for ten minutes." },
  { daysAgo: 10, symptoms: ["Fatigue", "Shortness of breath", "Jaw/back pain"], severity: 6, sleep: 4.5, context: "Climbing stairs", notes: "Jaw and upper back together, plus breathlessness. Same stairs as day 21, clearly worse. Rested 20 minutes." },
  { daysAgo: 8, symptoms: ["Shortness of breath", "Nausea", "Jaw/back pain"], severity: 6, sleep: 4, context: "Walking", notes: "Queasy and short of breath while walking, with a dull ache between my shoulder blades. Not a sharp chest pain. Eased when I stopped." },
  { daysAgo: 7, symptoms: ["Fatigue", "Shortness of breath", "Cold sweats"], severity: 6, sleep: 4, context: "Household tasks", notes: "Woke up sweaty. Got winded making the bed. This was not a nightmare and I was not panicking." },
  { daysAgo: 5, symptoms: ["Fatigue", "Shortness of breath", "Nausea", "Cold sweats"], severity: 7, sleep: 4, context: "Walking", notes: "Sweaty and nauseated walking to the car. Had to sit. No stabbing chest pain. The exhaustion stayed the rest of the day." },
  { daysAgo: 4, symptoms: ["Fatigue", "Shortness of breath", "Dizziness"], severity: 6, sleep: 5, context: "Climbing stairs", notes: "Lightheaded on the stairs. A colleague said it might be a panic attack. I was not anxious. I was carrying nothing." },
  { daysAgo: 2, symptoms: ["Jaw/back pain", "Shortness of breath", "Fatigue", "Nausea"], severity: 7, sleep: 4, context: "Climbing stairs", notes: "Same cluster as last week, worse: jaw, upper back, nausea, and I had to stop on the stairs. It did not happen while I was sitting in the meeting before that." },
  { daysAgo: 1, symptoms: ["Shortness of breath", "Nausea", "Cold sweats", "Fatigue", "Jaw/back pain"], severity: 8, sleep: 3.5, context: "Climbing stairs", notes: "Nauseated, sweaty, and short of breath on the stairs at home, with the jaw ache again. I had to sit on the step. There was no sharp chest pain. This is not how worry feels." },
];

// User B: palpitations that look cardiac in a single note, but the diary shows
// rest, caffeine, and stress — and preserved exercise the same days.
const userB: Seed[] = [
  { daysAgo: 20, symptoms: ["Palpitations"], severity: 2, sleep: 7.5, context: "Sitting", notes: "Heart flipped for about a minute while I was sitting in a meeting. Then it stopped." },
  { daysAgo: 18, symptoms: ["Palpitations", "Dizziness"], severity: 3, sleep: 7, context: "Sitting", notes: "After a large coffee, just before standup. Brief. I was seated the whole time." },
  { daysAgo: 16, symptoms: ["Fatigue"], severity: 2, sleep: 8, context: "Exercising", notes: "Long day, otherwise fine. Evening run felt normal. No chest symptoms during it." },
  { daysAgo: 14, symptoms: ["Palpitations"], severity: 2, sleep: 7, context: "Sitting", notes: "Noticed it when I was stressed about a deadline, at my desk. Walking the dog afterward was easy." },
  { daysAgo: 12, symptoms: ["Chest pain/pressure", "Palpitations"], severity: 4, sleep: 6.5, context: "Sitting", notes: "Tight chest during a presentation. Gone as soon as I sat down afterward. I ran 3 miles that evening without any tightness or breathlessness." },
  { daysAgo: 10, symptoms: ["Dizziness"], severity: 2, sleep: 7.5, context: "Resting", notes: "Skipped breakfast. Cleared after I ate. Not related to walking." },
  { daysAgo: 8, symptoms: ["Palpitations"], severity: 2, sleep: 8, context: "Sitting", notes: "Two coffees this morning. A short flutter at my desk. Bike ride later was easy, no symptoms." },
  { daysAgo: 6, symptoms: ["Fatigue"], severity: 1, sleep: 8, context: "Exercising", notes: "Feeling well. Workout was easy. No jaw pain, no nausea, no need to stop." },
  { daysAgo: 4, symptoms: ["Palpitations", "Dizziness"], severity: 3, sleep: 7, context: "Resting", notes: "Heart racing on the couch while watching the news. Lasted under two minutes. Stairs at the office were no problem earlier." },
  { daysAgo: 2, symptoms: ["Nausea"], severity: 2, sleep: 7.5, context: "After meals", notes: "Mild nausea after a spicy dinner. My walk before dinner was fine." },
  { daysAgo: 1, symptoms: ["Palpitations"], severity: 2, sleep: 8, context: "Sitting", notes: "Brief flutter at my desk again. I climbed three flights at work today with no shortness of breath." },
];

// User C: reflux and mechanical back pain that a symptom checklist could over-call.
// Exertion is repeatedly recorded as normal.
const userC: Seed[] = [
  { daysAgo: 21, symptoms: ["Upper abdominal discomfort", "Nausea"], severity: 3, sleep: 6, context: "After meals", notes: "Burning under my ribs after a large lunch. Started about half an hour after I ate, while I was sitting." },
  { daysAgo: 18, symptoms: ["Jaw/back pain"], severity: 3, sleep: 6.5, context: "Household tasks", notes: "Sore between my shoulders after gardening. My morning walk before that was comfortable, no breathlessness." },
  { daysAgo: 16, symptoms: ["Nausea", "Upper abdominal discomfort"], severity: 4, sleep: 6, context: "After meals", notes: "Came on after dinner and got worse when I lay down. Sitting up helped." },
  { daysAgo: 14, symptoms: ["Fatigue"], severity: 2, sleep: 5, context: "Walking", notes: "Hot flashes woke me. Daytime energy was okay. I still walked 30 minutes without stopping." },
  { daysAgo: 12, symptoms: ["Jaw/back pain", "Nausea"], severity: 3, sleep: 6, context: "Household tasks", notes: "Back ache after weeding. It did not show up on the stairs. Nausea was only after a late snack." },
  { daysAgo: 10, symptoms: ["Chest pain/pressure", "Nausea"], severity: 4, sleep: 5.5, context: "After meals", notes: "Burning in the center of my chest after pizza, lying on the couch. An antacid helped within 20 minutes. I had walked earlier with no chest symptoms." },
  { daysAgo: 8, symptoms: ["Fatigue"], severity: 2, sleep: 5, context: "Walking", notes: "Another perimenopause night. Morning walk felt normal. No jaw pain, no sweating with activity." },
  { daysAgo: 6, symptoms: ["Upper abdominal discomfort", "Nausea"], severity: 3, sleep: 6.5, context: "After meals", notes: "Same burn after breakfast. I climbed the stairs at home afterward and it did not get worse." },
  { daysAgo: 4, symptoms: ["Jaw/back pain"], severity: 2, sleep: 7, context: "Household tasks", notes: "Ache after lifting a grocery bag onto the counter. It did not happen while I carried the bags up the stairs." },
  { daysAgo: 2, symptoms: ["Nausea"], severity: 2, sleep: 6, context: "After meals", notes: "Mild nausea after coffee and a pastry. Gone in an hour. Afternoon walk was easy." },
  { daysAgo: 1, symptoms: ["Upper abdominal discomfort"], severity: 3, sleep: 6.5, context: "After meals", notes: "Burning after lunch again. I walked the dog afterward with no shortness of breath and no chest pressure." },
];

// User D: classic exertional chest pressure. The generic rule and the
// female-informed rule should agree that concern is elevated.
const userD: Seed[] = [
  { daysAgo: 18, symptoms: ["Chest pain/pressure", "Shortness of breath"], severity: 6, sleep: 7, context: "Walking", notes: "Pressure in the center of my chest on my usual morning walk. I stopped, and it eased in a few minutes. I was not upset." },
  { daysAgo: 14, symptoms: ["Chest pain/pressure", "Shortness of breath"], severity: 7, sleep: 6.5, context: "Climbing stairs", notes: "Same pressure on the stairs at the parking garage. Short of breath with it. Sat on the step until it passed." },
  { daysAgo: 11, symptoms: ["Chest pain/pressure", "Shortness of breath", "Cold sweats"], severity: 7, sleep: 6, context: "Walking", notes: "Had to stop twice on a flat walk. Sweaty, with the chest pressure, and it left after I rested. I finished the walk slowly." },
  { daysAgo: 8, symptoms: ["Chest pain/pressure", "Jaw/back pain"], severity: 8, sleep: 6, context: "Walking", notes: "Pressure again, and an ache in my jaw. Both faded after I sat for ten minutes. They did not start while I was sitting at breakfast." },
  { daysAgo: 5, symptoms: ["Fatigue"], severity: 2, sleep: 7, context: "Sitting", notes: "Quiet day at my desk. No chest pressure while seated." },
  { daysAgo: 3, symptoms: ["Chest pain/pressure", "Shortness of breath", "Nausea"], severity: 8, sleep: 5.5, context: "Climbing stairs", notes: "Pressure, nausea, and I could not finish one flight. Rested twenty minutes. It did not happen during the meeting before the stairs." },
  { daysAgo: 1, symptoms: ["Chest pain/pressure", "Shortness of breath"], severity: 8, sleep: 6, context: "Walking", notes: "Stopped twice on a short walk to the mailbox. Same central pressure, gone at rest. This is why I am here." },
];

// User E: a quiet diary. Brief desk palpitations, easy training. Both models stay low.
const userE: Seed[] = [
  { daysAgo: 16, symptoms: ["Palpitations"], severity: 2, sleep: 8, context: "Sitting", notes: "A short flutter after my second coffee, at my desk. Gone in under a minute." },
  { daysAgo: 12, symptoms: ["Fatigue"], severity: 2, sleep: 7.5, context: "Exercising", notes: "Easy 4-mile run. No chest pressure, no need to stop, no nausea." },
  { daysAgo: 9, symptoms: ["Palpitations", "Dizziness"], severity: 2, sleep: 8, context: "Sitting", notes: "Lightheaded for a moment when I stood up from a long meeting. Cleared right away. Stairs afterward were normal." },
  { daysAgo: 6, symptoms: ["Fatigue"], severity: 1, sleep: 8, context: "Walking", notes: "Walked to work. Felt well the whole way." },
  { daysAgo: 4, symptoms: ["Nausea"], severity: 2, sleep: 7, context: "After meals", notes: "Queasy after a greasy lunch. Gone in an hour. Evening run was easy, no symptoms." },
  { daysAgo: 2, symptoms: ["Fatigue"], severity: 1, sleep: 8, context: "Exercising", notes: "Tempo run felt strong. No jaw pain, no sweating out of proportion, no breathlessness beyond the effort." },
  { daysAgo: 1, symptoms: ["Palpitations"], severity: 1, sleep: 8, context: "Resting", notes: "One brief flutter on the couch. I climbed stairs at the office today with no trouble." },
];

// User F: the word "chest" appears twice, both times after meals. Workouts stay easy.
// Generic model goes elevated. Female-informed model stays low.
const userF: Seed[] = [
  { daysAgo: 16, symptoms: ["Fatigue"], severity: 2, sleep: 7, context: "Exercising", notes: "Lift session felt normal. No chest symptoms during the workout." },
  { daysAgo: 14, symptoms: ["Chest pain/pressure", "Nausea", "Upper abdominal discomfort"], severity: 6, sleep: 6.5, context: "After meals", notes: "Burning in the center of my chest about forty minutes after Thai food, while I was on the couch. An antacid helped. I had lifted earlier that day with no chest pain." },
  { daysAgo: 11, symptoms: ["Jaw/back pain"], severity: 3, sleep: 7, context: "Household tasks", notes: "Sore between my shoulders after overhead pressing. Stairs that evening were easy, and the ache did not show up then." },
  { daysAgo: 8, symptoms: ["Chest pain/pressure", "Upper abdominal discomfort"], severity: 7, sleep: 6, context: "After meals", notes: "Woke with strong burning after a late pizza. Sitting up and an antacid eased it within half an hour. It was worse lying down. My walk the next morning had no chest pressure." },
  { daysAgo: 5, symptoms: ["Nausea", "Upper abdominal discomfort"], severity: 3, sleep: 7, context: "After meals", notes: "Mild burn after coffee and a pastry. Climbing the stairs at home did not make it worse." },
  { daysAgo: 3, symptoms: ["Fatigue"], severity: 2, sleep: 7.5, context: "Walking", notes: "Dog walk was comfortable. No breathlessness, no nausea, no chest pressure." },
  { daysAgo: 1, symptoms: ["Fatigue"], severity: 1, sleep: 7.5, context: "Exercising", notes: "Another normal lift. No need to stop. No sweating beyond the workout." },
];

// User G: the prodrome has only just started. Two exertional clusters, no chest pain.
// Generic model stays low. Female-informed model is moderate, not yet elevated.
const userG: Seed[] = [
  { daysAgo: 10, symptoms: ["Fatigue"], severity: 3, sleep: 7, context: "Walking", notes: "Legs felt heavy on a walk I do every day. I did not have to stop." },
  { daysAgo: 8, symptoms: ["Fatigue", "Shortness of breath"], severity: 6, sleep: 6.5, context: "Climbing stairs", notes: "First time I stopped on my usual stairs at work. Winded, and unusually tired. It eased after I sat. No chest pain." },
  { daysAgo: 6, symptoms: ["Fatigue"], severity: 3, sleep: 7, context: "Sitting", notes: "A little drained at my desk. The afternoon was otherwise ordinary." },
  { daysAgo: 3, symptoms: ["Fatigue", "Shortness of breath", "Nausea"], severity: 6, sleep: 6, context: "Walking", notes: "Queasy and short of breath on a flat walk. I stopped, and both eased. There was no chest pressure and no panic. I was carrying nothing." },
  { daysAgo: 1, symptoms: ["Fatigue"], severity: 3, sleep: 7, context: "Household tasks", notes: "Folding laundry was fine. I have not had another stair episode since the walk." },
];

function build(pid: string, seeds: Seed[]): LogEntry[] {
  return seeds.map((seed, i) => ({
    id: `${pid}-e${i}`,
    patient_id: pid,
    date: daysAgo(seed.daysAgo),
    symptoms: seed.symptoms,
    other: "",
    severity: seed.severity,
    sleep_hours: seed.sleep,
    context: seed.context,
    notes: seed.notes,
    menstrual_day: null,
    menstrual_phase: "Not tracking",
  }));
}

const KEY = "symptom-advocate-session-v4";
type State = { patients: Patient[]; entries: LogEntry[] };
const seed = (): State => ({
  patients: SEED_PATIENTS,
  entries: [...build("p1", userA), ...build("p2", userB), ...build("p3", userC), ...build("p4", userD), ...build("p5", userE), ...build("p6", userF), ...build("p7", userG)],
});

let state: State = seed();
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) state = JSON.parse(raw) as State;
  } catch {
    /* ignore broken session data */
  }
}
function commit(next: State) {
  state = next;
  sessionStorage.setItem(KEY, JSON.stringify(state));
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
    return () => {
      listeners.delete(l);
    };
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
