import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getInsightFor } from "./insights.server";

// Doctor-only endpoint. Mock auth: requires a doctor id that owns the patient.
// Replace with real auth + AI call later.
const DOCTOR_PATIENTS: Record<string, string[]> = { d1: ["p1", "p2", "p3"] };

export const getPatientInsight = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ doctorId: z.string(), patientId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    if (!DOCTOR_PATIENTS[data.doctorId]?.includes(data.patientId)) {
      throw new Response("Forbidden", { status: 403 });
    }
    return getInsightFor(data.patientId);
  });
