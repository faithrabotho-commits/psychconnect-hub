
# PsychFest v2 — AI tools, sidebar, Google auth, landing polish

## 1. Three new AI tools (Lovable AI Gateway, `google/gemini-3-flash-preview`)

All three are authenticated server functions (`createServerFn` + `requireSupabaseAuth`) living under `src/lib/*.functions.ts`, called from React Query mutations on the corresponding pages. System prompts stay on the server.

**a. AI Email Generator — `/dashboard/email`**
- Form: purpose (Application / Thank You / Follow-up / Request / Recommendation), tone (Formal / Friendly / Persuasive), audience (NGO / Hospital / Psychologist / University), plus context fields (student name auto-filled from profile, target org, key points).
- Server fn `generateEmail` returns `{ subject, body }`. Rendered in an editable textarea with Copy + "Regenerate" buttons.
- Optional: save last 10 generations to a new `ai_generations` table (see schema below) so users can revisit them.

**b. AI Research Assistant — `/dashboard/research`**
- Input: paste text OR upload PDF/DOCX (≤ 20 MB). Client parses PDFs with `pdfjs-dist` (text extraction only, no OCR) and `.docx` via `mammoth`. Fallback: paste text.
- Server fn `summarizeResearch` returns structured JSON (`Output.object` + Zod): `aim, method, participants, results, limitations, implications, keyTheories[], apaReference`.
- UI: sectioned card with copy-to-clipboard on each block.

**c. AI Task Planner — `/dashboard/planner`**
- Input: free-form list of commitments (deadlines, classes, volunteer shifts) + week-start date.
- Server fn `generatePlan` returns structured JSON: `days: [{ date, blocks: [{ time, task, priority: high|medium|low, category }] }]`.
- UI: week grid (Mon–Sun) with priority-coloured chips; "Regenerate" and "Export as .ics" (client-side ical string).

## 2. Dashboard sidebar rework

- Convert `_authenticated` layout into a shadcn `Sidebar` shell (`SidebarProvider` + `SidebarTrigger` in header).
- Sidebar items: Home (`/dashboard`), Opportunities (`/opportunities`), Community (`/community`), Events (`/events`), Planner, Research AI, Email Generator, PsychBot, Profile.
- Existing pages continue to work; only routes under `/dashboard/*` and the sidebar chrome are new.
- Mobile: sidebar collapses to icon strip; trigger stays in header.

## 3. Google sign-in

- Call `supabase--configure_social_auth` with `providers: ["google"]` (keep email/password).
- Add "Continue with Google" button on `/auth` using `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`.
- Handles both signup and login; `handle_new_user` trigger already provisions a `student` profile by default.

## 4. Landing page polish

- New hero: "Your AI Productivity Assistant for Psychology Students" + subhead + two CTAs (Find Opportunities / Try PsychBot).
- Animated counters (Framer Motion `useInView` + count-up): 500+ opportunities, 120 psychologists, 2 000 students. Numbers hard-coded for now (real counts come once seeded data grows).
- Feature grid of 6 cards matching spec (Research, Planner, Email, Chatbot, Community, Opportunities), each linking to its page.
- Keep current Minimalist Calm palette (lavender / teal / blue).

## Backend changes

One migration:

```text
CREATE TABLE public.ai_generations (
  id uuid PK, user_id uuid → auth.users,
  kind text CHECK IN ('email','research','planner'),
  input jsonb, output jsonb,
  created_at timestamptz
);
+ GRANTs (authenticated, service_role)
+ RLS: owner-only SELECT/INSERT/DELETE via auth.uid()
```

No other schema changes.

## Technical notes

- All AI calls use the existing `createLovableAiGatewayProvider` helper; OpenAI structured-output flag not needed (Gemini model).
- PDF parsing runs in the browser to keep server functions light; server fn receives already-extracted text (cap 40 000 chars).
- Rate-limit surfacing: show toast on 429 / 402 responses from the gateway.
- No new secrets required — `LOVABLE_API_KEY` already provisioned.

## Out of scope (this pass)

- Certificates auto-issuance from planner completion.
- Real-time counter of live users/opportunities on the landing page.
- Calendar sync beyond `.ics` export.
- Psychologist verification workflow changes.
