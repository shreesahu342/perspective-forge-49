import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useAuth, S as SiteHeader, s as supabase } from "./site-header-DWpxh53r.mjs";
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
const CATEGORIES = [{
  value: "philosopher",
  label: "Philosopher"
}, {
  value: "everyday",
  label: "Everyday role"
}, {
  value: "archetype",
  label: "Archetype"
}];
function CreatePage() {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = reactExports.useState("");
  const [era, setEra] = reactExports.useState("");
  const [category, setCategory] = reactExports.useState("philosopher");
  const [credo, setCredo] = reactExports.useState("");
  const [worldview, setWorldview] = reactExports.useState("");
  const [argumentStyle, setArgumentStyle] = reactExports.useState("");
  const [voice, setVoice] = reactExports.useState("");
  const [refusals, setRefusals] = reactExports.useState("");
  const [openingMove, setOpeningMove] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState(false);
  reactExports.useEffect(() => {
  }, [authLoading, user, navigate]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim() || !credo.trim() || !worldview.trim() || !argumentStyle.trim() || !voice.trim()) {
      toast.error("Name, credo, worldview, method, and voice are required.");
      return;
    }
    setBusy(true);
    try {
      const {
        data,
        error
      } = await supabase.from("characters").insert({
        owner_id: user.id,
        is_builtin: false,
        name: name.trim(),
        era: era.trim() || null,
        category,
        credo: credo.trim(),
        worldview: worldview.trim(),
        argument_style: argumentStyle.trim(),
        voice: voice.trim(),
        refusals: refusals.trim() || null,
        opening_move: openingMove.trim() || null
      }).select("id").single();
      if (error) throw error;
      toast.success("Forged.");
      navigate({
        to: "/character/$characterId",
        params: {
          characterId: data.id
        }
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not forge character");
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen arena-bg vignette text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "relative mx-auto max-w-3xl px-6 py-12 md:py-16", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/library", className: "small-caps text-foreground/50 hover:text-claret transition-colors text-[0.7rem] tracking-[0.25em]", children: "← Back" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 mb-12 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "small-caps text-claret tracking-[0.4em] glitch-flicker mb-4", children: "◆  The Forge  ◆" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-display text-5xl md:text-6xl uppercase tracking-tight", children: [
          "Author a ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-claret italic", children: "mind" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 mx-auto max-w-2xl font-serif text-foreground/65 leading-relaxed", children: "Write someone into being — historical, fictional, or composite. The more specific you are about how they think, the more they will sound like themselves rather than like everyone." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("form", { onSubmit: handleSubmit, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hud-frame p-6 md:p-10 relative space-y-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner tl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner tr" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner bl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hud-corner br" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(FieldRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Name", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextInput, { value: name, onChange: setName, placeholder: "Hypatia of Alexandria" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Era / role", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextInput, { value: era, onChange: setEra, placeholder: "c. 350–415 CE" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Category", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 flex-wrap", children: CATEGORIES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setCategory(c.value), className: `option-pill px-4 py-2 ${category === c.value ? "active" : ""}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "small-caps text-[0.7rem]", children: c.label }) }, c.value)) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Credo (one line)", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextInput, { value: credo, onChange: setCredo, placeholder: "A motto they would write above their door." }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Worldview & first principles", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextArea, { value: worldview, onChange: setWorldview, rows: 4, placeholder: "What they take to be true about human beings, knowledge, value, the world." }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Argumentative method", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextArea, { value: argumentStyle, onChange: setArgumentStyle, rows: 3, placeholder: "How they reason. Do they ask questions? Tell stories? Demand definitions? Cite scripture?" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Voice", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextArea, { value: voice, onChange: setVoice, rows: 3, placeholder: "Vocabulary, register, recurring phrases, sentence rhythm, what they sound like." }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "What they refuse to concede", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextArea, { value: refusals, onChange: setRefusals, rows: 2, placeholder: "Lines they will not cross, no matter how clever the argument." }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Typical opening move", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextArea, { value: openingMove, onChange: setOpeningMove, rows: 2, placeholder: "How they tend to begin a conversation." }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-6 border-t border-white/10 flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", disabled: busy, className: "btn-claret", children: busy ? "Forging…" : "⚒  Forge" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/library", className: "btn-ghost", children: "Cancel" })
        ] })
      ] }) })
    ] })
  ] });
}
function Field({
  label,
  required,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "small-caps text-claret/70 tracking-[0.3em] mb-3 text-[0.7rem] flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-px w-8 bg-claret/40" }),
      label,
      " ",
      required && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-claret", children: "*" })
    ] }),
    children
  ] });
}
function FieldRow({
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-6 md:grid-cols-2", children });
}
function TextInput({
  value,
  onChange,
  placeholder
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", value, onChange: (e) => onChange(e.target.value), placeholder, className: "game-input" });
}
function TextArea({
  value,
  onChange,
  placeholder,
  rows
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value, onChange: (e) => onChange(e.target.value), placeholder, rows: rows ?? 3, className: "game-input resize-none leading-relaxed" });
}
export {
  CreatePage as component
};
