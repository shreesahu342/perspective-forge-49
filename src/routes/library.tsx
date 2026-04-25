import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import type { Database } from "@/integrations/supabase/types";

type Character = Database["public"]["Tables"]["characters"]["Row"];

const CATEGORY_LABEL: Record<string, string> = {
  philosopher: "Philosophers",
  everyday: "Everyday Roles",
  archetype: "Archetypes",
};

const CATEGORY_ORDER: Array<"philosopher" | "everyday" | "archetype"> = [
  "philosopher",
  "everyday",
  "archetype",
];

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "The Library — The Mirror" },
      {
        name: "description",
        content:
          "Browse philosophers, everyday roles, and archetypes. Choose an interlocutor for your next dialogue.",
      },
      { property: "og:title", content: "The Library — The Mirror" },
      {
        property: "og:description",
        content: "Browse philosophers, everyday roles, and archetypes.",
      },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "philosopher" | "everyday" | "archetype" | "mine">(
    "all",
  );

  useEffect(() => {
    // auth removed — anonymous session is established automatically
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .order("is_builtin", { ascending: false })
        .order("category")
        .order("name");
      if (!active) return;
      if (!error && data) setCharacters(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const filtered = characters.filter((c) => {
    if (filter === "all") return true;
    if (filter === "mine") return !c.is_builtin;
    return c.category === filter;
  });

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: filtered.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  const customs = filtered.filter((c) => !c.is_builtin);

  return (
    <div className="min-h-screen paper-bg">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="small-caps text-claret mb-4">The Library</p>
        <h1 className="font-display mb-6">Choose an interlocutor.</h1>
        <p className="measure-wide font-serif text-lg text-foreground/70 mb-12">
          Each entry is a mind with a method. Open one to read what they believe,
          how they argue, and what they refuse to concede — then begin a dialogue.
        </p>

        {/* Filters */}
        <div className="hairline-b mb-12 pb-4 flex flex-wrap gap-x-8 gap-y-3 small-caps">
          {(
            [
              ["all", "All"],
              ["philosopher", "Philosophers"],
              ["everyday", "Everyday"],
              ["archetype", "Archetypes"],
              ["mine", "Yours"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`transition-colors ${
                filter === key ? "text-claret" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
          <Link to="/create" className="ml-auto ink-link">
            + Forge a new character
          </Link>
        </div>

        {loading ? (
          <p className="font-serif text-muted-foreground">Reading the catalog…</p>
        ) : filtered.length === 0 ? (
          <p className="font-serif text-muted-foreground">
            Nothing here yet.{" "}
            <Link to="/create" className="ink-link">
              Forge your first character.
            </Link>
          </p>
        ) : (
          <div className="space-y-20">
            {grouped.map(({ cat, items }) => (
              <section key={cat}>
                <h2 className="font-display text-3xl mb-8">{CATEGORY_LABEL[cat]}</h2>
                <div className="grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((c) => (
                    <CharacterCard key={c.id} character={c} />
                  ))}
                </div>
              </section>
            ))}
            {filter === "mine" && customs.length === 0 && null}
          </div>
        )}
      </main>
    </div>
  );
}

function CharacterCard({ character }: { character: Character }) {
  return (
    <Link
      to="/character/$characterId"
      params={{ characterId: character.id }}
      className="group block border-t border-foreground/20 pt-5 hover:border-claret transition-colors"
    >
      <p className="small-caps text-muted-foreground mb-2">
        {character.era || (character.is_builtin ? "Built-in" : "Yours")}
      </p>
      <h3 className="font-display text-2xl mb-3 group-hover:text-claret transition-colors">
        {character.name}
      </h3>
      <p className="font-serif italic text-foreground/75 leading-relaxed">
        “{character.credo}”
      </p>
    </Link>
  );
}
