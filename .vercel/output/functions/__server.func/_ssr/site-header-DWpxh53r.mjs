import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { c as createClient } from "../_libs/supabase__supabase-js.mjs";
function createSupabaseClient() {
  const SUPABASE_URL = "https://akymlxcidfrffieuuhyf.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreW1seGNpZGZyZmZpZXV1aHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMzQ4NjgsImV4cCI6MjA5MjcxMDg2OH0.dPpVQo-BGmWEV4liOQoHe2HoFgplQLjs2iRWnfPGtbI";
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : void 0,
      persistSession: true,
      autoRefreshToken: true
    }
  });
}
let _supabase;
const supabase = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  }
});
const AuthContext = reactExports.createContext(void 0);
function useAnonymousSession() {
  const [session, setSession] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
    });
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) {
        setSession(data.session);
        setLoading(false);
        return;
      }
      try {
        const { data: anon, error } = await supabase.auth.signInAnonymously();
        if (!mounted) return;
        if (!error) setSession(anon.session);
      } catch {
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  const signOut = async () => {
    await supabase.auth.signOut();
  };
  return { session, user: session?.user ?? null, loading, signOut };
}
function useAuth() {
  const ctx = reactExports.useContext(AuthContext);
  return ctx ?? useAnonymousSession();
}
function usePoints() {
  const { user } = useAuth();
  const [points, setPoints] = reactExports.useState(0);
  const [unlockedIds, setUnlockedIds] = reactExports.useState(/* @__PURE__ */ new Set());
  const [loading, setLoading] = reactExports.useState(true);
  const refresh = reactExports.useCallback(async () => {
    if (!user) return;
    const [{ data: prog }, { data: unlocks }] = await Promise.all([
      supabase.from("user_progress").select("points").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_unlocks").select("character_id").eq("user_id", user.id)
    ]);
    setPoints(prog?.points ?? 0);
    setUnlockedIds(new Set((unlocks ?? []).map((u) => u.character_id)));
    setLoading(false);
  }, [user]);
  reactExports.useEffect(() => {
    if (!user) return;
    void refresh();
  }, [user, refresh]);
  return { points, unlockedIds, loading, refresh };
}
function SiteHeader() {
  const { points } = usePoints();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b border-white/10 backdrop-blur-md bg-black/40 sticky top-0 z-40", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-6xl items-center justify-between px-6 py-4 gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "font-display text-xl tracking-[0.3em] uppercase hover:text-claret transition-colors",
        children: "The Mirror"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "hidden md:flex items-center gap-7 small-caps", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/",
          className: "text-foreground/60 hover:text-claret transition-colors",
          activeOptions: { exact: true },
          activeProps: { className: "text-claret" },
          children: "Home"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/library",
          className: "text-foreground/60 hover:text-claret transition-colors",
          activeProps: { className: "text-claret" },
          children: "Library"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/dialogues",
          className: "text-foreground/60 hover:text-claret transition-colors",
          activeProps: { className: "text-claret" },
          children: "Archive"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/create",
          className: "text-foreground/60 hover:text-claret transition-colors",
          activeProps: { className: "text-claret" },
          children: "Forge"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center gap-2 border border-claret/40 bg-claret/10 px-3 py-1.5 small-caps text-claret text-[0.7rem] tracking-[0.2em]",
        title: "CRUX earned through strong debate turns and committed roleplay",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-claret", children: "◈" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-semibold", children: points }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline text-claret/60", children: "CRUX" })
        ]
      }
    )
  ] }) });
}
export {
  SiteHeader as S,
  usePoints as a,
  supabase as s,
  useAuth as u
};
