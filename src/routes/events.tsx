import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/layout/site-shell";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [{ title: "Events — PsychFest" }, { name: "description", content: "Careers fairs, conferences, and workshops for South African psychology students." }] }),
  component: EventsPage,
});

function EventsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*").gte("starts_at", new Date().toISOString()).order("starts_at");
      return data ?? [];
    },
  });

  const rsvps = useQuery({
    queryKey: ["rsvps", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("event_rsvps").select("event_id").eq("user_id", user!.id);
      return new Set((data ?? []).map((r) => r.event_id));
    },
  });

  const toggle = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error("Sign in to RSVP");
      if (rsvps.data?.has(eventId)) {
        await supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", user.id);
      } else {
        await supabase.from("event_rsvps").insert({ event_id: eventId, user_id: user.id });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rsvps"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-4xl font-extrabold md:text-5xl">Upcoming events</h1>
        <p className="mt-2 text-muted-foreground">Career fairs, conferences, and workshops from universities and organisations across South Africa.</p>

        <div className="mt-8 space-y-4">
          {(q.data ?? []).map((e) => (
            <div key={e.id} className="rounded-3xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold">{e.title}</h2>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="size-3.5" /> {new Date(e.starts_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                    {e.location && <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {e.location}</span>}
                  </p>
                  {e.description && <p className="mt-3 text-sm text-muted-foreground">{e.description}</p>}
                  {e.host && <p className="mt-2 text-xs text-muted-foreground">Hosted by {e.host}</p>}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                {user ? (
                  <button onClick={()=>toggle.mutate(e.id)} className={`rounded-full px-5 py-2 text-sm font-semibold ${rsvps.data?.has(e.id) ? "bg-teal text-teal-foreground" : "border border-input"}`}>
                    {rsvps.data?.has(e.id) ? "You're going" : "RSVP"}
                  </button>
                ) : null}
                {e.url && <a href={e.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-teal hover:underline">Learn more <ExternalLink className="size-3" /></a>}
              </div>
            </div>
          ))}
          {q.data?.length === 0 && <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">No upcoming events.</p>}
        </div>
      </div>
    </SiteShell>
  );
}
