import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Symptom Advocate — Daily symptom diary for heart health" },
      { name: "description", content: "A daily symptom diary for women, with pattern insights that help doctors spot heart risk early." },
      { property: "og:title", content: "Symptom Advocate" },
      { property: "og:description", content: "A daily symptom diary that helps doctors spot heart risk patterns in women." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="eyebrow">Symptom Advocate</p>
      <h1 className="mt-3 text-balance font-display text-5xl font-medium leading-[1.05] sm:text-6xl">
        Your symptoms, kept close — and taken seriously.
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
        A quiet daily diary for how you feel. Over time, your care team can see the patterns that a single visit might miss.
      </p>
      <div className="rise mt-10 grid gap-4 sm:grid-cols-2">
        <Link to="/patient" className="card-paper group p-7 transition-transform hover:-translate-y-0.5">
          <p className="eyebrow">For patients</p>
          <p className="mt-2 font-display text-3xl font-medium text-primary">I'm a Patient</p>
          <p className="mt-2 text-sm text-muted-foreground">Log today's symptoms in two minutes.</p>
        </Link>
        <Link to="/doctor" className="card-paper group p-7 transition-transform hover:-translate-y-0.5">
          <p className="eyebrow">For clinicians</p>
          <p className="mt-2 font-display text-3xl font-medium text-accent">I'm a Doctor</p>
          <p className="mt-2 text-sm text-muted-foreground">Review patient diaries and pattern flags.</p>
        </Link>
      </div>
    </main>
  );
}
