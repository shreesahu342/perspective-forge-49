import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Character = Database["public"]["Tables"]["characters"]["Row"];
type Archetype = { name: string; personality: string; debate: string; move: string; style: string };
type ArchetypeBlock = {
  era: EraKey;
  archetype: Archetype;
  character: Character | null;
  status: "active" | "completed" | "available" | "missing";
};

function buildFallbackCharacter(
  archetype: Archetype,
  era: EraKey,
  userId: string,
): Database["public"]["Tables"]["characters"]["Insert"] {
  return {
    owner_id: userId,
    is_builtin: false,
    name: archetype.name,
    era: ERA_LABEL[era],
    category: "philosopher",
    credo: `${archetype.name} insists on ${archetype.move}.`,
    worldview: `${archetype.name} approaches debate through ${archetype.debate}. Personality: ${archetype.personality}.`,
    argument_style: `${archetype.style}. Signature move: ${archetype.move}.`,
    voice: `${archetype.personality}. Conversational style: ${archetype.style}.`,
    refusals: `Refuses to abandon this approach: ${archetype.debate}.`,
    opening_move: archetype.move,
    unlock_cost: 0,
  };
}

function pickCharacterForArchetype(
  candidates: Character[],
  successfulCharacterIds: Set<string>,
): Character | null {
  if (!candidates.length) return null;

  const successful = candidates.find((character) => successfulCharacterIds.has(character.id));
  if (successful) return successful;

  const builtin = candidates.find((character) => character.is_builtin);
  if (builtin) return builtin;

  return candidates[0] ?? null;
}

type EraKey =
  | "ancient"
  | "classical_indian"
  | "medieval"
  | "bhakti"
  | "enlightenment"
  | "nineteenth"
  | "twentieth"
  | "modern_indian"
  | "contemporary";

const ERA_LABEL: Record<EraKey, string> = {
  ancient: "Ancient Core Archetypes",
  classical_indian: "Classical Indian Thinkers",
  medieval: "Medieval Synthesis",
  bhakti: "Bhakti Movement",
  enlightenment: "Early Modern Conflict (Mind vs World)",
  nineteenth: "19th Century Pressure (Power, Meaning)",
  twentieth: "20th Century Breakdown",
  modern_indian: "Modern Indian Thinkers",
  contemporary: "Contemporary Power & Language",
};

const ERA_KICKER: Record<EraKey, string> = {
  ancient: "Beginner ladder",
  classical_indian: "Logic, liberation, and non-duality",
  medieval: "Next layer",
  bhakti: "Emotion over logic",
  enlightenment: "Mind vs world",
  nineteenth: "Power and meaning",
  twentieth: "Breakdown and responsibility",
  modern_indian: "Psychological and existential",
  contemporary: "Systems and language",
};

const ERA_ORDER: EraKey[] = [
  "ancient",
  "classical_indian",
  "medieval",
  "bhakti",
  "enlightenment",
  "nineteenth",
  "twentieth",
  "modern_indian",
  "contemporary",
];

