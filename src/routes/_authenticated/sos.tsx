import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Loader2, MapPin, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";

const TYPES = [
  { value: "puncture", label: "Tyre puncture", icon: "🛞" },
  { value: "blowout", label: "Blowout tyre", icon: "💥" },
  { value: "dead_battery", label: "Dead battery", icon: "🔋" },
  { value: "wont_start", label: "Won't start", icon: "🔑" },
  { value: "mechanical", label: "Mechanical failure", icon: "⚙️" },
  { value: "other", label: "Other", icon: "❓" },
] as const;

export const Route = createFileRoute("/_authenticated/sos")({
  component: SosPage,
});

function SosPage() {
  const qc = useQueryClient();
  const [type, setType] = useState<typeof TYPES[number]["value"]>("puncture");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locText, setLocText] = useState("");
  const [locating, setLocating] = useState(false);

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => (await supabase.from("vehicles").select("*")).data ?? [],
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      return (await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle()).data;
    },
  });

  useEffect(() => {
    if (!vehicleId && vehicles && vehicles.length) setVehicleId(vehicles[0].id);
  }, [vehicles, vehicleId]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLocating(false);
        toast.success("Location captured");
      },
      (err) => {
        setLocating(false);
        toast.error("Could not get location: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("assistance_requests").insert({
        user_id: u.user.id,
        vehicle_id: vehicleId || null,
        type,
        description: description.trim() || null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        location_text: locText.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("SOS request created");
      qc.invalidateQueries({ queryKey: ["requests-recent"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const vehicle = vehicles?.find((v) => v.id === vehicleId);
  const typeLabel = TYPES.find((t) => t.value === type)?.label ?? type;

  const smsBody = [
    `🚨 RoadResQ SOS`,
    `Problem: ${typeLabel}`,
    vehicle ? `Vehicle: ${vehicle.vehicle_number} (${[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "—"})` : null,
    profile?.full_name ? `From: ${profile.full_name}` : null,
    profile?.phone ? `Phone: ${profile.phone}` : null,
    coords ? `Location: https://maps.google.com/?q=${coords.lat},${coords.lng}` : null,
    locText ? `Landmark: ${locText}` : null,
    description ? `Notes: ${description}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const technicianPhone = profile?.emergency_contact_phone ?? "";

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="flex items-center gap-3 font-display text-3xl font-bold">
          <span className="grid h-11 w-11 place-items-center rounded-xl gradient-emergency text-primary-foreground">
            <AlertTriangle className="h-6 w-6" />
          </span>
          Request Emergency Help
        </h1>
        <p className="mt-1 text-muted-foreground">
          Capture your location, then send via SMS — works without internet.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="glass rounded-2xl p-6">
          <div className="mb-2 text-sm font-semibold text-muted-foreground">What's wrong?</div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`rounded-xl border p-4 text-left transition ${
                  type === t.value ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"
                }`}
              >
                <div className="text-2xl">{t.icon}</div>
                <div className="mt-1 text-sm font-semibold">{t.label}</div>
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Vehicle</div>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              >
                <option value="">— No vehicle —</option>
                {vehicles?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_number} {v.make ? `(${v.make} ${v.model ?? ""})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Nearest landmark (optional)</div>
              <input
                value={locText}
                onChange={(e) => setLocText(e.target.value)}
                placeholder="e.g. NH65 Km 124, near HP pump"
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Describe the problem</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Smoke from bonnet, car will not restart…"
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={getLocation}
              disabled={locating}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-60"
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {coords ? "Update GPS" : "Get my GPS"}
            </button>
            {coords && (
              <span className="text-xs text-success">
                ✓ {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} ±{Math.round(coords.accuracy ?? 0)}m
              </span>
            )}
          </div>
        </div>

        <aside className="glass rounded-2xl p-6">
          <div className="font-display text-lg font-semibold">Send to technician</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap to open SMS or call — opens your phone's native apps so it works offline.
          </p>

          <label className="mt-4 block">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Technician / contact phone</div>
            <input
              defaultValue={technicianPhone}
              id="tech-phone"
              placeholder="+91…"
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
            />
          </label>

          <div className="mt-4 grid gap-2">
            <a
              href={`sms:${technicianPhone}?body=${encodeURIComponent(smsBody)}`}
              onClick={(e) => {
                const phone = (document.getElementById("tech-phone") as HTMLInputElement)?.value ?? "";
                if (!phone) {
                  e.preventDefault();
                  toast.error("Enter a phone number first");
                  return;
                }
                (e.currentTarget as HTMLAnchorElement).href = `sms:${phone}?body=${encodeURIComponent(smsBody)}`;
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg gradient-emergency px-4 py-3 font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
            >
              <MessageSquare className="h-4 w-4" /> Send SOS via SMS
            </a>
            <a
              href={`tel:${technicianPhone || "112"}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 font-semibold hover:bg-muted"
            >
              <Phone className="h-4 w-4" /> Call {technicianPhone || "emergency (112)"}
            </a>
          </div>

          <details className="mt-4 rounded-lg bg-card/60 p-3 text-xs text-muted-foreground">
            <summary className="cursor-pointer font-semibold">Preview message</summary>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px]">{smsBody}</pre>
          </details>

          <button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="mt-5 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-60"
          >
            {create.isPending ? "Logging…" : "Log this request"}
          </button>
        </aside>
      </div>
    </AppShell>
  );
}
