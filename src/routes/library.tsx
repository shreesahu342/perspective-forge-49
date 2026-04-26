import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";
import { SiteHeader } from "@/components/site-header";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

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
        content: "Choose an era and summon a philosopher to debate.",
      },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const { points, unlockedIds, refresh: refreshPoints } = usePoints();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEra, setActiveEra] = useState<EraKey | "all">("all");
  const [unlocking, setUnlocking] = useState<string | null>(null);

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

  const visibleRoster = useMemo(() => {
    if (activeEra === "all") return characters;
    return grouped.find((g) => g.key === activeEra)?.items ?? [];
  }, [activeEra, characters, grouped]);

  const handleUnlock = async (c: Character) => {
    if (unlocking) return;
    if (points < c.unlock_cost) {
      toast.error(`Need ${c.unlock_cost - points} more points. Win roleplay scenes to earn them.`);
      return;
    }
    if (!confirm(`Unlock ${c.name} for ${c.unlock_cost} points?`)) return;
    setUnlocking(c.id);
    try {
      const { error } = await supabase.rpc("unlock_character", { _character_id: c.id });
      if (error) throw error;
      await refreshPoints();
      toast.success(`${c.name} unlocked.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not unlock");
    } finally {
      setUnlocking(null);
    }
  };

  return (
    <div className="min-h-screen arena-bg vignette text-foreground">
      <SiteHeader />
      <main className="relative mx-auto max-w-6xl px-6 py-12 md:py-16">
        <Link
          to="/"
          className="small-caps text-foreground/50 hover:text-claret transition-colors text-[0.7rem] tracking-[0.25em]"
        >
          ← Back to entrance
        </Link>

        {/* Briefing header */}
        <div className="mt-6 mb-10 text-center">
          <p className="small-caps text-claret tracking-[0.4em] glitch-flicker mb-4">
            ◆  Mode I · Debate  ◆
          </p>
          <h1 className="font-display text-5xl md:text-7xl uppercase tracking-tight">
            Choose <span className="text-claret italic">your era</span>
          </h1>
          <p className="mt-5 mx-auto max-w-2xl font-serif text-foreground/70 leading-relaxed">
            Each age forged a different way of arguing. Select an era — then
            summon the mind whose reasoning you wish to test yourself against.
          </p>
        </div>

        {loading || authLoading ? (
          <p className="text-center font-serif text-foreground/50 py-20">Reading the catalog…</p>
        ) : (
          <>
            {/* Era dropdown selector */}
            <div className="hud-frame relative p-5 md:p-6 mb-10 flex flex-wrap items-center gap-4">
              <span className="hud-corner tl" />
              <span className="hud-corner br" />
              <span className="small-caps text-claret/80 text-[0.65rem] tracking-[0.3em] flex items-center gap-2">
                <span className="h-px w-8 bg-claret/40" />
                Filter by Era
              </span>
              <select
                value={activeEra}
                onChange={(e) => setActiveEra(e.target.value as EraKey | "all")}
                className="game-input flex-1 min-w-[200px]"
              >
                <option value="all" className="bg-background">
                  All Eras ({characters.length} philosophers)
                </option>
                {grouped.map((g) => (
                  <option key={g.key} value={g.key} className="bg-background">
                    {ERA_LABEL[g.key]} · {ERA_KICKER[g.key]} ({g.items.length})
                  </option>
                ))}
              </select>
            </div>

            {/* Roster */}
            {visibleRoster.length === 0 ? (
              <p className="text-center font-serif italic text-foreground/40 py-16">
                No philosophers in this era yet.
              </p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {visibleRoster.map((c) => (
                  <PhilosopherCard
                    key={c.id}
                    character={c}
                    isUnlocked={unlockedIds.has(c.id) || c.unlock_cost === 0}
                    canAfford={points >= c.unlock_cost}
                    busy={unlocking === c.id}
                    onUnlock={() => handleUnlock(c)}
                  />
                ))}
              </div>
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

function PhilosopherCard({
  character,
  isUnlocked,
  canAfford,
  busy,
  onUnlock,
}: {
  character: Character;
  isUnlocked: boolean;
  canAfford: boolean;
  busy: boolean;
  onUnlock: () => void;
}) {
  const initial = character.name.trim().charAt(0).toUpperCase();

  return (
    <article className={`combatant-card relative p-6 ${isUnlocked ? "" : "opacity-90"}`}>
      <span className="hud-corner tl" />
      <span className="hud-corner tr" />
      <span className="hud-corner bl" />
      <span className="hud-corner br" />

      <div className="relative z-10 flex gap-4 items-start">
        <div className={`combatant-sigil shrink-0 ${isUnlocked ? "" : "grayscale opacity-40"}`}>
          {isUnlocked ? initial : "✕"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="small-caps text-foreground/40 text-[0.65rem] mb-1.5">
            {character.era || "Built-in"}
          </p>
          <h3
            className={`font-display text-xl uppercase tracking-tight leading-tight ${
              isUnlocked ? "text-foreground/95" : "text-foreground/60"
            }`}
          >
            {character.name}
          </h3>
        </div>
      </div>

      <p className="relative z-10 mt-5 font-serif italic text-sm text-foreground/65 leading-relaxed line-clamp-3">
        “{character.credo}”
      </p>

      <div className="relative z-10 mt-5 pt-4 border-t border-white/10">
        {isUnlocked ? (
          <Link
            to="/character/$characterId"
            params={{ characterId: character.id }}
            className="flex items-center justify-between group"
          >
            <span className="small-caps text-claret/80 text-[0.65rem] group-hover:tracking-[0.3em] transition-all">
              ⚔  Engage
            </span>
            <span className="text-claret group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        ) : (
          <button
            onClick={onUnlock}
            disabled={busy || !canAfford}
            className="w-full flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span className="small-caps text-foreground/50 text-[0.65rem] tracking-[0.25em] flex items-center gap-2">
              <span className="text-claret">🔒</span>
              {busy ? "Unlocking…" : canAfford ? "Unlock" : "Locked"}
            </span>
            <span
              className={`small-caps text-[0.65rem] tracking-[0.2em] flex items-center gap-1.5 ${
                canAfford ? "text-claret" : "text-foreground/40"
              }`}
            >
              <span>◈</span>
              <span className="font-mono font-semibold">{character.unlock_cost}</span>
              <span>PTS</span>
            </span>
          </button>
        )}
      </div>
    </article>
  );
}
