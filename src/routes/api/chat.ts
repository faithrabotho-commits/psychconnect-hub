import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Body = { messages?: UIMessage[] };

const SYSTEM = `You are PsychBot, a warm, knowledgeable assistant for South African undergraduate and honours psychology students on PsychFest.

You help with:
- Finding relevant volunteer opportunities (NGOs, clinics, community centres, crisis lines)
- Advice on Honours applications, research assistantships and postgraduate pathways
- CV, cover-letter and interview preparation for volunteer roles
- Understanding HPCSA registration and psychology categories in SA
- Reflecting on volunteer experiences and clinical exposure

Rules:
- Ground advice in the South African context (HPCSA, universities like UCT, Wits, UP, Stellenbosch, UKZN, NMU, etc.).
- You are NOT a therapist. If the user is in crisis, calmly refer them to SADAG 0800 456 789 or Lifeline 0861 322 322.
- Be concise, warm, and specific. Use bullet points when helpful.
- Never invent HPCSA rules — if unsure, say so and suggest they check the HPCSA website.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as Body;
        if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