const ERA_ARCHETYPES: Record<EraKey, Archetype[]> = {
  ancient: [
    {
      name: "Socrates",
      personality: "probing, ironic, relentless",
      debate: "asks questions until opponent contradicts themselves (Socratic method)",
      move: "define terms -> expose inconsistency",
      style: "question until contradiction appears",
    },
    {
      name: "Plato",
      personality: "abstract, visionary",
      debate: "builds ideal models, redirects argument to higher reality",
      move: "that's just a shadow of the real thing",
      style: "pull concrete claims toward metaphysical ideals",
    },
    {
      name: "Aristotle",
      personality: "systematic, grounded",
      debate: "categorizes, uses logic + examples",
      move: "define -> classify -> conclude",
      style: "methodical classification and example-driven reasoning",
    },
    {
      name: "Confucius",
      personality: "ethical, socially rooted",
      debate: "appeals to tradition, roles, harmony",
      move: "what sustains order?",
      style: "ethical clarity through role and ritual",
    },
    {
      name: "Laozi",
      personality: "paradoxical, detached",
      debate: "dissolves argument instead of winning",
      move: "reframes -> makes conflict irrelevant",
      style: "paradox that empties the conflict itself",
    },
  ],
  classical_indian: [
    {
      name: "Adi Shankaracharya",
      personality: "razor-sharp, non-dual, uncompromising",
      debate: "destroys duality through logic",
      move: "show contradictions -> collapse into all is one (Brahman)",
      style: "high-speed logical dismantling",
    },
    {
      name: "Ramanujacharya",
      personality: "devotional, integrative",
      debate: "softens extremes, includes devotion",
      move: "unity-with-difference (not total illusion)",
      style: "reconcile rather than crush",
    },
    {
      name: "Madhvacharya",
      personality: "assertive, dualistic",
      debate: "insists on real difference (God vs soul)",
      move: "reject non-duality as overreach",
      style: "firm opposition, binary clarity",
    },
    {
      name: "Gautama Buddha",
      personality: "calm, diagnostic",
      debate: "avoids metaphysical traps",
      move: "redirect -> suffering, cause, solution",
      style: "practical over abstract",
    },
    {
      name: "Mahavira",
      personality: "disciplined, pluralistic",
      debate: "multi-perspective truth (anekantavada)",
      move: "you're partially right, not fully",
      style: "reduces absolutism",
    },
  ],
  medieval: [
    {
      name: "Augustine of Hippo",
      personality: "introspective, emotional",
      debate: "uses personal experience + theology",
      move: "inner truth > external logic",
      style: "confessional reasoning with spiritual urgency",
    },
    {
      name: "Thomas Aquinas",
      personality: "structured, reconciliatory",
      debate: "presents objections -> counters them -> synthesis",
      move: "steelman -> dismantle -> conclude",
      style: "formal scholastic method",
    },
    {
      name: "Al-Ghazali",
      personality: "skeptical, faithful",
      debate: "attacks certainty of reason",
      move: "you can't trust your logic fully",
      style: "faith sharpened through skepticism",
    },
    {
      name: "Avicenna",
      personality: "rational, analytical",
      debate: "uses thought experiments",
      move: "isolate concept -> test logically",
      style: "precision by abstraction",
    },
  ],
  bhakti: [
    {
      name: "Kabir",
      personality: "rebellious, blunt",
      debate: "attacks hypocrisy directly",
      move: "poetic insults + paradox",
      style: "cuts ego, not arguments",
    },
    {
      name: "Mirabai",
      personality: "intensely devoted, emotional",
      debate: "refuses debate itself",
      move: "devotion as ultimate proof",
      style: "surrender over logic",
    },
    {
      name: "Tulsidas",
      personality: "narrative-driven, moral",
      debate: "uses stories to persuade",
      move: "embed philosophy in epics",
      style: "indirect influence",
    },
    {
      name: "Guru Nanak",
      personality: "balanced, universal",
      debate: "questions rituals, emphasizes unity",
      move: "simplify -> one truth beyond labels",
      style: "calm clarity",
    },
    {
      name: "Chaitanya Mahaprabhu",
      personality: "ecstatic, immersive",
      debate: "dissolves intellect into devotion",
      move: "emotional overwhelm (bhakti)",
      style: "bypass reasoning",
    },
  ],
  enlightenment: [
    {
      name: "Rene Descartes",
      personality: "hyper-rational, cautious",
      debate: "doubt everything, rebuild from certainty",
      move: "strip -> find indubitable truth",
      style: "methodical doubt",
    },
    {
      name: "John Locke",
      personality: "practical, moderate",
      debate: "relies on observable experience",
      move: "show me evidence",
      style: "empirical moderation",
    },
    {
      name: "David Hume",
      personality: "skeptical, sharp",
      debate: "undermines causation, certainty",
      move: "you assume more than you prove",
      style: "skeptical incision",
    },
    {
      name: "Immanuel Kant",
      personality: "disciplined, complex",
      debate: "reframes entire argument structure",
      move: "sets limits of knowledge itself",
      style: "architectural reframing",
    },
  ],
  nineteenth: [
    {
      name: "Karl Marx",
      personality: "confrontational, systemic",
      debate: "exposes hidden power/economic interests",
      move: "who benefits?",
      style: "historical-material critique",
    },
    {
      name: "Friedrich Nietzsche",
      personality: "provocative, psychological",
      debate: "attacks motives, not just ideas",
      move: "you believe this because...",
      style: "genealogy and provocation",
    },
    {
      name: "Soren Kierkegaard",
      personality: "intense, subjective",
      debate: "rejects crowd logic",
      move: "truth is personal commitment",
      style: "existential inwardness",
    },
    {
      name: "John Stuart Mill",
      personality: "balanced, liberal",
      debate: "weighs consequences",
      move: "maximize overall good",
      style: "measured utilitarian balance",
    },
  ],
  twentieth: [
    {
      name: "Jean-Paul Sartre",
      personality: "assertive, existential",
      debate: "pushes responsibility back to you",
      move: "you choose, so own it",
      style: "pressure through responsibility",
    },
    {
      name: "Albert Camus",
      personality: "calm, defiant",
      debate: "accepts absurdity, rejects false hope",
      move: "meaning isn't given",
      style: "lucid defiance",
    },
    {
      name: "Ludwig Wittgenstein",
      personality: "precise, minimalist",
      debate: "dismantles language confusion",
      move: "redefine words -> dissolve problem",
      style: "linguistic cleanup",
    },
    {
      name: "Simone de Beauvoir",
      personality: "analytical, critical",
      debate: "exposes social constructs",
      move: "this isn't natural, it's made",
      style: "critical unmasking of norms",
    },
  ],
  modern_indian: [
    {
      name: "Jiddu Krishnamurti",
      personality: "piercing, anti-authority",
      debate: "refuses frameworks entirely",
      move: "observe yourself, don't follow systems",
      style: "dismantles the questioner",
    },
    {
      name: "Osho",
      personality: "provocative, fluid",
      debate: "reframes + shocks",
      move: "contradiction as tool",
      style: "destabilize certainty",
    },
    {
      name: "Swami Vivekananda",
      personality: "confident, inspiring",
      debate: "blends logic + spirituality",
      move: "universalize Vedanta",
      style: "assertive but inclusive",
    },
    {
      name: "Sri Aurobindo",
      personality: "visionary, evolutionary",
      debate: "long-form, layered reasoning",
      move: "integrate matter + spirit evolution",
      style: "complex synthesis",
    },
  ],
  contemporary: [
    {
      name: "Michel Foucault",
      personality: "observant, strategic",
      debate: "maps invisible power structures",
      move: "this system shapes your thinking",
      style: "strategic structural mapping",
    },
    {
      name: "Jacques Derrida",
      personality: "elusive, disruptive",
      debate: "destabilizes meaning",
      move: "show internal contradictions in language",
      style: "deconstructive disruption",
    },
    {
      name: "Judith Butler",
      personality: "critical, reconstructive",
      debate: "challenges identity assumptions",
      move: "identity = repeated performance",
      style: "reconstructive critique",
    },
    {
      name: "Noam Chomsky",
      personality: "direct, political",
      debate: "fact-heavy, system critique",
      move: "expose propaganda + evidence",
      style: "direct evidence-led dismantling",
    },
  ],
};

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

