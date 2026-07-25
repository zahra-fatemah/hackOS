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
  to?: string;
  label: string;
  icon?: LucideIcon;
  badge?: string;
  disabled?: boolean;
  children?: NavItem[];
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
  const loginTime = useAuth((s) => s.loginTime);

  // Initialize expanded groups based on active route
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    nav.forEach(item => {
      if (item.children) {
        const isActive = item.children.some(child =>
          child.to && (pathname === child.to || (child.to !== `/${base}` && pathname.startsWith(child.to)))
        );
        initialState[item.label] = isActive;
      }
    });
    return initialState;
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Enforce 1-hour session limit
  useEffect(() => {
    const checkSession = () => {
      if (loginTime && Date.now() - loginTime > 3600000) {
        logout();
        navigate({ to: "/" });
      }
    };
    checkSession();
    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [loginTime, logout, navigate]);

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
        className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar/60 backdrop-blur-xl md:flex"
      >
        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed ? (
            <div className="flex items-center">
              <div className="mr-2 h-1.5 w-1.5 rounded-full bg-brand animate-[pulse-dot_1.5s_ease-in-out_infinite]" />
              <Logo />
            </div>
          ) : (
            <div className="mx-auto h-8 w-8 rounded-lg bg-gradient-brand" />
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="px-3 pb-4">
          <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {!collapsed && (base === "participant" ? "Participant" : "Organizer")}
          </div>
          <motion.nav
            className="space-y-4"
            key={pathname + "-nav"}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {nav.map((item) => {
              if (item.children) {
                const isOpen = expandedGroups[item.label];
                return (
                  <div key={item.label} className="space-y-1">
                    {!collapsed && (
                      <button
                        onClick={() => toggleGroup(item.label)}
                        className="flex w-full items-center justify-between px-2 py-1 text-left font-mono text-[0.68rem] uppercase tracking-[0.15em] text-[#E1F5EC]/35 hover:text-white/60 transition-colors"
                      >
                        {item.label}
                        <ChevronsRight className={cn("h-3 w-3 transition-transform duration-150 ease-out", isOpen && "rotate-90")} />
                      </button>
                    )}
                    <AnimatePresence initial={false}>
                      {(isOpen || collapsed) && (
                        <motion.div
                          initial={collapsed ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="overflow-hidden space-y-1"
                        >
                          {item.children.map((child) => {
                            const active = child.to && (pathname === child.to || (child.to !== `/${base}` && pathname.startsWith(child.to)));
                            const Icon = child.icon!;
                            return (
                              <Link
                                key={child.label}
                                to={child.disabled ? "#" : child.to!}
                                className={cn(
                                  "group relative flex items-center gap-3 rounded-r-xl py-2 text-sm transition-colors duration-150 border-l-2",
                                  collapsed ? "px-3" : "pl-7 pr-3",
                                  active
                                    ? "bg-[rgba(0,255,102,0.08)] text-[#00FF66] border-[#00FF66]"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-[#E1F5EC] border-transparent",
                                  child.disabled && "opacity-50 pointer-events-none"
                                )}
                              >
                                <Icon className="h-4 w-4 shrink-0" />
                                {!collapsed && <span className="truncate">{child.label}</span>}
                                {child.badge && !collapsed && (
                                  <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">
                                    {child.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              const active = item.to && (pathname === item.to || (item.to !== `/${base}` && pathname.startsWith(item.to)));
              const Icon = item.icon!;
              return (
                <Link
                  key={item.label}
                  to={item.disabled ? "#" : item.to!}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-r-xl px-3 py-2 text-sm transition-colors duration-150 border-l-2",
                    active
                      ? "bg-[rgba(0,255,102,0.08)] text-[#00FF66] border-[#00FF66]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-[#E1F5EC] border-transparent",
                    item.disabled && "opacity-50 pointer-events-none"
                  )}
                >
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
          </motion.nav>
        </div>

        <div className="mt-auto p-3">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mb-3 rounded-2xl p-3 bg-card border border-border"
            >
              <div className="mb-2 flex items-center gap-2 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                <span>AI Assistant</span>
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">
                Ask HackOS anything — from PPT insights to seat maps.
              </p>
              <Button size="sm" className="mt-3 w-full bg-gradient-brand text-foreground hover:opacity-90 animate-[btn-breathe_3s_ease-in-out_infinite]">
                Open assistant
              </Button>
            </motion.div>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
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

  // Flatten tree to get actual leaf nodes for mobile nav
  const flatNav = nav.reduce((acc, item) => {
    if (item.children) {
      acc.push(...item.children);
    } else {
      acc.push(item);
    }
    return acc;
  }, [] as NavItem[]);

  return (
    <div className="fixed inset-x-0 bottom-3 z-40 mx-3 md:hidden">
      <div className="glass-strong flex items-center justify-around rounded-2xl px-2 py-1.5">
        {flatNav.slice(0, 5).map((item) => {
          const Icon = item.icon!;
          const active = item.to && (pathname === item.to || (item.to !== `/${base}` && pathname.startsWith(item.to)));
          return (
            <Link
              key={item.label}
              to={item.disabled ? "#" : item.to!}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px]",
                active ? "text-foreground" : "text-muted-foreground",
                item.disabled && "opacity-50 pointer-events-none"
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