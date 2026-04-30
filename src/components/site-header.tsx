import { Link } from "@tanstack/react-router";
import { usePoints } from "@/hooks/use-points";

export function SiteHeader() {
  const { points } = usePoints();

  return (
    <header className="border-b border-white/10 backdrop-blur-md bg-black/40 sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 gap-4">
        <Link
          to="/"
          className="font-display text-xl tracking-[0.3em] uppercase hover:text-claret transition-colors"
        >
          The Mirror
        </Link>

        <nav className="hidden md:flex items-center gap-7 small-caps">
          <Link
            to="/"
            className="text-foreground/60 hover:text-claret transition-colors"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-claret" }}
          >
            Home
          </Link>
          <Link
            to="/library"
            className="text-foreground/60 hover:text-claret transition-colors"
            activeProps={{ className: "text-claret" }}
          >
            Library
          </Link>
          <Link
            to="/dialogues"
            className="text-foreground/60 hover:text-claret transition-colors"
            activeProps={{ className: "text-claret" }}
          >
            Archive
          </Link>
          <Link
            to="/create"
            className="text-foreground/60 hover:text-claret transition-colors"
            activeProps={{ className: "text-claret" }}
          >
            Forge
          </Link>
        </nav>

        {/* CRUX HUD */}
        <div
          className="flex items-center gap-2 border border-claret/40 bg-claret/10 px-3 py-1.5 small-caps text-claret text-[0.7rem] tracking-[0.2em]"
          title="CRUX earned through strong debate turns and committed roleplay"
        >
          <span className="text-claret">◈</span>
          <span className="font-mono font-semibold">{points}</span>
          <span className="hidden sm:inline text-claret/60">CRUX</span>
        </div>
      </div>
    </header>
  );
}
