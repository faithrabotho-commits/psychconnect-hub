import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} PsychFest South Africa. Supporting future clinicians.
        </p>
        <div className="flex gap-6 text-sm font-medium text-muted-foreground">
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/psychologists" className="hover:text-foreground">For Psychologists</Link>
          <Link to="/events" className="hover:text-foreground">Events</Link>
        </div>
      </div>
    </footer>
  );
}
