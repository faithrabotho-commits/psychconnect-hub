import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/layout/site-shell";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { toast } from "sonner";
import { MessageSquare, PlusCircle } from "lucide-react";

export const Route = createFileRoute("/community/")({
  head: () => ({ meta: [{ title: "Community Forum — PsychFest" }, { name: "description", content: "Discussions on honours applications, research, and volunteer advice for SA psychology students." }] }),
  component: CommunityPage,
});

const CATS = ["Honours Applications","Research","Volunteer Advice","Clinical","Counselling","Study Tips","Mental Health","General"] as const;

function CommunityPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cat, setCat] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [threadCat, setThreadCat] = useState<typeof CATS[number]>("General");

  const q = useQuery({
    queryKey: ["threads", cat],
    queryFn: async () => {
      let query = supabase.from("forum_threads").select("*, profiles!forum_threads_author_id_fkey(full_name)").order("created_at", { ascending: false });
      if (cat) query = query.eq("category", cat);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in");
      const { error } = await supabase.from("forum_threads").insert({ author_id: user.id, category: threadCat, title, body });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Thread posted"); setTitle(""); setBody(""); setShowForm(false); qc.invalidateQueries({ queryKey: ["threads"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-display text-4xl font-extrabold md:text-5xl">Community</h1>
            <p className="mt-2 text-muted-foreground">Ask, answer, and share. Moderated by the PsychFest team.</p>
          </div>
          {user && (
            <button onClick={()=>setShowForm(v=>!v)} className="inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 font-semibold text-teal-foreground">
              <PlusCircle className="size-4" /> New thread
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
          <form onSubmit={(e)=>{e.preventDefault();create.mutate();}} className="mb-6 space-y-3 rounded-3xl border border-border bg-card p-6">
            <select value={threadCat} onChange={(e)=>setThreadCat(e.target.value as typeof CATS[number])} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm">
              {CATS.map((c)=><option key={c}>{c}</option>)}
            </select>
            <input required value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Thread title" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <textarea required value={body} onChange={(e)=>setBody(e.target.value)} placeholder="What's on your mind?" rows={5} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <button disabled={create.isPending} className="rounded-2xl bg-teal px-5 py-2.5 font-semibold text-teal-foreground">Post</button>
          </form>
        )}

        <div className="space-y-3">
          {q.data?.length === 0 && <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">No threads yet.</p>}
          {(q.data ?? []).map((t) => (
            <Link key={t.id} to="/community/$threadId" params={{ threadId: t.id }} className="block rounded-3xl border border-border bg-card p-6 hover:shadow-xl hover:shadow-black/5">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-lavender px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lavender-foreground">{t.category}</span>
                <span className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold">{t.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.body}</p>
              <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><MessageSquare className="size-3" /> {t.profiles?.full_name || "PsychFest member"}</p>
            </Link>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
