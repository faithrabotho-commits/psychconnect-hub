import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/layout/site-shell";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/community/$threadId")({
  loader: async ({ params }) => {
    const { data, error } = await supabase.from("forum_threads").select("*, profiles!forum_threads_author_id_fkey(full_name)").eq("id", params.threadId).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return data;
  },
  component: Thread,
});

function Thread() {
  const t = Route.useLoaderData();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const posts = useQuery({
    queryKey: ["thread-posts", t.id],
    queryFn: async () => {
      const { data } = await supabase.from("forum_posts").select("*, profiles!forum_posts_author_id_fkey(full_name)").eq("thread_id", t.id).order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const reply = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in");
      const { error } = await supabase.from("forum_posts").insert({ thread_id: t.id, author_id: user.id, body });
      if (error) throw error;
    },
    onSuccess: () => { setBody(""); qc.invalidateQueries({ queryKey: ["thread-posts", t.id] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link to="/community" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to community</Link>
        <article className="mt-6 rounded-3xl border border-border bg-card p-6">
          <span className="rounded-full bg-lavender px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lavender-foreground">{t.category}</span>
          <h1 className="mt-3 font-display text-3xl font-extrabold">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">By {t.profiles?.full_name || "member"} · {new Date(t.created_at).toLocaleDateString()}</p>
          <p className="mt-6 whitespace-pre-wrap text-muted-foreground">{t.body}</p>
        </article>

        <div className="mt-6 space-y-3">
          {(posts.data ?? []).map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-semibold">{p.profiles?.full_name || "member"}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>

        {user ? (
          <form onSubmit={(e)=>{e.preventDefault();reply.mutate();}} className="mt-6 space-y-3 rounded-3xl border border-border bg-card p-6">
            <textarea required value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Reply…" rows={4} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <button disabled={reply.isPending} className="rounded-2xl bg-teal px-5 py-2.5 font-semibold text-teal-foreground">Post reply</button>
          </form>
        ) : (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/auth" className="font-semibold text-teal underline">Sign in</Link> to reply.
          </p>
        )}
      </div>
    </SiteShell>
  );
}
