import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, ShieldCheck, Users, Wrench } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!roles?.some((r) => r.role === "admin")) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  const { data: counts } = useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const [users, providers, requests, packs] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("service_providers").select("id", { count: "exact", head: true }),
        supabase.from("assistance_requests").select("id", { count: "exact", head: true }),
        supabase.from("region_packs").select("id", { count: "exact", head: true }),
      ]);
      return {
        users: users.count ?? 0,
        providers: providers.count ?? 0,
        requests: requests.count ?? 0,
        packs: packs.count ?? 0,
      };
    },
  });

  const { data: requests } = useQuery({
    queryKey: ["admin-requests"],
    queryFn: async () =>
      (await supabase.from("assistance_requests").select("*").order("created_at", { ascending: false }).limit(20)).data ??
      [],
  });

  return (
    <AppShell isAdmin>
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Operations overview.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={Users} label="Users" value={counts?.users ?? 0} />
        <Stat icon={Wrench} label="Providers" value={counts?.providers ?? 0} />
        <Stat icon={Activity} label="SOS requests" value={counts?.requests ?? 0} />
        <Stat icon={ShieldCheck} label="Region packs" value={counts?.packs ?? 0} />
      </div>

      <h2 className="mt-10 mb-3 font-display text-lg font-semibold">Recent requests</h2>
      <div className="glass overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-card text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(requests ?? []).map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 capitalize">{r.type.replace("_", " ")}</td>
                <td className="px-4 py-3 text-xs">
                  {r.location_text ?? (r.latitude ? `${r.latitude.toFixed(3)}, ${r.longitude?.toFixed(3)}` : "—")}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-card px-2 py-0.5 text-xs capitalize">
                    {r.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
            {(requests?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-5">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
