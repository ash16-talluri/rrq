import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { CheckCircle2, Download, FileDown, FileText, Loader2, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deletePack,
  listPacks,
  savePack,
  type OfflinePack,
} from "@/lib/offline-store";
import { exportPackToDoc, exportPackToPdf } from "@/lib/export";

export const Route = createFileRoute("/region-packs")({
  head: () => ({
    meta: [
      { title: "Region Packs — RoadRescue" },
      { name: "description", content: "Download offline highway packs with mechanics, fuel, hospitals, and emergency contacts." },
    ],
  }),
  component: RegionPacksPage,
});

function RegionPacksPage() {
  const qc = useQueryClient();
  const { data: packs } = useQuery({
    queryKey: ["region-packs"],
    queryFn: async () =>
      (await supabase.from("region_packs").select("*").order("name")).data ?? [],
  });

  const [downloaded, setDownloaded] = useState<OfflinePack[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const refreshLocal = async () => setDownloaded(await listPacks());
  useEffect(() => {
    refreshLocal();
  }, []);

  const handleDownload = async (packId: string, slug: string) => {
    setBusy(packId);
    try {
      const { data: pack } = await supabase.from("region_packs").select("*").eq("id", packId).single();
      const { data: items } = await supabase
        .from("region_pack_items")
        .select("*, provider:service_providers(*)")
        .eq("pack_id", packId);

      const providers =
        items
          ?.filter((i) => i.provider)
          .map((i) => {
            const p = i.provider!;
            return {
              id: p.id,
              name: p.name,
              type: p.type,
              phone: p.phone,
              address: p.address,
              city: p.city,
              region: p.region,
              latitude: p.latitude,
              longitude: p.longitude,
              rating: p.rating ? Number(p.rating) : null,
              open_24h: p.open_24h,
            };
          }) ?? [];
      const extras =
        items
          ?.filter((i) => !i.provider_id && i.extra_name)
          .map((i) => ({
            name: i.extra_name!,
            phone: i.extra_phone ?? "",
            type: i.extra_type ?? "other",
            address: i.extra_address,
            notes: i.notes,
          })) ?? [];

      const offline: OfflinePack = {
        id: pack!.id,
        slug: pack!.slug,
        name: pack!.name,
        description: pack!.description,
        region: pack!.region,
        highway: pack!.highway,
        downloaded_at: new Date().toISOString(),
        providers,
        extras,
      };
      await savePack(offline);
      await refreshLocal();
      qc.invalidateQueries({ queryKey: ["region-packs"] });
      toast.success(`${pack!.name} downloaded for offline use`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from offline storage?`)) return;
    await deletePack(id);
    await refreshLocal();
    toast.success("Removed");
  };

  return (
    <AppShell showAuthCta>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Offline Region Packs</h1>
        <p className="text-muted-foreground">
          Download highway packs before you travel. They live on your device and work without internet.
        </p>
      </div>

      {downloaded.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 font-display text-lg font-semibold">Downloaded on this device</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {downloaded.map((p) => (
              <li key={p.id} className="glass rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-success">
                      <CheckCircle2 className="h-4 w-4" /> Saved offline
                    </div>
                    <div className="mt-1 font-display text-lg font-bold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.providers.length} providers • {p.extras.length} emergency contacts • Downloaded {new Date(p.downloaded_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => exportPackToPdf(p)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                  >
                    <FileDown className="h-3.5 w-3.5" /> Export PDF
                  </button>
                  <button
                    onClick={() => exportPackToDoc(p)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    <FileText className="h-3.5 w-3.5" /> Export DOC
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">Available packs</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {(packs ?? []).map((p) => {
            const isDown = downloaded.some((d) => d.id === p.id);
            return (
              <li key={p.id} className="glass rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-display text-lg font-bold">{p.name}</div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {p.region} {p.highway ? `• ${p.highway}` : ""}
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{p.description}</p>
                    <div className="mt-2 text-xs text-muted-foreground">~{p.size_kb} KB</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(p.id, p.slug)}
                  disabled={busy === p.id}
                  className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    isDown
                      ? "border border-border bg-card hover:bg-muted"
                      : "bg-primary text-primary-foreground hover:opacity-90"
                  } disabled:opacity-60`}
                >
                  {busy === p.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isDown ? "Re-download / update" : "Download for offline"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </AppShell>
  );
}
