import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useAuth, s as supabase, S as SiteHeader } from "./site-header-DWpxh53r.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { R as Route$3 } from "./router-D_osbJzY.mjs";
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
const LEVELS = [{
  value: "child",
  label: "Child",
  desc: "Short sentences. Concrete images. No jargon."
}, {
  value: "teen",
  label: "Teen",
  desc: "Vivid, with terms defined in passing."
}, {
  value: "adult",
  label: "Adult",
  desc: "Precise, intelligent, no lectures."
}, {
  value: "scholar",
  label: "Scholar",
  desc: "Technical vocabulary and rigor."
}];
const ROLEPLAY_PAIRS = [{
  id: "parent-child",
  emoji: "👨‍👩‍👧",
  title: "Parent ↔ Child",
  userRole: "Parent",
  aiRole: "Child",
  aiBehavior: "asks 'why', tests limits, misinterprets rules",
  hiddenTest: "do you explain or just assert authority?"
}, {
  id: "teacher-student",
  emoji: "👩‍🏫",
  title: "Teacher ↔ Student",
  userRole: "Teacher",
  aiRole: "Student",
  aiBehavior: "challenges relevance, asks basic/annoying doubts",
  hiddenTest: "can you simplify without frustration?"
}, {
  id: "authority-rebel",
  emoji: "⚖️",
  title: "Authority ↔ Rebel",
  userRole: "Authority",
  aiRole: "Rebel",
  aiBehavior: "pushes boundaries, rejects control",
  hiddenTest: "do you justify rules or hide behind power?"
}, {
  id: "rational-emotional",
  emoji: "🧠",
  title: "Rational ↔ Emotional",
  userRole: "Rational",
  aiRole: "Emotional",
  aiBehavior: "ignores logic, insists 'this feels right'",
  hiddenTest: "can you engage emotion without dismissing it?"
}, {
  id: "individual-society",
  emoji: "🌍",
  title: "Individual ↔ Society",
  userRole: "Individual",
  aiRole: "Society",
  aiBehavior: "pressures conformity",
  hiddenTest: "where do you bend?"
}, {
  id: "privileged-struggler",
  emoji: "💰",
  title: "Privileged ↔ Struggler",
  userRole: "Privileged",
  aiRole: "Struggler",
  aiBehavior: "rejects theory, brings raw reality",
  hiddenTest: "do you actually understand ground truth?"
}, {
  id: "scientist-believer",
  emoji: "🔬",
  title: "Scientist ↔ Believer",
  userRole: "Scientist",
  aiRole: "Believer",
  aiBehavior: "resists proof, values meaning",
  hiddenTest: "can you argue without dismissing purpose?"
}, {
  id: "past-present",
  emoji: "⏳",
  title: "Past Self ↔ Present You",
  userRole: "Present You",
  aiRole: "Past Self",
  aiBehavior: "insecure, reactive, naive",
  hiddenTest: "do you guide or judge?"
}, {
  id: "human-ai",
  emoji: "🤖",
  title: "Human ↔ AI (reverse mode)",
  userRole: "Human",
  aiRole: "Cold Optimizer AI",
  aiBehavior: "reduces everything to efficiency",
  hiddenTest: "what do you defend as 'human'?"
}, {
  id: "judge-accused",
  emoji: "⚖️",
  title: "Judge ↔ Accused",
  userRole: "Judge",
  aiRole: "Accused",
  aiBehavior: "rationalizes actions, shifts blame",
  hiddenTest: "do you seek truth or just punish?"
}, {
  id: "detective-suspect",
  emoji: "🕵️",
  title: "Detective ↔ Suspect",
  userRole: "Detective",
  aiRole: "Suspect",
  aiBehavior: "partial truths, contradictions",
  hiddenTest: "can you detect subtle lies?"
}, {
  id: "lover-avoidant",
  emoji: "💔",
  title: "Lover ↔ Avoidant Partner",
  userRole: "Lover",
  aiRole: "Avoidant Partner",
  aiBehavior: "withdraws, deflects emotions",
  hiddenTest: "do you chase, pressure, or understand?"
}, {
  id: "boss-employee",
  emoji: "🧑‍💼",
  title: "Boss ↔ Employee",
  userRole: "Boss",
  aiRole: "Employee",
  aiBehavior: "excuses, negotiation, quiet resentment",
  hiddenTest: "leadership vs control"
}, {
  id: "artist-critic",
  emoji: "🎨",
  title: "Artist ↔ Critic",
  userRole: "Artist",
  aiRole: "Critic",
  aiBehavior: "points flaws, dismisses intent",
  hiddenTest: "can you separate ego from work?"
}, {
  id: "monk-materialist",
  emoji: "🧘",
  title: "Monk ↔ Materialist",
  userRole: "Monk",
  aiRole: "Materialist",
  aiBehavior: "mocks abstraction, values comfort",
  hiddenTest: "meaning vs desire"
}, {
  id: "hero-villain",
  emoji: "⚔️",
  title: "Hero ↔ Villain",
  userRole: "Hero",
  aiRole: "Villain",
  aiBehavior: "reframes evil as necessary",
  hiddenTest: "are your morals consistent?"
}, {
  id: "creator-creation",
  emoji: "🧑‍🔬",
  title: "Creator ↔ Creation",
  userRole: "Creator",
  aiRole: "Creation",
  aiBehavior: "questions purpose, autonomy",
  hiddenTest: "control vs independence"
}, {
  id: "friend-friend",
  emoji: "🧑‍🤝‍🧑",
  title: "Friend ↔ Friend (hidden tension)",
  userRole: "Friend",
  aiRole: "Friend",
  aiBehavior: "subtle disagreement, indirect signals",
  hiddenTest: "can you read what's not said?"
}, {
  id: "therapist-patient",
  emoji: "🧠",
  title: "Therapist ↔ Patient",
  userRole: "Therapist",
  aiRole: "Patient",
  aiBehavior: "deflects, contradicts itself",
  hiddenTest: "do you listen or diagnose fast?"
}];
function getPairSides(title) {
  const [left, right] = title.split("↔").map((s) => s.trim());
  return {
    aiRole: left || "AI",
    userRole: right || "User"
  };
}
function NewDialoguePage() {
  const {
    characterId: initialCharacterId,
    mode: initialMode
  } = Route$3.useSearch();
  const {
    user,
    loading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  const [characters, setCharacters] = reactExports.useState([]);
  const [characterId, setCharacterId] = reactExports.useState(initialCharacterId);
  const [mode, setMode] = reactExports.useState(initialMode ?? "debate");
  const [level, setLevel] = reactExports.useState("adult");
  const [topic, setTopic] = reactExports.useState("");
  const [userRole, setUserRole] = reactExports.useState("");
  const [aiRole, setAiRole] = reactExports.useState("");
  const [relationship, setRelationship] = reactExports.useState("");
  const [pairId, setPairId] = reactExports.useState("");
  const [isFlipped, setIsFlipped] = reactExports.useState(false);
  const [busy, setBusy] = reactExports.useState(false);
  reactExports.useEffect(() => {
  }, [authLoading, user, navigate]);
  reactExports.useEffect(() => {
    if (!user) return;
    (async () => {
      const {
        data
      } = await supabase.from("characters").select("*").order("is_builtin", {
        ascending: false
      }).order("category").order("name");
      if (data) {
        setCharacters(data);
        if (!characterId && data[0]) setCharacterId(data[0].id);
      }
    })();
  }, [user]);
  const selected = characters.find((c) => c.id === characterId);
  const pickerCharacters = mode === "roleplay" ? characters.filter((c) => c.category !== "philosopher") : characters;
  reactExports.useEffect(() => {
    if (!characterId) return;
    if (!pickerCharacters.some((c) => c.id === characterId) && pickerCharacters[0]) {
      setCharacterId(pickerCharacters[0].id);
    }
  }, [mode, characters]);
  reactExports.useEffect(() => {
    if (mode !== "roleplay") {
      setPairId("");
      setUserRole("");
      setAiRole("");
      setRelationship("");
      setIsFlipped(false);
    }
  }, [mode]);
  reactExports.useEffect(() => {
    if (mode !== "roleplay") return;
    if (pairId) return;
    const first = ROLEPLAY_PAIRS[0];
    const sides = getPairSides(first.title);
    setPairId(first.id);
    setAiRole(isFlipped ? sides.userRole : sides.aiRole);
    setUserRole(isFlipped ? sides.aiRole : sides.userRole);
    setRelationship(first.title);
  }, [mode, pairId, isFlipped]);
  reactExports.useEffect(() => {
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
      const roleplayTitle = relationship ? `${relationship} Scene` : `Scene: ${userRole.trim() || "You"} ↔ ${aiRole.trim() || selected.name}`;
      const title = trimmedTopic ? trimmedTopic.slice(0, 80) : mode === "roleplay" ? roleplayTitle : `Dialogue with ${selected.name}`;
      const {
        data,
        error
      } = await supabase.from("dialogues").insert({
        user_id: user.id,
        character_id: characterId,
        title,
        mode,
        cognitive_level: level,
        user_role: mode === "roleplay" ? userRole.trim() || null : null,
        ai_role: mode === "roleplay" ? aiRole.trim() || null : null,
        relationship: mode === "roleplay" ? relationship || null : null,
        topic: trimmedTopic || null
      }).select("id").single();
      if (error) throw error;
      navigate({
        to: "/dialogue/$dialogueId",
        params: {
          dialogueId: data.id
        }
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not begin");
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen arena-bg vignette text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "relative mx-auto max-w-4xl px-6 py-12 md:py-16", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: mode === "roleplay" ? "/" : "/library", className: "small-caps text-foreground/50 hover:text-claret transition-colors", children: "← Back" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 mb-12 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "small-caps text-claret tracking-[0.4em] glitch-flicker mb-4", children: [
          "◆  ",
          mode === "roleplay" ? "Mode II · Roleplay" : "Dialogue Setup",
          "  ◆"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-5xl md:text-6xl uppercase tracking-tight", children: mode === "roleplay" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-claret italic", children: "Choose" }),
          " your scene"
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "Prepare the ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-claret italic", children: "dialogue" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hud-frame p-6 md:p-10 relative space-y-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner tl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner tr" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner bl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner br" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Field, { label: mode === "roleplay" ? "Select your interlocutor" : "Interlocutor", children: [
          mode === "roleplay" ? /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: pairId, onChange: (e) => {
            const nextId = e.target.value;
            const pair = ROLEPLAY_PAIRS.find((p) => p.id === nextId);
            if (!pair) return;
            const sides = getPairSides(pair.title);
            setPairId(pair.id);
            setAiRole(isFlipped ? sides.userRole : sides.aiRole);
            setUserRole(isFlipped ? sides.aiRole : sides.userRole);
            setRelationship(pair.title);
          }, className: "game-input", children: ROLEPLAY_PAIRS.map((pair) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: pair.id, className: "bg-background", children: pair.title }, pair.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-none border border-white/10 bg-black/20 px-4 py-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-2xl uppercase tracking-tight text-foreground/90", children: selected?.name || "No interlocutor selected" }),
            selected?.era && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 small-caps text-foreground/45 text-[0.65rem] tracking-[0.25em]", children: selected.era })
          ] }),
          selected && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 font-serif italic text-foreground/60 text-sm", children: [
            "“",
            selected.credo,
            "”"
          ] }),
          mode === "roleplay" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "small-caps text-foreground/55 text-[0.65rem] tracking-[0.2em]", children: [
              "Your role: ",
              userRole || "User",
              " · AI role: ",
              aiRole || "AI"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setIsFlipped((v) => !v), className: `option-pill px-3 py-1 text-[0.65rem] ${isFlipped ? "active" : ""}`, children: "Swap AI/User roles" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Cognitive level", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-4", children: LEVELS.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setLevel(l.value), className: `option-pill ${level === l.value ? "active" : ""}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-lg uppercase tracking-tight", children: l.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-serif text-xs text-foreground/55 leading-snug", children: l.desc })
        ] }, l.value)) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: mode === "roleplay" ? "Scene (optional)" : "Opening thesis", children: /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { rows: 3, value: topic, onChange: (e) => setTopic(e.target.value), placeholder: mode === "roleplay" ? "Describe the situation you're walking into…" : "State the position you want them to attack, question, or refine.", className: "game-input resize-none" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-6 border-t border-white/10 flex flex-wrap items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleBegin, disabled: busy || !characterId || mode === "debate" && !topic.trim(), className: "btn-claret", children: busy ? "Opening…" : "⚔  Begin" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/library", className: "btn-ghost", children: "Cancel" })
        ] })
      ] })
    ] })
  ] });
}
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "small-caps text-claret/70 tracking-[0.3em] mb-4 text-[0.7rem] flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-px w-8 bg-claret/40" }),
      label
    ] }),
    children
  ] });
}
export {
  NewDialoguePage as component
};
