import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Home,
  MapPin,
  MessagesSquare,
  CalendarDays,
  ListChecks,
  BookOpen,
  Mail,
  Sparkles,
  User,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const primary = [
  { title: "Home", to: "/dashboard", icon: Home },
  { title: "Opportunities", to: "/opportunities", icon: MapPin },
  { title: "Community", to: "/community", icon: MessagesSquare },
  { title: "Events", to: "/events", icon: CalendarDays },
] as const;

const aiTools = [
  { title: "Task Planner", to: "/planner", icon: ListChecks },
  { title: "Research AI", to: "/research", icon: BookOpen },
  { title: "Email Generator", to: "/email", icon: Mail },
  { title: "PsychBot", to: "/psychbot", icon: Sparkles },
] as const;

export function DashboardShell({ children, title }: { children: ReactNode; title?: string }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2">
              <div className="grid size-8 place-items-center rounded-xl bg-gradient-to-tr from-teal to-blue-brand text-white">
                <Sparkles className="size-4" />
              </div>
              <span className="font-display text-lg font-extrabold group-data-[collapsible=icon]:hidden">
                PsychFest
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigate</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {primary.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={pathname === item.to} tooltip={item.title}>
                        <Link to={item.to}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>AI Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {aiTools.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={pathname === item.to} tooltip={item.title}>
                        <Link to={item.to}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Profile">
                  <Link to="/dashboard">
                    <User />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} tooltip="Sign out">
                  <LogOut />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex-1">
              {title && <h1 className="font-display text-sm font-semibold text-muted-foreground">{title}</h1>}
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
