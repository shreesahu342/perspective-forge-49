import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useAuth, a as usePoints, s as supabase, S as SiteHeader } from "./site-header-DWpxh53r.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { a as Route$2 } from "./router-D_osbJzY.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/zod.mjs";
function DialoguePage() {
  const {
    dialogueId
  } = Route$2.useParams();
  const {
    user,
    session,
    loading: authLoading
  } = useAuth();
  const {
    refresh: refreshPoints
  } = usePoints();
  const navigate = useNavigate();
  const [dialogue, setDialogue] = reactExports.useState(null);
  const [character, setCharacter] = reactExports.useState(null);
  const [messages, setMessages] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [streaming, setStreaming] = reactExports.useState(false);
  const [streamingText, setStreamingText] = reactExports.useState("");
  const [input, setInput] = reactExports.useState("");
  const [claiming, setClaiming] = reactExports.useState(false);
  const [cruxBursts, setCruxBursts] = reactExports.useState([]);
  const messageListRef = reactExports.useRef(null);
  const abortRef = reactExports.useRef(null);
  const burstIdRef = reactExports.useRef(0);
  const burstTimeoutsRef = reactExports.useRef([]);
  reactExports.useEffect(() => {
  }, [authLoading, user, navigate]);
  reactExports.useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const {
        data: d
      } = await supabase.from("dialogues").select("*").eq("id", dialogueId).single();
      if (!active) return;
      if (!d) {
        setLoading(false);
        return;
      }
      setDialogue(d);
      const [{
        data: c
      }, {
        data: m
      }] = await Promise.all([supabase.from("characters").select("*").eq("id", d.character_id).single(), supabase.from("messages").select("*").eq("dialogue_id", dialogueId).order("created_at", {
        ascending: true
      })]);
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
  }, [user, dialogueId]);
  reactExports.useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;
    const frame = window.requestAnimationFrame(() => {
      list.scrollTo({
        top: list.scrollHeight,
        behavior: streamingText ? "auto" : "smooth"
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, streamingText]);
  reactExports.useEffect(() => {
    return () => {
      for (const timeoutId of burstTimeoutsRef.current) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);
  const triggerCruxBurst = (amount) => {
    const id = burstIdRef.current;
    burstIdRef.current += 1;
    setCruxBursts((current) => [...current, {
      id,
      amount
    }]);
    const timeoutId = window.setTimeout(() => {
      setCruxBursts((current) => current.filter((burst) => burst.id !== id));
      burstTimeoutsRef.current = burstTimeoutsRef.current.filter((entry) => entry !== timeoutId);
    }, 1600);
    burstTimeoutsRef.current.push(timeoutId);
  };
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
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          dialogueId
        }),
        signal: controller.signal
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({
          error: "Stream failed"
        }));
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
      let streamMeta = null;
      while (!done) {
        const {
          value,
          done: rDone
        } = await reader.read();
        if (rDone) break;
        buffer += decoder.decode(value, {
          stream: true
        });
        let nl;
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
              streamMeta = parsed.meta;
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
      const [{
        data: m
      }, {
        data: d
      }] = await Promise.all([supabase.from("messages").select("*").eq("dialogue_id", dialogueId).order("created_at", {
        ascending: true
      }), supabase.from("dialogues").select("*").eq("id", dialogueId).single()]);
      if (m) setMessages(m);
      if (d) setDialogue(d);
      setStreamingText("");
      if ((streamMeta?.points ?? 0) > 0) {
        await refreshPoints();
        triggerCruxBurst(streamMeta?.points ?? 0);
        toast.success(dialogue?.mode === "debate" ? `+${streamMeta?.points} CRUX${streamMeta?.agreed ? " · agreement earned" : ""}` : `+${streamMeta?.points} CRUX`);
      }
      if (streamMeta?.success && dialogue?.mode === "debate") {
        toast.success("Success recorded. This debate is complete.");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
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
    const {
      data: inserted,
      error
    } = await supabase.from("messages").insert({
      dialogue_id: dialogueId,
      role: "user",
      content: text
    }).select("*").single();
    if (error) {
      toast.error(error.message);
      setInput(text);
      return;
    }
    if (inserted) setMessages((prev) => [...prev, inserted]);
    await runStream();
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };
  const handleClaimVictory = async () => {
    if (!dialogue || claiming || dialogue.mode !== "roleplay") return;
    if (!confirm("End this scene? CRUX is already awarded turn by turn, so this only marks the scene as complete.")) return;
    setClaiming(true);
    try {
      const {
        error
      } = await supabase.from("dialogues").update({
        victory_claimed: true
      }).eq("id", dialogueId);
      if (error) throw error;
      setDialogue({
        ...dialogue,
        victory_claimed: true
      });
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
  const autoRoleplayTitle = normalizedCharacterName ? normalizedTitle === `scene with ${normalizedCharacterName}` : false;
  const displayTitle = dialogue?.mode === "roleplay" && autoRoleplayTitle ? dialogue.relationship || `${speakerNameForUser} ↔ ${speakerNameForAi}` : dialogue?.title || "Dialogue";
  const showVersusLine = dialogue?.mode !== "roleplay" && !!character;
  const roleplayMetaLine = dialogue?.mode === "roleplay" ? dialogue.relationship || [dialogue?.user_role, dialogue?.ai_role].filter(Boolean).join(" ↔ ") : null;
  const canClaim = dialogue?.mode === "roleplay" && !dialogue.victory_claimed && messages.filter((m) => m.role === "user").length >= 1;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen arena-bg vignette text-foreground flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "relative flex-1 mx-auto flex w-full max-w-4xl min-h-0 flex-col px-4 py-6 md:px-6 md:py-8", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center font-serif text-foreground/50 py-20", children: "Opening the conversation…" }) : !dialogue ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-serif text-center py-20", children: "Dialogue not found." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-0 flex-1 flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dialogues", className: "small-caps text-foreground/50 hover:text-claret transition-colors text-[0.7rem] tracking-[0.25em]", children: "← Archive" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hud-frame p-5 md:p-7 mb-6 relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner tl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner tr" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner bl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner br" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-full border border-claret/30" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-full border-t border-claret/60 animate-[spin_8s_linear_infinite]" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 md:w-20 md:h-20 flex items-center justify-center ember-glow", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-3xl md:text-4xl text-claret", children: aiInitial }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "small-caps text-claret tracking-[0.3em] text-[0.65rem] mb-1", children: dialogue.mode === "debate" ? "⚔ Debate in progress" : dialogue.mode === "roleplay" ? "✦ Scene in progress" : "◆ Open dialogue" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl md:text-3xl uppercase tracking-tight leading-tight truncate", children: displayTitle }),
            showVersusLine && character && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "small-caps text-foreground/50 text-[0.65rem] tracking-[0.25em] mt-1", children: [
              "vs. ",
              character.name
            ] })
          ] })
        ] }),
        dialogue.mode === "roleplay" && roleplayMetaLine && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 pt-4 border-t border-white/10 small-caps text-foreground/50 text-[0.65rem] tracking-[0.25em]", children: roleplayMetaLine }),
        dialogue.topic && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-4 pt-4 border-t border-white/10 font-serif italic text-foreground/65 text-sm", children: [
          "▸ ",
          dialogue.topic
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "arena-panel scanlines relative mb-4 flex min-h-0 flex-1 flex-col overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner tl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner tr" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner bl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner br" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: messageListRef, className: "relative z-10 flex-1 overflow-y-auto pb-3", children: [
          messages.length === 0 && !streaming && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-serif italic text-foreground/40 p-10 text-center", children: "Silence. Waiting for the first word." }),
          messages.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(Turn, { speaker: m.role === "assistant" ? speakerNameForAi : speakerNameForUser, isSelf: m.role === "user", text: m.content }, m.id)),
          streaming && /* @__PURE__ */ jsxRuntimeExports.jsx(Turn, { speaker: speakerNameForAi, isSelf: false, text: streamingText || "…", cursor: !!streamingText })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hud-frame sticky bottom-3 z-20 mt-auto p-3 md:p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner tl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner br" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "crux-burst-layer", "aria-hidden": "true", children: cruxBursts.map((burst) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "crux-burst", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "crux-coin", children: "◈" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "crux-burst-label", children: [
            "+",
            burst.amount,
            " CRUX"
          ] })
        ] }, burst.id)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 md:gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", value: input, onChange: (e) => setInput(e.target.value), onKeyDown: handleKeyDown, placeholder: streaming ? "They are speaking…" : "Speak. Press Enter to send.", disabled: streaming, className: "min-w-0 flex-1 border border-white/10 border-b-claret/50 bg-black/20 px-3 py-2 font-serif text-sm leading-relaxed text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-claret/20 disabled:opacity-50 md:text-base" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleSend, disabled: streaming || !input.trim(), className: "btn-claret shrink-0 px-4 py-2 text-[0.64rem]", children: "Send" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 flex items-center justify-between gap-3 border-t border-white/10 pt-2 flex-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "small-caps text-foreground/40 text-[0.65rem] tracking-[0.25em]", children: streaming ? "▸ transmitting…" : "▸ ready" }) }),
        (dialogue.mode === "roleplay" || dialogue.mode === "debate") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-black/15 px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "small-caps text-foreground/45 text-[0.62rem] tracking-[0.22em]", children: dialogue.mode === "debate" ? dialogue.victory_claimed ? "✓ Success recorded" : "▸ Earn 10 CRUX from the archetype 3 times to complete this debate" : dialogue.victory_claimed ? "◈ Scene complete" : canClaim ? "▸ End the scene whenever you are done" : "▸ CRUX is awarded turn by turn as you roleplay" }),
          dialogue.mode === "roleplay" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleClaimVictory, disabled: !canClaim || claiming || dialogue.victory_claimed, className: "btn-ghost disabled:opacity-40 px-3 py-2 text-[0.62rem]", children: claiming ? "Ending…" : dialogue.victory_claimed ? "Completed" : "◈  End Scene" })
        ] })
      ] })
    ] }) })
  ] });
}
function Turn({
  speaker,
  isSelf,
  text,
  cursor
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `turn-row ${isSelf ? "is-self" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `turn-tag ${isSelf ? "is-self" : ""}`, children: speaker }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `font-serif text-base md:text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap ${cursor ? "quill-cursor" : ""}`, children: text })
  ] });
}
export {
  DialoguePage as component
};
