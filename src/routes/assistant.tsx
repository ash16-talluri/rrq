import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeSymptom } from "@/lib/ai.functions";
import { Bot, Loader2, Send, ShieldAlert, Wrench } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant — RoadRescue" },
      { name: "description", content: "Describe a vehicle symptom and get likely causes, safety steps, and the right service to call." },
    ],
  }),
  component: AssistantPage,
});

interface Analysis {
  severity: "low" | "medium" | "high" | "critical";
  likely_causes: string[];
  immediate_steps: string[];
  recommended_service: string;
  recommended_service_label: string;
  summary: string;
}

const SEVERITY_STYLE: Record<string, string> = {
  low: "bg-success/15 text-success",
  medium: "bg-warning/15 text-warning",
  high: "bg-primary/15 text-primary",
  critical: "bg-destructive/15 text-destructive",
};

const EXAMPLES = [
  "Car won't start, just clicking sound",
  "Steering wheel is vibrating at highway speed",
  "Tyre burst on left rear",
  "White smoke from the bonnet",
  "Brake pedal feels soft",
];

function AssistantPage() {
  const [symptom, setSymptom] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const analyze = useServerFn(analyzeSymptom);

  const submit = async (text?: string) => {
    const value = (text ?? symptom).trim();
    if (value.length < 3) {
      toast.error("Please describe the problem in a few words");
      return;
    }
    setSymptom(value);
    setLoading(true);
    setResult(null);
    try {
      const r = await analyze({ data: { symptom: value } });
      setResult(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell showAuthCta>
      <div className="mb-6">
        <h1 className="flex items-center gap-3 font-display text-3xl font-bold">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Bot className="h-6 w-6" />
          </span>
          AI Roadside Assistant
        </h1>
        <p className="mt-1 text-muted-foreground">
          Describe what's happening. The assistant suggests likely causes, immediate safety steps, and the right service.
        </p>
      </div>

      <div className="glass rounded-2xl p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <textarea
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            rows={3}
            placeholder="e.g. Engine making a knocking sound and the temperature gauge is rising…"
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => submit(ex)}
                  className="rounded-full bg-card px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
                >
                  {ex}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Analyze
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="mt-6 grid gap-4">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${SEVERITY_STYLE[result.severity]}`}>
                {result.severity}
              </span>
              <span className="text-xs text-muted-foreground">AI-generated — verify with a mechanic</span>
            </div>
            <p className="mt-3 text-base">{result.summary}</p>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
              <ShieldAlert className="h-5 w-5 text-warning" /> Do this now
            </div>
            <ol className="space-y-2">
              {result.immediate_steps.map((s, i) => (
                <li key={i} className="flex gap-3 rounded-lg bg-card/60 p-3 text-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
              <Wrench className="h-5 w-5 text-primary" /> Likely causes
            </div>
            <ul className="space-y-1.5 text-sm">
              {result.likely_causes.map((c, i) => (
                <li key={i} className="flex gap-2"><span className="text-primary">•</span>{c}</li>
              ))}
            </ul>
          </div>

          <div className="glass flex items-center justify-between gap-4 rounded-2xl p-5">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Recommended service</div>
              <div className="font-display text-xl font-bold">{result.recommended_service_label}</div>
            </div>
            <Link
              to="/providers"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Find one near me →
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
