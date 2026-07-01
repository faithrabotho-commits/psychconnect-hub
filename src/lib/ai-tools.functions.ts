import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

function gateway() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key);
}

// ---------------- Email Generator ----------------
const EmailInput = z.object({
  purpose: z.enum(["Application", "Thank You", "Follow-up", "Request Letter", "Recommendation"]),
  tone: z.enum(["Formal", "Friendly", "Persuasive"]),
  audience: z.enum(["NGO", "Hospital", "Psychologist", "University"]),
  studentName: z.string().min(1).max(120),
  university: z.string().max(160).optional().default(""),
  recipient: z.string().max(160).optional().default(""),
  context: z.string().max(2000).optional().default(""),
});

export const generateEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EmailInput.parse(d))
  .handler(async ({ data, context }) => {
    const system = `You are an experienced South African career advisor for psychology students.
Write a professional volunteer / academic email in South African English.
Rules: clear, polite, ≤ 250 words, include a subject line and a call to action. Never invent HPCSA rules.`;

    const prompt = `Purpose: ${data.purpose}
Tone: ${data.tone}
Audience: ${data.audience}
Student name: ${data.studentName}
University: ${data.university || "(not provided)"}
Recipient (org / person): ${data.recipient || "(not provided)"}
Additional context: ${data.context || "(none)"}

Return a JSON object with { subject, body }. The body must be plain text with paragraph breaks (\\n\\n).`;

    const { output } = await generateText({
      model: gateway()("google/gemini-3-flash-preview"),
      output: Output.object({
        schema: z.object({ subject: z.string(), body: z.string() }),
      }),
      system,
      prompt,
    });

    await context.supabase.from("ai_generations").insert({
      user_id: context.userId,
      kind: "email",
      input: data,
      output,
    });

    return output;
  });

// ---------------- Research Assistant ----------------
const ResearchInput = z.object({
  text: z.string().min(50).max(40000),
});

export const summarizeResearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ResearchInput.parse(d))
  .handler(async ({ data, context }) => {
    const system = `You are a research assistant for South African psychology Honours students.
Summarise academic articles clearly and simplify complex concepts. Never invent citations.`;

    const prompt = `Summarise the following psychology article for an Honours student.
Extract: aim, method, participants, results, limitations, practical implications, key theories, and one APA-style reference (if possible from the text; otherwise say "Reference not provided in text").

ARTICLE:
"""
${data.text}
"""`;

    const { output } = await generateText({
      model: gateway()("google/gemini-3-flash-preview"),
      output: Output.object({
        schema: z.object({
          aim: z.string(),
          method: z.string(),
          participants: z.string(),
          results: z.string(),
          limitations: z.string(),
          implications: z.string(),
          keyTheories: z.array(z.string()),
          apaReference: z.string(),
        }),
      }),
      system,
      prompt,
    });

    await context.supabase.from("ai_generations").insert({
      user_id: context.userId,
      kind: "research",
      input: { length: data.text.length },
      output,
    });

    return output;
  });

// ---------------- Task Planner ----------------
const PlannerInput = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  commitments: z.string().min(10).max(4000),
});

export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlannerInput.parse(d))
  .handler(async ({ data, context }) => {
    const system = `You are a productivity coach for South African psychology students.
Create realistic weekly schedules that balance study, volunteering, and rest. Prioritise by urgency and importance.`;

    const start = new Date(data.weekStart + "T00:00:00Z");
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      return d.toISOString().slice(0, 10);
    });

    const prompt = `Build a weekly schedule from ${days[0]} to ${days[6]}.
The student's commitments this week:
"""
${data.commitments}
"""

For each day, return 2–5 time-blocked tasks with priorities. Include short breaks and one rest evening. Use 24h times.
Return JSON: { days: [{ date, blocks: [{ time, task, priority, category }] }] }
priority ∈ ["high","medium","low"]. category ∈ ["study","volunteer","class","admin","rest","exam"].`;

    const { output } = await generateText({
      model: gateway()("google/gemini-3-flash-preview"),
      output: Output.object({
        schema: z.object({
          days: z.array(
            z.object({
              date: z.string(),
              blocks: z.array(
                z.object({
                  time: z.string(),
                  task: z.string(),
                  priority: z.enum(["high", "medium", "low"]),
                  category: z.enum(["study", "volunteer", "class", "admin", "rest", "exam"]),
                }),
              ),
            }),
          ),
        }),
      }),
      system,
      prompt,
    });

    await context.supabase.from("ai_generations").insert({
      user_id: context.userId,
      kind: "planner",
      input: data,
      output,
    });

    return output;
  });
