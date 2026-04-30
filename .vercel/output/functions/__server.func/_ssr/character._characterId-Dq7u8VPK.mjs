import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useAuth, s as supabase, S as SiteHeader } from "./site-header-DWpxh53r.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { b as Route$1 } from "./router-D_osbJzY.mjs";
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
function CharacterPage() {
  const {
    characterId
  } = Route$1.useParams();
  const {
    user,
    loading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  const [character, setCharacter] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
  }, [authLoading, user, navigate]);
  reactExports.useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const {
        data
      } = await supabase.from("characters").select("*").eq("id", characterId).single();
      if (!active) return;
      setCharacter(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user, characterId]);
  const handleDelete = async () => {
    if (!character || character.is_builtin) return;
    if (!confirm(`Delete ${character.name}? This cannot be undone.`)) return;
    const {
      error
    } = await supabase.from("characters").delete().eq("id", character.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Character removed.");
    navigate({
      to: "/library"
    });
  };
  const initial = character?.name.trim().charAt(0).toUpperCase() ?? "?";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen arena-bg vignette text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "relative mx-auto max-w-4xl px-6 py-12 md:py-16", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/library", className: "small-caps text-foreground/50 hover:text-claret transition-colors text-[0.7rem] tracking-[0.25em]", children: "← Back to roster" }),
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-20 text-center font-serif text-foreground/50", children: "Loading combatant…" }) : !character ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-20 text-center font-serif", children: "Not found." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "mt-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hud-frame p-8 md:p-12 mb-12 relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner tl" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner tr" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner bl" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner br" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row gap-8 items-start", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative shrink-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-full border border-claret/30" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-2 rounded-full border border-claret/15" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-full border-t-2 border-claret/40 animate-[spin_20s_linear_infinite]" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center ember-glow", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-7xl md:text-8xl text-claret", children: initial }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "small-caps text-claret/80 tracking-[0.3em] mb-3", children: [
                character.era || (character.is_builtin ? "Built-in" : "Yours"),
                " ·",
                " ",
                character.category
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-5xl md:text-6xl uppercase tracking-tight leading-none mb-5", children: character.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-serif italic text-lg text-foreground/80 leading-relaxed", children: [
                "“",
                character.credo,
                "”"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dialogue/new", search: {
              characterId: character.id
            }, className: "btn-claret", children: "⚔  Engage in Debate" }),
            !character.is_builtin && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleDelete, className: "small-caps text-foreground/40 hover:text-destructive transition-colors text-[0.7rem] tracking-[0.2em]", children: "Delete" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-5 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Worldview", body: character.worldview }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Method", body: character.argument_style }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Voice", body: character.voice }),
          character.refusals && /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Will not concede", body: character.refusals }),
          character.opening_move && /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Opening move", body: character.opening_move, full: true })
        ] })
      ] })
    ] })
  ] });
}
function Stat({
  label,
  body,
  full
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: `hud-frame p-6 relative ${full ? "md:col-span-2" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner tl" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner br" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "small-caps text-claret/70 tracking-[0.3em] mb-3 text-[0.65rem]", children: [
      "▸ ",
      label
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-serif text-foreground/85 leading-relaxed whitespace-pre-line", children: body })
  ] });
}
export {
  CharacterPage as component
};
