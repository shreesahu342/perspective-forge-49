import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useAuth, s as supabase, S as SiteHeader } from "./site-header-DWpxh53r.mjs";
import { t as toast } from "../_libs/sonner.mjs";
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
function ArchivePage() {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  const [dialogues, setDialogues] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [query, setQuery] = reactExports.useState("");
  reactExports.useEffect(() => {
  }, [authLoading, user, navigate]);
  reactExports.useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const {
        data
      } = await supabase.from("dialogues").select("*, characters(name, era)").order("updated_at", {
        ascending: false
      });
      if (!active) return;
      setDialogues(data ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);
  const filtered = dialogues.filter((d) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return d.title.toLowerCase().includes(q) || d.characters?.name.toLowerCase().includes(q) || d.topic?.toLowerCase().includes(q);
  });
  const handleDelete = async (id) => {
    if (!confirm("Delete this dialogue? This cannot be undone.")) return;
    const {
      error
    } = await supabase.from("dialogues").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDialogues((prev) => prev.filter((d) => d.id !== id));
    toast.success("Removed.");
  };
  const modeIcon = (m) => m === "debate" ? "⚔" : m === "roleplay" ? "✦" : "◆";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen arena-bg vignette text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "relative mx-auto max-w-5xl px-6 py-12 md:py-16", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "small-caps text-claret tracking-[0.4em] glitch-flicker mb-4", children: "◆  The Archive  ◆" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-display text-5xl md:text-6xl uppercase tracking-tight", children: [
          "Your ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-claret italic", children: "campaigns" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 mx-auto max-w-2xl font-serif text-foreground/65 leading-relaxed", children: "A record of what was said, and to whom. Old conversations often hold more than they did the day they ended." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hud-frame p-4 mb-8 relative flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner tl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner br" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "small-caps text-claret/70 text-[0.65rem] tracking-[0.3em] hidden md:inline", children: "▸ Search" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Filter by title, philosopher, topic…", className: "flex-1 bg-transparent font-serif text-base focus:outline-none placeholder:text-foreground/30 text-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dialogue/new", className: "btn-ghost whitespace-nowrap", children: "+ New" })
      ] }),
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center font-serif text-foreground/50 py-20", children: "Reading the archive…" }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hud-frame relative p-12 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner tl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner tr" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner bl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner br" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-serif italic text-foreground/55 mb-6", children: dialogues.length === 0 ? "Nothing here yet. Begin a dialogue and it will be kept." : "No dialogues match that search." }),
        dialogues.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/library", className: "btn-claret", children: "Choose an interlocutor →" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "grid gap-4", children: filtered.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "combatant-card relative group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner tl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner br" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-6 p-5 md:p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/dialogue/$dialogueId", params: {
            dialogueId: d.id
          }, className: "flex-1 min-w-0 relative z-10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-claret text-lg", children: modeIcon(d.mode) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "small-caps text-foreground/40 text-[0.65rem] tracking-[0.25em]", children: [
                d.mode === "debate" ? "Debate" : d.mode === "roleplay" ? "Scene" : "Open",
                d.characters?.name ? ` · ${d.characters.name}` : "",
                " · ",
                new Date(d.updated_at).toLocaleDateString(void 0, {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl md:text-2xl uppercase tracking-tight text-foreground/95 group-hover:text-claret transition-colors leading-tight", children: d.title }),
            d.topic && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-serif italic text-foreground/55 text-sm mt-2 line-clamp-2", children: d.topic })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleDelete(d.id), className: "small-caps text-foreground/30 hover:text-destructive transition-colors text-[0.65rem] tracking-[0.25em] mt-1 relative z-10", "aria-label": "Delete", children: "Remove" })
        ] })
      ] }, d.id)) })
    ] })
  ] });
}
export {
  ArchivePage as component
};
