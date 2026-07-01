import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
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

const MAX_MESSAGES = 40;
const MAX_CHARS_PER_MESSAGE = 4000;

async function verifyCaller(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  if (!token || token.split(".").length !== 3) return null;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null;

  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const userId = await verifyCaller(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const { messages } = (await request.json()) as Body;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("Messages required", { status: 400 });
        }
        if (messages.length > MAX_MESSAGES) {
          return new Response("Too many messages", { status: 413 });
        }
        for (const m of messages) {
          const size = JSON.stringify(m.parts ?? m).length;
          if (size > MAX_CHARS_PER_MESSAGE) {
            return new Response("Message too long", { status: 413 });
          }
        }

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
