import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Fuel, Phone, ShieldAlert, Star, Stethoscope, Wrench, Truck, CircleDot } from "lucide-react";

const TYPE_META: Record<string, { label: string; icon: typeof Wrench; color: string }> = {
  puncture_shop: { label: "Puncture", icon: CircleDot, color: "text-warning" },
  mechanic: { label: "Mechanic", icon: Wrench, color: "text-primary" },
  towing: { label: "Towing", icon: Truck, color: "text-accent" },
  fuel_station: { label: "Fuel", icon: Fuel, color: "text-success" },
  hospital: { label: "Hospital", icon: Stethoscope, color: "text-destructive" },
  police: { label: "Police", icon: ShieldAlert, color: "text-accent" },
};

export const Route = createFileRoute("/providers")({
  head: () => ({
    meta: [
      { title: "Nearby Service Providers — TravAID" },
      { name: "description", content: "Mechanics, tow trucks, puncture shops, fuel, hospitals, and police across major highways." },
    ],
  }),
  component: ProvidersPage,
});

function ProvidersPage() {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { data: providers, isLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => (await supabase.from("service_providers").select("*").order("name")).data ?? [],
  });

  const filtered = (providers ?? []).filter((p) => {
    if (filter !== "all" && p.type !== filter) return false;
    if (search && !`${p.name} ${p.city ?? ""} ${p.region ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AppShell showAuthCta>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Nearby Providers</h1>
        <p className="text-muted-foreground">
          Curated highway helpers — call directly. Connect Google Maps to enable live map view.
        </p>
      </div>

      <div className="glass mb-6 flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or city…"
          className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-1">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
          {Object.entries(TYPE_META).map(([k, v]) => (
            <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>{v.label}</Chip>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {filtered.map((p) => {
            const meta = TYPE_META[p.type] ?? TYPE_META.mechanic;
            const Icon = meta.icon;
            return (
              <li key={p.id} className="glass flex items-start gap-4 rounded-2xl p-5">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-card ${meta.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-display text-lg font-semibold">{p.name}</div>
                    {p.open_24h && <span className="rounded bg-success/15 px-2 py-0.5 text-xs text-success">24/7</span>}
                  </div>
                  <div className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                    {meta.label} {p.city ? `• ${p.city}` : ""}
                  </div>
                  {p.address && <div className="mt-1 text-sm text-muted-foreground">{p.address}</div>}
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    {(p.rating ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-warning">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {Number(p.rating).toFixed(1)}
                      </span>
                    )}
                    {p.phone && (
                      <a
                        href={`tel:${p.phone}`}
                        className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2.5 py-1 font-semibold text-primary hover:bg-primary/25"
                      >
                        <Phone className="h-3.5 w-3.5" /> {p.phone}
                      </a>
                    )}
                    {p.latitude && p.longitude && (
                      <a
                        href={`https://maps.google.com/?q=${p.latitude},${p.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-accent hover:underline"
                      >
                        Open in Maps ↗
                      </a>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="glass col-span-full rounded-2xl p-8 text-center text-muted-foreground">
              No providers match your filters.
            </li>
          )}
        </ul>
      )}
    </AppShell>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
