import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getGuide } from "@/lib/guides";
import { AlertTriangle, ArrowLeft, Clock } from "lucide-react";

export const Route = createFileRoute("/guides/$slug")({
  loader: ({ params }) => {
    const guide = getGuide(params.slug);
    if (!guide) throw notFound();
    return { guide };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.guide.title} — TravAID` },
          { name: "description", content: `${loaderData.guide.title}: ${loaderData.guide.steps.length} step offline guide.` },
        ]
      : [],
  }),
  component: GuideDetail,
  notFoundComponent: () => (
    <AppShell showAuthCta>
      <div className="glass rounded-2xl p-10 text-center">Guide not found.</div>
    </AppShell>
  ),
});

function GuideDetail() {
  const { guide } = Route.useLoaderData();
  return (
    <AppShell showAuthCta>
      <Link to="/guides" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All guides
      </Link>

      <header className="mb-6 flex items-start gap-5">
        <div className="text-6xl leading-none">{guide.icon}</div>
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">{guide.title}</h1>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {guide.duration}
            </span>
            <span className={`rounded px-2 py-0.5 ${guide.difficulty === "Hard" ? "bg-destructive/15 text-destructive" : guide.difficulty === "Medium" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>
              {guide.difficulty}
            </span>
          </div>
        </div>
      </header>

      {guide.warning && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          <div className="text-destructive-foreground">
            <strong className="text-destructive">Safety: </strong>
            {guide.warning}
          </div>
        </div>
      )}

      <ol className="space-y-4">
        {guide.steps.map((s: { title: string; body: string }, i: number) => (
          <li key={i} className="glass rounded-2xl p-5">
            <div className="flex gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
                {i + 1}
              </div>
              <div>
                <div className="font-display text-lg font-semibold">{s.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 glass rounded-2xl p-5 text-sm">
        Still stuck?{" "}
        <Link to="/sos" className="font-semibold text-primary hover:underline">
          Send an SOS request →
        </Link>
      </div>
    </AppShell>
  );
}
