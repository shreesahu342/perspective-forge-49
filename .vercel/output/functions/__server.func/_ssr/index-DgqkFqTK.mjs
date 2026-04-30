import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { S as SiteHeader } from "./site-header-DWpxh53r.mjs";
import { s as socratesLogo } from "./router-D_osbJzY.mjs";
import "../_libs/sonner.mjs";
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
function Home() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen arena-bg vignette text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative mx-auto max-w-6xl px-6 pt-16 md:pt-24 pb-16 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "small-caps text-claret mb-6 tracking-[0.4em] glitch-flicker", children: "⚔  A House of Dialogue  ⚔" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mx-auto w-[260px] md:w-[340px] aspect-square mb-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-full border border-claret/30" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-3 rounded-full border border-claret/15" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-6 rounded-full border border-white/5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: socratesLogo, alt: "Socrates — patron of The Mirror", width: 1024, height: 1024, className: "relative z-10 w-full h-full object-contain ember-glow" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-full border-t-2 border-claret/40 animate-[spin_20s_linear_infinite]" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-display text-6xl md:text-8xl uppercase tracking-tight leading-none", children: [
          "The ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-claret italic", children: "Mirror" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "small-caps mt-4 text-foreground/60 tracking-[0.5em]", children: "Of Perspectives" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 mx-auto max-w-2xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-serif italic text-lg md:text-xl text-foreground/75 leading-relaxed", children: '"The unexamined life is not worth living."' }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "small-caps text-claret/70 mt-2", children: "— Socrates, 399 B.C." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ornament my-8 max-w-md mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-claret", children: "§" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-serif text-base md:text-lg text-foreground/85 leading-relaxed", children: [
            "You stand at the threshold of a house where the dead still argue, where a child's ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("em", { children: "why" }),
            " can collapse a kingdom, and where every belief you hold must answer for itself. ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-claret", children: "Choose your trial." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto max-w-6xl px-6 pb-20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "small-caps text-center text-foreground/40 mb-10 tracking-[0.4em]", children: "◆  Choose Your Mode  ◆" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ModeCard, { numeral: "I", title: "Debate", kicker: "Combat of Minds", body: "Choose an era. Summon a philosopher from it. Offer your thesis — they will press, dismantle, and rebuild your position until it either deepens or breaks.", cta: "Choose an Era", href: "/library" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ModeCard, { numeral: "II", title: "Roleplay", kicker: "Theatre of Voices", body: "Cast yourself and your interlocutor into roles — parent and child, prophet and skeptic, tyrant and citizen. The relationship shapes what is said and what is withheld.", cta: "Stage the Scene", href: "/dialogue/new", search: {
            mode: "roleplay"
          } })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-10 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/create", className: "inline-flex items-center gap-3 small-caps text-foreground/50 hover:text-claret transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-px w-12 bg-current opacity-50" }),
          "Or forge your own interlocutor",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-px w-12 bg-current opacity-50" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "border-t border-white/5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl px-6 py-8 flex flex-wrap items-center justify-between gap-4 small-caps text-foreground/40", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "The Mirror · MMXXVI" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Set in Fraunces & EB Garamond" })
      ] }) })
    ] })
  ] });
}
function ModeCard({
  numeral,
  title,
  kicker,
  body,
  cta,
  href,
  search
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: href, search, className: "group block", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "mode-card p-8 md:p-10 h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mode-corner tl" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mode-corner tr" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mode-corner bl" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mode-corner br" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-7xl md:text-8xl text-claret/80 leading-none", children: numeral }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "small-caps text-foreground/40", children: kicker })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-4xl md:text-5xl uppercase tracking-tight mb-4 group-hover:text-claret transition-colors", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-serif text-foreground/70 leading-relaxed mb-8 min-h-[6rem]", children: body }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-t border-white/10 pt-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "small-caps text-claret group-hover:tracking-[0.3em] transition-all", children: cta }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-claret text-2xl group-hover:translate-x-2 transition-transform", children: "→" })
      ] })
    ] })
  ] }) });
}
export {
  Home as component
};
