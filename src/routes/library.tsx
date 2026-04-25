import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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

/**
 * Era buckets for philosophers. We parse the `era` text field and assign
 * each philosopher to one of these chronological houses.
 */
const ERAS = [
  {
    key: "ancient",
    name: "Ancient",
    range: "before 500 CE",
    blurb: "The first thinkers — agora, river, and oracle.",
  },
  {
    key: "medieval-early-modern",
    name: "Medieval & Early Modern",
    range: "500 – 1700",
    blurb: "Faith, reason, and the slow turn toward the self.",
  },
  {
    key: "modern",
    name: "Modern",
    range: "1700 – 1900",
    blurb: "Enlightenment, revolution, and the death of certainties.",
  },
  {
    key: "contemporary",
    name: "Contemporary",
    range: "1900 – today",
    blurb: "Existence, power, gender, the absurd.",
  },
] as const;

type EraKey = (typeof ERAS)[number]["key"];

function parseEraYear(era: string | null): { year: number; bce: boolean } | null {
  if (!era) return null;
  const bce = /BCE|B\.C/.test(era);
  // Grab the first number we can find.
  const m = era.match(/\d{1,4}/);
  if (!m) return null;
  return { year: parseInt(m[0], 10), bce };
}

function classifyEra(era: string | null): EraKey {
  const parsed = parseEraYear(era);
  if (!parsed) return "contemporary";
  if (parsed.bce) return "ancient";
  if (parsed.year < 500) return "ancient";
  if (parsed.year < 1700) return "medieval-early-modern";
  if (parsed.year < 1900) return "modern";
  return "contemporary";
}

export const Route = createFileRoute("/library")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search.mode as string) || undefined,
    era: (search.era as string) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "The Library — The Mirror" },
      {
        name: "description",
        content:
          "Browse philosophers by era, alongside everyday roles and archetypes. Choose an interlocutor for your next dialogue.",
      },
      { property: "og:title", content: "The Library — The Mirror" },
      {
        property: "og:description",
        content: "Browse philosophers by era. Choose your interlocutor.",
      },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const isDebateMode = search.mode === "debate";
  const selectedEra = search.era as EraKey | undefined;

  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "philosopher" | "everyday" | "archetype" | "mine">(
    isDebateMode ? "philosopher" : "all",
  );

  useEffect(() => {
    // auth removed — anonymous sessions
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

  // In debate mode with an era chosen, filter philosophers down to that era.
  const filtered = useMemo(() => {
    return characters.filter((c) => {
      if (isDebateMode) {
        if (c.category !== "philosopher") return false;
        if (selectedEra && classifyEra(c.era) !== selectedEra) return false;
        return true;
      }
      if (filter === "all") return true;
      if (filter === "mine") return !c.is_builtin;
      return c.category === filter;
    });
  }, [characters, filter, isDebateMode, selectedEra]);

  // Count philosophers per era for the era picker.
  const eraCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of characters) {
      if (c.category !== "philosopher") continue;
      const k = classifyEra(c.era);
      counts[k] = (counts[k] || 0) + 1;
    }
    return counts;
  }, [characters]);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: filtered.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  // === DEBATE MODE: era picker first ===
  if (isDebateMode && !selectedEra) {
    return (
      <div className="min-h-screen arena-bg vignette">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-6 py-16">
          <p className="small-caps text-claret mb-4 tracking-[0.4em]">
            ⚔  Mode I · Debate
          </p>
          <h1 className="font-display text-5xl md:text-6xl uppercase tracking-tight mb-4">
            Choose an <span className="text-claret italic">era</span>.
          </h1>
          <p className="measure-wide font-serif text-lg text-foreground/70 mb-12">
            Every age has its own questions and its own way of arguing. Pick the century
            whose mind you wish to face — then choose your opponent from its house.
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            {ERAS.map((era) => {
              const count = eraCounts[era.key] || 0;
              const disabled = count === 0;
              return (
                <Link
                  key={era.key}
                  to="/library"
                  search={{ mode: "debate", era: era.key }}
                  disabled={disabled}
                  className={`mode-card p-7 md:p-8 block group ${
                    disabled ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  <span className="mode-corner tl" />
                  <span className="mode-corner tr" />
                  <span className="mode-corner bl" />
                  <span className="mode-corner br" />
                  <div className="relative z-10 flex items-start justify-between gap-6">
                    <div>
                      <p className="small-caps text-claret/80 mb-3">{era.range}</p>
                      <h2 className="font-display text-3xl md:text-4xl uppercase tracking-tight mb-3 group-hover:text-claret transition-colors">
                        {era.name}
                      </h2>
                      <p className="font-serif text-foreground/70 leading-relaxed">
                        {era.blurb}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-display text-5xl text-claret/70 leading-none">
                        {count}
                      </span>
                      <p className="small-caps text-foreground/40 mt-2">
                        {count === 1 ? "Mind" : "Minds"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link to="/" className="small-caps text-foreground/50 hover:text-claret transition-colors">
              ← Back to the entrance
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // === DEBATE MODE: philosophers of the chosen era ===
  if (isDebateMode && selectedEra) {
    const eraMeta = ERAS.find((e) => e.key === selectedEra);
    return (
      <div className="min-h-screen arena-bg vignette">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-6 py-16">
          <p className="small-caps text-claret mb-4 tracking-[0.4em]">
            ⚔  Debate · {eraMeta?.name}
          </p>
          <h1 className="font-display text-5xl md:text-6xl uppercase tracking-tight mb-4">
            Choose your <span className="text-claret italic">opponent</span>.
          </h1>
          <p className="measure-wide font-serif text-lg text-foreground/70 mb-10">
            {eraMeta?.blurb}
          </p>

          <div className="hairline-b mb-10 pb-4 flex items-center justify-between small-caps">
            <Link
              to="/library"
              search={{ mode: "debate" }}
              className="text-foreground/60 hover:text-claret transition-colors"
            >
              ← Choose another era
            </Link>
            <Link to="/create" className="text-claret hover:underline">
              + Forge a new mind
            </Link>
          </div>

          {loading ? (
            <p className="font-serif text-foreground/60">Reading the catalog…</p>
          ) : filtered.length === 0 ? (
            <p className="font-serif text-foreground/60">
              No philosophers from this era yet.{" "}
              <Link to="/create" className="ink-link">
                Forge one.
              </Link>
            </p>
          ) : (
            <div className="grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
                <CharacterCard key={c.id} character={c} />
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // === DEFAULT LIBRARY (browse all) ===
  return (
    <div className="min-h-screen arena-bg vignette">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="small-caps text-claret mb-4">The Library</p>
        <h1 className="font-display text-5xl md:text-6xl uppercase tracking-tight mb-6">
          Choose an interlocutor.
        </h1>
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
                filter === key ? "text-claret" : "text-foreground/60 hover:text-foreground"
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
          <p className="font-serif text-foreground/60">Reading the catalog…</p>
        ) : filtered.length === 0 ? (
          <p className="font-serif text-foreground/60">
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
      <p className="small-caps text-foreground/50 mb-2">
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
