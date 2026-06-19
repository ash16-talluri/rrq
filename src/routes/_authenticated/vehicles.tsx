import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Car, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vehicles")({
  component: VehiclesPage,
});

function VehiclesPage() {
  const qc = useQueryClient();
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => (await supabase.from("vehicles").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    vehicle_number: "",
    make: "",
    model: "",
    year: "",
    color: "",
    fuel_type: "petrol",
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("vehicles").insert({
        user_id: u.user.id,
        vehicle_number: form.vehicle_number.trim().toUpperCase(),
        make: form.make.trim() || null,
        model: form.model.trim() || null,
        year: form.year ? Number(form.year) : null,
        color: form.color.trim() || null,
        fuel_type: form.fuel_type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vehicle added");
      setShow(false);
      setForm({ vehicle_number: "", make: "", model: "", year: "", color: "", fuel_type: "petrol" });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vehicle removed");
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });

  return (
    <AppShell>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">My Vehicles</h1>
          <p className="text-muted-foreground">Register vehicles to attach to SOS requests.</p>
        </div>
        <button
          onClick={() => setShow((s) => !s)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add vehicle
        </button>
      </div>

      {show && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="glass mb-6 grid gap-3 rounded-2xl p-5 md:grid-cols-2"
        >
          <Input label="Vehicle Number *" value={form.vehicle_number} onChange={(v) => setForm({ ...form, vehicle_number: v })} required placeholder="TS 09 AB 1234" />
          <Input label="Make" value={form.make} onChange={(v) => setForm({ ...form, make: v })} placeholder="Maruti" />
          <Input label="Model" value={form.model} onChange={(v) => setForm({ ...form, model: v })} placeholder="Swift" />
          <Input label="Year" type="number" value={form.year} onChange={(v) => setForm({ ...form, year: v })} placeholder="2021" />
          <Input label="Color" value={form.color} onChange={(v) => setForm({ ...form, color: v })} placeholder="White" />
          <Select label="Fuel" value={form.fuel_type} onChange={(v) => setForm({ ...form, fuel_type: v })} options={["petrol", "diesel", "cng", "electric", "hybrid"]} />
          <div className="md:col-span-2">
            <button disabled={create.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {create.isPending ? "Saving…" : "Save vehicle"}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (vehicles?.length ?? 0) === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
          <Car className="mx-auto h-10 w-10 text-primary/60" />
          <p className="mt-3">No vehicles yet. Add one to speed up emergency requests.</p>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {vehicles!.map((v) => (
            <li key={v.id} className="glass flex items-center justify-between rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Car className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-display text-lg font-bold tracking-wide">{v.vehicle_number}</div>
                  <div className="text-sm text-muted-foreground">
                    {[v.year, v.make, v.model, v.color].filter(Boolean).join(" • ") || "—"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm("Remove this vehicle?")) remove.mutate(v.id);
                }}
                className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remove vehicle"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}

function Input(props: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-muted-foreground">{props.label}</div>
      <input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        placeholder={props.placeholder}
        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function Select(props: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-muted-foreground">{props.label}</div>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
      >
        {props.options.map((o) => (
          <option key={o} value={o} className="capitalize">{o}</option>
        ))}
      </select>
    </label>
  );
}
