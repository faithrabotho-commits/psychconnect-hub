import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateEmail } from "@/lib/ai-tools.functions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Mail, Loader2, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/email")({
  head: () => ({ meta: [{ title: "AI Email Generator — PsychFest" }] }),
  component: EmailPage,
});

const PURPOSES = ["Application", "Thank You", "Follow-up", "Request Letter", "Recommendation"] as const;
const TONES = ["Formal", "Friendly", "Persuasive"] as const;
const AUDIENCES = ["NGO", "Hospital", "Psychologist", "University"] as const;

function EmailPage() {
  const fn = useServerFn(generateEmail);
  const [form, setForm] = useState({
    purpose: PURPOSES[0] as (typeof PURPOSES)[number],
    tone: TONES[0] as (typeof TONES)[number],
    audience: AUDIENCES[0] as (typeof AUDIENCES)[number],
    studentName: "",
    university: "",
    recipient: "",
    context: "",
  });
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const m = useMutation({
    mutationFn: () => fn({ data: form }),
    onSuccess: (out) => {
      setSubject(out.subject);
      setBody(out.body);
    },
    onError: (e: Error) => toast.error(e.message || "Generation failed"),
  });

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <DashboardShell title="AI Email Generator">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-lavender text-lavender-foreground">
            <Mail className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold">AI Email Generator</h1>
            <p className="text-sm text-muted-foreground">Draft professional volunteer and academic emails in seconds.</p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.studentName.trim()) return toast.error("Enter your name first");
              m.mutate();
            }}
            className="space-y-4 rounded-3xl border border-border bg-card p-6"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value as (typeof PURPOSES)[number] })} className="rounded-xl border border-input bg-background px-3 py-2 text-sm">
                {PURPOSES.map((p) => <option key={p}>{p}</option>)}
              </select>
              <select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value as (typeof TONES)[number] })} className="rounded-xl border border-input bg-background px-3 py-2 text-sm">
                {TONES.map((p) => <option key={p}>{p}</option>)}
              </select>
              <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as (typeof AUDIENCES)[number] })} className="rounded-xl border border-input bg-background px-3 py-2 text-sm">
                {AUDIENCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <input value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} placeholder="Your full name" className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
            <input value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} placeholder="Your university (optional)" className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
            <input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} placeholder="Recipient organisation / person (optional)" className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
            <textarea value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} placeholder="Additional context: what are you asking for, your skills, deadlines…" rows={5} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
            <button disabled={m.isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal py-3 font-semibold text-teal-foreground disabled:opacity-60">
              {m.isPending ? <><Loader2 className="size-4 animate-spin" /> Generating…</> : <>Generate email</>}
            </button>
          </form>

          <div className="space-y-3 rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Draft</h2>
              {(subject || body) && (
                <button onClick={() => m.mutate()} disabled={m.isPending} className="inline-flex items-center gap-1 rounded-full border border-input px-3 py-1 text-xs font-semibold">
                  <RefreshCw className="size-3" /> Regenerate
                </button>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</label>
              <div className="mt-1 flex gap-2">
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Your subject will appear here" className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm" />
                {subject && <button onClick={() => copy(subject, "Subject")} className="rounded-xl border border-input px-3 text-xs"><Copy className="size-3.5" /></button>}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Body</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14} placeholder="Your generated email will appear here — you can edit before sending." className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
              {body && (
                <button onClick={() => copy(body, "Body")} className="mt-2 inline-flex items-center gap-1 rounded-full border border-input px-3 py-1 text-xs font-semibold">
                  <Copy className="size-3" /> Copy body
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
