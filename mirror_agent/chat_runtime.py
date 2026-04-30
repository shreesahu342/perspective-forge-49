from __future__ import annotations

import json
import os
from typing import Annotated, Literal

from pydantic import AliasChoices, BaseModel, Field
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from dotenv import load_dotenv
from typing_extensions import TypedDict

load_dotenv()

Mode = Literal["debate", "roleplay"]
Level = Literal["child", "teen", "adult", "scholar"]


class DebateTurnOutput(BaseModel):
    message: str = Field(
        min_length=1,
        validation_alias=AliasChoices("message", "response", "reply", "line"),
    )
    agreed: bool = Field(validation_alias=AliasChoices("agreed", "agreement"))


class RoleplayTurnOutput(BaseModel):
    message: str = Field(
        min_length=1,
        validation_alias=AliasChoices("message", "response", "reply", "line"),
    )
    points: int = Field(ge=0, le=10, validation_alias=AliasChoices("points", "score"))

DEBATE_SYSTEM_PROMPT = """
### ROLE
You are a debate agent embodying a specific philosopher in "The Mirror".

You MUST faithfully simulate:
- philosophy (core ideas, assumptions, worldview)
- reasoning method (how arguments are built and attacked)
- speaking style (tone, rhythm, structure)
- personality (temperament, aggressiveness, humility)

Do not approximate. Do not generalize. Act as that philosopher would.

---

### INPUT VARIABLES
philosopher_name: {philosopher_name}
personality: {personality}
debate_method: {debate}
opening_move: {move}
style: {style}
opening_thesis: {opening_thesis}
users_cognitive_level: {cognitive_level}

---

### PHILOSOPHER GROUNDING RULES

Before generating a reply:
1. Identify the philosopher’s core principles (implicit internal step)
2. Align response with:
   - their epistemology (what counts as truth)
   - their method (e.g., dialectic, empiricism, skepticism)
   - their typical argumentative moves
3. Reject responses that contradict the philosopher’s worldview

If unsure → default to the philosopher’s most widely accepted positions.

---

### DEBATE ENGINE (DETERMINISTIC)

For every user turn:

STEP 1 — Extract
- claim (if present)
- assumptions (implicit or explicit)

STEP 2 — Validate clarity
IF claim is vague:
  → ask for definition (do not argue yet)

STEP 3 — Attack
ELSE:
  choose ONE:
  - attack weakest assumption
  - provide counterexample
  - expose contradiction
  - reframe the claim

STEP 4 — Concede (rare)
Only concede if:
- user resolves contradiction OR
- provides stronger reasoning than current position

---

### RESPONSE CONSTRAINTS

message must:
- be ≤ 3 sentences
- be ≤ 60 tokens (approx)
- contain exactly ONE primary argumentative move
- end with a sharp follow-up question (unless conceding)

first turn:
- MUST be exactly 1 sentence
- MUST open with a brief greeting or address that this philosopher or archetype would plausibly use
- MUST directly engage the opening_thesis by challenging, refining, or pressure-testing it

style:
- spoken dialogue, not essay
- no fluff, no filler

---

### LANGUAGE ADAPTATION

child:
- ≤ 8 words per sentence
- concrete examples only

teen:
- simple language
- define any abstract term immediately

adult:
- concise explanations
- minimal definitions

scholar:
- allow abstraction
- define philosopher-specific terms once before use

---

### ARGUMENT QUALITY SCORING

Evaluate ONLY the user’s latest message.

score = 0

+1: clear claim
+1: supporting reason/example
+1: directly addresses prior challenge
+1: exposes contradiction or weak assumption

IF score ≥ 2:
  agreed = true
ELSE:
  agreed = false

Special rule:
- agreed = true ONLY if you genuinely concede or partially accept

---

### EDGE CASE HANDLING

IF no claim:
  - ask for a clear claim
  - agreed = false

IF opening_thesis is missing, blank, or "Not specified":
    - ask the user to state a clear thesis in one sentence
    - agreed = false

IF emotional or vague:
  - redirect to argument
  - agreed = false

IF repetition:
  - explicitly call it out

---

### OUTPUT FORMAT (STRICT)

Return ONLY valid JSON.

Schema:
{{
  "message": string,
  "agreed": boolean
}}

Rules:
- no extra text
- no markdown
- no explanations outside JSON
- message must never be empty

---

### FAILURE HANDLING

If constraints conflict:
1. prioritize JSON validity
2. then response constraints
3. then style

Always return valid JSON.
"""

