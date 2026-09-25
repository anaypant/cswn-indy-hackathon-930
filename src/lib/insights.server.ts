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

export type ModelRead = {
  score: ModelScore;
  narrative: Insight;
};

export type DiaryEntry = {
  date: string;
  symptoms: string[];
  other: string;
  severity: number;
  sleep_hours: number;
  context: string;
  notes: string;
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

You are the generic population model. You were shaped by cohorts in which recognized heart attacks were mostly men with classic chest pain. Your rule:
- Only entries tagged chest pain count as cardiac.
- Fatigue, shortness of breath, nausea, jaw pain, upper-back pain, and sweating do not raise concern when chest pain is absent. Call that pattern anxiety, deconditioning, or a nonspecific illness, especially if a prior visit said anxiety.
- If chest pain is present, treat it as the cardiac signal even if it occurred at rest, during stress, or after a meal. Do not excuse it with preserved exercise.`;

const FEMALE_SYSTEM = `${SHARED_RULES}

You are the female-informed model. Use this evidence, not a chest-pain-only rule:

${FEMALE_EVIDENCE_BRIEF}

Your rule:
- Repeated symptoms brought on by walking or stairs — unusual fatigue, breathlessness, nausea, sweating, jaw pain, or pain between the shoulder blades — are an ischemic pattern in women even when crushing chest pain and left-arm radiation are absent.
- A prior label of anxiety is a known miss (VIRGO), not reassurance, when the diary shows the symptoms track exertion.
- Chest pain only at rest, with caffeine, or during stress, plus a same-day workout or stair climb with no symptoms, is a poor fit for ischemia.
- Burning after meals, worse when lying down, helped by an antacid, is reflux. Mechanical ache after lifting or gardening is not ischemia when walks stay easy.`;

function diaryText(patient: DiaryPatient, entries: DiaryEntry[]) {
  const lines = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(
      (entry) =>
        `${entry.date} | ${entry.context || "context not recorded"} | severity ${entry.severity}/10 | sleep ${entry.sleep_hours}h | ${[...entry.symptoms, entry.other].filter(Boolean).join(", ") || "no listed symptoms"} | ${entry.notes}`,
    );
  return [
    `Patient: ${patient.name}`,
    `Age: ${patient.age ?? "not recorded"}`,
    `Height: ${patient.height ?? "not recorded"}`,
    `Weight: ${patient.weight ?? "not recorded"}`,
    `History: ${patient.background}`,
    "",
    "Diary, oldest first:",
    ...lines,
  ].join("\n");
}

async function explain(system: string, score: ModelScore, patient: DiaryPatient, entries: DiaryEntry[]): Promise<Insight> {
  const started = Date.now();
  const result = await generateText({
    model: openai("gpt-5-mini"),
    output: Output.object({ schema: insightSchema, name: "clinical_impression" }),
    system,
    prompt: `Assigned concern: ${score.level}.\nRule: ${score.rule}\n\n${diaryText(patient, entries)}`,
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

export async function analyzeDiary(patient: DiaryPatient, entries: DiaryEntry[]) {
  if (!process.env["OPENAI_API_KEY"]) {
    throw new Error("OPENAI_API_KEY is not set. Add it to .env and restart the dev server.");
  }
  if (entries.length === 0) {
    throw new Error("This session has no diary entries to analyze.");
  }

  const generic = scoreGeneric(entries);
  const female = scoreFemale(entries);
  const [genericNarrative, femaleNarrative] = await Promise.all([
    explain(GENERIC_SYSTEM, generic, patient, entries),
    explain(FEMALE_SYSTEM, female, patient, entries),
  ]);

  return {
    generic: { score: generic, narrative: genericNarrative },
    female: { score: female, narrative: femaleNarrative },
  };
}
