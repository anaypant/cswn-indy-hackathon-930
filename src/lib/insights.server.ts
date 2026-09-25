import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { FEMALE_EVIDENCE_BRIEF } from "./evidence";
import { scoreFemale, scoreGeneric, type ModelScore } from "./models";

export type Insight = {
  level: "low" | "moderate" | "elevated";
  impression: string;
  whyTheHistoryMatters: string;
  pattern: string;
  supporting: { date: string; label: string }[];
  arguesAgainst: string[];
  clinicianNextStep: string;
};

export type EntryTag = {
  date: string;
  symptoms: string[];
  context: string;
};

export type ModelRead = {
  score: ModelScore;
  narrative: Insight;
  tags: EntryTag[];
};

export type DiaryEntry = {
  date: string;
  severity: number;
  sleep_hours: number;
  notes: string;
  menstrual_day: number | null;
  menstrual_phase: string;
};

export type DiaryPatient = {
  name: string;
  age: number | null;
  height: string | null;
  weight: string | null;
  background: string;
};

const insightSchema = z.object({
  level: z.enum(["low", "moderate", "elevated"]),
  impression: z.string(),
  whyTheHistoryMatters: z.string(),
  pattern: z.string(),
  supporting: z.array(z.object({ date: z.string(), label: z.string() })),
  arguesAgainst: z.array(z.string()),
  clinicianNextStep: z.string(),
});

const SHARED_RULES = `You are writing a clinician-facing note. You are not speaking to the patient.
The concern level is already assigned. Set level to exactly that value and defend it. Do not upgrade or downgrade it.
Never say a heart attack has been ruled out. Never invent diary entries. Cite real dates.
Be brief: each prose field is one or two short sentences. At most 3 supporting labels and 2 arguesAgainst items.
This is decision support for clinician review, not a completed diagnosis.`;

const GENERIC_SYSTEM = `${SHARED_RULES}

You are the generic population model. You were shaped by cohorts in which recognized heart attacks were mostly men with classic chest pain. You are reading the patient's own words, plus sleep and menstrual tracking. You do not receive symptom labels.
Your rule:
- Only chest pain or pressure the patient says they felt counts as cardiac. A sentence that denies chest pain does not count.
- Fatigue, shortness of breath, nausea, jaw pain, upper-back pain, sweating, and menstrual phase do not raise concern when chest pain is absent. Call that pattern anxiety, deconditioning, or a nonspecific illness, especially if a prior visit said anxiety.
- If chest pain is present, treat it as the cardiac signal even if it occurred at rest, with stress, or after a meal. Do not excuse it with preserved exercise.`;

const FEMALE_SYSTEM = `${SHARED_RULES}

You are the female-informed model. Use this evidence, not a chest-pain-only rule:

${FEMALE_EVIDENCE_BRIEF}

Your rule:
- Repeated symptoms brought on by walking or stairs — unusual fatigue, breathlessness, nausea, sweating, jaw pain, or pain between the shoulder blades — are an ischemic pattern in women even when crushing chest pain and left-arm radiation are absent.
- A prior label of anxiety is a known miss (VIRGO), not reassurance, when the diary shows the symptoms track exertion.
- Chest pain only at rest, with caffeine, or during stress, plus a same-day workout or stair climb with no symptoms, is a poor fit for ischemia.
- Burning after meals, worse when lying down, helped by an antacid, is reflux. Mechanical ache after lifting or gardening is not ischemia when walks stay easy.`;

function cycleText(entry: DiaryEntry) {
  if (!entry.menstrual_phase || entry.menstrual_phase === "Not tracking") return "cycle not tracked";
  return entry.menstrual_day ? `${entry.menstrual_phase}, day ${entry.menstrual_day}` : entry.menstrual_phase;
}

function header(patient: DiaryPatient) {
  return [
    `Patient: ${patient.name}`,
    `Age: ${patient.age ?? "not recorded"}`,
    `Height: ${patient.height ?? "not recorded"}`,
    `Weight: ${patient.weight ?? "not recorded"}`,
    `History: ${patient.background}`,
    "",
    "Diary, oldest first:",
  ];
}

function rawDiaryText(patient: DiaryPatient, entries: DiaryEntry[]) {
  const lines = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(
      (entry) =>
        `${entry.date} | severity ${entry.severity}/10 | sleep ${entry.sleep_hours}h | ${cycleText(entry)} | ${entry.notes || "no written entry"}`,
    );
  return [...header(patient), ...lines].join("\n");
}

function taggedDiaryText(patient: DiaryPatient, entries: DiaryEntry[], tags: EntryTag[]) {
  const byDate = new Map(tags.map((tag) => [tag.date, tag]));
  const lines = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => {
      const tag = byDate.get(entry.date);
      const symptoms = tag?.symptoms.join(", ") || "none";
      return `${entry.date} | ${tag?.context || "activity not labeled"} | labels: ${symptoms} | severity ${entry.severity}/10 | sleep ${entry.sleep_hours}h | ${cycleText(entry)} | ${entry.notes || "no written entry"}`;
    });
  return [...header(patient), ...lines].join("\n");
}

async function explain(system: string, score: ModelScore, prompt: string): Promise<Insight> {
  const started = Date.now();
  const result = await generateText({
    model: openai("gpt-5-mini"),
    output: Output.object({ schema: insightSchema, name: "clinical_impression" }),
    system,
    prompt: `Assigned concern: ${score.level}.\nRule: ${score.rule}\n\n${prompt}`,
    providerOptions: {
      openai: { store: false, reasoningEffort: "low", textVerbosity: "low" },
    },
  });
  const usage = result.usage;
  console.info(
    `[insight:${score.id}] ${Date.now() - started}ms input=${usage.inputTokens ?? "?"} output=${usage.outputTokens ?? "?"} reasoning=${usage.outputTokenDetails?.reasoningTokens ?? 0}`,
  );
  if (!result.output) {
    throw new Error(`${score.name} returned no explanation.`);
  }
  return { ...result.output, level: score.level };
}

