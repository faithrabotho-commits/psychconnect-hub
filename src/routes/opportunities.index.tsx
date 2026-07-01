import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/layout/site-shell";
import { MapPin, Search, Filter } from "lucide-react";
import { OpportunitiesMap } from "@/components/opportunities-map";

export const Route = createFileRoute("/opportunities/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Volunteer Opportunities — PsychFest" },
      { name: "description", content: "Browse verified volunteer opportunities at psychology-focused NGOs, clinics and community centres across South Africa." },
      { property: "og:title", content: "Volunteer Opportunities — PsychFest" },
    ],
  }),
  component: OpportunitiesPage,
});

const CATEGORIES = ["Children","Trauma","Community Psychology","Counselling","Crisis Centres","Mental Health","Research","Disability","Schools","Hospitals","Substance Abuse"];
const PROVINCES = ["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","Northern Cape","North West","Western Cape"];

function OpportunitiesPage() {
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState<string>("");
  const [cat, setCat] = useState<string>("");
  const navigate = useNavigate();

  const q = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id, title, description, opp_type, hours_per_week, categories, organisations(id, name, slug, city, province, lat, lng)")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const items = q.data ?? [];
    return items.filter((o) => {
      if (province && o.organisations?.province !== province) return false;
      if (cat && !(o.categories ?? []).includes(cat)) return false;
      if (query) {
        const s = `${o.title} ${o.description} ${o.organisations?.name ?? ""} ${o.organisations?.city ?? ""}`.toLowerCase();
        if (!s.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [q.data, province, cat, query]);

  const mapPins = filtered
    .filter((o) => o.organisations?.lat && o.organisations?.lng)
    .map((o) => ({
      id: o.id,
      lat: o.organisations!.lat!,
      lng: o.organisations!.lng!,
      title: o.title,
      subtitle: `${o.organisations!.name} • ${o.organisations!.city}`,
    }));

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10">
          <h1 className="font-display text-4xl font-extrabold md:text-5xl">Verified volunteer placements</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {q.data?.length ?? 0} opportunities from partner NGOs, clinics and community centres across South Africa.
          </p>
        </header>

        {/* Filters */}
        <div className="mb-8 rounded-3xl border border-border bg-card p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                placeholder="Search roles, organisations, cities…"
                className="w-full rounded-full border border-input bg-background py-2.5 pl-9 pr-4 text-sm"
              />
            </div>
            <select value={province} onChange={(e)=>setProvince(e.target.value)} className="rounded-full border border-input bg-background px-4 py-2.5 text-sm">
              <option value="">All provinces</option>
              {PROVINCES.map((p)=><option key={p}>{p}</option>)}
            </select>
            <select value={cat} onChange={(e)=>setCat(e.target.value)} className="rounded-full border border-input bg-background px-4 py-2.5 text-sm">
              <option value="">All categories</option>
              {CATEGORIES.map((c)=><option key={c}>{c}</option>)}
            </select>
            {(province || cat || query) && (
              <button onClick={()=>{setProvince("");setCat("");setQuery("");}} className="rounded-full border border-input px-4 py-2.5 text-sm">Clear</button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.slice(0,7).map((c)=>(
              <button
                key={c}
                onClick={()=>setCat(cat===c?"":c)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${cat===c ? "border-teal bg-teal/10 text-teal" : "border-border text-muted-foreground hover:bg-muted"}`}
              >{c}</button>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* List */}
          <div className="space-y-4">
            {q.isLoading && Array.from({length:4}).map((_,i)=><div key={i} className="h-32 rounded-3xl bg-muted animate-pulse" />)}
            {!q.isLoading && filtered.length === 0 && (
              <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
                <Filter className="mx-auto mb-3 size-6" />
                No opportunities match those filters.
              </div>
            )}
            {filtered.map((o) => (
              <Link
                key={o.id}
                to="/opportunities/$id"
                params={{ id: o.id }}
                className="block rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg font-bold">{o.title}</h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" /> {o.organisations?.name} • {o.organisations?.city}, {o.organisations?.province}
                    </p>
                  </div>
                  <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal">Verified</span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{o.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded border border-border px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground capitalize">{o.opp_type.replace("_"," ")}</span>
                  {o.hours_per_week && <span className="rounded border border-border px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{o.hours_per_week} hrs/wk</span>}
                  {(o.categories ?? []).slice(0,3).map((c)=><span key={c} className="rounded border border-border px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{c}</span>)}
                </div>
              </Link>
            ))}
          </div>

          {/* Map */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-border bg-card">
              <OpportunitiesMap
                pins={mapPins}
                onSelect={(id) => navigate({ to: "/opportunities/$id", params: { id } })}
              />
              <div className="border-t border-border p-4 text-xs text-muted-foreground">
                {mapPins.length} placements plotted across South Africa
              </div>
            </div>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
