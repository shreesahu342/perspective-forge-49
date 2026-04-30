import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { c as createRouter, u as useRouter, a as createRootRoute, b as createFileRoute, l as lazyRouteComponent, H as HeadContent, S as Scripts, O as Outlet, L as Link } from "../_libs/tanstack__react-router.mjs";
import { T as Toaster$1 } from "../_libs/sonner.mjs";
import { c as createClient } from "../_libs/supabase__supabase-js.mjs";
import { o as objectType, e as enumType, s as stringType } from "../_libs/zod.mjs";
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
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
const appCss = "/assets/styles-BG7R1yCP.css";
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center px-4 paper-bg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "small-caps text-claret mb-4", children: "Lost in the colonnade" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-7xl", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-muted-foreground", children: "The page you sought is not in this library." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "ink-link", children: "Return to the entrance" }) })
  ] }) });
}
const Route$8 = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "The Mirror — A House of Philosophical Dialogue" },
      {
        name: "description",
        content: "Debate Socrates, roleplay as a worried parent, sit with Confucius. An interactive house of philosophical dialogue."
      },
      { name: "author", content: "The Mirror" },
      { property: "og:title", content: "The Mirror — A House of Philosophical Dialogue" },
      {
        property: "og:description",
        content: "Debate Socrates, roleplay as a worried parent, sit with Confucius. An interactive house of philosophical dialogue."
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" }
    ],
    links: [{ rel: "stylesheet", href: appCss }]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", className: "dark", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  reactExports.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
  reactExports.useEffect(() => {
    return;
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, {})
  ] });
}
const $$splitComponentImporter$6 = () => import("./library-B-8VoBoS.mjs");
const Route$7 = createFileRoute("/library")({
  head: () => ({
    meta: [{
      title: "Choose an Era - The Mirror"
    }, {
      name: "description",
      content: "Choose an era and summon a philosopher to debate."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./dialogues-CZi2ALxg.mjs");
const Route$6 = createFileRoute("/dialogues")({
  head: () => ({
    meta: [{
      title: "The Archive — The Mirror"
    }, {
      name: "description",
      content: "Your past dialogues, kept like letters."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./create-DTg3NfXw.mjs");
const Route$5 = createFileRoute("/create")({
  head: () => ({
    meta: [{
      title: "The Forge — The Mirror"
    }, {
      name: "description",
      content: "Author a new mind: credo, worldview, method, voice."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const socratesLogo = "/assets/socrates-logo-Cr59cwaP.png";
const $$splitComponentImporter$3 = () => import("./index-DgqkFqTK.mjs");
const Route$4 = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "The Mirror — Enter the Arena of Ideas"
    }, {
      name: "description",
      content: "Two modes. Infinite minds. Step into the arena of philosophical combat or stage a dialogue across roles. The Mirror awaits."
    }, {
      property: "og:title",
      content: "The Mirror — Enter the Arena of Ideas"
    }, {
      property: "og:description",
      content: "Two modes. Infinite minds. The arena of philosophical dialogue."
    }, {
      property: "og:image",
      content: socratesLogo
    }, {
      name: "twitter:image",
      content: socratesLogo
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./dialogue.new-BaXFnqEh.mjs");
const searchSchema = objectType({
  characterId: stringType().optional(),
  mode: enumType(["debate", "roleplay", "open"]).optional()
});
const Route$3 = createFileRoute("/dialogue/new")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{
      title: "Begin a dialogue — The Mirror"
    }, {
      name: "description",
      content: "Set the stage for a new philosophical dialogue."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./dialogue._dialogueId-DYwjFA8O.mjs");
const Route$2 = createFileRoute("/dialogue/$dialogueId")({
  head: () => ({
    meta: [{
      title: "Dialogue — The Mirror"
    }, {
      name: "description",
      content: "An ongoing philosophical dialogue."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./character._characterId-Dq7u8VPK.mjs");
const Route$1 = createFileRoute("/character/$characterId")({
  head: () => ({
    meta: [{
      title: "A Character — The Mirror"
    }, {
      name: "description",
      content: "A philosophical interlocutor's portrait."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const Route = createFileRoute("/api/dialogue/stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" }
            });
          }
          const token = authHeader.slice("Bearer ".length);
          const SUPABASE_URL = process.env.SUPABASE_URL;
          const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
          const userClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false }
          });
          const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
          if (claimsErr || !claimsData?.claims?.sub) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" }
            });
          }
          const userId = claimsData.claims.sub;
          const body = await request.json().catch(() => ({}));
          const dialogueId = body?.dialogueId;
          if (!dialogueId || typeof dialogueId !== "string") {
            return new Response(JSON.stringify({ error: "Missing dialogueId" }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          const { data: dialogue, error: dErr } = await userClient.from("dialogues").select("*").eq("id", dialogueId).single();
          if (dErr || !dialogue) {
            return new Response(JSON.stringify({ error: "Dialogue not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (dialogue.user_id !== userId) {
            return new Response(JSON.stringify({ error: "Forbidden" }), {
              status: 403,
              headers: { "Content-Type": "application/json" }
            });
          }
          const { data: character, error: cErr } = await userClient.from("characters").select("*").eq("id", dialogue.character_id).single();
          if (cErr || !character) {
            return new Response(JSON.stringify({ error: "Character not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" }
            });
          }
          const { data: messages } = await userClient.from("messages").select("role, content").eq("dialogue_id", dialogueId).order("created_at", { ascending: true });
          const backendUrl = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";
          const backendResponse = await fetch(`${backendUrl}/chat/respond`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              dialogue_id: dialogueId,
              mode: dialogue.mode,
              cognitive_level: dialogue.cognitive_level,
              selection: dialogue.mode === "roleplay" ? dialogue.relationship || dialogue.ai_role || character.name : character.name,
              messages: (messages ?? []).map((message) => ({
                role: message.role === "assistant" ? "assistant" : "user",
                content: message.content
              })),
              debate_profile: dialogue.mode === "debate" ? {
                philosopher_name: character.name,
                personality: character.credo,
                debate: character.argument_style,
                move: character.opening_move || "Not specified",
                style: character.voice,
                opening_thesis: dialogue.topic?.trim() || "Not specified"
              } : null,
              roleplay_profile: dialogue.mode === "roleplay" ? {
                ai_role: dialogue.ai_role || character.name,
                user_role: dialogue.user_role || "User",
                relationship: dialogue.relationship || dialogue.ai_role || character.name,
                scene_text: dialogue.topic?.trim() || "Not specified"
              } : null
            })
          });
          if (!backendResponse.ok) {
            const text = await backendResponse.text().catch(() => "");
            console.error("AI backend error:", backendResponse.status, text);
            return new Response(
              JSON.stringify({ error: text || `AI backend error (${backendResponse.status})` }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" }
              }
            );
          }
          const payload = await backendResponse.json().catch(() => null);
          const assembled = payload?.message?.trim();
          if (!assembled) {
            return new Response(JSON.stringify({ error: "Empty AI response" }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            });
          }
          const awardedPoints = Math.max(0, Math.trunc(payload?.points ?? 0));
          const agreed = payload?.agreed === true;
          const success = payload?.success === true;
          if (awardedPoints > 0) {
            const { data: progress } = await userClient.from("user_progress").select("points").eq("user_id", userId).maybeSingle();
            const nextTotal = (progress?.points ?? 0) + awardedPoints;
            const { error: progressError } = await userClient.from("user_progress").upsert(
              {
                user_id: userId,
                points: nextTotal
              },
              { onConflict: "user_id" }
            );
            if (progressError) {
              return new Response(JSON.stringify({ error: progressError.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
              });
            }
          }
          await userClient.from("messages").insert({
            dialogue_id: dialogueId,
            role: "assistant",
            content: assembled
          });
          const dialogueUpdate = {
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          };
          if (dialogue.mode === "debate" && success) {
            dialogueUpdate.victory_claimed = true;
          }
          await userClient.from("dialogues").update(dialogueUpdate).eq("id", dialogueId);
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ choices: [{ delta: { content: assembled } }], meta: { points: awardedPoints, agreed, success, scoreEvents: payload?.score_events ?? 0, totalPoints: payload?.total_points ?? 0 } })}

`
                  )
                );
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
              } catch (err) {
                console.error("stream error:", err);
                controller.error(err);
              }
            }
          });
          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive"
            }
          });
        } catch (e) {
          console.error("dialogue/stream error:", e);
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }
  }
});
const LibraryRoute = Route$7.update({
  id: "/library",
  path: "/library",
  getParentRoute: () => Route$8
});
const DialoguesRoute = Route$6.update({
  id: "/dialogues",
  path: "/dialogues",
  getParentRoute: () => Route$8
});
const CreateRoute = Route$5.update({
  id: "/create",
  path: "/create",
  getParentRoute: () => Route$8
});
const IndexRoute = Route$4.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$8
});
const DialogueNewRoute = Route$3.update({
  id: "/dialogue/new",
  path: "/dialogue/new",
  getParentRoute: () => Route$8
});
const DialogueDialogueIdRoute = Route$2.update({
  id: "/dialogue/$dialogueId",
  path: "/dialogue/$dialogueId",
  getParentRoute: () => Route$8
});
const CharacterCharacterIdRoute = Route$1.update({
  id: "/character/$characterId",
  path: "/character/$characterId",
  getParentRoute: () => Route$8
});
const ApiDialogueStreamRoute = Route.update({
  id: "/api/dialogue/stream",
  path: "/api/dialogue/stream",
  getParentRoute: () => Route$8
});
const rootRouteChildren = {
  IndexRoute,
  CreateRoute,
  DialoguesRoute,
  LibraryRoute,
  CharacterCharacterIdRoute,
  DialogueDialogueIdRoute,
  DialogueNewRoute,
  ApiDialogueStreamRoute
};
const routeTree = Route$8._addFileChildren(rootRouteChildren)._addFileTypes();
function DefaultErrorComponent({ error, reset }) {
  const router2 = useRouter();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        className: "h-8 w-8 text-destructive",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: 2,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          }
        )
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Something went wrong" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "An unexpected error occurred. Please try again." }),
    false,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center justify-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const getRouter = () => {
  const router2 = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route$3 as R,
  Route$2 as a,
  Route$1 as b,
  router as r,
  socratesLogo as s
};
