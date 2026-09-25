// Published findings used as the female-informed model's knowledge.
// This is not a fine-tune. Credentialed databases (MIMIC, UK Biobank, WHI,
// All of Us, HCUP, NCDR) are not loaded.

export type Citation = {
  id: string;
  label: string;
  finding: string;
  href: string;
};

export const CITATIONS: Citation[] = [
  {
    id: "virgo",
    label: "VIRGO — Lichtman et al., Circulation 2018",
    finding:
      "Young women with myocardial infarction were more likely than men to have symptoms judged non-cardiac, and more likely to delay care. Absence of chest pain did not make the event benign.",
    href: "https://doi.org/10.1161/CIRCULATIONAHA.117.031650",
  },
  {
    id: "canto",
    label: "Canto et al., JAMA 2012 (NRMI)",
    finding:
      "Across more than a million patients, women were more likely than men to present without chest pain, and presentation without chest pain carried higher mortality.",
    href: "https://doi.org/10.1001/jama.2012.199",
  },
  {
    id: "hermes",
    label: "HERMES — Ferry et al., JAHA 2019",
    finding:
      "Women more often described radiation to the back, neck, or jaw and more accompanying symptoms such as nausea and shortness of breath. Chest pain was still common in both sexes.",
    href: "https://doi.org/10.1161/JAHA.119.012307",
  },
  {
    id: "meta",
    label: "van Oosterhout et al., JAHA 2020",
    finding:
      "In ACS, women more often had pain between the shoulder blades, nausea, and shortness of breath. Men more often had chest pain and sweating. The differences are real and modest.",
    href: "https://doi.org/10.1161/JAHA.119.014733",
  },
  {
    id: "mehta",
    label: "Mehta et al., AHA Scientific Statement, Circulation 2016",
    finding:
      "Women with acute MI are more often missed, present later, and more often have MINOCA, spasm, or microvascular disease rather than a classic obstructive plaque.",
    href: "https://doi.org/10.1161/CIR.0000000000000351",
  },
  {
    id: "guideline",
    label: "2021 AHA/ACC Chest Pain Guideline",
    finding:
      "Chest pain remains the leading symptom, but accompanying dyspnea, nausea, and fatigue must not be dismissed in women. The word atypical has been used to under-triage them.",
    href: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001029",
  },
  {
    id: "highsteacs",
    label: "High-STEACS — Shah et al., BMJ 2015",
    finding:
      "A single troponin cutoff, derived largely from men, misses myocardial injury in women. Sex-specific thresholds identify additional women with real infarcts.",
    href: "https://doi.org/10.1136/bmj.g7873",
  },
  {
    id: "udmi",
    label: "Fourth Universal Definition of MI, Circulation 2018",
    finding:
      "Myocardial infarction is a rising and falling troponin with evidence of ischemia. Sex-specific 99th percentile limits are recommended.",
    href: "https://doi.org/10.1161/CIR.0000000000000617",
  },
  {
    id: "wise",
    label: "WISE — Women's Ischemia Syndrome Evaluation",
    finding:
      "Women can have ischemia and future events without an obstructive stenosis. A normal-looking epicardial artery does not close the case.",
    href: "https://pubmed.ncbi.nlm.nih.gov/?term=Women%27s+Ischemia+Syndrome+Evaluation",
  },
];

export const FEMALE_EVIDENCE_BRIEF = CITATIONS.map(
  (item) => `- ${item.label}: ${item.finding}`,
).join("\n");
