import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/site-shell";
import { Shield, Star, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/psychologists")({
  head: () => ({ meta: [{ title: "For Registered Psychologists — PsychFest" }] }),
  component: PsychInfo,
});

function PsychInfo() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-5xl font-extrabold">Support the next generation of SA psychologists.</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          HPCSA-registered psychologists can join PsychFest to review organisations, mentor students, and help maintain the quality of volunteer placements across the country.
        </p>
        <div className="mt-10 space-y-4">
          {[
            { icon: Shield, t: "Verified psychologist badge", c: "Your HPCSA practice number gives you a verified badge on the platform (v1: trust-based)." },
            { icon: Star, t: "Rate and review organisations", c: "Help students find quality placements and flag unethical ones." },
            { icon: MessageCircle, t: "Mentor emerging clinicians", c: "Answer questions in the community forum and support students preparing for Honours." },
          ].map((f) => (
            <div key={f.t} className="flex gap-4 rounded-3xl border border-border bg-card p-6">
              <f.icon className="size-6 shrink-0 text-teal" />
              <div>
                <h3 className="font-display text-lg font-bold">{f.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.c}</p>
              </div>
            </div>
          ))}
        </div>
        <Link to="/auth" search={{ mode: "signup" }} className="mt-10 inline-block rounded-full bg-primary px-7 py-3 font-semibold text-primary-foreground">Register as psychologist</Link>
      </div>
    </SiteShell>
  );
}
