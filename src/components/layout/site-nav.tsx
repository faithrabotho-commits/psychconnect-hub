import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const links = [
  { to: "/opportunities", label: "Opportunities" },
  { to: "/experiences", label: "Experiences" },
  { to: "/community", label: "Community" },
  { to: "/events", label: "Events" },
  { to: "/about", label: "About" },
];

export function SiteNav() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-gradient-to-tr from-teal to-blue-brand text-xs font-bold text-white">PF</span>
          <span className="font-display text-xl font-bold tracking-tight">PsychFest</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname.startsWith(l.to) ? "text-teal" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to="/psychbot" className="text-sm font-medium text-muted-foreground hover:text-foreground">PsychBot</Link>
              <Link to="/dashboard" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Dashboard</Link>
            </>
          ) : (
            <>
              <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign in</Link>
              <Link to="/auth" search={{ mode: "signup" }} className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Join network</Link>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-sm font-medium">
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/psychbot" onClick={() => setOpen(false)} className="text-sm font-medium">PsychBot</Link>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="mt-2 rounded-full bg-primary px-5 py-2 text-center text-sm font-medium text-primary-foreground">Dashboard</Link>
              </>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="mt-2 rounded-full bg-primary px-5 py-2 text-center text-sm font-medium text-primary-foreground">Sign in / Join</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