const ACTIVITY = ["Resting", "Sitting", "Walking", "Climbing stairs", "Exercising", "After meals", "Household tasks"] as const;
const SYMPTOM_TAGS = [
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

const labelSchema = z.object({
  entries: z.array(
    z.object({
      date: z.string(),
      symptoms: z.array(z.enum(SYMPTOM_TAGS)),
      context: z.enum(ACTIVITY),
    }),
  ),
});

const chestSchema = z.object({
  presentDates: z.array(z.string()),
});

const LABEL_SYSTEM = `You are the first step of a female-informed heart model. Read each written entry and label it. Copy each date exactly.

Symptoms, use only these names, and only when the person felt them. A denial does not count ("no chest pain", "not a sharp chest pain"):
- Chest pain/pressure: pressure, tightness, squeezing, or burning in the chest that they felt.
- Shortness of breath: winded, breathless, had to stop for air.
- Fatigue: unusually tired, drained, exhausted, heavy.
- Nausea: queasy, sick to the stomach.
- Jaw/back pain: jaw ache, or pain between the shoulder blades or upper back.
- Palpitations: flutter, racing, or a flip in the chest.
- Dizziness: lightheaded.
- Cold sweats: sweaty without exertion that explains it.
- Upper abdominal discomfort: burning under the ribs or in the stomach.

Activity, exactly one, for what they were doing when the symptom happened. Ignore a later activity that felt fine:
- Walking: on foot, a dog walk, a parking lot, walking to the car.
- Climbing stairs: stairs or a flight of steps.
- Exercising: a run, ride, lift, workout, or sport.
- After meals: the symptom starts after eating or drinking.
- Household tasks: chores, gardening, folding, making the bed, lifting at home.
- Sitting: desk, meeting, presentation, or couch, when the symptom is not from a meal.
- Resting: lying down, waking, or the entry never says.`;

const CHEST_SYSTEM = `You read a diary for a chest-pain-only heart model. List the dates where the person says they felt chest pain, pressure, tightness, or burning in the chest.
Do not list a date that denies it ("no chest pain", "not a sharp chest pain", "no stabbing chest pain").
Copy dates exactly. Return an empty list when chest pain is absent.`;

const modelOptions = {
  openai: { store: false, reasoningEffort: "low" as const, textVerbosity: "low" as const },
};

async function complete<T>(name: string, schema: z.ZodType<T>, system: string, prompt: string): Promise<T> {
  const started = Date.now();
  const result = await generateText({
    model: openai("gpt-5-mini"),
    output: Output.object({ schema, name }),
    system,
    prompt,
    providerOptions: modelOptions,
  });
  const usage = result.usage;
  console.info(
    `[${name}] ${Date.now() - started}ms input=${usage.inputTokens ?? "?"} output=${usage.outputTokens ?? "?"} reasoning=${usage.outputTokenDetails?.reasoningTokens ?? 0}`,
  );
  if (!result.output) throw new Error(`${name} returned nothing.`);
  return result.output;
}

export async function analyzeDiary(patient: DiaryPatient, entries: DiaryEntry[]) {
  if (!process.env["OPENAI_API_KEY"]) {
    throw new Error("OPENAI_API_KEY is not set. Add it to .env and restart the dev server.");
  }
  if (entries.length === 0) {
    throw new Error("This session has no diary entries to analyze.");
  }

  const knownDates = new Set(entries.map((entry) => entry.date));
  const raw = rawDiaryText(patient, entries);
  const [labels, chest] = await Promise.all([
    complete("labels", labelSchema, LABEL_SYSTEM, raw),
    complete("chest", chestSchema, CHEST_SYSTEM, raw),
  ]);

  const tags: EntryTag[] = entries.map((entry) => {
    const labeled = labels.entries.find((item) => item.date === entry.date);
    return {
      date: entry.date,
      symptoms: labeled ? [...labeled.symptoms] : [],
      context: labeled?.context ?? "Resting",
    };
  });
  const chestDates = new Set(chest.presentDates.filter((date) => knownDates.has(date)));
  const genericScore = scoreGeneric(
    entries.map((entry) => ({
      date: entry.date,
      symptoms: chestDates.has(entry.date) ? ["Chest pain/pressure"] : [],
      severity: entry.severity,
      context: "",
      notes: entry.notes,
    })),
  );
  const femaleScore = scoreFemale(
    tags.map((tag) => {
      const entry = entries.find((item) => item.date === tag.date);
      return {
        date: tag.date,
        symptoms: tag.symptoms,
        severity: entry?.severity ?? 0,
        context: tag.context,
        notes: entry?.notes ?? "",
      };
    }),
  );

  const [genericNarrative, femaleNarrative] = await Promise.all([
    explain(GENERIC_SYSTEM, genericScore, raw),
    explain(FEMALE_SYSTEM, femaleScore, taggedDiaryText(patient, entries, tags)),
  ]);

  return {
    generic: {
      score: genericScore,
      narrative: genericNarrative,
      tags: [...chestDates].map((date) => ({ date, symptoms: ["Chest pain/pressure"], context: "" })),
    },
    female: { score: femaleScore, narrative: femaleNarrative, tags },
  };
}
