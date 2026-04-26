import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";
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

const ALL_MODES: Array<{ value: Mode; label: string; desc: string }> = [
  { value: "debate", label: "Debate", desc: "They will press your assumptions and test your arguments." },
  { value: "roleplay", label: "Roleplay", desc: "Two roles in relation. Each speaks from inside their situation." },
  { value: "open", label: "Open", desc: "A wandering dialogue, in character, without a thesis to prove." },
];

const LEVELS: Array<{ value: Level; label: string; desc: string }> = [
  { value: "child", label: "Child", desc: "Short sentences. Concrete images. No jargon." },
  { value: "teen", label: "Teen", desc: "Vivid, with terms defined in passing." },
  { value: "adult", label: "Adult", desc: "Precise, intelligent, no lectures." },
  { value: "scholar", label: "Scholar", desc: "Technical vocabulary and rigor." },
];

const RELATIONSHIPS = ["authority", "care", "conflict", "mentorship", "dependence", "rivalry"];

function NewDialoguePage() {
  const { characterId: initialCharacterId, mode: initialMode } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const { unlockedIds } = usePoints();
  const navigate = useNavigate();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [characterId, setCharacterId] = useState<string | undefined>(initialCharacterId);
  const [mode, setMode] = useState<Mode>(initialMode ?? "debate");
  const [level, setLevel] = useState<Level>("adult");
  const [topic, setTopic] = useState("");
  const [userRole, setUserRole] = useState("");
  const [aiRole, setAiRole] = useState("");
  const [relationship, setRelationship] = useState("");
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
  const isPhilosopher = selected?.category === "philosopher";

  const availableModes = isPhilosopher
    ? ALL_MODES.filter((m) => m.value !== "roleplay")
    : ALL_MODES;

  useEffect(() => {
    if (isPhilosopher && mode === "roleplay") setMode("debate");
  }, [isPhilosopher, mode]);

  // Hide locked philosophers — only unlocked or free characters can be engaged.
  const accessible = characters.filter(
    (c) => c.unlock_cost === 0 || unlockedIds.has(c.id),
  );
  const pickerCharacters =
    mode === "roleplay" ? accessible.filter((c) => c.category !== "philosopher") : accessible;

  useEffect(() => {
    if (!characterId) return;
    if (!pickerCharacters.some((c) => c.id === characterId) && pickerCharacters[0]) {
      setCharacterId(pickerCharacters[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, characters]);

  const handleBegin = async () => {
    if (!user || !characterId || !selected) {
      toast.error("Pick a character first.");
      return;
    }
    setBusy(true);
    try {
      const title =
        topic.trim()
          ? topic.trim().slice(0, 80)
          : `${mode === "roleplay" ? "Scene" : "Dialogue"} with ${selected.name}`;

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
          topic: topic.trim() || null,
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
            ◆  {mode === "roleplay" ? "Mode II · Roleplay" : "Mode I · Debate"} · Briefing  ◆
          </p>
          <h1 className="font-display text-5xl md:text-6xl uppercase tracking-tight">
            Set the <span className="text-claret italic">stage</span>
          </h1>
        </div>

        <div className="hud-frame p-6 md:p-10 relative space-y-10">
          <span className="hud-corner tl" />
          <span className="hud-corner tr" />
          <span className="hud-corner bl" />
          <span className="hud-corner br" />

          {/* Character */}
          <Field label={mode === "roleplay" ? "Cast your interlocutor" : "Interlocutor"}>
            <select
              value={characterId ?? ""}
              onChange={(e) => setCharacterId(e.target.value)}
              className="game-input"
            >
              {pickerCharacters.map((c) => (
                <option key={c.id} value={c.id} className="bg-background">
                  {c.name} {c.era ? `· ${c.era}` : ""}
                </option>
              ))}
            </select>
            {selected && (
              <p className="mt-3 font-serif italic text-foreground/60 text-sm">
                “{selected.credo}”
              </p>
            )}
            {mode === "roleplay" && (
              <p className="mt-2 small-caps text-foreground/40 text-[0.65rem] tracking-[0.25em]">
                Philosophers are reserved for Mode I (Debate).
              </p>
            )}
          </Field>

          {/* Mode */}
          <Field label="Mode">
            <div
              className={`grid gap-3 ${
                availableModes.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"
              }`}
            >
              {availableModes.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  className={`option-pill ${mode === m.value ? "active" : ""}`}
                >
                  <p className="font-display text-xl mb-1 uppercase tracking-tight">{m.label}</p>
                  <p className="font-serif text-xs text-foreground/55 leading-snug">{m.desc}</p>
                </button>
              ))}
            </div>
            {isPhilosopher && (
              <p className="mt-3 small-caps text-foreground/40 text-[0.65rem] tracking-[0.25em]">
                Roleplay is reserved for Mode II — pick an everyday role to use it.
              </p>
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

          {/* Roleplay extras */}
          {mode === "roleplay" && (
            <>
              <Field label="You play">
                <input
                  type="text"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  placeholder="e.g. a worried parent"
                  className="game-input"
                />
              </Field>
              <Field label="They play">
                <input
                  type="text"
                  value={aiRole}
                  onChange={(e) => setAiRole(e.target.value)}
                  placeholder="e.g. a curious 5-year-old"
                  className="game-input"
                />
              </Field>
              <Field label="Relationship">
                <div className="flex flex-wrap gap-2">
                  {RELATIONSHIPS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRelationship(relationship === r ? "" : r)}
                      className={`option-pill px-4 py-2 ${relationship === r ? "active" : ""}`}
                    >
                      <span className="small-caps text-[0.7rem]">{r}</span>
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}

          {/* Topic */}
          <Field label={mode === "roleplay" ? "Scene (optional)" : "Opening thesis (optional)"}>
            <textarea
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                mode === "roleplay"
                  ? "Describe the situation you're walking into…"
                  : "Offer a position for them to test, or leave blank and let them open."
              }
              className="game-input resize-none"
            />
          </Field>

          {/* Action bar */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-4">
            <button onClick={handleBegin} disabled={busy || !characterId} className="btn-claret">
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
