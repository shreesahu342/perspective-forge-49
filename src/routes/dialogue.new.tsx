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

const MODES: Array<{ value: Mode; label: string; desc: string }> = [
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
  const { characterId: initialCharacterId } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [characterId, setCharacterId] = useState<string | undefined>(initialCharacterId);
  const [mode, setMode] = useState<Mode>("debate");
  const [level, setLevel] = useState<Level>("adult");
  const [topic, setTopic] = useState("");
  const [userRole, setUserRole] = useState("");
  const [aiRole, setAiRole] = useState("");
  const [relationship, setRelationship] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // auth removed — anonymous sessions
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
    <div className="min-h-screen paper-bg">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="small-caps text-claret mb-4">Set the stage</p>
        <h1 className="font-display mb-12">Begin a dialogue.</h1>

        {/* Character */}
        <Field label="Interlocutor">
          <select
            value={characterId ?? ""}
            onChange={(e) => setCharacterId(e.target.value)}
            className="w-full bg-transparent border-b border-foreground/30 py-3 font-serif text-lg focus:outline-none focus:border-claret transition-colors"
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.era ? `· ${c.era}` : ""}
              </option>
            ))}
          </select>
          {selected && (
            <p className="mt-3 font-serif italic text-muted-foreground">“{selected.credo}”</p>
          )}
        </Field>

        {/* Mode */}
        <Field label="Mode">
          <div className="grid gap-3 md:grid-cols-3">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={`text-left border p-4 transition-colors ${
                  mode === m.value
                    ? "border-claret bg-claret/5"
                    : "border-foreground/20 hover:border-foreground/50"
                }`}
              >
                <p className="font-display text-xl mb-1">{m.label}</p>
                <p className="font-serif text-sm text-muted-foreground">{m.desc}</p>
              </button>
            ))}
          </div>
        </Field>

        {/* Cognitive level */}
        <Field label="Cognitive level">
          <div className="grid gap-3 md:grid-cols-4">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setLevel(l.value)}
                className={`text-left border p-3 transition-colors ${
                  level === l.value
                    ? "border-claret bg-claret/5"
                    : "border-foreground/20 hover:border-foreground/50"
                }`}
              >
                <p className="font-display text-lg">{l.label}</p>
                <p className="font-serif text-xs text-muted-foreground leading-snug">{l.desc}</p>
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
                className="w-full bg-transparent border-b border-foreground/30 py-3 font-serif text-lg focus:outline-none focus:border-claret transition-colors"
              />
            </Field>
            <Field label="They play">
              <input
                type="text"
                value={aiRole}
                onChange={(e) => setAiRole(e.target.value)}
                placeholder="e.g. a curious 5-year-old"
                className="w-full bg-transparent border-b border-foreground/30 py-3 font-serif text-lg focus:outline-none focus:border-claret transition-colors"
              />
            </Field>
            <Field label="Relationship">
              <div className="flex flex-wrap gap-2">
                {RELATIONSHIPS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRelationship(relationship === r ? "" : r)}
                    className={`small-caps border px-4 py-2 transition-colors ${
                      relationship === r
                        ? "border-claret bg-claret text-claret-foreground"
                        : "border-foreground/30 hover:border-claret hover:text-claret"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}

        {/* Topic / opening thesis */}
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
            className="w-full bg-transparent border-b border-foreground/30 py-3 font-serif text-lg focus:outline-none focus:border-claret transition-colors resize-none"
          />
        </Field>

        <div className="mt-12 flex items-center gap-6">
          <button
            onClick={handleBegin}
            disabled={busy || !characterId}
            className="bg-claret text-claret-foreground py-4 px-8 small-caps hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {busy ? "Opening…" : "Begin →"}
          </button>
          <Link to="/library" className="small-caps text-muted-foreground hover:text-claret transition-colors">
            Cancel
          </Link>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <p className="small-caps text-muted-foreground mb-4">{label}</p>
      {children}
    </div>
  );
}
