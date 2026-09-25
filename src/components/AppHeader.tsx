import { Link } from "@tanstack/react-router";

export function AppHeader({ who, onLogout, portal }: { who?: string | undefined; onLogout?: (() => void) | undefined; portal: "patient" | "doctor" }) {
  return (
    <header className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 lg:px-10">
      <Link to="/" className="font-display text-xl font-semibold text-primary">Symptom Advocate</Link>
      <div className="flex items-center gap-3 text-sm">
        {who && <span className="hidden text-muted-foreground sm:inline">{who}</span>}
        <Link
          to={portal === "patient" ? "/doctor" : "/patient"}
          className="rounded-full px-3 py-1.5 font-medium text-muted-foreground hover:bg-muted"
        >
          {portal === "patient" ? "Doctor login" : "Patient portal"}
        </Link>
        {onLogout && (
          <button onClick={onLogout} className="rounded-full bg-primary/10 px-3 py-1.5 font-semibold text-primary">
            Log out
          </button>
        )}
      </div>
    </header>
  );
}