ROLEPLAY_SYSTEM_PROMPT = """### ROLE
You are an in-character roleplay agent inside "The Mirror".

You MUST fully embody the assigned role:
- identity (who you are)
- intention (what you want)
- emotional state (what you feel but may not say)
- relationship dynamic (power, history, tension)

Never step outside the scene. Never explain the role. Never narrate.

---

### INPUT VARIABLES
selection: {selection}
ai_role: {ai_role}
user_role: {user_role}
relationship: {relationship}
scene_text: {scene_text}
cognitive_level: {cognitive_level}

---

### SCENE GROUNDING

Before replying (implicit step):
1. Infer:
   - what you want from the user
   - what you are avoiding saying
   - current emotional tension
2. Anchor every reply in:
   - relationship dynamic
   - current conflict or subtext
    - the user-described scene_text when it is provided
3. Maintain continuity across turns

Reject responses that:
- break character
- resolve tension too quickly
- become generic or neutral

---

### INTERACTION ENGINE (DETERMINISTIC)

For each user turn:

STEP 1 — Evaluate input
- Is it in-character?
- Does it add tension, intent, or emotion?

STEP 2 — Respond with ONE primary move:
Choose ONE:
- escalate tension
- reveal partial emotion
- challenge the user
- deflect or avoid
- shift power dynamic
- introduce a new constraint or pressure

STEP 3 — Leave space
- do not resolve the scene
- do not over-explain
- invite response implicitly or explicitly

---

### RESPONSE CONSTRAINTS

message must:
- be ≤ 3 sentences
- be ≤ 60 tokens (approx)
- feel like spoken dialogue (not narration)
- contain subtext (not everything stated directly)

first turn:
- MUST be exactly 1 sentence
- MUST open with a brief greeting or address that fits the assigned role naturally
- MUST incorporate the user-described scene_text when it is provided

style:
- natural, conversational
- no monologues
- no exposition dumps
- no stage directions unless minimal and inline

---

### LANGUAGE ADAPTATION

child:
- simple words
- short sentences
- clear emotions

teen:
- casual tone
- light emotional clarity

adult:
- natural, realistic speech
- implicit emotion allowed

scholar:
- more layered dialogue
- subtle subtext and implication

All levels:
- stay in character (no teaching tone)

---

### SCORING SYSTEM (DETERMINISTIC)

Evaluate ONLY the user’s latest message.

points = 0

IF breaks role OR irrelevant:
  points = 0–2

ELSE:
  base = 3

  +1 if fits role and context
  +1 if moves interaction forward
  +1 if adds tension or stakes
  +1 if shows clear motivation or intent
  +1 if adds emotional depth or subtext

  points = min(base + additions, 10)

IF no prior user input:
  points = 0

---

### EDGE CASE HANDLING

IF user breaks character:
  - pull them back into scene in-character

IF user gives minimal input:
  - increase tension or pressure

IF user resolves conflict too quickly:
  - reintroduce friction or complication

---

### OUTPUT FORMAT (STRICT)

Return ONLY valid JSON.

Schema:
{{
  "message": string,
  "points": number
}}

Rules:
- no extra text
- no markdown
- no explanation outside JSON
- message must not be empty

---

### FAILURE PRIORITY

If constraints conflict:
1. JSON validity
2. staying in character
3. response constraints
4. style
"""


class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    mode: Mode
    cognitive_level: Level
    selection: str
    debate_profile: dict[str, str]
    roleplay_profile: dict[str, str]


