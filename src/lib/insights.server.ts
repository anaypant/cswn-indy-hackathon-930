// Server-only: AI insight content never ships in client bundles.
export type Insight = {
  level: "elevated" | "none";
  summary: string;
  supporting: { daysAgo: number; label: string }[];
};

const INSIGHTS: Record<string, Insight> = {
  p1: {
    level: "elevated",
    summary:
      "Pattern detected: escalating fatigue and shortness of breath over the past 9 days, with two entries reporting chest pressure following nights of under 5 hours of sleep. This combination is consistent with atypical ACS presentation patterns more common in women. Recommend clinical follow-up.",
    supporting: [
      { daysAgo: 3, label: "Chest pressure, SOB, nausea · severity 7 · 4h sleep" },
      { daysAgo: 4, label: "Cold sweats, SOB · severity 6 · 5h sleep" },
      { daysAgo: 6, label: "Chest pressure, SOB · severity 6 · 4.5h sleep" },
      { daysAgo: 7, label: "Jaw/back pain · severity 5 · 4.5h sleep" },
      { daysAgo: 9, label: "First shortness of breath · severity 4 · 5h sleep" },
    ],
  },
};

export function getInsightFor(patientId: string): Insight {
  return (
    INSIGHTS[patientId] ?? {
      level: "none",
      summary:
        "No concerning pattern detected. Logged symptoms are mild, low-severity, and not escalating, with generally adequate sleep. Continue routine monitoring.",
      supporting: [],
    }
  );
}
