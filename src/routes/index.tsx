import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/layout/site-shell";
import heroImg from "@/assets/hero-student.jpg";
import { ArrowRight, Sparkles, MapPin, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PsychFest — Volunteering for South African Psychology Students" },
      { name: "description", content: "Find verified volunteer placements at SA NGOs, clinics and community centres. Build clinical hours, connect with mentors, and grow your psychology career." },
      { property: "og:title", content: "PsychFest — Volunteering for SA Psychology Students" },
      { property: "og:description", content: "Verified volunteer placements, an AI career assistant, and a community for South African psychology students." },
    ],
  }),
  component: Home,
});

function Home() {
  const featured = useQuery({
    queryKey: ["featured-opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id, title, opp_type, hours_per_week, categories, organisations(name, city, province, slug)")
        .eq("active", true)
        .limit(4);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="animate-fade-up pt-20 pb-16 md:pt-28">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal">
                <Sparkles className="size-3" /> For SA psychology students
              </span>
              <h1 className="mb-6 text-balance font-display text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">
                Helping South African psychology students gain{" "}
                <span className="text-teal">practical experience.</span>
              </h1>
              <p className="mb-10 max-w-xl text-lg text-muted-foreground md:text-xl">
                The bridge between academic theory and clinical reality. Find verified volunteer placements at NGOs, clinics, and community centres.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/opportunities"
                  className="rounded-2xl bg-teal px-7 py-4 font-semibold text-teal-foreground shadow-xl shadow-teal/20 transition-transform hover:-translate-y-0.5"
                >
                  Find Opportunities
                </Link>
                <Link
                  to="/psychbot"
                  className="rounded-2xl bg-lavender px-7 py-4 font-semibold text-lavender-foreground transition-colors hover:bg-lavender/70"
                >
                  Talk to PsychBot
                </Link>
                <Link
                  to="/experiences"
                  className="rounded-2xl border border-border px-7 py-4 font-semibold text-foreground hover:bg-muted"
                >
                  Share Experience
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src={heroImg}
                width={1088}
                height={1344}
                alt="South African psychology student studying at her desk"
                className="aspect-[4/5] w-full rounded-3xl object-cover outline outline-1 -outline-offset-1 outline-black/5"
              />
              <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-background/90 p-4 shadow-xl backdrop-blur md:block">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Verified placements</p>
                <p className="mt-1 font-display text-2xl font-bold">350+ orgs</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="flex flex-wrap justify-between gap-6 border-y border-border py-10">
          {[
            { v: "8,000+", l: "Students", c: "text-blue-brand" },
            { v: "350+", l: "Organisations", c: "text-teal" },
            { v: "21", l: "Universities", c: "" },
            { v: "15,000+", l: "Hours Logged", c: "text-muted-foreground" },
          ].map((s) => (
            <div key={s.l}>
              <p className={`font-display text-3xl font-extrabold ${s.c}`}>{s.v}</p>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </section>

        {/* Featured Placements + map */}
        <section className="py-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-extrabold md:text-4xl">Verified placements</h2>
              <p className="mt-2 text-muted-foreground">Hand-picked opportunities from partner NGOs and clinics across South Africa.</p>
            </div>
            <Link to="/opportunities" className="hidden items-center gap-1 text-sm font-semibold text-teal hover:underline md:inline-flex">
              View all <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(featured.data ?? []).map((opp) => (
              <Link
                key={opp.id}
                to="/opportunities/$id"
                params={{ id: opp.id }}
                className="group rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/5"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold">{opp.title}</h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {opp.organisations?.name} • {opp.organisations?.city}
                    </p>
                  </div>
                  <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal">
                    Verified
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {opp.hours_per_week && (
                    <span className="rounded border border-border px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {opp.hours_per_week} hrs/week
                    </span>
                  )}
                  <span className="rounded border border-border px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground capitalize">
                    {opp.opp_type.replace("_", " ")}
                  </span>
                  {(opp.categories ?? []).slice(0, 2).map((c) => (
                    <span key={c} className="rounded border border-border px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {c}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
            {featured.isLoading && Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 rounded-3xl bg-muted animate-pulse" />
            ))}
          </div>
        </section>

        {/* Featured story */}
        <section className="border-t border-border py-20">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="aspect-[4/5] rounded-3xl bg-lavender p-10 outline outline-1 -outline-offset-1 outline-black/5">
              <div className="flex h-full flex-col justify-between">
                <span className="inline-flex w-fit rounded-full bg-background/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lavender-foreground">
                  Student Story
                </span>
                <div>
                  <p className="font-display text-2xl font-bold text-lavender-foreground">"I found my passion for trauma counselling through a PsychFest placement in Soweto."</p>
                  <p className="mt-4 text-sm font-medium text-lavender-foreground/80">Lerato M. — Honours, Wits</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <h2 className="font-display text-4xl font-extrabold leading-tight">The path from theory to practice.</h2>
              <p className="text-lg text-muted-foreground">
                Students on PsychFest complete on average 120 volunteer hours before applying for Honours — building the practical CV that supervisors and postgraduate coordinators look for.
              </p>
              <Link to="/experiences" className="inline-flex items-center gap-2 border-b-2 border-blue-brand/30 pb-1 font-semibold text-blue-brand hover:border-blue-brand">
                Read more student stories <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="grid gap-12 border-t border-border py-20 md:grid-cols-3 md:gap-16">
          {[
            { n: "01", t: "Discover", c: "Browse roles vetted for clinical relevance and ethical standards across nine provinces.", bg: "bg-lavender", fg: "text-lavender-foreground" },
            { n: "02", t: "Connect", c: "Apply to supervised placements, message NGO coordinators, and secure your spot.", bg: "bg-teal/10", fg: "text-teal" },
            { n: "03", t: "Grow", c: "Log your hours, gather formal feedback, and build a portfolio ready for Honours applications.", bg: "bg-blue-brand/10", fg: "text-blue-brand" },
          ].map((s) => (
            <div key={s.n} className="space-y-4">
              <div className={`grid size-12 place-items-center rounded-2xl font-bold ${s.bg} ${s.fg}`}>{s.n}</div>
              <h3 className="font-display text-xl font-bold">{s.t}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.c}</p>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="mb-16 rounded-3xl bg-gradient-to-br from-teal to-blue-brand p-10 text-center text-white md:p-16">
          <Users className="mx-auto mb-4 size-8 opacity-90" />
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold md:text-4xl">
            Ready to build your clinical experience?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/85">
            Join 8,000+ SA psychology students already using PsychFest to find placements and grow their careers.
          </p>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-foreground hover:bg-white/90"
          >
            Create your free account <ArrowRight className="size-4" />
          </Link>
        </section>
      </div>
    </SiteShell>
  );
}