def build_system_prompt(
    mode: Mode,
    cognitive_level: Level,
    selection: str,
    debate_profile: dict[str, str] | None = None,
    roleplay_profile: dict[str, str] | None = None,
) -> str:
    if mode not in {"debate", "roleplay"}:
        raise ValueError(f"Unsupported mode: {mode}")

    if mode == "roleplay":
        profile = {
            "selection": selection.strip() or "Unknown selection",
            "ai_role": (roleplay_profile or {}).get("ai_role", "Not specified"),
            "user_role": (roleplay_profile or {}).get("user_role", "Not specified"),
            "relationship": (roleplay_profile or {}).get("relationship", "Not specified"),
            "scene_text": (roleplay_profile or {}).get("scene_text", "Not specified"),
            "cognitive_level": cognitive_level,
        }
        return ROLEPLAY_SYSTEM_PROMPT.format(**profile)

    profile = {
        "philosopher_name": (debate_profile or {}).get("philosopher_name", "Unknown perspective"),
        "personality": (debate_profile or {}).get("personality", "Not specified"),
        "debate": (debate_profile or {}).get("debate", "Not specified"),
        "move": (debate_profile or {}).get("move", "Not specified"),
        "style": (debate_profile or {}).get("style", "Not specified"),
        "opening_thesis": (debate_profile or {}).get("opening_thesis", "Not specified"),
        "cognitive_level": cognitive_level,
    }
    return DEBATE_SYSTEM_PROMPT.format(**profile)


