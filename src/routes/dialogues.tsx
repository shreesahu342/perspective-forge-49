import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Dialogue = Database["public"]["Tables"]["dialogues"]["Row"] & {
  characters: { name: string; era: string | null } | null;
};

export const Route = createFileRoute("/dialogues")({
  head: () => ({
    meta: [
      { title: "The Archive — The Mirror" },
      { name: "description", content: "Your past dialogues, kept like letters." },
    ],
  }),
  component: ArchivePage,
});

function ArchivePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    // anonymous
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("dialogues")
        .select("*, characters(name, era)")
        .order("updated_at", { ascending: false });
      if (!active) return;
      setDialogues((data as unknown as Dialogue[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const filtered = dialogues.filter((d) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.characters?.name.toLowerCase().includes(q) ||
      d.topic?.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this dialogue? This cannot be undone.")) return;
    const { error } = await supabase.from("dialogues").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDialogues((prev) => prev.filter((d) => d.id !== id));
    toast.success("Removed.");
  };

  const modeIcon = (m: string) => (m === "debate" ? "⚔" : m === "roleplay" ? "✦" : "◆");

  return (
    <div className="min-h-screen arena-bg vignette text-foreground">
      <SiteHeader />
      <main className="relative mx-auto max-w-5xl px-6 py-12 md:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="small-caps text-claret tracking-[0.4em] glitch-flicker mb-4">
            ◆  The Archive  ◆
          </p>
          <h1 className="font-display text-5xl md:text-6xl uppercase tracking-tight">
            Your <span className="text-claret italic">campaigns</span>
          </h1>
          <p className="mt-5 mx-auto max-w-2xl font-serif text-foreground/65 leading-relaxed">
            A record of what was said, and to whom. Old conversations often hold
            more than they did the day they ended.
          </p>
        </div>

        {/* Search bar */}
        <div className="hud-frame p-4 mb-8 relative flex items-center gap-4">
          <span className="hud-corner tl" />
          <span className="hud-corner br" />
          <span className="small-caps text-claret/70 text-[0.65rem] tracking-[0.3em] hidden md:inline">
            ▸ Search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title, philosopher, topic…"
            className="flex-1 bg-transparent font-serif text-base focus:outline-none placeholder:text-foreground/30 text-foreground"
          />
          <Link to="/dialogue/new" className="btn-ghost whitespace-nowrap">
            + New
          </Link>
        </div>

        {loading ? (
          <p className="text-center font-serif text-foreground/50 py-20">Reading the archive…</p>
        ) : filtered.length === 0 ? (
          <div className="hud-frame relative p-12 text-center">
            <span className="hud-corner tl" />
            <span className="hud-corner tr" />
            <span className="hud-corner bl" />
            <span className="hud-corner br" />
            <p className="font-serif italic text-foreground/55 mb-6">
              {dialogues.length === 0
                ? "Nothing here yet. Begin a dialogue and it will be kept."
                : "No dialogues match that search."}
            </p>
            {dialogues.length === 0 && (
              <Link to="/library" className="btn-claret">
                Choose an interlocutor →
              </Link>
            )}
          </div>
        ) : (
          <ul className="grid gap-4">
            {filtered.map((d) => (
              <li key={d.id} className="combatant-card relative group">
                <span className="hud-corner tl" />
                <span className="hud-corner br" />
                <div className="flex items-start justify-between gap-6 p-5 md:p-6">
                  <Link
                    to="/dialogue/$dialogueId"
                    params={{ dialogueId: d.id }}
                    className="flex-1 min-w-0 relative z-10"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-claret text-lg">{modeIcon(d.mode)}</span>
                      <p className="small-caps text-foreground/40 text-[0.65rem] tracking-[0.25em]">
                        {d.mode === "debate" ? "Debate" : d.mode === "roleplay" ? "Scene" : "Open"}
                        {d.characters?.name ? ` · ${d.characters.name}` : ""}
                        {" · "}
                        {new Date(d.updated_at).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <h3 className="font-display text-xl md:text-2xl uppercase tracking-tight text-foreground/95 group-hover:text-claret transition-colors leading-tight">
                      {d.title}
                    </h3>
                    {d.topic && (
                      <p className="font-serif italic text-foreground/55 text-sm mt-2 line-clamp-2">
                        {d.topic}
                      </p>
                    )}
                  </Link>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="small-caps text-foreground/30 hover:text-destructive transition-colors text-[0.65rem] tracking-[0.25em] mt-1 relative z-10"
                    aria-label="Delete"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
