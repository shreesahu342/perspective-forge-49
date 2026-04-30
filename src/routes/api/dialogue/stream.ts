import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUserEnv } from "@/integrations/supabase/env.server";
import type { Database } from "@/integrations/supabase/types";

type StreamMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export const Route = createFileRoute("/api/dialogue/stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
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

          const body = await request.json().catch(() => ({}));
          const dialogueId = body?.dialogueId as string | undefined;
          const userMessage = typeof body?.userMessage === "string" ? body.userMessage.trim() : "";
          if (!dialogueId || typeof dialogueId !== "string") {
            return new Response(JSON.stringify({ error: "Missing dialogueId" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Load dialogue (RLS via user client guarantees ownership)
          const { data: dialogue, error: dErr } = await userClient
            .from("dialogues")
            .select("*")
            .eq("id", dialogueId)
            .single();
          if (dErr || !dialogue) {
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

          // Load character
          const { data: character, error: cErr } = await userClient
            .from("characters")
            .select("*")
            .eq("id", dialogue.character_id!)
            .single();
          if (cErr || !character) {
            return new Response(JSON.stringify({ error: "Character not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          const backendUrl = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";

          // Fallback history for legacy sessions still stored in Supabase.
          const { data: fallbackMessages } = await userClient
            .from("messages")
            .select("role, content")
            .eq("dialogue_id", dialogueId)
            .order("created_at", { ascending: true });

          const sessionResponse = await fetch(`${backendUrl}/chat/session/${dialogueId}`);
          const sessionPayload = (await sessionResponse.json().catch(() => null)) as
            | { messages?: Array<{ role?: string; content?: string }> }
            | null;

          const history: StreamMessage[] =
            sessionResponse.ok && Array.isArray(sessionPayload?.messages) && sessionPayload.messages.length > 0
              ? sessionPayload.messages
                  .filter(
                    (message): message is { role: "user" | "assistant" | "system"; content: string } =>
                      (message?.role === "user" ||
                        message?.role === "assistant" ||
                        message?.role === "system") &&
                      typeof message?.content === "string" &&
                      message.content.trim().length > 0,
                  )
                  .map((message) => ({ role: message.role, content: message.content }))
              : (fallbackMessages ?? []).map((message) => ({
                  role: message.role === "assistant" ? "assistant" : "user",
                  content: message.content,
                }));

          const outgoingMessages = userMessage
            ? [...history, { role: "user" as const, content: userMessage }]
            : history;

          const backendResponse = await fetch(`${backendUrl}/chat/respond`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              dialogue_id: dialogueId,
              mode: dialogue.mode,
              cognitive_level: dialogue.cognitive_level,
              selection:
                dialogue.mode === "roleplay"
                  ? dialogue.relationship || dialogue.ai_role || character.name
                  : character.name,
              messages: outgoingMessages,
              debate_profile:
                dialogue.mode === "debate"
                  ? {
                      philosopher_name: character.name,
                      personality: character.credo,
                      debate: character.argument_style,
                      move: character.opening_move || "Not specified",
                      style: character.voice,
                      opening_thesis: dialogue.topic?.trim() || "Not specified",
                    }
                  : null,
              roleplay_profile:
                dialogue.mode === "roleplay"
                  ? {
                      ai_role: dialogue.ai_role || character.name,
                      user_role: dialogue.user_role || "User",
                      relationship: dialogue.relationship || dialogue.ai_role || character.name,
                      scene_text: dialogue.topic?.trim() || "Not specified",
                    }
                  : null,
            }),
          });

          if (!backendResponse.ok) {
            const text = await backendResponse.text().catch(() => "");
            console.error("AI backend error:", backendResponse.status, text);
            return new Response(
              JSON.stringify({ error: text || `AI backend error (${backendResponse.status})` }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const payload = (await backendResponse.json().catch(() => null)) as
            | {
                message?: string;
                points?: number;
                agreed?: boolean | null;
                success?: boolean;
                score_events?: number;
                total_points?: number;
              }
            | null;
          const assembled = payload?.message?.trim();
          if (!assembled) {
            return new Response(JSON.stringify({ error: "Empty AI response" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const awardedPoints = Math.max(0, Math.trunc(payload?.points ?? 0));
          const agreed = payload?.agreed === true;
          const success = payload?.success === true;

          if (awardedPoints > 0) {
            const { data: progress } = await userClient
              .from("user_progress")
              .select("points")
              .eq("user_id", userId)
              .maybeSingle();

            const nextTotal = (progress?.points ?? 0) + awardedPoints;
            const { error: progressError } = await userClient.from("user_progress").upsert(
              {
                user_id: userId,
                points: nextTotal,
              },
              { onConflict: "user_id" },
            );

            if (progressError) {
              return new Response(JSON.stringify({ error: progressError.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
              });
            }
          }

          const dialogueUpdate: Database["public"]["Tables"]["dialogues"]["Update"] = {
            updated_at: new Date().toISOString(),
          };
          if (dialogue.mode === "debate" && success) {
            dialogueUpdate.victory_claimed = true;
          }

          await userClient
            .from("dialogues")
            .update(dialogueUpdate)
            .eq("id", dialogueId);

          const encoder = new TextEncoder();

          const stream = new ReadableStream({
            async start(controller) {
              try {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ choices: [{ delta: { content: assembled } }], meta: { points: awardedPoints, agreed, success, scoreEvents: payload?.score_events ?? 0, totalPoints: payload?.total_points ?? 0 } })}\n\n`,
                  ),
                );
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
              } catch (err) {
                console.error("stream error:", err);
                controller.error(err);
              }
            },
          });

          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        } catch (e) {
          console.error("dialogue/stream error:", e);
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
