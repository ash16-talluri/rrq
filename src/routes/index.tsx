import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  Car,
  Download,
  MapPin,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RoadRescue — Emergency Roadside Assistance" },
      {
        name: "description",
        content:
          "Offline-ready roadside help for highway emergencies. Downloadable region packs, illustrated repair guides, nearby mechanics, AI assistant.",
      },
      { property: "og:title", content: "RoadRescue — Emergency Roadside Assistance" },
      {
        property: "og:description",
        content: "Offline-first roadside help: SOS, region packs, guides, AI assistant.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <AppShell showAuthCta>
      <section className="relative overflow-hidden rounded-3xl glass-strong p-8 md:p-14">
        <div className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs">
            {online ? (
              <>
                <Wifi className="h-3 w-3 text-success" /> You're online
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-warning" /> Offline — region packs still work
              </>
            )}
          </div>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-tight md:text-6xl">
            Stranded on the highway?{" "}
            <span className="text-primary text-glow">Help is one tap away.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            RoadRescue works even without internet. Download region packs for your route, follow
            illustrated repair guides offline, and reach mechanics, tow trucks, and emergency
            services in seconds.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl gradient-emergency px-6 py-3.5 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-[1.02]"
            >
              <AlertTriangle className="h-5 w-5" /> Get started — it's free
            </Link>
            <Link
              to="/guides"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 font-semibold hover:bg-muted"
            >
              <BookOpen className="h-5 w-5" /> View offline guides
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        <Feature
          icon={AlertTriangle}
          title="One-tap SOS"
          body="Send your GPS coordinates and vehicle info to a technician via SMS — no internet needed."
        />
        <Feature
          icon={Download}
          title="Offline region packs"
          body="Download mechanics, tow trucks, fuel stops, hospitals, and police for any highway. Export as PDF or DOC."
        />
        <Feature
          icon={BookOpen}
          title="Illustrated guides"
          body="Step-by-step instructions for tyre changes, blowouts, jump-starts, and overheating — fully offline."
        />
        <Feature
          icon={MapPin}
          title="Nearby providers"
          body="Puncture shops, mechanics, towing, and 24/7 fuel — with phone numbers and ratings."
        />
        <Feature
          icon={Bot}
          title="AI assistant"
          body="Describe symptoms in plain language. Get likely causes, safety steps, and the right service to call."
        />
        <Feature
          icon={Car}
          title="Low-battery mode"
          body="Minimalist text-only interface that sips battery when you need every percent."
        />
      </section>

      <section className="mt-12 glass rounded-2xl p-6 md:p-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm text-primary">
              <ShieldCheck className="h-4 w-4" /> Built for emergencies
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">
              Install RoadRescue on your phone
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Add it to your home screen for instant access — works offline once installed.
              Available on Android &amp; iOS.
            </p>
          </div>
          <Link
            to="/auth"
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90"
          >
            Create your account
          </Link>
        </div>
      </section>
    </AppShell>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof AlertTriangle;
  title: string;
  body: string;
}) {
  return (
    <div className="glass rounded-2xl p-6 transition hover:translate-y-[-2px]">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
