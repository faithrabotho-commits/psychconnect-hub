import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SiteShell } from "@/components/layout/site-shell";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const SEARCH = z.object({ mode: z.enum(["signin", "signup"]).optional() });
type Search = z.infer<typeof SEARCH>;

export const Route = createFileRoute("/auth")({
  validateSearch: (s): Search => SEARCH.parse(s),
  head: () => ({ meta: [{ title: "Sign in — PsychFest" }] }),
  component: Auth,
});

const UNIVERSITIES = [
  "University of Cape Town","University of Pretoria","University of the Witwatersrand","University of Johannesburg",
  "Stellenbosch University","University of KwaZulu-Natal","Rhodes University","Nelson Mandela University",
  "University of the Western Cape","North-West University","University of the Free State","University of South Africa (UNISA)",
  "Sol Plaatje University","University of Venda","University of Zululand","University of Limpopo",
  "University of Fort Hare","Walter Sisulu University","Central University of Technology","Cape Peninsula University of Technology",
  "Tshwane University of Technology",
];
const PROVINCES = ["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","Northern Cape","North West","Western Cape"];

function Auth() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"student" | "psychologist" | "organisation">("student");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState("");
  const [province, setProvince] = useState("");
  const [hpcsa, setHpcsa] = useState("");
  const [psychCategory, setPsychCategory] = useState("");
  const [psychOrg, setPsychOrg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
              role,
              university,
              degree,
              province,
              hpcsa_number: hpcsa,
              psych_category: psychCategory,
              psych_org: psychOrg,
            },
          },
        });
        if (error) throw error;
        toast.success("Account created! Redirecting to your dashboard…");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) throw new Error(String(result.error));
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-black/5">
          <h1 className="font-display text-3xl font-extrabold">{isSignup ? "Join PsychFest" : "Welcome back"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup ? "Use your personal email — your account stays with you after graduation." : "Sign in to your PsychFest account."}
          </p>

          <button
            onClick={onGoogle}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-background py-3 text-sm font-semibold hover:bg-muted"
          >
            Continue with Google
          </button>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or email <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-muted p-1 text-xs font-semibold">
                  {(["student","psychologist","organisation"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`rounded-xl py-2 capitalize transition-colors ${role===r?"bg-background shadow":"text-muted-foreground"}`}
                    >{r}</button>
                  ))}
                </div>
                <input required value={fullName} onChange={(e)=>setFullName(e.target.value)} placeholder="Full name" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
                {role === "student" && (
                  <>
                    <select required value={university} onChange={(e)=>setUniversity(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm">
                      <option value="">Select your university…</option>
                      {UNIVERSITIES.map((u)=><option key={u}>{u}</option>)}
                    </select>
                    <input required value={degree} onChange={(e)=>setDegree(e.target.value)} placeholder="Degree (e.g. BA Psychology, 2nd year)" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
                    <select required value={province} onChange={(e)=>setProvince(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm">
                      <option value="">Province…</option>
                      {PROVINCES.map((p)=><option key={p}>{p}</option>)}
                    </select>
                  </>
                )}
                {role === "psychologist" && (
                  <>
                    <input required value={hpcsa} onChange={(e)=>setHpcsa(e.target.value)} placeholder="HPCSA practice number" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
                    <input required value={psychCategory} onChange={(e)=>setPsychCategory(e.target.value)} placeholder="Category (e.g. Clinical, Counselling, Educational)" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
                    <input value={psychOrg} onChange={(e)=>setPsychOrg(e.target.value)} placeholder="Practice / organisation" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
                    <p className="text-xs text-muted-foreground">You'll receive a verified badge and can review organisations. v1 uses trust-based verification.</p>
                  </>
                )}
                {role === "organisation" && (
                  <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                    After sign-up, create your organisation profile from the dashboard to post opportunities.
                  </p>
                )}
              </>
            )}
            <input required type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Personal email" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input required type="password" minLength={8} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password (min 8 characters)" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />

            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal py-3 font-semibold text-teal-foreground shadow-lg shadow-teal/25 disabled:opacity-60">
              {loading && <Loader2 className="size-4 animate-spin" />}
              {isSignup ? "Create account" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <button type="button" onClick={()=>setIsSignup(v=>!v)} className="font-medium text-teal hover:underline">
              {isSignup ? "Have an account? Sign in" : "New here? Create account"}
            </button>
            {!isSignup && (
              <Link to="/reset-password" className="text-muted-foreground hover:text-foreground">Forgot password</Link>
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