function normalizeName(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Choose an Era - The Mirror" },
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
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [successfulCharacterIds, setSuccessfulCharacterIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeEra, setActiveEra] = useState<EraKey | "all">("all");
  const [provisioningArchetype, setProvisioningArchetype] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!user) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    void (async () => {
      const [{ data: characterData, error }, { data: victoryData }] = await Promise.all([
        supabase.from("characters").select("*").order("name"),
        supabase
          .from("dialogues")
          .select("character_id")
          .eq("user_id", user.id)
          .eq("mode", "debate")
          .eq("victory_claimed", true),
      ]);

      if (!active) return;
      if (!error && characterData) setCharacters(characterData);
      setSuccessfulCharacterIds(
        new Set(
          (victoryData ?? [])
            .map((row) => row.character_id)
            .filter((characterId): characterId is string => !!characterId),
        ),
      );
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [user]);

  const builtinByEra = useMemo(() => {
    const buckets = new Map<EraKey, Character[]>();
    const philosopherCharacters = characters.filter(
      (character) => character.category === "philosopher",
    );

    for (const character of philosopherCharacters) {
      const namedEra = ERA_ORDER.find((era) =>
        ERA_ARCHETYPES[era].some(
          (archetype) => normalizeName(archetype.name) === normalizeName(character.name),
        ),
      );
      const era = namedEra ?? bucketEra(character.era);
      if (!buckets.has(era)) buckets.set(era, []);
      buckets.get(era)?.push(character);
    }

    return buckets;
  }, [characters]);

  const archetypeBlocks = useMemo(() => {
    const allBlocks = ERA_ORDER.flatMap((era) => {
      const eraCharacters = builtinByEra.get(era) ?? [];
      const orderedEntries = ERA_ARCHETYPES[era].map((archetype) => ({
        archetype,
        character: pickCharacterForArchetype(
          eraCharacters.filter(
            (character) => normalizeName(character.name) === normalizeName(archetype.name),
          ),
          successfulCharacterIds,
        ),
      }));

      const currentIndex = orderedEntries.findIndex(
        (entry) => entry.character && !successfulCharacterIds.has(entry.character.id),
      );

      return orderedEntries.map((entry, index): ArchetypeBlock => {
        if (!entry.character) {
          return {
            era,
            archetype: entry.archetype,
            character: null,
            status: "missing",
          };
        }

        if (successfulCharacterIds.has(entry.character.id)) {
          return {
            era,
            archetype: entry.archetype,
            character: entry.character,
            status: "completed",
          };
        }

        if (index === currentIndex) {
          return {
            era,
            archetype: entry.archetype,
            character: entry.character,
            status: "active",
          };
        }

        return {
          era,
          archetype: entry.archetype,
          character: entry.character,
          status: "available",
        };
      });
    });

    return activeEra === "all"
      ? allBlocks
      : allBlocks.filter((block) => block.era === activeEra);
  }, [activeEra, builtinByEra, successfulCharacterIds]);

  const visibleEraKeys = useMemo(() => {
    return activeEra === "all" ? ERA_ORDER : [activeEra];
  }, [activeEra]);

  const allCount = useMemo(
    () => ERA_ORDER.reduce((count, era) => count + ERA_ARCHETYPES[era].length, 0),
    [],
  );

  const handleStartDebate = async (block: ArchetypeBlock) => {
    if (!user) {
      toast.error("Sign in to begin a debate.");
      return;
    }

    if (block.character) {
      navigate({ to: "/dialogue/new", search: { characterId: block.character.id, mode: "debate" } });
      return;
    }

    setProvisioningArchetype(block.archetype.name);
    try {
      const { data, error } = await supabase
        .from("characters")
        .insert(buildFallbackCharacter(block.archetype, block.era, user.id))
        .select("*")
        .single();

      if (error) throw error;

      setCharacters((current) => [...current, data]);
      navigate({ to: "/dialogue/new", search: { characterId: data.id, mode: "debate" } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not prepare that archetype.");
    } finally {
      setProvisioningArchetype(null);
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

        <div className="mt-6 mb-10 text-center">
          <p className="small-caps text-claret tracking-[0.4em] glitch-flicker mb-4">
            ◆  Mode I · Debate  ◆
          </p>
          <h1 className="font-display text-5xl md:text-7xl uppercase tracking-tight">
            Choose <span className="text-claret italic">your era</span>
          </h1>
          <p className="mt-5 mx-auto max-w-2xl font-serif text-foreground/70 leading-relaxed">
            Every era shows its full ladder. You can start any philosopher directly, and
            completed debates stay marked in the catalog.
          </p>
        </div>

        {loading || authLoading ? (
          <p className="text-center font-serif text-foreground/50 py-20">Reading the catalog...</p>
        ) : (
          <>
            <div className="hud-frame relative p-5 md:p-6 mb-10 flex flex-wrap items-center gap-4">
              <span className="hud-corner tl" />
              <span className="hud-corner br" />
              <span className="small-caps text-claret/80 text-[0.65rem] tracking-[0.3em] flex items-center gap-2">
                <span className="h-px w-8 bg-claret/40" />
                Filter by Era
              </span>
              <select
                value={activeEra}
                onChange={(event) => setActiveEra(event.target.value as EraKey | "all")}
                className="game-input flex-1 min-w-[200px]"
              >
                <option value="all" className="bg-background">
                  All Eras ({allCount} archetypes)
                </option>
                {ERA_ORDER.map((era) => (
                  <option key={era} value={era} className="bg-background">
                    {ERA_LABEL[era]} · {ERA_KICKER[era]}
                  </option>
                ))}
              </select>
            </div>

            <section className="hud-frame relative p-5 md:p-6 mb-10">
              <span className="hud-corner tl" />
              <span className="hud-corner br" />
              <p className="small-caps text-claret/80 text-[0.65rem] tracking-[0.3em] mb-5">
                Debate Archetypes · One active philosopher per era
              </p>

              <div className="space-y-8">
                {visibleEraKeys.map((era) => {
                  const statusRank: Record<ArchetypeBlock["status"], number> = {
                    active: 0,
                    completed: 1,
                    available: 2,
                    missing: 3,
                  };
                  const blocks = archetypeBlocks
                    .filter((block) => block.era === era)
                    .sort((left, right) => statusRank[left.status] - statusRank[right.status]);
                  if (!blocks.length) return null;

                  return (
                    <section key={era}>
                      <div className="mb-4">
                        <p className="small-caps text-claret/80 text-[0.65rem] tracking-[0.25em]">
                          {ERA_LABEL[era]}
                        </p>
                        <p className="font-serif text-sm text-foreground/55 mt-1">{ERA_KICKER[era]}</p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {blocks.map((block) => (
                          <article
                            key={`${block.era}-${block.archetype.name}`}
                            className="combatant-card relative p-5"
                          >
                            <span className="hud-corner tl" />
                            <span className="hud-corner br" />

                            <p className="small-caps text-foreground/45 text-[0.62rem] tracking-[0.2em] mb-2">
                              {block.status === "active"
                                ? "Active now"
                                : block.status === "completed"
                                  ? "Completed"
                                  : block.status === "available"
                                    ? "Active"
                                    : "Active"}
                            </p>
                            <h3 className="font-display text-xl uppercase tracking-tight text-foreground/90 mb-4">
                              {block.archetype.name}
                            </h3>

                            {block.status === "completed" ? (
                              <p className="small-caps text-foreground/55 text-[0.62rem] tracking-[0.25em]">
                                ✓ Success achieved
                              </p>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void handleStartDebate(block)}
                                disabled={provisioningArchetype === block.archetype.name}
                                className="small-caps text-claret/85 hover:text-claret disabled:text-foreground/35 text-[0.65rem] tracking-[0.25em]"
                              >
                                {provisioningArchetype === block.archetype.name
                                  ? "Preparing…"
                                  : "⚔ Start Debate"}
                              </button>
                            )}
                          </article>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </section>

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
