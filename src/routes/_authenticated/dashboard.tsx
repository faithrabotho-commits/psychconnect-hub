import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRoles } from "@/hooks/use-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { Bookmark, ClipboardList, Clock, Award, Sparkles, LogOut, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PsychFest" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const roles = useRoles(user);
  const navigate = useNavigate();

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const apps = useQuery({
    queryKey: ["my-apps", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, status, created_at, opportunities(id, title, organisations(name, city))")
        .eq("student_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const saved = useQuery({
    queryKey: ["my-saved", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_opportunities")
        .select("opportunity_id, opportunities(id, title, organisations(name))")
        .eq("user_id", user!.id);
      return data ?? [];
    },
  });

  const hours = useQuery({
    queryKey: ["my-hours", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("volunteer_hours").select("*").eq("user_id", user!.id).order("logged_at", { ascending: false });
      return data ?? [];
    },
  });

  const totalHours = (hours.data ?? []).reduce((s, h) => s + Number(h.hours), 0);
  const badges = [
    { t: "First Volunteer", got: (hours.data?.length ?? 0) > 0 },
    { t: "100 Hours", got: totalHours >= 100 },
    { t: "500 Hours", got: totalHours >= 500 },
    { t: "Honours Ready", got: totalHours >= 120 && roles.includes("student") },
  ];

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  const isOrg = roles.includes("organisation");
  const isPsych = roles.includes("psychologist");

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="font-display text-4xl font-extrabold">{profile.data?.full_name || user?.email}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {roles.map((r) => (
                <span key={r} className="rounded-full bg-lavender px-3 py-1 text-xs font-semibold text-lavender-foreground capitalize">{r}</span>
              ))}
              {isPsych && <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">✔ HPCSA Verified</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/psychbot" className="inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2 text-sm font-semibold text-teal-foreground"><Sparkles className="size-4" /> PsychBot</Link>
            <button onClick={signOut} className="inline-flex items-center gap-2 rounded-full border border-input px-5 py-2 text-sm font-semibold"><LogOut className="size-4" /> Sign out</button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { icon: ClipboardList, l: "Applications", v: apps.data?.length ?? 0, c: "text-blue-brand" },
            { icon: Bookmark, l: "Saved", v: saved.data?.length ?? 0, c: "text-teal" },
            { icon: Clock, l: "Volunteer Hours", v: totalHours, c: "" },
            { icon: Award, l: "Badges earned", v: badges.filter(b=>b.got).length, c: "text-muted-foreground" },
          ].map((s) => (
            <div key={s.l} className="rounded-3xl border border-border bg-card p-6">
              <s.icon className="size-5 text-muted-foreground" />
              <p className={`mt-3 font-display text-3xl font-extrabold ${s.c}`}>{s.v}</p>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Applications */}
        <section className="mt-10">
          <h2 className="mb-4 font-display text-2xl font-extrabold">My applications</h2>
          <div className="space-y-3">
            {(apps.data ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                <div>
                  <p className="font-semibold">{a.opportunities?.title}</p>
                  <p className="text-sm text-muted-foreground">{a.opportunities?.organisations?.name} • {a.opportunities?.organisations?.city}</p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize">{a.status}</span>
              </div>
            ))}
            {apps.data?.length === 0 && <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No applications yet. <Link to="/opportunities" className="text-teal underline">Browse opportunities.</Link></p>}
          </div>
        </section>

        {/* Saved */}
        <section className="mt-10">
          <h2 className="mb-4 font-display text-2xl font-extrabold">Saved opportunities</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {(saved.data ?? []).map((s) => (
              <Link key={s.opportunity_id} to="/opportunities/$id" params={{ id: s.opportunities!.id }} className="rounded-2xl border border-border bg-card p-4 hover:shadow-lg">
                <p className="font-semibold">{s.opportunities?.title}</p>
                <p className="text-sm text-muted-foreground">{s.opportunities?.organisations?.name}</p>
              </Link>
            ))}
            {saved.data?.length === 0 && <p className="text-sm text-muted-foreground">Nothing saved yet.</p>}
          </div>
        </section>

        {/* Hours + badges */}
        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-extrabold">My Journey</h2>
            <p className="mt-1 text-sm text-muted-foreground">{totalHours} hours logged across {hours.data?.length ?? 0} entries.</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-teal transition-all" style={{ width: `${Math.min(100, (totalHours/500)*100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Progress towards 500-hour milestone.</p>
            <div className="mt-4 space-y-2">
              {(hours.data ?? []).slice(0,5).map((h) => (
                <div key={h.id} className="flex items-center justify-between text-sm">
                  <span>{h.description || "Volunteer session"}</span>
                  <span className="text-muted-foreground">{Number(h.hours)} hrs · {new Date(h.logged_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-extrabold">Achievements</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {badges.map((b) => (
                <div key={b.t} className={`rounded-2xl p-4 text-sm font-semibold ${b.got ? "bg-teal/10 text-teal" : "bg-muted text-muted-foreground"}`}>
                  {b.got ? "🏆" : "🔒"} {b.t}
                </div>
              ))}
            </div>
          </div>
        </section>

        {(isOrg || isPsych) && (
          <section className="mt-10 rounded-3xl border border-border bg-lavender p-6 text-lavender-foreground">
            <h2 className="font-display text-xl font-extrabold">
              {isOrg ? "Organisation tools" : "Psychologist tools"}
            </h2>
            <p className="mt-2 text-sm">
              {isOrg
                ? "Post opportunities, review applicants, verify volunteer hours and issue certificates from your dashboard."
                : "Review organisations, mentor students in the community forum, and help maintain placement quality."}
            </p>
            <div className="mt-4 flex gap-2">
              <Link to="/community" className="inline-flex items-center gap-1 rounded-full bg-background px-4 py-2 text-sm font-semibold"><MessageCircle className="size-4" /> Community forum</Link>
              <Link to="/opportunities" className="inline-flex items-center gap-1 rounded-full bg-background px-4 py-2 text-sm font-semibold">Opportunities</Link>
            </div>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
