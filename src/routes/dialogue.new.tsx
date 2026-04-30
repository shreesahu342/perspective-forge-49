import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Character = Database["public"]["Tables"]["characters"]["Row"];
type Mode = Database["public"]["Enums"]["dialogue_mode"];
type Level = Database["public"]["Enums"]["cognitive_level"];

const searchSchema = z.object({
  characterId: z.string().optional(),
  mode: z.enum(["debate", "roleplay", "open"]).optional(),
});

export const Route = createFileRoute("/dialogue/new")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Begin a dialogue — The Mirror" },
      { name: "description", content: "Set the stage for a new philosophical dialogue." },
    ],
  }),
  component: NewDialoguePage,
});

const LEVELS: Array<{ value: Level; label: string; desc: string }> = [
  { value: "child", label: "Child", desc: "Short sentences. Concrete images. No jargon." },
  { value: "teen", label: "Teen", desc: "Vivid, with terms defined in passing." },
  { value: "adult", label: "Adult", desc: "Precise, intelligent, no lectures." },
  { value: "scholar", label: "Scholar", desc: "Technical vocabulary and rigor." },
];

type RoleplayPair = {
  id: string;
  emoji: string;
  title: string;
  userRole: string;
  aiRole: string;
  aiBehavior: string;
  hiddenTest: string;
};

const ROLEPLAY_PAIRS: RoleplayPair[] = [
  {
    id: "parent-child",
    emoji: "👨‍👩‍👧",
    title: "Parent ↔ Child",
    userRole: "Parent",
    aiRole: "Child",
    aiBehavior: "asks 'why', tests limits, misinterprets rules",
    hiddenTest: "do you explain or just assert authority?",
  },
  {
    id: "teacher-student",
    emoji: "👩‍🏫",
    title: "Teacher ↔ Student",
    userRole: "Teacher",
    aiRole: "Student",
    aiBehavior: "challenges relevance, asks basic/annoying doubts",
    hiddenTest: "can you simplify without frustration?",
  },
  {
    id: "authority-rebel",
    emoji: "⚖️",
    title: "Authority ↔ Rebel",
    userRole: "Authority",
    aiRole: "Rebel",
    aiBehavior: "pushes boundaries, rejects control",
    hiddenTest: "do you justify rules or hide behind power?",
  },
  {
    id: "rational-emotional",
    emoji: "🧠",
    title: "Rational ↔ Emotional",
    userRole: "Rational",
    aiRole: "Emotional",
    aiBehavior: "ignores logic, insists 'this feels right'",
    hiddenTest: "can you engage emotion without dismissing it?",
  },
  {
    id: "individual-society",
    emoji: "🌍",
    title: "Individual ↔ Society",
    userRole: "Individual",
    aiRole: "Society",
    aiBehavior: "pressures conformity",
    hiddenTest: "where do you bend?",
  },
  {
    id: "privileged-struggler",
    emoji: "💰",
    title: "Privileged ↔ Struggler",
    userRole: "Privileged",
    aiRole: "Struggler",
    aiBehavior: "rejects theory, brings raw reality",
    hiddenTest: "do you actually understand ground truth?",
  },
  {
    id: "scientist-believer",
    emoji: "🔬",
    title: "Scientist ↔ Believer",
    userRole: "Scientist",
    aiRole: "Believer",
    aiBehavior: "resists proof, values meaning",
    hiddenTest: "can you argue without dismissing purpose?",
  },
  {
    id: "past-present",
    emoji: "⏳",
    title: "Past Self ↔ Present You",
    userRole: "Present You",
    aiRole: "Past Self",
    aiBehavior: "insecure, reactive, naive",
    hiddenTest: "do you guide or judge?",
  },
  {
    id: "human-ai",
    emoji: "🤖",
    title: "Human ↔ AI (reverse mode)",
    userRole: "Human",
    aiRole: "Cold Optimizer AI",
    aiBehavior: "reduces everything to efficiency",
    hiddenTest: "what do you defend as 'human'?",
  },
  {
    id: "judge-accused",
    emoji: "⚖️",
    title: "Judge ↔ Accused",
    userRole: "Judge",
    aiRole: "Accused",
    aiBehavior: "rationalizes actions, shifts blame",
    hiddenTest: "do you seek truth or just punish?",
  },
  {
    id: "detective-suspect",
    emoji: "🕵️",
    title: "Detective ↔ Suspect",
    userRole: "Detective",
    aiRole: "Suspect",
    aiBehavior: "partial truths, contradictions",
    hiddenTest: "can you detect subtle lies?",
  },
  {
    id: "lover-avoidant",
    emoji: "💔",
    title: "Lover ↔ Avoidant Partner",
    userRole: "Lover",
    aiRole: "Avoidant Partner",
    aiBehavior: "withdraws, deflects emotions",
    hiddenTest: "do you chase, pressure, or understand?",
  },
  {
    id: "boss-employee",
    emoji: "🧑‍💼",
    title: "Boss ↔ Employee",
    userRole: "Boss",
    aiRole: "Employee",
    aiBehavior: "excuses, negotiation, quiet resentment",
    hiddenTest: "leadership vs control",
  },
  {
    id: "artist-critic",
    emoji: "🎨",
    title: "Artist ↔ Critic",
    userRole: "Artist",
    aiRole: "Critic",
    aiBehavior: "points flaws, dismisses intent",
    hiddenTest: "can you separate ego from work?",
  },
  {
    id: "monk-materialist",
    emoji: "🧘",
    title: "Monk ↔ Materialist",
    userRole: "Monk",
    aiRole: "Materialist",
    aiBehavior: "mocks abstraction, values comfort",
    hiddenTest: "meaning vs desire",
  },
  {
    id: "hero-villain",
    emoji: "⚔️",
    title: "Hero ↔ Villain",
    userRole: "Hero",
    aiRole: "Villain",
    aiBehavior: "reframes evil as necessary",
    hiddenTest: "are your morals consistent?",
  },
  {
    id: "creator-creation",
    emoji: "🧑‍🔬",
    title: "Creator ↔ Creation",
    userRole: "Creator",
    aiRole: "Creation",
    aiBehavior: "questions purpose, autonomy",
    hiddenTest: "control vs independence",
  },
  {
    id: "friend-friend",
    emoji: "🧑‍🤝‍🧑",
    title: "Friend ↔ Friend (hidden tension)",
    userRole: "Friend",
    aiRole: "Friend",
    aiBehavior: "subtle disagreement, indirect signals",
    hiddenTest: "can you read what's not said?",
  },
  {
    id: "therapist-patient",
    emoji: "🧠",
    title: "Therapist ↔ Patient",
    userRole: "Therapist",
    aiRole: "Patient",
    aiBehavior: "deflects, contradicts itself",
    hiddenTest: "do you listen or diagnose fast?",
  },
];

