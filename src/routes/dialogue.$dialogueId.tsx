import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
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
  const navigate = useNavigate();

  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/" });
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

      // If no messages yet, kick off the AI's opening turn
      if ((m?.length ?? 0) === 0) {
        // Fire-and-forget; runStream will pick up dialogue context from server
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

      // Reload messages from DB (server has already persisted)
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
    // Optimistic insert via DB (RLS scopes to user) then trigger stream
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

  const speakerNameForAi = dialogue?.ai_role || character?.name || "Other";
  const speakerNameForUser = dialogue?.user_role || "You";

  return (
    <div className="min-h-screen paper-bg flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-12">
        {loading ? (
          <p className="font-serif text-muted-foreground">Opening the conversation…</p>
        ) : !dialogue ? (
          <p className="font-serif">Dialogue not found.</p>
        ) : (
          <>
            {/* Header / scene */}
            <div className="mb-12">
              <Link
                to="/dialogues"
                className="small-caps text-muted-foreground hover:text-claret transition-colors"
              >
                ← The archive
              </Link>
              <p className="mt-6 small-caps text-claret">
                {dialogue.mode === "debate"
                  ? "A debate"
                  : dialogue.mode === "roleplay"
                  ? "A scene"
                  : "An open dialogue"}
                {character ? ` · with ${character.name}` : ""}
              </p>
              <h1 className="font-display text-4xl md:text-5xl mt-3 leading-tight">
                {dialogue.title}
              </h1>
              {dialogue.topic && (
                <p className="font-serif italic text-muted-foreground mt-4 measure-wide">
                  {dialogue.topic}
                </p>
              )}
              {dialogue.mode === "roleplay" && (dialogue.user_role || dialogue.ai_role) && (
                <p className="mt-3 small-caps text-muted-foreground">
                  {dialogue.user_role || "You"} ↔ {dialogue.ai_role || character?.name}
                  {dialogue.relationship ? ` · ${dialogue.relationship}` : ""}
                </p>
              )}
            </div>

            {/* Dialogue script */}
            <article className="hairline-b">
              {messages.length === 0 && !streaming && (
                <p className="font-serif italic text-muted-foreground py-10">
                  Silence. Waiting for the first word.
                </p>
              )}
              {messages.map((m, i) => (
                <Turn
                  key={m.id}
                  speaker={m.role === "assistant" ? speakerNameForAi : speakerNameForUser}
                  isSelf={m.role === "user"}
                  text={m.content}
                  dropCap={i === 0 && m.role === "assistant"}
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
            </article>

            {/* Composer + toolbar */}
            <div className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4 small-caps text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span>Level:</span>
                  {(["child", "teen", "adult", "scholar"] as Level[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => handleChangeLevel(l)}
                      className={`transition-colors ${
                        dialogue.cognitive_level === l ? "text-claret" : "hover:text-foreground"
                      }`}
                    >
                      {LEVEL_LABEL[l]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-foreground/30 pt-4">
                <textarea
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    streaming ? "They are speaking…" : "Speak. (Enter to send, Shift+Enter for line break.)"
                  }
                  disabled={streaming}
                  className="w-full bg-transparent font-serif text-lg leading-relaxed focus:outline-none resize-none placeholder:text-muted-foreground/60 disabled:opacity-50"
                />
                <div className="mt-3 flex items-center justify-between">
                  <p className="small-caps text-muted-foreground">
                    {streaming ? "…" : "Plain prose. No need for markdown."}
                  </p>
                  <button
                    onClick={handleSend}
                    disabled={streaming || !input.trim()}
                    className="bg-claret text-claret-foreground py-3 px-6 small-caps hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    Send →
                  </button>
                </div>
              </div>
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
  dropCap,
}: {
  speaker: string;
  isSelf: boolean;
  text: string;
  cursor?: boolean;
  dropCap?: boolean;
}) {
  return (
    <div className="dialogue-turn">
      <div className={`speaker-label ${isSelf ? "self" : ""}`}>{speaker}.</div>
      <div className={`dialogue-text ${cursor ? "quill-cursor" : ""} ${dropCap ? "drop-cap" : ""}`}>
        {text}
      </div>
    </div>
  );
}