class MirrorMemoryChatbot:
    """LangChain + LangGraph chatbot with per-thread conversational memory.

    Usage:
        export GROQ_API_KEY=your_key_here
        bot = MirrorMemoryChatbot()
        reply = bot.send_message(
            thread_id="demo-thread",
            mode="debate",
            selection="Socrates",
            user_message="Is justice stronger than power?",
        )
    """

    def __init__(
        self,
        *,
        api_key: str | None = None,
        model: str = "openai/gpt-oss-120b",
        temperature: float = 1.0,
        max_completion_tokens: int = 1024,
        top_p: float = 1.0,
        reasoning_effort: str = "medium",
    ) -> None:
        resolved_api_key = api_key or os.getenv("GROQ_API_KEY")
        if not resolved_api_key:
            raise ValueError("GROQ_API_KEY is required. Set it in the environment or pass api_key.")

        self._llm = ChatGroq(
            api_key=resolved_api_key,
            model=model,
            temperature=temperature,
            max_tokens=max_completion_tokens,
            reasoning_effort=reasoning_effort,
            model_kwargs={
                "top_p": top_p,
            },
        )
        self._debate_llm = self._llm.with_structured_output(
            DebateTurnOutput,
            method="json_mode",
        )
        self._roleplay_llm = self._llm.with_structured_output(
            RoleplayTurnOutput,
            method="json_mode",
        )

        workflow = StateGraph(ChatState)
        workflow.add_node("assistant", self._assistant)
        workflow.add_edge(START, "assistant")
        workflow.add_edge("assistant", END)
        self._graph = workflow.compile(checkpointer=MemorySaver())

    def _build_prompt_messages(
        self,
        *,
        mode: Mode,
        cognitive_level: Level,
        selection: str,
        messages: list[BaseMessage],
        debate_profile: dict[str, str] | None = None,
        roleplay_profile: dict[str, str] | None = None,
    ) -> list[BaseMessage]:
        return [
            SystemMessage(
                content=build_system_prompt(
                    mode,
                    cognitive_level,
                    selection,
                    debate_profile,
                    roleplay_profile,
                )
            ),
            *messages,
        ]

    def generate_reply(
        self,
        *,
        mode: Mode,
        cognitive_level: Level,
        selection: str,
        messages: list[BaseMessage],
        debate_profile: dict[str, str] | None = None,
        roleplay_profile: dict[str, str] | None = None,
    ) -> AIMessage:
        prompt_messages = self._build_prompt_messages(
            mode=mode,
            cognitive_level=cognitive_level,
            selection=selection,
            messages=messages,
            debate_profile=debate_profile,
            roleplay_profile=roleplay_profile,
        )

        if mode == "debate":
            response = self._debate_llm.invoke(prompt_messages)
            return AIMessage(content=json.dumps(response.model_dump()))

        response = self._roleplay_llm.invoke(prompt_messages)
        return AIMessage(content=json.dumps(response.model_dump()))

    @staticmethod
    def message_text(message: BaseMessage) -> str:
        content = getattr(message, "content", "")
        if isinstance(content, str):
            return content
        return "".join(part.get("text", "") for part in content if isinstance(part, dict))

    def _assistant(self, state: ChatState) -> ChatState:
        response = self.generate_reply(
            mode=state["mode"],
            cognitive_level=state["cognitive_level"],
            selection=state["selection"],
            messages=state["messages"],
            debate_profile=state.get("debate_profile"),
            roleplay_profile=state.get("roleplay_profile"),
        )
        return {
            "messages": [response],
            "mode": state["mode"],
            "cognitive_level": state["cognitive_level"],
            "selection": state["selection"],
            "debate_profile": state["debate_profile"],
            "roleplay_profile": state["roleplay_profile"],
        }

    def send_message(
        self,
        *,
        thread_id: str,
        mode: Mode,
        cognitive_level: Level = "adult",
        selection: str,
        user_message: str,
        philosopher_name: str | None = None,
        personality: str | None = None,
        debate: str | None = None,
        move: str | None = None,
        style: str | None = None,
        opening_thesis: str | None = None,
        ai_role: str | None = None,
        user_role: str | None = None,
        relationship: str | None = None,
        scene_text: str | None = None,
    ) -> str:
        if not user_message.strip():
            raise ValueError("user_message cannot be empty")

        debate_profile = {
            "philosopher_name": (philosopher_name or selection).strip() or "Unknown perspective",
            "personality": (personality or "Not specified").strip() or "Not specified",
            "debate": (debate or "Not specified").strip() or "Not specified",
            "move": (move or "Not specified").strip() or "Not specified",
            "style": (style or "Not specified").strip() or "Not specified",
            "opening_thesis": (opening_thesis or "Not specified").strip() or "Not specified",
        }
        roleplay_profile = {
            "ai_role": (ai_role or "Not specified").strip() or "Not specified",
            "user_role": (user_role or "Not specified").strip() or "Not specified",
            "relationship": (relationship or selection).strip() or "Not specified",
            "scene_text": (scene_text or "Not specified").strip() or "Not specified",
        }

        result = self._graph.invoke(
            {
                "mode": mode,
                "cognitive_level": cognitive_level,
                "selection": selection,
                "debate_profile": debate_profile,
                "roleplay_profile": roleplay_profile,
                "messages": [HumanMessage(content=user_message.strip())],
            },
            config={"configurable": {"thread_id": thread_id}},
        )

        last_message = result["messages"][-1]
        return self.message_text(last_message)

    def get_history(self, *, thread_id: str) -> list[BaseMessage]:
        snapshot = self._graph.get_state({"configurable": {"thread_id": thread_id}})
        if not snapshot.values:
            return []
        return list(snapshot.values.get("messages", []))


def run_cli() -> None:
    mode = input("Mode (debate/roleplay): ").strip().lower() or "debate"
    if mode not in {"debate", "roleplay"}:
        raise ValueError("Mode must be 'debate' or 'roleplay'.")

    selection = input("Selection: ").strip() or "General"
    thread_id = input("Thread ID [default]: ").strip() or "default"

    bot = MirrorMemoryChatbot()

    print("Type 'exit' to quit. Conversation memory is kept per thread ID for this process.")
    while True:
        user_message = input("You: ").strip()
        if user_message.lower() in {"exit", "quit"}:
            break
        reply = bot.send_message(
            thread_id=thread_id,
            mode=mode,
            selection=selection,
            user_message=user_message,
        )
        print(f"AI: {reply}")


if __name__ == "__main__":
    run_cli()