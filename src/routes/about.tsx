import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/site-shell";
import { CheckCircle, Users, Heart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About PsychFest" }, { name: "description", content: "PsychFest is South Africa's dedicated professional volunteering platform for psychology students, honours applicants, and registered psychologists." }] }),
  component: About,
});

function About() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-5xl font-extrabold leading-tight">A trusted professional ecosystem for South African psychology.</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          PsychFest is more than a volunteer job board. It's the bridge between undergraduate psychology, honours, registration, and professional practice — designed specifically for the South African context.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {[
            { icon: CheckCircle, t: "Verified organisations", c: "Every placement is vetted so students avoid poor-quality experiences." },
            { icon: Heart, t: "Student-first", c: "Personal-email registration means your account and hours travel with you after graduation." },
            { icon: Users, t: "Professional oversight", c: "Registered psychologists review organisations and mentor students." },
            { icon: Sparkles, t: "AI-guided", c: "PsychBot answers your questions on Honours applications, CVs, and interviews." },
          ].map((f) => (
            <div key={f.t} className="rounded-3xl border border-border bg-card p-6">
              <f.icon className="size-6 text-teal" />
              <h3 className="mt-4 font-display text-lg font-bold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.c}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-gradient-to-br from-teal to-blue-brand p-10 text-center text-white">
          <h2 className="font-display text-3xl font-extrabold">Ready to start?</h2>
          <Link to="/auth" search={{ mode: "signup" }} className="mt-6 inline-block rounded-full bg-white px-7 py-3 font-semibold text-foreground">Create your free account</Link>
        </div>
      </div>
    </SiteShell>
  );
}
