import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analyzeDiary, type ModelRead } from "./insights.server";

const entrySchema = z.object({
  date: z.string(),
  severity: z.number(),
  sleep_hours: z.number(),
  notes: z.string(),
  menstrual_day: z.number().nullable(),
  menstrual_phase: z.string(),
});

const inputSchema = z.object({
  patient: z.object({
    name: z.string(),
    age: z.number().nullable(),
    height: z.string().nullable(),
    weight: z.string().nullable(),
    background: z.string(),
  }),
  entries: z.array(entrySchema).min(1),
});

export type InsightResponse =
  | { ok: true; generic: ModelRead; female: ModelRead }
  | { ok: false; message: string };

// The browser session sends the written diary. The server does not store it.
export const getPatientInsight = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<InsightResponse> => {
    try {
      const comparison = await analyzeDiary(data.patient, data.entries);
      return { ok: true, ...comparison };
    } catch (error) {
      const message = error instanceof Error ? error.message : "The analysis could not be completed.";
      return { ok: false, message };
    }
  });
