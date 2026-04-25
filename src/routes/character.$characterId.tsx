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
    // auth removed — anonymous sessions
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

  return (
    <div className="min-h-screen paper-bg">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/library" className="small-caps text-muted-foreground hover:text-claret transition-colors">
          ← The Library
        </Link>

        {loading ? (
          <p className="mt-12 font-serif text-muted-foreground">Loading…</p>
        ) : !character ? (
          <p className="mt-12 font-serif">Not found.</p>
        ) : (
          <article className="mt-10">
            <p className="small-caps text-claret mb-4">
              {character.era || (character.is_builtin ? "Built-in" : "Yours")} ·{" "}
              {character.category}
            </p>
            <h1 className="font-display text-6xl md:text-7xl leading-none mb-8">
              {character.name}
            </h1>
            <p className="font-display italic text-2xl md:text-3xl text-claret leading-snug mb-12 measure">
              “{character.credo}”
            </p>

            <div className="ornament mb-12">
              <span className="font-display text-xl text-claret">§</span>
            </div>

            <Section label="Worldview" body={character.worldview} />
            <Section label="Method" body={character.argument_style} />
            <Section label="Voice" body={character.voice} />
            {character.refusals && <Section label="Will not concede" body={character.refusals} />}
            {character.opening_move && (
              <Section label="Opening move" body={character.opening_move} />
            )}

            <div className="mt-16 flex flex-wrap items-center gap-6">
              <Link
                to="/dialogue/new"
                search={{ characterId: character.id }}
                className="bg-claret text-claret-foreground py-4 px-8 small-caps hover:opacity-90 transition-opacity"
              >
                Begin a dialogue with {character.name.split(" ")[0]}
              </Link>
              {!character.is_builtin && (
                <button
                  onClick={handleDelete}
                  className="small-caps text-muted-foreground hover:text-destructive transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <section className="mb-10">
      <p className="small-caps text-muted-foreground mb-3">{label}</p>
      <p className="font-serif text-lg leading-relaxed text-foreground/85 measure-wide whitespace-pre-line">
        {body}
      </p>
    </section>
  );
}
