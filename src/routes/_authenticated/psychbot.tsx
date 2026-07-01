import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Send, Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/psychbot")({
  head: () => ({ meta: [{ title: "PsychBot — PsychFest" }] }),
  component: PsychBot,
});

const SUGGESTIONS = [
  "Where can I volunteer near Wits University?",
  "How can I strengthen my Honours application?",
  "What should I wear for a Lifeline interview?",
  "Help me write a cover letter for a trauma counselling role.",
];

function PsychBot() {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const initial: UIMessage[] = useMemo(() => [], []);
  const { messages, sendMessage, status } = useChat({
    id: "psychbot",
    messages: initial,
    transport,
    onError: (e) => console.error(e),
  });
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  const submit = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    await sendMessage({ text: t });
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-6 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-tr from-teal to-blue-brand text-white">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold">PsychBot</h1>
            <p className="text-sm text-muted-foreground">Your AI guide to volunteering and psychology careers in South Africa.</p>
          </div>
        </header>

        <div className="min-h-[400px] rounded-3xl border border-border bg-card p-6">
          {messages.length === 0 ? (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">Ask me anything about volunteering, Honours applications, or your psychology career.</p>
              <div className="mx-auto grid max-w-lg gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={()=>submit(s)} className="rounded-2xl border border-border bg-background p-3 text-left text-sm hover:bg-muted">{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => {
                const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
                return (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "user" ? (
                      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground whitespace-pre-wrap">{text}</div>
                    ) : (
                      <div className="max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap">{text}</div>
                    )}
                  </div>
                );
              })}
              {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Thinking…</div>}
            </div>
          )}
        </div>

        <form onSubmit={(e)=>{e.preventDefault();submit(input);}} className="mt-4 flex gap-2 rounded-full border border-border bg-card p-2">
          <input
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            placeholder="Ask PsychBot anything…"
            className="flex-1 bg-transparent px-4 py-2 text-sm outline-none"
          />
          <button disabled={busy || !input.trim()} className="grid size-10 place-items-center rounded-full bg-teal text-teal-foreground disabled:opacity-40">
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}
