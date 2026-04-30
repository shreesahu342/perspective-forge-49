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
type MessageRole = Database["public"]["Enums"]["message_role"];

type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [input, setInput] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [cruxBursts, setCruxBursts] = useState<Array<{ id: number; amount: number }>>([]);
  const messageListRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const burstIdRef = useRef(0);
  const burstTimeoutsRef = useRef<number[]>([]);

  const loadSessionMessages = async (accessToken: string, currentDialogueId: string) => {
    const response = await fetch(`/api/dialogue/session?dialogueId=${encodeURIComponent(currentDialogueId)}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return [] as ChatMessage[];
    }

    const payload = (await response.json().catch(() => null)) as
      | { messages?: Array<{ id?: string; role?: string; content?: string }> }
      | null;

    return (payload?.messages ?? [])
      .filter(
        (message): message is { id?: string; role: MessageRole; content: string } =>
          (message?.role === "user" || message?.role === "assistant" || message?.role === "system") &&
          typeof message?.content === "string",
      )
      .map((message, index) => ({
        id: message.id || `${currentDialogueId}:${index}`,
        role: message.role,
        content: message.content,
      }));
  };

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

      const [{ data: c }, m] = await Promise.all([
        supabase.from("characters").select("*").eq("id", d.character_id!).single(),
        loadSessionMessages(session?.access_token || "", dialogueId),
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
    const list = messageListRef.current;
    if (!list) return;

    const frame = window.requestAnimationFrame(() => {
      list.scrollTo({
        top: list.scrollHeight,
        behavior: streamingText ? "auto" : "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [messages, streamingText]);

  useEffect(() => {
    return () => {
      for (const timeoutId of burstTimeoutsRef.current) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  const triggerCruxBurst = (amount: number) => {
    const id = burstIdRef.current;
    burstIdRef.current += 1;
    setCruxBursts((current) => [...current, { id, amount }]);

    const timeoutId = window.setTimeout(() => {
      setCruxBursts((current) => current.filter((burst) => burst.id !== id));
      burstTimeoutsRef.current = burstTimeoutsRef.current.filter((entry) => entry !== timeoutId);
    }, 1600);

    burstTimeoutsRef.current.push(timeoutId);
  };

  const runStream = async (pendingUserMessage?: string) => {
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
        body: JSON.stringify({ dialogueId, userMessage: pendingUserMessage }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Stream failed" }));
        if (res.status === 429) toast.error("They need a moment. Try again shortly.");
        else if (res.status === 402) toast.error("Out of AI credits. Add credits to continue.");
        else toast.error(err.error || "Something went wrong.");
        setStreaming(false);
        return false;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";
      let done = false;
      let streamMeta: {
        points?: number;
        agreed?: boolean;
        success?: boolean;
        scoreEvents?: number;
      } | null = null;

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
            if (parsed?.meta && typeof parsed.meta === "object") {
              streamMeta = parsed.meta as {
                points?: number;
                agreed?: boolean;
                success?: boolean;
                scoreEvents?: number;
              };
            }
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

      const [{ data: d }, m] = await Promise.all([
        supabase.from("dialogues").select("*").eq("id", dialogueId).single(),
        loadSessionMessages(session.access_token, dialogueId),
      ]);
      if (m) setMessages(m);
      if (d) setDialogue(d);
      setStreamingText("");

      if ((streamMeta?.points ?? 0) > 0) {
        await refreshPoints();
        triggerCruxBurst(streamMeta?.points ?? 0);
        toast.success(
          dialogue?.mode === "debate"
            ? `+${streamMeta?.points} CRUX${streamMeta?.agreed ? " · agreement earned" : ""}`
            : `+${streamMeta?.points} CRUX`,
        );
      }

      if (streamMeta?.success && dialogue?.mode === "debate") {
        toast.success("Success recorded. This debate is complete.");
      }
      return true;
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Connection lost.");
      }
      return false;
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleSend = async () => {
    if (!user || !input.trim() || streaming) return;
    const text = input.trim();
    setInput("");
    const optimisticMessage: ChatMessage = {
      id: `pending:${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    const succeeded = await runStream(text);
    if (!succeeded) {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticMessage.id));
      setInput(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClaimVictory = async () => {
    if (!dialogue || claiming || dialogue.mode !== "roleplay") return;
    if (
      !confirm(
        "End this scene? CRUX is already awarded turn by turn, so this only marks the scene as complete.",
      )
    )
      return;
    setClaiming(true);
    try {
      const { error } = await supabase
        .from("dialogues")
        .update({ victory_claimed: true })
        .eq("id", dialogueId);
      if (error) throw error;
      setDialogue({ ...dialogue, victory_claimed: true });
      toast.success("Scene complete.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not claim");
    } finally {
      setClaiming(false);
    }
  };

  const speakerNameForAi = dialogue?.ai_role || character?.name || "Other";
  const speakerNameForUser = dialogue?.user_role || "You";
  const aiInitial = speakerNameForAi.trim().charAt(0).toUpperCase();
  const normalizedCharacterName = character?.name.trim().toLowerCase() || "";
  const normalizedTitle = dialogue?.title.trim().toLowerCase() || "";
  const autoRoleplayTitle = normalizedCharacterName
    ? normalizedTitle === `scene with ${normalizedCharacterName}`
    : false;
  const displayTitle =
    dialogue?.mode === "roleplay" && autoRoleplayTitle
      ? dialogue.relationship || `${speakerNameForUser} ↔ ${speakerNameForAi}`
      : dialogue?.title || "Dialogue";
  const showVersusLine = dialogue?.mode !== "roleplay" && !!character;
  const roleplayMetaLine =
    dialogue?.mode === "roleplay"
      ? dialogue.relationship || [dialogue?.user_role, dialogue?.ai_role].filter(Boolean).join(" ↔ ")
      : null;
  const canClaim =
    dialogue?.mode === "roleplay" &&
    !dialogue.victory_claimed &&
    messages.filter((m) => m.role === "user").length >= 1;

  return (
    <div className="min-h-screen arena-bg vignette text-foreground flex flex-col">
      <SiteHeader />
      <main className="relative flex-1 mx-auto flex w-full max-w-4xl min-h-0 flex-col px-4 py-6 md:px-6 md:py-8">
        {loading ? (
          <p className="text-center font-serif text-foreground/50 py-20">
            Opening the conversation…
          </p>
        ) : !dialogue ? (
          <p className="font-serif text-center py-20">Dialogue not found.</p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
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
                    {displayTitle}
                  </h1>
                  {showVersusLine && character && (
                    <p className="small-caps text-foreground/50 text-[0.65rem] tracking-[0.25em] mt-1">
                      vs. {character.name}
                    </p>
                  )}
                </div>
              </div>

              {dialogue.mode === "roleplay" && roleplayMetaLine && (
                <p className="mt-4 pt-4 border-t border-white/10 small-caps text-foreground/50 text-[0.65rem] tracking-[0.25em]">
                  {roleplayMetaLine}
                </p>
              )}

              {dialogue.topic && (
                <p className="mt-4 pt-4 border-t border-white/10 font-serif italic text-foreground/65 text-sm">
                  ▸ {dialogue.topic}
                </p>
              )}

            </div>

            {/* Arena — the dialogue surface */}
            <div className="arena-panel scanlines relative mb-4 flex min-h-0 flex-1 flex-col overflow-hidden">
              <span className="hud-corner tl" />
              <span className="hud-corner tr" />
              <span className="hud-corner bl" />
              <span className="hud-corner br" />

              <div ref={messageListRef} className="relative z-10 flex-1 overflow-y-auto pb-3">
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
              </div>
            </div>

            {/* Composer */}
            <div className="hud-frame sticky bottom-3 z-20 mt-auto p-3 md:p-4">
              <span className="hud-corner tl" />
              <span className="hud-corner br" />
              <div className="crux-burst-layer" aria-hidden="true">
                {cruxBursts.map((burst) => (
                  <div key={burst.id} className="crux-burst">
                    <span className="crux-coin">◈</span>
                    <span className="crux-burst-label">+{burst.amount} CRUX</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={streaming ? "They are speaking…" : "Speak. Press Enter to send."}
                  disabled={streaming}
                  className="min-w-0 flex-1 border border-white/10 border-b-claret/50 bg-black/20 px-3 py-2 font-serif text-sm leading-relaxed text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-claret/20 disabled:opacity-50 md:text-base"
                />
                <button
                  onClick={handleSend}
                  disabled={streaming || !input.trim()}
                  className="btn-claret shrink-0 px-4 py-2 text-[0.64rem]"
                >
                  Send
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/10 pt-2 flex-wrap">
                <p className="small-caps text-foreground/40 text-[0.65rem] tracking-[0.25em]">
                  {streaming ? "▸ transmitting…" : "▸ ready"}
                </p>
              </div>
              {(dialogue.mode === "roleplay" || dialogue.mode === "debate") && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-black/15 px-3 py-2">
                  <p className="small-caps text-foreground/45 text-[0.62rem] tracking-[0.22em]">
                    {dialogue.mode === "debate"
                      ? dialogue.victory_claimed
                        ? "✓ Success recorded"
                        : "▸ Earn 10 CRUX from the archetype 3 times to complete this debate"
                      : dialogue.victory_claimed
                        ? "◈ Scene complete"
                        : canClaim
                          ? "▸ End the scene whenever you are done"
                          : "▸ CRUX is awarded turn by turn as you roleplay"}
                  </p>
                  {dialogue.mode === "roleplay" && (
                    <button
                      onClick={handleClaimVictory}
                      disabled={!canClaim || claiming || dialogue.victory_claimed}
                      className="btn-ghost disabled:opacity-40 px-3 py-2 text-[0.62rem]"
                    >
                      {claiming
                        ? "Ending…"
                        : dialogue.victory_claimed
                          ? "Completed"
                          : "◈  End Scene"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
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
