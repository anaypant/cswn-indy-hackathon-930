export type ConcernLevel = "low" | "moderate" | "elevated";

export type ScoreEntry = {
  date: string;
  symptoms: string[];
  severity: number;
  context: string;
  notes: string;
};

export type ModelScore = {
  id: "generic" | "female";
  name: string;
  level: ConcernLevel;
  rule: string;
  counted: { date: string; label: string }[];
};

const EXERTION = new Set(["Walking", "Climbing stairs", "Exercising"]);

function has(entry: ScoreEntry, symptom: string) {
  return entry.symptoms.includes(symptom);
}

function chestEntries(entries: ScoreEntry[]) {
  return entries.filter((entry) => has(entry, "Chest pain/pressure"));
}

// Classic-textbook rule. Chest pain is the only cardiac signal.
// Fatigue, dyspnea, nausea, jaw, and back pain do not raise concern.
export function scoreGeneric(entries: ScoreEntry[]): ModelScore {
  const chest = chestEntries(entries).sort((a, b) => b.severity - a.severity);
  const peak = chest[0]?.severity ?? 0;
  const level: ConcernLevel =
    chest.length === 0 ? "low" : peak >= 7 || chest.length >= 2 ? "elevated" : "moderate";

  return {
    id: "generic",
    name: "Generic population model",
    level,
    rule:
      chest.length === 0
        ? "No chest pain is described in the written entry, so this model calls the diary non-cardiac. It does not treat exertional fatigue, breathlessness, nausea, or jaw and back pain as ischemia."
        : "Concern comes only from chest pain described in the written entry. Other symptoms are ignored, including whether the chest symptom happened at rest, with stress, or after a meal.",
    counted: chest.slice(0, 4).map((entry) => ({
      date: entry.date,
      label: `Chest pain/pressure · severity ${entry.severity} · ${entry.context || "context not recorded"}`,
    })),
  };
}

function cluster(entry: ScoreEntry) {
  if (!EXERTION.has(entry.context)) return false;
  const signals = [
    has(entry, "Fatigue") && entry.severity >= 5,
    has(entry, "Shortness of breath"),
    has(entry, "Jaw/back pain"),
    has(entry, "Nausea"),
    has(entry, "Cold sweats"),
    has(entry, "Chest pain/pressure"),
  ];
  return signals.filter(Boolean).length >= 2;
}

// Evidence-informed rule. Exertional clusters count even without classic chest pain.
// Chest pain at rest, with stress, or after meals does not, when exertion stays easy.
export function scoreFemale(entries: ScoreEntry[]): ModelScore {
  const clusters = entries.filter(cluster).sort((a, b) => b.date.localeCompare(a.date));
  const chest = chestEntries(entries);
  const chestOnlyNonExertional =
    chest.length > 0 && chest.every((entry) => !EXERTION.has(entry.context));
  const level: ConcernLevel =
    clusters.length >= 3 ? "elevated" : clusters.length > 0 ? "moderate" : "low";
  const exertionalChest = clusters.some((entry) => has(entry, "Chest pain/pressure"));

  return {
    id: "female",
    name: "Female-informed model",
    level,
    rule:
      clusters.length >= 3
        ? exertionalChest
          ? "Repeated chest pressure brought on by walking or stairs, easing with rest, is exertional ischemia. Breathlessness with that pressure counts as the same pattern."
          : "Repeated exertional clusters — breathlessness, fatigue, nausea, sweating, or jaw and upper-back pain — meet the pattern described in women with ACS, including when classic crushing chest pain is absent."
        : clusters.length > 0
          ? "Symptoms have started on walking or stairs, in only one or two episodes. That raises concern above a quiet diary, and it is earlier than a weeks-long prodrome."
          : chestOnlyNonExertional
            ? "Chest symptoms sit with rest, stress, or meals, and exertion stays easy. That pattern does not match an ischemic prodrome."
            : "No chest pain is logged, and activity does not bring on a symptom cluster.",
    counted: clusters.slice(0, 4).map((entry) => ({
      date: entry.date,
      label: `${entry.symptoms.join(", ")} · ${entry.context}`,
    })),
  };
}

export function levelGap(generic: ConcernLevel, female: ConcernLevel) {
  const rank = { low: 0, moderate: 1, elevated: 2 };
  return rank[female] - rank[generic];
}
