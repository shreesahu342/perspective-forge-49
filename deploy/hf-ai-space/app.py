from __future__ import annotations

import json
import os
from typing import Literal

from fastapi import FastAPI, HTTPException
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from mirror_agent.chat_runtime import MirrorMemoryChatbot

Mode = Literal["debate", "roleplay"]
MessageRole = Literal["user", "assistant", "system"]
Level = Literal["child", "teen", "adult", "scholar"]


class DebateProfilePayload(BaseModel):
    philosopher_name: str = "Unknown perspective"
    personality: str = "Not specified"
    debate: str = "Not specified"
    move: str = "Not specified"
    style: str = "Not specified"
    opening_thesis: str = "Not specified"


class RoleplayProfilePayload(BaseModel):
    ai_role: str = "Not specified"
    user_role: str = "Not specified"
    relationship: str = "Not specified"
    scene_text: str = "Not specified"


class ChatMessagePayload(BaseModel):
    role: MessageRole
    content: str = Field(min_length=1)


class ChatRequest(BaseModel):
    mode: Mode
    cognitive_level: Level = "adult"
    selection: str = "General"
    messages: list[ChatMessagePayload] = Field(default_factory=list)
    debate_profile: DebateProfilePayload | None = None
    roleplay_profile: RoleplayProfilePayload | None = None


class ChatResponse(BaseModel):
    raw: str
    message: str
    agreed: bool | None = None
    points: int | None = None


app = FastAPI(title="The Mirror AI Space", version="0.1.0")
chatbot = MirrorMemoryChatbot(
    model=os.getenv("AI_MODEL", "openai/gpt-oss-120b"),
    temperature=float(os.getenv("AI_TEMPERATURE", "1.0")),
)


def _to_langchain_messages(messages: list[ChatMessagePayload]) -> list[BaseMessage]:
    mapped: list[BaseMessage] = []
    for message in messages:
        if message.role == "user":
            mapped.append(HumanMessage(content=message.content))
        elif message.role == "assistant":
            mapped.append(AIMessage(content=message.content))
        else:
            mapped.append(SystemMessage(content=message.content))
    return mapped


def _starter_message(payload: ChatRequest) -> HumanMessage:
    if payload.mode == "debate":
        profile = payload.debate_profile or DebateProfilePayload()
        thesis = profile.opening_thesis.strip() or "Not specified"
        if thesis[-1:] not in ".!?":
            thesis = f"{thesis}."
        return HumanMessage(
            content=(
                f"As {profile.philosopher_name}, greet the user the way this archetype naturally would, then challenge this thesis in one short line: {thesis} "
                f"Use this personality: {profile.personality}. Use this method: {profile.debate}. Use this opening move: {profile.move}. Use this style: {profile.style}. "
                f"The user's cognitive level is {payload.cognitive_level}."
            )
        )

    profile = payload.roleplay_profile or RoleplayProfilePayload()
    scene_text = profile.scene_text.strip() or "Not specified"
    if scene_text[-1:] not in ".!?":
        scene_text = f"{scene_text}."
    return HumanMessage(
        content=(
            f"As {profile.ai_role}, greet {profile.user_role} naturally in one short line. "
            f"Use this relationship: {profile.relationship}. Use this scene detail: {scene_text} "
            f"The user's cognitive level is {payload.cognitive_level}."
        )
    )


def _extract_payload(raw_text: str) -> tuple[str, int | None, bool | None]:
    stripped = raw_text.strip()
    try:
        parsed = json.loads(stripped)
    except json.JSONDecodeError:
        return stripped or "...", None, None

    if not isinstance(parsed, dict):
        return stripped or "...", None, None

    message = str(parsed.get("message") or stripped).strip() or "..."
    points_value = parsed.get("points")
    points = int(points_value) if isinstance(points_value, (int, float)) and not isinstance(points_value, bool) else None
    agreed_value = parsed.get("agreed")
    agreed = agreed_value if isinstance(agreed_value, bool) else None
    return message, points, agreed


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/chat/respond", response_model=ChatResponse)
def respond(payload: ChatRequest) -> ChatResponse:
    try:
        messages = _to_langchain_messages(payload.messages)
        if not messages:
            messages = [_starter_message(payload)]

        reply = chatbot.generate_reply(
            mode=payload.mode,
            cognitive_level=payload.cognitive_level,
            selection=payload.selection,
            messages=messages,
            debate_profile=payload.debate_profile.model_dump() if payload.debate_profile else None,
            roleplay_profile=payload.roleplay_profile.model_dump() if payload.roleplay_profile else None,
        )
        raw = chatbot.message_text(reply).strip()
        message, points, agreed = _extract_payload(raw)
        return ChatResponse(raw=raw, message=message, points=points, agreed=agreed)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc