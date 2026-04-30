import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Character = Database["public"]["Tables"]["characters"]["Row"];

export const Route = createFileRoute("/character/$characterId")({
  head: () => ({
    meta: [
      { title: "A Character — The Mirror" },
      { name: "description", content: "A philosophical interlocutor's portrait." },
    ],
  }),
  component: CharacterPage,
});

function CharacterPage() {
  const { characterId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // anonymous
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("characters")
        .select("*")
        .eq("id", characterId)
        .single();
      if (!active) return;
      setCharacter(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user, characterId]);

  const handleDelete = async () => {
    if (!character || character.is_builtin) return;
    if (!confirm(`Delete ${character.name}? This cannot be undone.`)) return;
    const { error } = await supabase.from("characters").delete().eq("id", character.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Character removed.");
    navigate({ to: "/library" });
  };

  const initial = character?.name.trim().charAt(0).toUpperCase() ?? "?";

  return (
    <div className="min-h-screen arena-bg vignette text-foreground">
      <SiteHeader />
      <main className="relative mx-auto max-w-4xl px-6 py-12 md:py-16">
        <Link
          to="/library"
          className="small-caps text-foreground/50 hover:text-claret transition-colors text-[0.7rem] tracking-[0.25em]"
        >
          ← Back to roster
        </Link>

        {loading ? (
          <p className="mt-20 text-center font-serif text-foreground/50">Loading combatant…</p>
        ) : !character ? (
          <p className="mt-20 text-center font-serif">Not found.</p>
        ) : (
          <article className="mt-10">
            <div className="hud-frame p-8 md:p-12 mb-12 relative">
              <span className="hud-corner tl" />
              <span className="hud-corner tr" />
              <span className="hud-corner bl" />
              <span className="hud-corner br" />

              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-full border border-claret/30" />
                  <div className="absolute inset-2 rounded-full border border-claret/15" />
                  <div className="absolute inset-0 rounded-full border-t-2 border-claret/40 animate-[spin_20s_linear_infinite]" />
                  <div
                    className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center ember-glow"
                  >
                    <span className="font-display text-7xl md:text-8xl text-claret">
                      {initial}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="small-caps text-claret/80 tracking-[0.3em] mb-3">
                    {character.era || (character.is_builtin ? "Built-in" : "Yours")} ·{" "}
                    {character.category}
                  </p>
                  <h1 className="font-display text-5xl md:text-6xl uppercase tracking-tight leading-none mb-5">
                    {character.name}
                  </h1>
                  <p className="font-serif italic text-lg text-foreground/80 leading-relaxed">
                    “{character.credo}”
                  </p>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center gap-4">
                <Link
                  to="/dialogue/new"
                  search={{ characterId: character.id }}
                  className="btn-claret"
                >
                  ⚔  Engage in Debate
                </Link>
                {!character.is_builtin && (
                  <button
                    onClick={handleDelete}
                    className="small-caps text-foreground/40 hover:text-destructive transition-colors text-[0.7rem] tracking-[0.2em]"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Stat label="Worldview" body={character.worldview} />
              <Stat label="Method" body={character.argument_style} />
              <Stat label="Voice" body={character.voice} />
              {character.refusals && <Stat label="Will not concede" body={character.refusals} />}
              {character.opening_move && (
                <Stat label="Opening move" body={character.opening_move} full />
              )}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}

function Stat({ label, body, full }: { label: string; body: string; full?: boolean }) {
  return (
    <section className={`hud-frame p-6 relative ${full ? "md:col-span-2" : ""}`}>
      <span className="hud-corner tl" />
      <span className="hud-corner br" />
      <p className="small-caps text-claret/70 tracking-[0.3em] mb-3 text-[0.65rem]">
        ▸ {label}
      </p>
      <p className="font-serif text-foreground/85 leading-relaxed whitespace-pre-line">
        {body}
      </p>
    </section>
  );
}
