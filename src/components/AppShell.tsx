import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Battery,
  BookOpen,
  Bot,
  Car,
  Download,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getLowBattery, setLowBattery } from "@/lib/low-battery";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Car;
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/sos", label: "Request SOS", icon: AlertTriangle },
  { to: "/vehicles", label: "My Vehicles", icon: Car },
  { to: "/providers", label: "Providers", icon: Map },
  { to: "/region-packs", label: "Region Packs", icon: Download },
  { to: "/guides", label: "Guides", icon: BookOpen },
  { to: "/assistant", label: "AI Assistant", icon: Bot },
];

export function AppShell({
  children,
  isAdmin,
  showAuthCta,
}: {
  children: ReactNode;
  isAdmin?: boolean;
  showAuthCta?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [lowBat, setLowBat] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setLowBat(getLowBattery());
  }, []);

  useEffect(() => setOpen(false), [loc.pathname]);

  const toggleLow = () => {
    const next = !lowBat;
    setLowBat(next);
    setLowBattery(next);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  const items = isAdmin ? [...NAV, { to: "/admin", label: "Admin", icon: ShieldCheck }] : NAV;

  return (
    <div className="relative min-h-screen gradient-hero">
      <header className="sticky top-0 z-40 glass-strong">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="font-display text-lg font-bold tracking-tight">RoadRescue</div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {items.map((it) => {
              const active = loc.pathname.startsWith(it.to);
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-card hover:text-foreground",
                  )}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLow}
              className={cn(
                "hidden items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium transition md:inline-flex",
                lowBat ? "bg-warning text-warning-foreground" : "bg-card hover:bg-muted",
              )}
              title="Toggle low-battery text-only mode"
            >
              <Battery className="h-3.5 w-3.5" />
              {lowBat ? "Low-batt ON" : "Low-batt"}
            </button>
            {showAuthCta ? (
              <Link
                to="/auth"
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
              >
                Sign in
              </Link>
            ) : (
              <button
                onClick={handleSignOut}
                className="hidden items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-muted md:inline-flex"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            )}
            <button
              className="rounded-md border border-border bg-card p-2 lg:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-border bg-card/80 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col p-2">
              {items.map((it) => {
                const Icon = it.icon;
                const active = loc.pathname.startsWith(it.to);
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                      active ? "bg-primary/15 text-primary" : "hover:bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {it.label}
                  </Link>
                );
              })}
              <button
                onClick={toggleLow}
                className="mt-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted"
              >
                <Battery className="h-4 w-4" />
                {lowBat ? "Disable low-battery mode" : "Enable low-battery mode"}
              </button>
              {!showAuthCta && (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>

      <footer className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-muted-foreground">
        RoadRescue • Stay safe out there. In a life-threatening emergency, call <strong>112</strong>.
      </footer>
    </div>
  );
}
