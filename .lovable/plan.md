## PsychFest — Full MVP Plan

A professional networking + volunteering platform for South African psychology students. Built on TanStack Start + Lovable Cloud (Supabase) + Lovable AI (Gemini). Design follows the selected **Minimalist Calm** direction — white surfaces, teal (#0d9488) + blue (#2563eb) + lavender (#f3f0ff), Inter Tight display + Inter body, generously rounded cards.

---

### 1. Design system

- Install `@fontsource/inter` and `@fontsource-variable/inter-tight`; import in root.
- Rewrite `src/styles.css` `@theme` tokens: background, foreground, teal, blue, lavender, muted, border. Keep dark mode variants.
- Global elements: sticky glass nav, generous max-w-6xl container, `fade-up` keyframe animation, rounded-2xl/3xl cards, subtle teal-tinted shadows.
- Bottom tab bar for mobile (`🏠 🔍 ➕ 💬 👤`).

### 2. Backend (Lovable Cloud)

Enable Cloud, then migrations for:

- `profiles` (id → auth.users, full_name, personal_email, university, degree, province, avatar_url, bio, grad_year)
- `user_roles` (enum: `student`, `psychologist`, `organisation`, `admin`) + `has_role()` security-definer fn
- `psychologist_details` (user_id, hpcsa_number, category, organisation, verified_at) — trust-based auto-verify in v1
- `organisations` (id, name, slug, description, logo_url, website, province, city, address, lat, lng, categories[], verified, created_by)
- `opportunities` (id, org_id, title, description, categories[], commitment, hours_per_week, remote/hybrid/in_person, requirements, created_by, active)
- `applications` (id, opportunity_id, student_id, status, cover_note, created_at)
- `saved_opportunities` (user_id, opportunity_id)
- `experiences` (id, author_id, org_id nullable, title, body, categories[], created_at) + `experience_reactions` (like/helpful/save) + `experience_comments`
- `volunteer_hours` (id, user_id, opportunity_id, org_id, hours, description, logged_at, verified_by nullable)
- `certificates` (id, user_id, opportunity_id, url, issued_at)
- `forum_threads` + `forum_posts` (category enum)
- `events` (id, org_id/university, title, date, location, description) + `event_rsvps`
- `notifications` (user_id, type, payload, read_at)
- `chat_conversations` + `chat_messages` for PsychBot (user_id, role, content)

Every table gets RLS + explicit GRANTs. Public reads for orgs/opportunities/experiences via anon SELECT policies with narrow columns. Auth-owned data scoped to `auth.uid()`. Role-gated writes for organisations/psychologists via `has_role()`.

Seed migration inserts ~20 organisations, ~30 opportunities, 21 SA universities, and a handful of experiences so the app looks alive.

### 3. Auth

Email/password + Google OAuth via Lovable broker. Registration form asks role first:
- **Student**: name, personal email, university (dropdown), degree, province.
- **Psychologist**: adds HPCSA number, category, organisation. Auto-marks `verified_at = now()` (v1 trust-based; flagged in code for future real verification).
- **Organisation**: creates org record + admin membership.

Handled by a `handle_new_user` trigger populating `profiles` + `user_roles`. Password reset page at `/reset-password`. Protected app routes under `src/routes/_authenticated/`.

### 4. Route map

Public:
- `/` Home (hero, stats, featured story, featured opportunities, how-it-works)
- `/opportunities` Volunteer jobs list + filters + map preview
- `/opportunities/$id` Job detail
- `/organisations/$slug` Org page (with reviews from verified psychologists)
- `/experiences` Feed of student experiences
- `/experiences/$id`
- `/community` Forum categories + threads
- `/community/$threadId`
- `/events`
- `/about`, `/psychologists` (info page), `/auth`, `/reset-password`

Authenticated (`_authenticated/`):
- `/dashboard` Role-adaptive (student / org / psychologist)
- `/dashboard/applications`, `/dashboard/saved`, `/dashboard/hours`, `/dashboard/certificates`, `/dashboard/journey`
- `/dashboard/experiences/new`
- `/dashboard/org` (org: post opportunity, review applications, verify hours, issue certificates)
- `/psychbot` AI chat
- `/profile` + `/profile/edit`
- `/notifications`

### 5. Key features

**Volunteer Jobs** — filter chips (province, category, university proximity, remote), search, sortable card list, sticky map panel using `react-leaflet` + OpenStreetMap (no Google Maps key needed) with pins by lat/lng. Save/apply actions.

**Organisation page** — logo, description, requirements, volunteer hours stat, contact/website, verified badge, reviews from verified psychologists only, star rating aggregate.

**Experiences feed** — LinkedIn-meets-Reddit posts; like, comment, save, share, mark helpful; category filter; markdown rendering.

**My Journey** — timeline of logged hours + skills earned, portfolio-style export, gamification badges (First Volunteer, 100 Hours, 500 Hours, Honours Ready, Community Builder).

**PsychBot** — AI chat surface using AI Elements (`conversation`, `message`, `prompt-input`, `shimmer`). TanStack server route `/api/chat` streams from `google/gemini-3-flash-preview` via Lovable AI Gateway with a system prompt tuned to SA psychology students; can suggest opportunities based on province/university via tool call that queries Supabase. Persist per-user conversations.

**Community forum** — categories (Honours Applications, Research, Volunteer Advice, Clinical, Counselling, Study Tips, Mental Health), threads with replies and reactions.

**Events** — list + RSVP.

**Organisation dashboard** — post/edit opportunities, view applications, accept/reject, verify submitted hours, issue certificate (generates PDF client-side and stores URL), rate volunteers.

**Student dashboard** — role-aware landing showing applications, saved, hours progress, certificates, achievements, notifications.

**Notifications** — DB-backed list + realtime subscription; bell in nav.

**AI extras** — server functions for Resume Builder, Cover Letter Generator, Interview Practice (structured chat), Volunteer Recommendation Engine (query embedding via `google/gemini-embedding-001` over opportunities). Skill Analysis from journey entries. All via Lovable AI, LOVABLE_API_KEY provisioned automatically.

**Accessibility** — dark mode toggle, semantic HTML, focus rings, aria labels on icon buttons, high-contrast tokens.

**Security** — Zod validation on all forms, RLS + role checks, POPIA-friendly consent copy on signup, encrypted at rest via Supabase defaults.

### 6. Technical

- Router: TanStack Start file-based routes as documented.
- Data: TanStack Query in loaders via `ensureQueryData` + `useSuspenseQuery`; server fns in `src/lib/*.functions.ts` using `requireSupabaseAuth` where needed.
- Maps: `bun add leaflet react-leaflet` — no API key required.
- PsychBot: `bun add ai @ai-sdk/react @ai-sdk/openai-compatible`; AI Elements installed via `bunx ai-elements@latest add conversation message prompt-input shimmer`.
- Illustrations: two generated hero images (student portrait, stylised SA map) saved under `src/assets/`.

### 7. Build order

1. Cloud enable + schema + seed + auth pages.
2. Design tokens + fonts + shared layout (nav, footer, mobile tab bar).
3. Home page (matches selected prototype composition).
4. Opportunities list + detail + map.
5. Organisations pages.
6. Experiences feed + create form.
7. Community forum + events.
8. Student dashboard + journey + certificates + notifications.
9. Organisation dashboard.
10. PsychBot chat + AI extras.
11. Profile + settings + dark mode.
12. Polish, a11y pass, seeded data check.

Scope is large — I'll ship it in stages and check in between phases. Confirm to start with phase 1.
