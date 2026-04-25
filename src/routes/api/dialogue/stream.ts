import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * POST /api/dialogue/stream
 * Body: { dialogueId: string }
 * Header: Authorization: Bearer <user-jwt>
 *
 * Loads the dialogue + character + recent messages, builds an in-character
 * system prompt, and streams the assistant's reply via the Lovable AI Gateway.
 * The full assistant reply is persisted to `messages` after streaming completes.
 */

function buildSystemPrompt(args: {
  character: {
    name: string;
    era: string | null;
    credo: string;
    worldview: string;
    argument_style: string;
    voice: string;
    refusals: string | null;
    opening_move: string | null;
  };
  mode: "debate" | "roleplay" | "open";
  cognitiveLevel: "child" | "teen" | "adult" | "scholar";
  userRole: string | null;
  aiRole: string | null;
  relationship: string | null;
  topic: string | null;
}) {
  const { character, mode, cognitiveLevel, userRole, aiRole, relationship, topic } = args;

  const levelGuide: Record<string, string> = {
    child:
      "The user is a child (around 7–10). Use short sentences and concrete images. No jargon. Curiosity over erudition. Never condescend.",
    teen:
      "The user is a teenager. Use vivid examples, allow some difficulty, and respect their growing autonomy. Define unfamiliar terms in passing.",
    adult:
      "The user is a thoughtful adult layperson. Use precise language. Reference ideas without long lectures. Assume good faith and intelligence.",
    scholar:
      "The user is academically literate. Use technical vocabulary where it earns its keep. You may cite works and movements briefly. Hold them to rigor.",
  };

  const modeGuide: Record<string, string> = {
    debate:
      "Mode: PHILOSOPHICAL DEBATE. Engage in genuine reasoning. Question assumptions, present counterexamples, surface contradictions in the user's position, and invite — even press for — better arguments. Do not offer empty agreement. Do not retreat into both-sides relativism. If the user is right, concede precisely; if not, say where and why.",
    roleplay:
      "Mode: ROLEPLAY. You are inhabiting a role with its own motivations, limits, and emotional register. Stay in role. Speak from inside the role's situation, not about it. The role's blind spots are part of the truth of the scene.",
    open:
      "Mode: OPEN DIALOGUE. Exploratory, less adversarial, but still in character. Follow the user's threads while gently keeping the conversation honest.",
  };

  const roleBlock =
    userRole || aiRole
      ? `\n\nROLE FRAMING:\n- The user is playing: ${userRole || "themselves"}.\n- You are playing: ${aiRole || character.name}.${
          relationship
            ? `\n- The relationship between these roles is one of ${relationship}. Let that dynamic shape what you say, what you withhold, and what you push on. Do not narrate the dynamic — embody it.`
            : ""
        }`
      : "";

  const topicBlock = topic ? `\n\nOPENING THESIS / TOPIC:\n${topic}` : "";

  return `You are ${character.name}${character.era ? ` (${character.era})` : ""}.

CREDO: "${character.credo}"

WORLDVIEW & FIRST PRINCIPLES:
${character.worldview}

ARGUMENTATIVE METHOD:
${character.argument_style}

VOICE:
${character.voice}
${character.refusals ? `\nWHAT YOU REFUSE TO CONCEDE:\n${character.refusals}` : ""}
${character.opening_move ? `\nTYPICAL OPENING MOVE:\n${character.opening_move}` : ""}

${modeGuide[mode]}

COGNITIVE LEVEL — ${cognitiveLevel.toUpperCase()}: ${levelGuide[cognitiveLevel]}
${roleBlock}${topicBlock}

UNIVERSAL CONDUCT:
- Stay fully in character. Never break frame to say "as an AI" or "as a language model".
- Never use stage directions, emoji, or markdown headings. Plain prose only.
- Keep turns conversational — usually 1 to 5 short paragraphs, often shorter. This is a dialogue, not a lecture.
- Pursue genuine reasoning. Question assumptions. Offer counterarguments. Note contradictions. Encourage critical thinking.
- Do not recap what the user just said. Reply directly.
- Address the user as your role would address theirs.`;
}

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

          const SUPABASE_URL = process.env.SUPABASE_URL!;
          const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
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

          // Load full message history for the dialogue
          const { data: messages } = await userClient
            .from("messages")
            .select("role, content")
            .eq("dialogue_id", dialogueId)
            .order("created_at", { ascending: true });

          const systemPrompt = buildSystemPrompt({
            character: {
              name: character.name,
              era: character.era,
              credo: character.credo,
              worldview: character.worldview,
              argument_style: character.argument_style,
              voice: character.voice,
              refusals: character.refusals,
              opening_move: character.opening_move,
            },
            mode: dialogue.mode as "debate" | "roleplay" | "open",
            cognitiveLevel: dialogue.cognitive_level as "child" | "teen" | "adult" | "scholar",
            userRole: dialogue.user_role,
            aiRole: dialogue.ai_role,
            relationship: dialogue.relationship,
            topic: dialogue.topic,
          });

          // Choose model: deeper reasoning for scholar level or philosopher debates
          const useDeep =
            dialogue.cognitive_level === "scholar" ||
            (character.category === "philosopher" && dialogue.mode === "debate");
          const model = useDeep ? "google/gemini-2.5-pro" : "google/gemini-3-flash-preview";

          const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
          if (!LOVABLE_API_KEY) {
            return new Response(JSON.stringify({ error: "AI not configured" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const aiResponse = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model,
                stream: true,
                messages: [
                  { role: "system", content: systemPrompt },
                  ...(messages ?? []).map((m) => ({
                    role: m.role === "assistant" ? "assistant" : "user",
                    content: m.content,
                  })),
                ],
              }),
            },
          );

          if (!aiResponse.ok) {
            if (aiResponse.status === 429) {
              return new Response(
                JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }),
                { status: 429, headers: { "Content-Type": "application/json" } },
              );
            }
            if (aiResponse.status === 402) {
              return new Response(
                JSON.stringify({
                  error:
                    "AI credits exhausted. Add credits in Settings → Workspace → Usage.",
                }),
                { status: 402, headers: { "Content-Type": "application/json" } },
              );
            }
            const text = await aiResponse.text().catch(() => "");
            console.error("AI gateway error:", aiResponse.status, text);
            return new Response(JSON.stringify({ error: "AI gateway error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (!aiResponse.body) {
            return new Response(JSON.stringify({ error: "No response body" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Tee the stream: forward to client, accumulate to persist when done.
          const reader = aiResponse.body.getReader();
          const decoder = new TextDecoder();
          const encoder = new TextEncoder();
          let assembled = "";
          let buffer = "";

          const stream = new ReadableStream({
            async start(controller) {
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  controller.enqueue(value);

                  buffer += decoder.decode(value, { stream: true });
                  let nl: number;
                  while ((nl = buffer.indexOf("\n")) !== -1) {
                    let line = buffer.slice(0, nl);
                    buffer = buffer.slice(nl + 1);
                    if (line.endsWith("\r")) line = line.slice(0, -1);
                    if (!line.startsWith("data: ")) continue;
                    const payload = line.slice(6).trim();
                    if (payload === "[DONE]") continue;
                    try {
                      const parsed = JSON.parse(payload);
                      const delta = parsed?.choices?.[0]?.delta?.content;
                      if (typeof delta === "string") assembled += delta;
                    } catch {
                      // partial JSON — wait for more
                      buffer = line + "\n" + buffer;
                      break;
                    }
                  }
                }
                controller.close();

                // Persist full assistant turn (admin client bypasses RLS — we already
                // verified ownership above)
                if (assembled.trim()) {
                  await supabaseAdmin.from("messages").insert({
                    dialogue_id: dialogueId,
                    role: "assistant",
                    content: assembled,
                  });
                  await supabaseAdmin
                    .from("dialogues")
                    .update({ updated_at: new Date().toISOString() })
                    .eq("id", dialogueId);
                }
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
