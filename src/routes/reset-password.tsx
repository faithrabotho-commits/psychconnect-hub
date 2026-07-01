import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/layout/site-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — PsychFest" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRecovery, setIsRecovery] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) setIsRecovery(true);
  }, []);

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Check your email for the reset link");
  };

  const setNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Password updated. You can now sign in.");
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-black/5">
          <h1 className="font-display text-2xl font-extrabold">
            {isRecovery ? "Set a new password" : "Reset your password"}
          </h1>
          <form onSubmit={isRecovery ? setNew : sendEmail} className="mt-6 space-y-4">
            {isRecovery ? (
              <input required type="password" minLength={8} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="New password" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            ) : (
              <input required type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Your email" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            )}
            <button disabled={loading} className="w-full rounded-2xl bg-teal py-3 font-semibold text-teal-foreground">
              {isRecovery ? "Update password" : "Send reset link"}
            </button>
          </form>
        </div>
      </div>
    </SiteShell>
  );
}
