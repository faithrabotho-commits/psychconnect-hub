import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generatePlan } from "@/lib/ai-tools.functions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ListChecks, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({ meta: [{ title: "AI Task Planner — PsychFest" }] }),
  component: PlannerPage,
});

type PlanOut = Awaited<ReturnType<typeof generatePlan>>;

function mondayOfThisWeek() {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500/10 text-red-600 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
};

const CATEGORY_EMOJI: Record<string, string> = {
  study: "📚", volunteer: "❤️", class: "🎓", admin: "🗂️", rest: "☕", exam: "📝",
};

function PlannerPage() {
  const fn = useServerFn(generatePlan);
  const [weekStart, setWeekStart] = useState(mondayOfThisWeek());
  const [commitments, setCommitments] = useState("");
  const [plan, setPlan] = useState<PlanOut | null>(null);

  const m = useMutation({
    mutationFn: () => fn({ data: { weekStart, commitments } }),
    onSuccess: (r) => setPlan(r),
    onError: (e: Error) => toast.error(e.message || "Planner failed"),
  });

  const exportIcs = () => {
    if (!plan) return;
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PsychFest//Planner//EN"];
    plan.days.forEach((d) => {
      d.blocks.forEach((b, i) => {
        const dt = d.date.replace(/-/g, "");
        const start = b.time.replace(":", "").padStart(4, "0") + "00";
        lines.push(
          "BEGIN:VEVENT",
          `UID:${dt}-${i}@psychfest`,
          `DTSTART:${dt}T${start}`,
          `DTEND:${dt}T${start}`,
          `SUMMARY:${b.task}`,
          `CATEGORIES:${b.category}`,
          "END:VEVENT",
        );
      });
    });
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\n")], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `psychfest-plan-${weekStart}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardShell title="AI Task Planner">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-blue-brand/10 text-blue-brand">
            <ListChecks className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold">AI Task Planner</h1>
            <p className="text-sm text-muted-foreground">List your commitments — we'll build a balanced week for you.</p>
          </div>
        </header>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="grid gap-3 md:grid-cols-[200px_1fr_auto]">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Week starting</label>
              <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Commitments</label>
              <textarea
                value={commitments}
                onChange={(e) => setCommitments(e.target.value)}
                rows={4}
                placeholder="e.g. Assignment due Friday, Volunteer Sat 9-1, Class Mon 10am, Exam Tues 2pm…"
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <button
              disabled={m.isPending || commitments.length < 10}
              onClick={() => m.mutate()}
              className="self-end rounded-xl bg-teal px-6 py-3 font-semibold text-teal-foreground disabled:opacity-60 md:min-w-40"
            >
              {m.isPending ? <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Planning…</span> : "Generate plan"}
            </button>
          </div>
        </div>

        {plan && (
          <>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Priority: <span className="mx-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs text-red-600">high</span><span className="mx-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700">medium</span><span className="mx-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700">low</span></p>
              <button onClick={exportIcs} className="inline-flex items-center gap-2 rounded-full border border-input px-4 py-2 text-sm font-semibold">
                <Download className="size-4" /> Export .ics
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-7">
              {plan.days.map((d) => (
                <div key={d.date} className="rounded-2xl border border-border bg-card p-3">
                  <p className="font-display text-sm font-bold">
                    {new Date(d.date + "T00:00:00Z").toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" })}
                  </p>
                  <p className="mb-2 text-xs text-muted-foreground">{d.date.slice(5)}</p>
                  <div className="space-y-2">
                    {d.blocks.map((b, i) => (
                      <div key={i} className={`rounded-lg border p-2 text-xs ${PRIORITY_COLORS[b.priority] ?? ""}`}>
                        <p className="font-semibold">{b.time}</p>
                        <p className="mt-0.5">{CATEGORY_EMOJI[b.category] ?? ""} {b.task}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
