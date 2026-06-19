import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BookOpen, Bot, Car, Download, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return null;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      return { ...p, user_id: data.user.id, isAdmin: roles?.some((r) => r.role === "admin") ?? false };
    },
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => (await supabase.from("vehicles").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: recent } = useQuery({
    queryKey: ["requests-recent"],
    queryFn: async () =>
      (
        await supabase
          .from("assistance_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5)
      ).data ?? [],
  });

  return (
    <AppShell isAdmin={profile?.isAdmin}>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">
          Hi {profile?.full_name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          What do you need help with right now?
        </p>
      </div>

      <Link
        to="/sos"
        className="group relative block overflow-hidden rounded-3xl gradient-emergency p-8 shadow-[var(--shadow-glow)] transition hover:scale-[1.01]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="relative flex items-center gap-5 text-primary-foreground">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-black/20 backdrop-blur">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="font-display text-2xl font-bold">Request emergency assistance</div>
            <div className="text-sm opacity-90">
              Share your location with a technician via SMS — works offline.
            </div>
          </div>
          <div className="hidden text-3xl md:block">→</div>
        </div>
      </Link>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ActionCard to="/providers" icon={MapPin} title="Nearby providers" body="Mechanics, towing, fuel" />
        <ActionCard to="/region-packs" icon={Download} title="Region packs" body="Download offline highway packs" />
        <ActionCard to="/guides" icon={BookOpen} title="Offline guides" body="Tyre, battery, overheating" />
        <ActionCard to="/assistant" icon={Bot} title="AI assistant" body="Describe symptoms, get answers" />
        <ActionCard to="/vehicles" icon={Car} title="My vehicles" body={`${vehicles?.length ?? 0} registered`} />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl font-semibold">Recent requests</h2>
        {(recent?.length ?? 0) === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
            No requests yet. Stay safe out there!
          </div>
        ) : (
          <ul className="space-y-2">
            {recent!.map((r) => (
              <li key={r.id} className="glass flex items-center justify-between rounded-xl p-4">
                <div>
                  <div className="font-semibold capitalize">{r.type.replace("_", " ")}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()} • {r.location_text ?? "Unknown location"}
                  </div>
                </div>
                <span className="rounded-full bg-card px-2.5 py-0.5 text-xs font-medium capitalize">
                  {r.status.replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

function ActionCard({
  to,
  icon: Icon,
  title,
  body,
}: {
  to: string;
  icon: typeof Car;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      className="glass rounded-2xl p-5 transition hover:translate-y-[-2px] hover:border-primary/40"
    >
      <Icon className="h-6 w-6 text-primary" />
      <div className="mt-3 font-display text-lg font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground">{body}</div>
    </Link>
  );
}
