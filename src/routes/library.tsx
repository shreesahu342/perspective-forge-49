import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import type { Database } from "@/integrations/supabase/types";

type Character = Database["public"]["Tables"]["characters"]["Row"];

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

const ERA_SIGIL: Record<EraKey, string> = {
  ancient: "Ⅰ",
  medieval: "Ⅱ",
  enlightenment: "Ⅲ",
  nineteenth: "Ⅳ",
  twentieth: "Ⅴ",
  contemporary: "Ⅵ",
};

const ERA_ORDER: EraKey[] = [
  "ancient",
  "medieval",
  "enlightenment",
  "nineteenth",
  "twentieth",
  "contemporary",
];

function bucketEra(era: string | null): EraKey {
  if (!era) return "contemporary";
  const lowered = era.toLowerCase();
  const isBCE = /bce|b\.c\./.test(lowered);
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
      { title: "Choose an Era — The Mirror" },
      {
        name: "description",
        content:
          "Choose an era and summon a philosopher to debate. From the Ancients to the Contemporary mind.",
      },
      { property: "og:title", content: "Choose an Era — The Mirror" },
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
  const [activeEra, setActiveEra] = useState<EraKey | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
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
    return ERA_ORDER.map((k) => ({ key: k, items: buckets.get(k) ?? [] }));
  }, [characters]);

  const eraData = grouped.find((g) => g.key === activeEra);

  return (
    <div className="min-h-screen arena-bg vignette text-foreground">
      <SiteHeader />
      <main className="relative mx-auto max-w-6xl px-6 py-12 md:py-16">
        {/* Mission briefing header */}
        <div className="mb-10 text-center">
          <p className="small-caps text-claret tracking-[0.4em] glitch-flicker mb-4">
            ◆  Mode I · Debate  ◆
          </p>
          <h1 className="font-display text-5xl md:text-7xl uppercase tracking-tight">
            Choose <span className="text-claret italic">your era</span>
          </h1>
          <p className="mt-5 mx-auto max-w-2xl font-serif text-foreground/70 leading-relaxed">
            Each age forged a different way of arguing. Select a chapter — then
            summon the mind whose reasoning you wish to test yourself against.
          </p>
        </div>

        {loading || authLoading ? (
          <p className="text-center font-serif text-foreground/50 py-20">
            Reading the catalog…
          </p>
        ) : (
          <>
            {/* Chapter / era selector grid */}
            <section className="mb-12">
              <p className="small-caps text-foreground/40 text-center tracking-[0.4em] mb-6">
                ⟢  Select Chapter  ⟣
              </p>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {grouped.map((g) => {
                  const isActive = activeEra === g.key;
                  const empty = g.items.length === 0;
                  return (
                    <button
                      key={g.key}
                      onClick={() => !empty && setActiveEra(isActive ? null : g.key)}
                      disabled={empty}
                      className={`era-tile ${isActive ? "active" : ""} ${
                        empty ? "opacity-40 cursor-not-allowed" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="font-display text-3xl text-claret/80 leading-none">
                          {ERA_SIGIL[g.key]}
                        </span>
                        <span className="small-caps text-foreground/40 text-[0.65rem]">
                          {g.items.length} {g.items.length === 1 ? "mind" : "minds"}
                        </span>
                      </div>
                      <p className="font-display text-xl uppercase tracking-tight text-foreground/90">
                        {ERA_LABEL[g.key]}
                      </p>
                      <p className="small-caps text-foreground/40 mt-1 text-[0.65rem]">
                        {ERA_KICKER[g.key]}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Roster reveal */}
            {activeEra && eraData && (
              <section className="mt-16 animate-fade-in">
                <div className="ornament mb-10">
                  <span className="font-display text-claret text-2xl">
                    {ERA_SIGIL[activeEra]}
                  </span>
                </div>
                <div className="text-center mb-10">
                  <p className="small-caps text-foreground/40 tracking-[0.3em] mb-2">
                    Roster · {ERA_KICKER[activeEra]}
                  </p>
                  <h2 className="font-display text-4xl md:text-5xl uppercase">
                    The {ERA_LABEL[activeEra]} <span className="text-claret">Minds</span>
                  </h2>
                </div>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {eraData.items.map((c) => (
                    <CombatantCard key={c.id} character={c} />
                  ))}
                </div>
              </section>
            )}

            {!activeEra && (
              <p className="text-center small-caps text-foreground/30 mt-12 tracking-[0.3em]">
                ↑  Select a chapter to reveal its philosophers  ↑
              </p>
            )}

            {/* Forge entry */}
            <div className="mt-20 text-center">
              <Link
                to="/create"
                className="inline-flex items-center gap-3 small-caps text-foreground/50 hover:text-claret transition-colors"
              >
                <span className="h-px w-12 bg-current opacity-50" />
                Forge a new philosopher
                <span className="h-px w-12 bg-current opacity-50" />
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function CombatantCard({ character }: { character: Character }) {
  const initial = character.name.trim().charAt(0).toUpperCase();
  return (
    <Link
      to="/character/$characterId"
      params={{ characterId: character.id }}
      className="combatant-card group block p-6"
    >
      <span className="hud-corner tl" />
      <span className="hud-corner tr" />
      <span className="hud-corner bl" />
      <span className="hud-corner br" />

      <div className="relative z-10 flex gap-4 items-start">
        <div className="combatant-sigil shrink-0">{initial}</div>
        <div className="min-w-0">
          <p className="small-caps text-foreground/40 text-[0.65rem] mb-1.5">
            {character.era || "Built-in"}
          </p>
          <h3 className="font-display text-xl uppercase tracking-tight text-foreground/95 group-hover:text-claret transition-colors leading-tight">
            {character.name}
          </h3>
        </div>
      </div>

      <p className="relative z-10 mt-5 font-serif italic text-sm text-foreground/65 leading-relaxed line-clamp-3">
        “{character.credo}”
      </p>

      <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="small-caps text-claret/80 text-[0.65rem] group-hover:tracking-[0.3em] transition-all">
          Engage
        </span>
        <span className="text-claret group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </Link>
  );
}
