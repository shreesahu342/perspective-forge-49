import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";
import { SiteHeader } from "@/components/site-header";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Dialogue = Database["public"]["Tables"]["dialogues"]["Row"];
type Character = Database["public"]["Tables"]["characters"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];
type Level = Database["public"]["Enums"]["cognitive_level"];

const LEVEL_LABEL: Record<Level, string> = {
  child: "Child",
  teen: "Teen",
  adult: "Adult",
  scholar: "Scholar",
};

export const Route = createFileRoute("/dialogue/$dialogueId")({
  head: () => ({
    meta: [
      { title: "Dialogue — The Mirror" },
      { name: "description", content: "An ongoing philosophical dialogue." },
    ],
  }),
  component: DialoguePage,
});

function DialoguePage() {
  const { dialogueId } = Route.useParams();
  const { user, session, loading: authLoading } = useAuth();
  const { refresh: refreshPoints } = usePoints();
  const navigate = useNavigate();

  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [input, setInput] = useState("");
  const [claiming, setClaiming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // anonymous
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data: d } = await supabase.from("dialogues").select("*").eq("id", dialogueId).single();
      if (!active) return;
      if (!d) {
        setLoading(false);
        return;
      }
      setDialogue(d);

      const [{ data: c }, { data: m }] = await Promise.all([
        supabase.from("characters").select("*").eq("id", d.character_id!).single(),
        supabase
          .from("messages")
          .select("*")
          .eq("dialogue_id", dialogueId)
          .order("created_at", { ascending: true }),
      ]);
      if (!active) return;
      setCharacter(c);
      setMessages(m ?? []);
      setLoading(false);

      if ((m?.length ?? 0) === 0) {
        void runStream();
      }
    })();
    return () => {
      active = false;
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dialogueId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingText]);

  const runStream = async () => {
    if (!session) return;
    setStreaming(true);
    setStreamingText("");
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/dialogue/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ dialogueId }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Stream failed" }));
        if (res.status === 429) toast.error("They need a moment. Try again shortly.");
        else if (res.status === 402) toast.error("Out of AI credits. Add credits to continue.");
        else toast.error(err.error || "Something went wrong.");
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";
      let done = false;

      while (!done) {
        const { value, done: rDone } = await reader.read();
        if (rDone) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === "string") {
              assembled += delta;
              setStreamingText(assembled);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      const { data: m } = await supabase
        .from("messages")
        .select("*")
        .eq("dialogue_id", dialogueId)
        .order("created_at", { ascending: true });
      if (m) setMessages(m);
      setStreamingText("");
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Connection lost.");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleSend = async () => {
    if (!user || !input.trim() || streaming) return;
    const text = input.trim();
    setInput("");
    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({ dialogue_id: dialogueId, role: "user", content: text })
      .select("*")
      .single();
    if (error) {
      toast.error(error.message);
      setInput(text);
      return;
    }
    if (inserted) setMessages((prev) => [...prev, inserted]);
    await runStream();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChangeLevel = async (lvl: Level) => {
    if (!dialogue) return;
    const { error } = await supabase
      .from("dialogues")
      .update({ cognitive_level: lvl })
      .eq("id", dialogue.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDialogue({ ...dialogue, cognitive_level: lvl });
    toast.success(`Cognitive level: ${LEVEL_LABEL[lvl]}`);
  };

  const handleClaimVictory = async () => {
    if (!dialogue || claiming) return;
    if (!confirm("Declare yourself the victor of this scene? This locks the dialogue and awards points.")) return;
    setClaiming(true);
    try {
      const { data, error } = await supabase.rpc("claim_victory", { _dialogue_id: dialogueId });
      if (error) throw error;
      await refreshPoints();
      setDialogue({ ...dialogue, victory_claimed: true });
      toast.success(`Victory claimed. Total: ◈ ${data} pts`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not claim");
    } finally {
      setClaiming(false);
    }
  };

  const speakerNameForAi = dialogue?.ai_role || character?.name || "Other";
  const speakerNameForUser = dialogue?.user_role || "You";
  const aiInitial = speakerNameForAi.trim().charAt(0).toUpperCase();
  const canClaim =
    dialogue?.mode === "roleplay" &&
    !dialogue.victory_claimed &&
    messages.filter((m) => m.role === "user").length >= 3;

  return (
    <div className="min-h-screen arena-bg vignette text-foreground flex flex-col">
      <SiteHeader />
      <main className="relative flex-1 mx-auto w-full max-w-4xl px-4 md:px-6 py-8 md:py-12">
        {loading ? (
          <p className="text-center font-serif text-foreground/50 py-20">
            Opening the conversation…
          </p>
        ) : !dialogue ? (
          <p className="font-serif text-center py-20">Dialogue not found.</p>
        ) : (
          <>
            {/* Match HUD header */}
            <div className="mb-6">
              <Link
                to="/dialogues"
                className="small-caps text-foreground/50 hover:text-claret transition-colors text-[0.7rem] tracking-[0.25em]"
              >
                ← Archive
              </Link>
            </div>

            <div className="hud-frame p-5 md:p-7 mb-6 relative">
              <span className="hud-corner tl" />
              <span className="hud-corner tr" />
              <span className="hud-corner bl" />
              <span className="hud-corner br" />

              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-full border border-claret/30" />
                  <div className="absolute inset-0 rounded-full border-t border-claret/60 animate-[spin_8s_linear_infinite]" />
                  <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center ember-glow">
                    <span className="font-display text-3xl md:text-4xl text-claret">
                      {aiInitial}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="small-caps text-claret tracking-[0.3em] text-[0.65rem] mb-1">
                    {dialogue.mode === "debate"
                      ? "⚔ Debate in progress"
                      : dialogue.mode === "roleplay"
                      ? "✦ Scene in progress"
                      : "◆ Open dialogue"}
                  </p>
                  <h1 className="font-display text-2xl md:text-3xl uppercase tracking-tight leading-tight truncate">
                    {dialogue.title}
                  </h1>
                  {character && (
                    <p className="small-caps text-foreground/50 text-[0.65rem] tracking-[0.25em] mt-1">
                      vs. {character.name}
                    </p>
                  )}
                </div>
              </div>

              {dialogue.mode === "roleplay" && (dialogue.user_role || dialogue.ai_role) && (
                <p className="mt-4 pt-4 border-t border-white/10 small-caps text-foreground/50 text-[0.65rem] tracking-[0.25em]">
                  {dialogue.user_role || "You"} ↔ {dialogue.ai_role || character?.name}
                  {dialogue.relationship ? ` · ${dialogue.relationship}` : ""}
                </p>
              )}

              {dialogue.topic && (
                <p className="mt-4 pt-4 border-t border-white/10 font-serif italic text-foreground/65 text-sm">
                  ▸ {dialogue.topic}
                </p>
              )}

              {/* Level selector */}
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3 small-caps text-[0.65rem] tracking-[0.25em]">
                <span className="text-foreground/40">Level:</span>
                {(["child", "teen", "adult", "scholar"] as Level[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => handleChangeLevel(l)}
                    className={`px-2 py-0.5 transition-colors ${
                      dialogue.cognitive_level === l
                        ? "text-claret border-b border-claret"
                        : "text-foreground/50 hover:text-foreground"
                    }`}
                  >
                    {LEVEL_LABEL[l]}
                  </button>
                ))}
              </div>
            </div>

            {/* Arena — the dialogue surface */}
            <div className="arena-panel scanlines relative mb-6">
              <span className="hud-corner tl" />
              <span className="hud-corner tr" />
              <span className="hud-corner bl" />
              <span className="hud-corner br" />

              <div className="relative z-10 max-h-[60vh] overflow-y-auto">
                {messages.length === 0 && !streaming && (
                  <p className="font-serif italic text-foreground/40 p-10 text-center">
                    Silence. Waiting for the first word.
                  </p>
                )}
                {messages.map((m) => (
                  <Turn
                    key={m.id}
                    speaker={m.role === "assistant" ? speakerNameForAi : speakerNameForUser}
                    isSelf={m.role === "user"}
                    text={m.content}
                  />
                ))}
                {streaming && (
                  <Turn
                    speaker={speakerNameForAi}
                    isSelf={false}
                    text={streamingText || "…"}
                    cursor={!!streamingText}
                  />
                )}
                <div ref={endRef} />
              </div>
            </div>

            {/* Composer */}
            <div className="hud-frame p-4 md:p-5 relative">
              <span className="hud-corner tl" />
              <span className="hud-corner br" />
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  streaming
                    ? "They are speaking…"
                    : "Speak. (Enter to send, Shift+Enter for line break.)"
                }
                disabled={streaming}
                className="w-full bg-transparent font-serif text-base md:text-lg leading-relaxed focus:outline-none resize-none placeholder:text-foreground/35 disabled:opacity-50 text-foreground"
              />
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-4">
                <p className="small-caps text-foreground/40 text-[0.65rem] tracking-[0.25em]">
                  {streaming ? "▸ transmitting…" : "▸ ready"}
                </p>
                <button
                  onClick={handleSend}
                  disabled={streaming || !input.trim()}
                  className="btn-claret"
                  style={{ padding: "0.7rem 1.5rem" }}
                >
                  Send →
                </button>
              </div>
              {dialogue.mode === "roleplay" && (
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
                  <p className="small-caps text-foreground/40 text-[0.65rem] tracking-[0.25em]">
                    {dialogue.victory_claimed
                      ? "◈ Victory claimed"
                      : canClaim
                      ? "▸ End the scene to claim points"
                      : "▸ Speak at least 3 turns to claim victory"}
                  </p>
                  <button
                    onClick={handleClaimVictory}
                    disabled={!canClaim || claiming || dialogue.victory_claimed}
                    className="btn-ghost disabled:opacity-40"
                  >
                    {claiming ? "Claiming…" : dialogue.victory_claimed ? "Claimed" : "◈  Declare Victory"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Turn({
  speaker,
  isSelf,
  text,
  cursor,
}: {
  speaker: string;
  isSelf: boolean;
  text: string;
  cursor?: boolean;
}) {
  return (
    <div className={`turn-row ${isSelf ? "is-self" : ""}`}>
      <div className={`turn-tag ${isSelf ? "is-self" : ""}`}>{speaker}</div>
      <div
        className={`font-serif text-base md:text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap ${
          cursor ? "quill-cursor" : ""
        }`}
      >
        {text}
      </div>
    </div>
  );
}
