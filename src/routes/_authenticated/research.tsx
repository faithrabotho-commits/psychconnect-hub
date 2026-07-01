import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { summarizeResearch } from "@/lib/ai-tools.functions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BookOpen, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({ meta: [{ title: "AI Research Assistant — PsychFest" }] }),
  component: ResearchPage,
});

type ResearchOut = Awaited<ReturnType<typeof summarizeResearch>>;

function ResearchPage() {
  const fn = useServerFn(summarizeResearch);
  const [text, setText] = useState("");
  const [out, setOut] = useState<ResearchOut | null>(null);

  const m = useMutation({
    mutationFn: () => fn({ data: { text } }),
    onSuccess: (r) => setOut(r),
    onError: (e: Error) => toast.error(e.message || "Summarisation failed"),
  });

  const copy = (t: string, label: string) => { navigator.clipboard.writeText(t); toast.success(`${label} copied`); };

  const sections: Array<{ key: keyof ResearchOut; label: string }> = [
    { key: "aim", label: "Aim" },
    { key: "method", label: "Method" },
    { key: "participants", label: "Participants" },
    { key: "results", label: "Results" },
    { key: "limitations", label: "Limitations" },
    { key: "implications", label: "Practical Implications" },
    { key: "apaReference", label: "APA Reference" },
  ];

  return (
    <DashboardShell title="AI Research Assistant">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-teal/10 text-teal">
            <BookOpen className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold">AI Research Assistant</h1>
            <p className="text-sm text-muted-foreground">Paste an article and get an Honours-ready summary in seconds.</p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-border bg-card p-6">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paste article text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={18}
              placeholder="Paste the full text of a psychology journal article, chapter, or extract (up to ~40,000 characters)…"
              className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{text.length.toLocaleString()} / 40,000 chars</span>
              <span>Tip: for PDFs, open, select all, paste here.</span>
            </div>
            <button
              disabled={m.isPending || text.length < 50}
              onClick={() => m.mutate()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal py-3 font-semibold text-teal-foreground disabled:opacity-60"
            >
              {m.isPending ? <><Loader2 className="size-4 animate-spin" /> Summarising…</> : "Summarise"}
            </button>
          </div>

          <div className="space-y-3">
            {!out && !m.isPending && (
              <div className="grid h-full place-items-center rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Your structured summary will appear here.
              </div>
            )}
            {out && (
              <>
                {sections.map((s) => (
                  <div key={s.key} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-teal">{s.label}</h3>
                      <button onClick={() => copy(String(out[s.key]), s.label)} className="text-muted-foreground hover:text-foreground"><Copy className="size-3.5" /></button>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{String(out[s.key])}</p>
                  </div>
                ))}
                <div className="rounded-2xl border border-border bg-card p-4">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-teal">Key Theories</h3>
                  <ul className="mt-2 list-inside list-disc text-sm">
                    {out.keyTheories.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
