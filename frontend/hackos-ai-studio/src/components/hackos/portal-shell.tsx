import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AmbientBackground, MouseGlow } from "./background";
import { Logo } from "./logo";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "./command-palette";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

export function PortalShell({
  title,
  nav,
  base,
}: {
  title: string;
  nav: NavItem[];
  base: "participant" | "organizer";
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { name, logout } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative flex min-h-screen">
      <AmbientBackground />
      <MouseGlow />

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 248 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/5 bg-sidebar/60 backdrop-blur-xl md:flex"
      >
        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed ? <Logo /> : (
            <div className="mx-auto h-8 w-8 rounded-lg bg-gradient-brand" />
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="px-3">
          <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {!collapsed && (base === "participant" ? "Participant" : "Organizer")}
          </div>
          <nav className="space-y-1">
            {nav.map((item) => {
              const active =
                pathname === item.to || (item.to !== `/${base}` && pathname.startsWith(item.to));
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                    active
                      ? "bg-white/5 text-foreground"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId={`nav-${base}`}
                      className="absolute inset-0 -z-10 rounded-xl bg-gradient-brand-soft ring-1 ring-white/10"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon className="h-4 w-4 shrink-0" />
                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {item.badge && !collapsed && (
                    <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-3">
          {!collapsed && (
            <div className="glass mb-3 rounded-2xl p-3">
              <div className="mb-2 flex items-center gap-2 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                <span>AI Assistant</span>
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">
                Ask HackOS anything — from PPT insights to seat maps.
              </p>
              <Button size="sm" className="mt-3 w-full bg-gradient-brand text-white hover:opacity-90">
                Open assistant
              </Button>
            </div>
          )}
          <button
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/5 bg-background/60 px-4 backdrop-blur-xl md:px-8">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {base === "participant" ? "Participant" : "Organizer"} · HackOS AI
            </div>
            <div className="truncate text-sm font-medium">{title}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setCmdOpen(true)}
              className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground hover:bg-white/10 md:flex"
            >
              <Search className="h-3.5 w-3.5" />
              Search everywhere
              <kbd className="ml-3 rounded bg-white/10 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
            </button>
            <button className="rounded-xl border border-white/10 bg-white/5 p-2 text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
            </button>
            <div className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-gradient-brand text-xs font-semibold text-white">
              {(name || "GU").slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-10"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} base={base} />
    </div>
  );
}

export function MobileNav({ nav, base }: { nav: NavItem[]; base: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="fixed inset-x-0 bottom-3 z-40 mx-3 md:hidden">
      <div className="glass-strong flex items-center justify-around rounded-2xl px-2 py-1.5">
        {nav.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to || (item.to !== `/${base}` && pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px]",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
