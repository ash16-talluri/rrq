import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  symptom: z.string().trim().min(3).max(800),
  vehicle: z
    .object({
      make: z.string().optional(),
      model: z.string().optional(),
      year: z.number().int().optional(),
      fuel_type: z.string().optional(),
    })
    .optional(),
});

export const analyzeSymptom = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const vehicleNote = data.vehicle
      ? `Vehicle: ${[data.vehicle.year, data.vehicle.make, data.vehicle.model].filter(Boolean).join(" ")}${data.vehicle.fuel_type ? ` (${data.vehicle.fuel_type})` : ""}.`
      : "";

    const system = `You are TravAID's roadside assistant for drivers stranded on highways. The user describes a problem in plain language.
Respond with a strict JSON object matching this TypeScript type:
{
  "severity": "low" | "medium" | "high" | "critical",
  "likely_causes": string[], // 2-4 plain-English causes, most likely first
  "immediate_steps": string[], // 3-6 safety + diagnostic steps the driver can do RIGHT NOW
  "recommended_service": "puncture_shop" | "mechanic" | "towing" | "fuel_station" | "hospital" | "police",
  "recommended_service_label": string, // e.g. "Mechanic" or "Towing service"
  "summary": string // one short sentence summarising the situation
}
Be concise, calm, and practical. Prioritise driver safety. Do NOT include any markdown or commentary outside the JSON object.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `${vehicleNote}\nProblem: ${data.symptom}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) {
      throw new Error("AI is busy right now (rate limit). Try again in a moment.");
    }
    if (res.status === 402) {
      throw new Error("AI credits exhausted on this workspace. Add credits to continue.");
    }
    if (!res.ok) {
      throw new Error(`AI request failed: ${res.status}`);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    try {
      return JSON.parse(content) as {
        severity: "low" | "medium" | "high" | "critical";
        likely_causes: string[];
        immediate_steps: string[];
        recommended_service: string;
        recommended_service_label: string;
        summary: string;
      };
    } catch {
      throw new Error("AI returned an unparseable response");
    }
  });