function getPairSides(title: string): { aiRole: string; userRole: string } {
  const [left, right] = title.split("↔").map((s) => s.trim());
  return {
    aiRole: left || "AI",
    userRole: right || "User",
  };
}

function NewDialoguePage() {
  const { characterId: initialCharacterId, mode: initialMode } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [characterId, setCharacterId] = useState<string | undefined>(initialCharacterId);
  const [mode, setMode] = useState<Mode>(initialMode ?? "debate");
  const [level, setLevel] = useState<Level>("adult");
  const [topic, setTopic] = useState("");
  const [userRole, setUserRole] = useState("");
  const [aiRole, setAiRole] = useState("");
  const [relationship, setRelationship] = useState("");
  const [pairId, setPairId] = useState<string>("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // anonymous
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("characters")
        .select("*")
        .order("is_builtin", { ascending: false })
        .order("category")
        .order("name");
      if (data) {
        setCharacters(data);
        if (!characterId && data[0]) setCharacterId(data[0].id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const selected = characters.find((c) => c.id === characterId);

  const pickerCharacters =
    mode === "roleplay"
      ? characters.filter((c) => c.category !== "philosopher")
      : characters;

  useEffect(() => {
    if (!characterId) return;
    if (!pickerCharacters.some((c) => c.id === characterId) && pickerCharacters[0]) {
      setCharacterId(pickerCharacters[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, characters]);

  useEffect(() => {
    if (mode !== "roleplay") {
      setPairId("");
      setUserRole("");
      setAiRole("");
      setRelationship("");
      setIsFlipped(false);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "roleplay") return;
    if (pairId) return;
    const first = ROLEPLAY_PAIRS[0];
    const sides = getPairSides(first.title);
    setPairId(first.id);
    setAiRole(isFlipped ? sides.userRole : sides.aiRole);
    setUserRole(isFlipped ? sides.aiRole : sides.userRole);
    setRelationship(first.title);
  }, [mode, pairId, isFlipped]);

  useEffect(() => {
    if (mode !== "roleplay" || !pairId) return;
    const pair = ROLEPLAY_PAIRS.find((p) => p.id === pairId);
    if (!pair) return;
    const sides = getPairSides(pair.title);
    setAiRole(isFlipped ? sides.userRole : sides.aiRole);
    setUserRole(isFlipped ? sides.aiRole : sides.userRole);
  }, [mode, pairId, isFlipped]);

  const handleBegin = async () => {
    if (!user || !characterId || !selected) {
      toast.error("Pick a character first.");
      return;
    }
    const trimmedTopic = topic.trim();
    if (mode === "debate" && !trimmedTopic) {
      toast.error("Opening thesis is required for debate mode.");
      return;
    }
    setBusy(true);
    try {
      const roleplayTitle = relationship
        ? `${relationship} Scene`
        : `Scene: ${userRole.trim() || "You"} ↔ ${aiRole.trim() || selected.name}`;
      const title =
        trimmedTopic
          ? trimmedTopic.slice(0, 80)
          : mode === "roleplay"
            ? roleplayTitle
            : `Dialogue with ${selected.name}`;

      const { data, error } = await supabase
        .from("dialogues")
        .insert({
          user_id: user.id,
          character_id: characterId,
          title,
          mode,
          cognitive_level: level,
          user_role: mode === "roleplay" ? userRole.trim() || null : null,
          ai_role: mode === "roleplay" ? aiRole.trim() || null : null,
          relationship: mode === "roleplay" ? relationship || null : null,
          topic: trimmedTopic || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      navigate({ to: "/dialogue/$dialogueId", params: { dialogueId: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not begin");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen arena-bg vignette text-foreground">
      <SiteHeader />
      <main className="relative mx-auto max-w-4xl px-6 py-12 md:py-16">
        <Link
          to={mode === "roleplay" ? "/" : "/library"}
          className="small-caps text-foreground/50 hover:text-claret transition-colors"
        >
          ← Back
        </Link>

        {/* Briefing header */}
        <div className="mt-6 mb-12 text-center">
          <p className="small-caps text-claret tracking-[0.4em] glitch-flicker mb-4">
            ◆  {mode === "roleplay" ? "Mode II · Roleplay" : "Dialogue Setup"}  ◆
          </p>
          <h1 className="font-display text-5xl md:text-6xl uppercase tracking-tight">
            {mode === "roleplay"
              ? <><span className="text-claret italic">Choose</span> your scene</>
              : <>Prepare the <span className="text-claret italic">dialogue</span></>}
          </h1>
        </div>

        <div className="hud-frame p-6 md:p-10 relative space-y-10">
          <span className="hud-corner tl" />
          <span className="hud-corner tr" />
          <span className="hud-corner bl" />
          <span className="hud-corner br" />

          {/* Character */}
          <Field label={mode === "roleplay" ? "Select your interlocutor" : "Interlocutor"}>
            {mode === "roleplay" ? (
              <select
                value={pairId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  const pair = ROLEPLAY_PAIRS.find((p) => p.id === nextId);
                  if (!pair) return;
                  const sides = getPairSides(pair.title);
                  setPairId(pair.id);
                  setAiRole(isFlipped ? sides.userRole : sides.aiRole);
                  setUserRole(isFlipped ? sides.aiRole : sides.userRole);
                  setRelationship(pair.title);
                }}
                className="game-input"
              >
                {ROLEPLAY_PAIRS.map((pair) => (
                  <option key={pair.id} value={pair.id} className="bg-background">
                    {pair.title}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-none border border-white/10 bg-black/20 px-4 py-4">
                <p className="font-display text-2xl uppercase tracking-tight text-foreground/90">
                  {selected?.name || "No interlocutor selected"}
                </p>
                {selected?.era && (
                  <p className="mt-1 small-caps text-foreground/45 text-[0.65rem] tracking-[0.25em]">
                    {selected.era}
                  </p>
                )}
              </div>
            )}
            {selected && (
              <p className="mt-3 font-serif italic text-foreground/60 text-sm">
                “{selected.credo}”
              </p>
            )}

            {mode === "roleplay" && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="small-caps text-foreground/55 text-[0.65rem] tracking-[0.2em]">
                  Your role: {userRole || "User"} · AI role: {aiRole || "AI"}
                </p>
                <button
                  type="button"
                  onClick={() => setIsFlipped((v) => !v)}
                  className={`option-pill px-3 py-1 text-[0.65rem] ${isFlipped ? "active" : ""}`}
                >
                  Swap AI/User roles
                </button>
              </div>
            )}
          </Field>

          {/* Cognitive level */}
          <Field label="Cognitive level">
            <div className="grid gap-3 md:grid-cols-4">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLevel(l.value)}
                  className={`option-pill ${level === l.value ? "active" : ""}`}
                >
                  <p className="font-display text-lg uppercase tracking-tight">{l.label}</p>
                  <p className="font-serif text-xs text-foreground/55 leading-snug">{l.desc}</p>
                </button>
              ))}
            </div>
          </Field>

          {/* Topic */}
          <Field label={mode === "roleplay" ? "Scene (optional)" : "Opening thesis"}>
            <textarea
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                mode === "roleplay"
                  ? "Describe the situation you're walking into…"
                  : "State the position you want them to attack, question, or refine."
              }
              className="game-input resize-none"
            />
          </Field>

          {/* Action bar */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-4">
            <button
              onClick={handleBegin}
              disabled={busy || !characterId || (mode === "debate" && !topic.trim())}
              className="btn-claret"
            >
              {busy ? "Opening…" : "⚔  Begin"}
            </button>
            <Link to="/library" className="btn-ghost">
              Cancel
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="small-caps text-claret/70 tracking-[0.3em] mb-4 text-[0.7rem] flex items-center gap-2">
        <span className="h-px w-8 bg-claret/40" />
        {label}
      </p>
      {children}
    </div>
  );
}
