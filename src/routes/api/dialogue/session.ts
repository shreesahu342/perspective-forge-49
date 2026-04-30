import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUserEnv } from "@/integrations/supabase/env.server";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/dialogue/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const url = new URL(request.url);
          const dialogueId = url.searchParams.get("dialogueId");
          if (!dialogueId) {
            return new Response(JSON.stringify({ error: "Missing dialogueId" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const token = authHeader.slice("Bearer ".length);
          const {
            url: SUPABASE_URL,
            publishableKey: SUPABASE_PUBLISHABLE_KEY,
          } = getSupabaseUserEnv();
          const userClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          });

          const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
          if (claimsErr || !claimsData?.claims?.sub) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const userId = claimsData.claims.sub;
          const { data: dialogue, error: dialogueError } = await userClient
            .from("dialogues")
            .select("id, user_id")
            .eq("id", dialogueId)
            .single();
          if (dialogueError || !dialogue) {
            return new Response(JSON.stringify({ error: "Dialogue not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (dialogue.user_id !== userId) {
            return new Response(JSON.stringify({ error: "Forbidden" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          const backendUrl = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";
          const backendResponse = await fetch(`${backendUrl}/chat/session/${dialogueId}`);
          const backendPayload = (await backendResponse.json().catch(() => null)) as
            | {
                messages?: Array<{ id?: string; role?: string; content?: string }>;
                success?: boolean;
                score_events?: number;
                total_points?: number;
              }
            | null;

          if (backendResponse.ok && Array.isArray(backendPayload?.messages)) {
            return new Response(
              JSON.stringify({
                messages: backendPayload.messages,
                success: backendPayload.success ?? false,
                scoreEvents: backendPayload.score_events ?? 0,
                totalPoints: backendPayload.total_points ?? 0,
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }

          const { data: fallbackMessages } = await userClient
            .from("messages")
            .select("id, role, content, created_at")
            .eq("dialogue_id", dialogueId)
            .order("created_at", { ascending: true });

          return new Response(
            JSON.stringify({
              messages: (fallbackMessages ?? []).map((message) => ({
                id: message.id,
                role: message.role,
                content: message.content,
                created_at: message.created_at,
              })),
              success: false,
              scoreEvents: 0,
              totalPoints: 0,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});