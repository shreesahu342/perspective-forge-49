import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import type { Database } from "@/integrations/supabase/types";

type Character = Database["public"]["Tables"]["characters"]["Row"];

// Era buckets for philosophers — from raw `era` strings on each character.
type EraKey = "ancient" | "medieval" | "enlightenment" | "nineteenth" | "twentieth" | "contemporary";

const ERA_LABEL: Record<EraKey, string> = {
  ancient: "Ancient",
  medieval: "Medieval",
  enlightenment: "Enlightenment",
  nineteenth: "19th Century",
  twentieth: "20th Century",
  contemporary: "Contemporary",
};

const ERA_KICKER: Record<EraKey, string> = {
  ancient: "Before 500 CE",
  medieval: "500 – 1500",
  enlightenment: "1600 – 1800",
  nineteenth: "1800 – 1900",
  twentieth: "1900 – 2000",
  contemporary: "2000 – Now",
};

const ERA_ORDER: EraKey[] = [
  "ancient",
  "medieval",
  "enlightenment",
  "nineteenth",
  "twentieth",
  "contemporary",
];

/** Heuristic: parse an era string like "1844–1900" or "551–479 BCE" → bucket. */
function bucketEra(era: string | null): EraKey {
  if (!era) return "contemporary";
  const lowered = era.toLowerCase();
  const isBCE = /bce|b\.c\./.test(lowered);
  // Pull the first 1-4 digit number we can find.
  const match = era.match(/(\d{1,4})/);
  const year = match ? parseInt(match[1], 10) : NaN;
  if (isBCE) return "ancient";
  if (Number.isNaN(year)) return "contemporary";
  if (year < 500) return "ancient";
  if (year < 1500) return "medieval";
  if (year < 1800) return "enlightenment";
  if (year < 1900) return "nineteenth";
  if (year < 2000) return "twentieth";
  return "contemporary";
}

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "The Library — Choose an Era — The Mirror" },
      {
        name: "description",
        content:
          "Choose an era and summon a philosopher to debate. From the Ancients to the Contemporary mind.",
      },
      { property: "og:title", content: "The Library — Choose an Era" },
      {
        property: "og:description",
        content: "Choose an era and summon a philosopher to debate.",
      },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEra, setActiveEra] = useState<EraKey | "all">("all");

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      // Mode I = Debate. Only philosophers are eligible.
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("category", "philosopher")
        .order("name");
      if (!active) return;
      if (!error && data) setCharacters(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const grouped = useMemo(() => {
    const buckets = new Map<EraKey, Character[]>();
    for (const c of characters) {
      const k = bucketEra(c.era);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k)!.push(c);
    }
    return ERA_ORDER.map((k) => ({ key: k, items: buckets.get(k) ?? [] })).filter(
      (g) => g.items.length > 0,
    );
  }, [characters]);

  const visible =
    activeEra === "all" ? grouped : grouped.filter((g) => g.key === activeEra);

  return (
    <div className="min-h-screen paper-bg">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="small-caps text-claret mb-4">Mode I · Debate</p>
        <h1 className="font-display mb-6">Choose an era.</h1>
        <p className="measure-wide font-serif text-lg text-foreground/70 mb-12">
          Each age produced a different way of arguing. Pick a period — then
          summon the philosopher whose mind you wish to test yourself against.
        </p>

        {/* Era selector */}
        <div className="hairline-b mb-12 pb-5 flex flex-wrap gap-x-8 gap-y-3 small-caps">
          <button
            onClick={() => setActiveEra("all")}
            className={`transition-colors ${
              activeEra === "all" ? "text-claret" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Eras
          </button>
          {ERA_ORDER.filter((k) => grouped.some((g) => g.key === k)).map((k) => (
            <button
              key={k}
              onClick={() => setActiveEra(k)}
              className={`transition-colors ${
                activeEra === k ? "text-claret" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {ERA_LABEL[k]}
            </button>
          ))}
          <Link to="/create" className="ml-auto ink-link">
            + Forge a new philosopher
          </Link>
        </div>

        {loading || authLoading ? (
          <p className="font-serif text-muted-foreground">Reading the catalog…</p>
        ) : visible.length === 0 ? (
          <p className="font-serif text-muted-foreground">No philosophers in this era yet.</p>
        ) : (
          <div className="space-y-20">
            {visible.map(({ key, items }) => (
              <section key={key}>
                <div className="flex items-baseline justify-between mb-8">
                  <h2 className="font-display text-3xl">{ERA_LABEL[key]}</h2>
                  <span className="small-caps text-muted-foreground">{ERA_KICKER[key]}</span>
                </div>
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
      <p className="small-caps text-muted-foreground mb-2">
        {character.era || "Built-in"}
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
