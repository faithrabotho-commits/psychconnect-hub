import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/layout/site-shell";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Heart, MessageCircle, Award, PlusCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/experiences/")({
  head: () => ({ meta: [
    { title: "Student Experiences — PsychFest" },
    { name: "description", content: "Read authentic volunteering stories from South African psychology students." },
  ]}),
  component: ExperiencesPage,
});

const CATS = ["Trauma","Children","Schools","Hospitals","Mental Health","Substance Abuse","Disability","Research"];

function ExperiencesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cat, setCat] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [chosenCats, setChosenCats] = useState<string[]>([]);

  const q = useQuery({
    queryKey: ["experiences", cat],
    queryFn: async () => {
      let query = supabase.from("experiences").select("*, profiles!experiences_author_profile_fk(full_name, university)").order("created_at", { ascending: false });
      if (cat) query = query.contains("categories", [cat]);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const reactions = useQuery({
    queryKey: ["exp-reactions"],
    queryFn: async () => {
      const { data } = await supabase.from("experience_reactions").select("experience_id, kind");
      const counts: Record<string, { like: number; helpful: number }> = {};
      (data ?? []).forEach((r) => {
        counts[r.experience_id] ??= { like: 0, helpful: 0 };
        if (r.kind === "like") counts[r.experience_id].like++;
        if (r.kind === "helpful") counts[r.experience_id].helpful++;
      });
      return counts;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in");
      const { error } = await supabase.from("experiences").insert({ author_id: user.id, title, body, categories: chosenCats });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Experience shared!");
      setTitle(""); setBody(""); setChosenCats([]); setShowForm(false);
      qc.invalidateQueries({ queryKey: ["experiences"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const react = useMutation({
    mutationFn: async ({ id, kind }: { id: string; kind: "like" | "helpful" }) => {
      if (!user) throw new Error("Sign in to react");
      const { error } = await supabase.from("experience_reactions").insert({ experience_id: id, user_id: user.id, kind });
      if (error && error.code !== "23505") throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exp-reactions"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-extrabold md:text-5xl">Student experiences</h1>
            <p className="mt-2 text-muted-foreground">Real stories from psychology students volunteering across South Africa.</p>
          </div>
          {user && (
            <button onClick={()=>setShowForm(v=>!v)} className="inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 font-semibold text-teal-foreground">
              <PlusCircle className="size-4" /> Share
            </button>
          )}
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          <button onClick={()=>setCat("")} className={`rounded-full border px-3 py-1 text-xs font-medium ${!cat?"border-teal bg-teal/10 text-teal":"border-border text-muted-foreground"}`}>All</button>
          {CATS.map((c)=>(
            <button key={c} onClick={()=>setCat(cat===c?"":c)} className={`rounded-full border px-3 py-1 text-xs font-medium ${cat===c?"border-teal bg-teal/10 text-teal":"border-border text-muted-foreground"}`}>{c}</button>
          ))}
        </div>

        {showForm && user && (
          <form onSubmit={(e)=>{e.preventDefault();create.mutate();}} className="mb-8 space-y-3 rounded-3xl border border-border bg-card p-6">
            <input required value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <textarea required value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Share what you learned, what surprised you, what advice you have…" rows={6} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <div className="flex flex-wrap gap-2">
              {CATS.map((c) => (
                <button key={c} type="button" onClick={()=>setChosenCats((p)=>p.includes(c)?p.filter(x=>x!==c):[...p,c])} className={`rounded-full border px-3 py-1 text-xs font-medium ${chosenCats.includes(c)?"border-teal bg-teal/10 text-teal":"border-border text-muted-foreground"}`}>{c}</button>
              ))}
            </div>
            <button disabled={create.isPending} className="rounded-2xl bg-teal px-5 py-2.5 font-semibold text-teal-foreground disabled:opacity-60">Post experience</button>
          </form>
        )}

        <div className="space-y-4">
          {q.isLoading && Array.from({length:3}).map((_,i)=><div key={i} className="h-40 rounded-3xl bg-muted animate-pulse" />)}
          {q.data?.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No experiences yet {user ? "— be the first to share one." : "— sign in to be the first."}
            </div>
          )}
          {(q.data ?? []).map((exp) => {
            const r = reactions.data?.[exp.id] ?? { like: 0, helpful: 0 };
            return (
              <article key={exp.id} className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-lavender text-sm font-bold text-lavender-foreground">
                    {(exp.profiles?.full_name ?? "?").slice(0,1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{exp.profiles?.full_name || "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">{exp.profiles?.university || "PsychFest student"}</p>
                  </div>
                </div>
                <h2 className="mt-4 font-display text-xl font-bold">{exp.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{exp.body}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(exp.categories ?? []).map((c: string) => <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{c}</span>)}
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <button onClick={()=>react.mutate({id:exp.id,kind:"like"})} className="inline-flex items-center gap-1 hover:text-teal"><Heart className="size-4" /> {r.like}</button>
                  <button onClick={()=>react.mutate({id:exp.id,kind:"helpful"})} className="inline-flex items-center gap-1 hover:text-teal"><Award className="size-4" /> {r.helpful}</button>
                  <span className="inline-flex items-center gap-1"><MessageCircle className="size-4" /> Discuss</span>
                </div>
              </article>
            );
          })}
        </div>

        {!user && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link to="/auth" search={{ mode: "signup" }} className="font-semibold text-teal underline">Create a free account</Link> to share your own experience.
          </p>
        )}
      </div>
    </SiteShell>
  );
}
