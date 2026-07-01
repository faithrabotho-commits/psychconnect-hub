import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Clock, CheckCircle, Bookmark } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/opportunities/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Opportunity — PsychFest` }, { property: "og:title", content: `Volunteer opportunity #${params.id.slice(0,8)}` }],
  }),
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*, organisations(*)")
      .eq("id", params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return data;
  },
  component: OpportunityDetail,
});

function OpportunityDetail() {
  const opp = Route.useLoaderData();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [coverNote, setCoverNote] = useState("");

  const applied = useQuery({
    queryKey: ["application", opp.id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("id, status").eq("opportunity_id", opp.id).eq("student_id", user!.id).maybeSingle();
      return data;
    },
  });
  const saved = useQuery({
    queryKey: ["saved", opp.id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("saved_opportunities").select("user_id").eq("opportunity_id", opp.id).eq("user_id", user!.id).maybeSingle();
      return !!data;
    },
  });

  const apply = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to apply");
      const { error } = await supabase.from("applications").insert({ opportunity_id: opp.id, student_id: user.id, cover_note: coverNote });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Application sent!"); qc.invalidateQueries({ queryKey: ["application", opp.id] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to save");
      if (saved.data) {
        await supabase.from("saved_opportunities").delete().eq("opportunity_id", opp.id).eq("user_id", user.id);
      } else {
        await supabase.from("saved_opportunities").insert({ opportunity_id: opp.id, user_id: user.id });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved", opp.id] }),
  });

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link to="/opportunities" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to opportunities
        </Link>

        <div className="mt-6 flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal">
              <CheckCircle className="size-3" /> Verified organisation
            </span>
            <h1 className="mt-3 font-display text-3xl font-extrabold md:text-5xl">{opp.title}</h1>
            <p className="mt-2 flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" />
              <Link to="/organisations/$slug" params={{ slug: opp.organisations!.slug }} className="hover:text-foreground">
                {opp.organisations!.name}
              </Link>
              • {opp.organisations!.city}, {opp.organisations!.province}
            </p>
          </div>
          {user && (
            <button
              onClick={() => toggleSave.mutate()}
              className="rounded-full border border-input p-3 hover:bg-muted"
              aria-label={saved.data ? "Unsave" : "Save"}
            >
              <Bookmark className={`size-5 ${saved.data ? "fill-teal text-teal" : ""}`} />
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {opp.hours_per_week && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-semibold"><Clock className="size-3" /> {opp.hours_per_week} hrs/week</span>
          )}
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize">{opp.opp_type.replace("_"," ")}</span>
          {opp.commitment && <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{opp.commitment}</span>}
          {(opp.categories ?? []).map((c: string) => <span key={c} className="rounded-full bg-lavender px-3 py-1 text-xs font-semibold text-lavender-foreground">{c}</span>)}
        </div>

        <article className="prose prose-slate mt-10 max-w-none">
          <h2 className="font-display text-2xl font-bold">About this role</h2>
          <p className="whitespace-pre-wrap text-muted-foreground">{opp.description}</p>
          {opp.requirements && (
            <>
              <h3 className="mt-6 font-display text-xl font-bold">Requirements</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">{opp.requirements}</p>
            </>
          )}
        </article>

        <div className="mt-10 rounded-3xl border border-border bg-card p-6">
          <h3 className="font-display text-xl font-bold">Apply to this placement</h3>
          {!user && (
            <p className="mt-3 text-sm text-muted-foreground">
              <Link to="/auth" search={{ mode: "signup" }} className="font-semibold text-teal underline">Sign in or create a free account</Link> to apply and track your hours.
            </p>
          )}
          {user && applied.data && (
            <p className="mt-3 rounded-xl bg-teal/10 p-3 text-sm text-teal">Application status: <strong className="capitalize">{applied.data.status}</strong></p>
          )}
          {user && !applied.data && (
            <>
              <textarea
                value={coverNote}
                onChange={(e)=>setCoverNote(e.target.value)}
                placeholder="Tell the organisation why you're a good fit (optional)…"
                className="mt-4 h-32 w-full rounded-2xl border border-input bg-background p-4 text-sm"
              />
              <button onClick={()=>apply.mutate()} disabled={apply.isPending} className="mt-4 rounded-2xl bg-teal px-6 py-3 font-semibold text-teal-foreground shadow-lg shadow-teal/25 disabled:opacity-60">
                {apply.isPending ? "Sending…" : "Submit application"}
              </button>
            </>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
