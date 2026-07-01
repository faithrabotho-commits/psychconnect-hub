import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/layout/site-shell";
import { ArrowLeft, MapPin, Globe, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/organisations/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} — PsychFest` }] }),
  loader: async ({ params }) => {
    const { data, error } = await supabase.from("organisations").select("*").eq("slug", params.slug).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return data;
  },
  component: OrgPage,
});

function OrgPage() {
  const org = Route.useLoaderData();
  const opps = useQuery({
    queryKey: ["org-opps", org.id],
    queryFn: async () => {
      const { data } = await supabase.from("opportunities").select("id, title, opp_type, hours_per_week").eq("org_id", org.id).eq("active", true);
      return data ?? [];
    },
  });

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link to="/opportunities" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <header className="mt-6">
          {org.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">
              <CheckCircle className="size-3" /> Verified organisation
            </span>
          )}
          <h1 className="mt-3 font-display text-4xl font-extrabold md:text-5xl">{org.name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-4 text-muted-foreground">
            {org.city && <span className="flex items-center gap-1"><MapPin className="size-4" /> {org.city}, {org.province}</span>}
            {org.website && <a className="flex items-center gap-1 hover:text-foreground" href={org.website} target="_blank" rel="noreferrer"><Globe className="size-4" /> Website</a>}
          </p>
        </header>

        {org.description && <p className="mt-6 max-w-3xl text-lg text-muted-foreground">{org.description}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {(org.categories ?? []).map((c) => <span key={c} className="rounded-full bg-lavender px-3 py-1 text-xs font-semibold text-lavender-foreground">{c}</span>)}
        </div>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-extrabold">Open placements</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(opps.data ?? []).map((o) => (
              <Link key={o.id} to="/opportunities/$id" params={{ id: o.id }} className="rounded-3xl border border-border bg-card p-5 hover:shadow-xl hover:shadow-black/5">
                <h3 className="font-display font-bold">{o.title}</h3>
                <div className="mt-2 flex gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span className="rounded border border-border px-2 py-1 capitalize">{o.opp_type.replace("_"," ")}</span>
                  {o.hours_per_week && <span className="rounded border border-border px-2 py-1">{o.hours_per_week} hrs/wk</span>}
                </div>
              </Link>
            ))}
            {opps.data?.length === 0 && <p className="text-sm text-muted-foreground">No open placements right now.</p>}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
