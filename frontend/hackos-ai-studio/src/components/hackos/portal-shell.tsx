import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Search,
  Sparkles,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { MouseGlow, AmbientBackground } from "./background";
import { Logo } from "./logo";
import { useAuth } from "@/store/auth";
import { useTheme } from "@/store/theme";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "./command-palette";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  const { name, email, education, organization, bio, age, profession, profilePicture, updateProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; parts: string[] }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatOpen && chatScrollRef.current) {
      chatScrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatOpen, isChatLoading]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMsg = chatInput.trim();
    setChatInput("");
    setMessages(prev => [...prev, { role: "user", parts: [userMsg] }]);
    setIsChatLoading(true);
    
    try {
      // Assuming backend runs on :5000
      const res = await fetch("http://192.168.1.67:5000/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message: userMsg }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMessages(data.data.history);
      } else {
        setMessages(prev => [...prev, { role: "model", parts: ["Sorry, I encountered an error. Please try again."] }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: "model", parts: ["Network error. Is the backend running?"] }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile({ profilePicture: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };
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
                        className="flex w-full items-center justify-between px-2 py-1 text-left font-mono text-[0.68rem] uppercase tracking-[0.15em] text-muted-foreground/60 hover:text-foreground transition-colors"
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
                                    ? "bg-brand/10 text-brand border-brand"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground border-transparent",
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
                      ? "bg-brand/10 text-brand border-brand"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground border-transparent",
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
              <Sheet open={chatOpen} onOpenChange={setChatOpen}>
                <SheetTrigger asChild>
                  <Button size="sm" className="mt-3 w-full bg-gradient-brand text-foreground hover:opacity-90 animate-[btn-breathe_3s_ease-in-out_infinite]">
                    Open assistant
                  </Button>
                </SheetTrigger>
                <SheetContent className="flex flex-col sm:max-w-md w-full border-l border-border bg-background">
                  <SheetHeader className="shrink-0 border-b border-border pb-4">
                    <SheetTitle className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-brand" />
                      HackOS Copilot
                    </SheetTitle>
                    <SheetDescription>
                      Ask anything about schedules, analytics, or event rules.
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2 custom-scrollbar">
                    {messages.length === 0 && (
                      <div className="text-center text-sm text-muted-foreground mt-10">
                        Send a message to start chatting with HackOS AI.
                      </div>
                    )}
                    {messages.map((m, i) => (
                      <div key={i} className={cn("flex flex-col gap-1 text-sm max-w-[85%]", m.role === "user" ? "ml-auto items-end" : "mr-auto items-start")}>
                        <div className={cn("rounded-2xl px-3 py-2", m.role === "user" ? "bg-brand text-primary-foreground" : "bg-muted text-foreground")}>
                          {m.parts[0]}
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="mr-auto items-start max-w-[85%]">
                        <div className="rounded-2xl px-3 py-2 bg-muted text-muted-foreground text-sm flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}
                    <div ref={chatScrollRef} />
                  </div>
                  
                  <form 
                    className="mt-auto shrink-0 border-t border-border pt-4 flex gap-2"
                    onSubmit={handleChatSubmit}
                  >
                    <Input 
                      placeholder="Ask a question..." 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={isChatLoading}
                      className="flex-1 bg-muted/50 border-transparent focus-visible:ring-brand"
                    />
                    <Button type="submit" size="sm" disabled={!chatInput.trim() || isChatLoading} className="bg-brand text-primary-foreground hover:bg-brand/90">
                      Send
                    </Button>
                  </form>
                </SheetContent>
              </Sheet>
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
            <button
              onClick={toggleTheme}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Sheet>
              <SheetTrigger asChild>
                <button className="ml-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-gradient-brand text-xs font-semibold text-white transition-all hover:opacity-90 hover:ring-2 hover:ring-brand/50 hover:ring-offset-2 hover:ring-offset-background focus:outline-none overflow-hidden">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    (name || "GU").slice(0, 2).toUpperCase()
                  )}
                </button>
              </SheetTrigger>
              <SheetContent className="flex flex-col">
                <SheetHeader>
                  <SheetTitle>Profile Settings</SheetTitle>
                  <SheetDescription>
                    Manage your profile details and preferences.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 flex flex-1 flex-col gap-6">
                  <div className="flex flex-col items-center gap-3">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Profile" className="h-24 w-24 rounded-full object-cover shadow-sm" />
                    ) : (
                      <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-brand text-3xl font-semibold text-white shadow-sm">
                        {(name || "GU").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    <Button variant="outline" size="sm" className="h-8" onClick={() => fileInputRef.current?.click()}>Change Picture</Button>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profile-name">Name</Label>
                    <Input id="profile-name" value={name || ""} onChange={(e) => updateProfile({ name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="profile-age">Age</Label>
                      <Input id="profile-age" type="number" value={age || ""} onChange={(e) => updateProfile({ age: e.target.value })} placeholder="e.g. 21" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="profile-profession">Profession</Label>
                      <Select value={profession || ""} onValueChange={(value) => updateProfile({ profession: value })}>
                        <SelectTrigger id="profile-profession">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Student">Student</SelectItem>
                          <SelectItem value="Teacher">Teacher</SelectItem>
                          <SelectItem value="Developer">Developer</SelectItem>
                          <SelectItem value="Designer">Designer</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profile-education">Educational Qualification</Label>
                    <Input id="profile-education" value={education || ""} onChange={(e) => updateProfile({ education: e.target.value })} placeholder="e.g. B.Sc. Computer Science" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profile-organization">Organization</Label>
                    <Input id="profile-organization" value={organization || ""} onChange={(e) => updateProfile({ organization: e.target.value })} placeholder="e.g. Stanford University / Acme Corp" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profile-bio">Bio</Label>
                    <Textarea id="profile-bio" value={bio || ""} onChange={(e) => updateProfile({ bio: e.target.value })} placeholder="A short bio about yourself..." className="resize-none h-20" />
                  </div>
                  <div className="mt-auto pt-6">
                    <Button
                      variant="destructive"
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        logout();
                        navigate({ to: "/" });
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
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