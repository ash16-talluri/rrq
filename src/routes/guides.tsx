import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GUIDES } from "@/lib/guides";
import { BookOpen, Clock, Download, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/guides")({
  head: () => ({
    meta: [
      { title: "Offline Emergency Guides — TravAID" },
      { name: "description", content: "Step-by-step offline guides: change a tyre, handle a blowout, jump-start a battery, check coolant." },
    ],
  }),
  component: GuidesPage,
});

function GuidesPage() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const u = () => setOnline(navigator.onLine);
    u();
    window.addEventListener("online", u);
    window.addEventListener("offline", u);
    return () => {
      window.removeEventListener("online", u);
      window.removeEventListener("offline", u);
    };
  }, []);

  return (
    <AppShell showAuthCta>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">🛠️ Offline Emergency Guides</h1>
          <p className="text-muted-foreground">Calm, step-by-step instructions. No internet needed.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs">
          {online ? <Wifi className="h-3 w-3 text-success" /> : <WifiOff className="h-3 w-3 text-warning" />}
          {online ? "Online" : "Offline"}
        </span>
      </div>

      <div className="mb-6 glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          📥 <strong>Download printable manuals</strong> — keep them in your glovebox for offline use.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {GUIDES.map((g) => (
          <div key={g.slug} className="glass rounded-2xl p-6 transition hover:translate-y-[-2px] hover:border-primary/40">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{g.icon}</div>
              <div className="flex-1">
                <Link to="/guides/$slug" params={{ slug: g.slug }} className="block">
                  <div className="font-display text-xl font-bold hover:text-primary">{g.title}</div>
                </Link>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {g.duration}
                  </span>
                  <span className={`rounded px-2 py-0.5 ${g.difficulty === "Hard" ? "bg-destructive/15 text-destructive" : g.difficulty === "Medium" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>
                    {g.difficulty}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{g.steps.length} steps</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to="/guides/$slug"
                    params={{ slug: g.slug }}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                  >
                    <BookOpen className="h-3.5 w-3.5" /> Read
                  </Link>
                  <a
                    href={`/manuals/${g.slug}.pdf`}
                    download
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
