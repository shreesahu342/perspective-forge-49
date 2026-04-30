from __future__ import annotations

import json
import os
import re
from datetime import UTC, datetime
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from pymongo import MongoClient

from mirror_agent.chat_runtime import MirrorMemoryChatbot
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage

load_dotenv()

Mode = Literal["debate", "roleplay", "open"]
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
    dialogue_id: str = Field(min_length=1)
    mode: Mode
    cognitive_level: Level = "adult"
    selection: str = "General"
    messages: list[ChatMessagePayload]
    debate_profile: DebateProfilePayload | None = None
    roleplay_profile: RoleplayProfilePayload | None = None


class ChatResponse(BaseModel):
    message: str
    points: int = 0
    agreed: bool | None = None
    success: bool = False
    score_events: int = 0
    total_points: int = 0
    dialogue_id: str
    stored_at: str


class StoredChatMessage(BaseModel):
    id: str
    role: MessageRole
    content: str


class ChatSessionResponse(BaseModel):
    dialogue_id: str
    messages: list[StoredChatMessage] = Field(default_factory=list)
    success: bool = False
    score_events: int = 0
    total_points: int = 0
    updated_at: str | None = None


def _get_env(name: str, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if value is None or not value.strip():
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _create_mongo_client() -> MongoClient:
    return MongoClient(_get_env("MONGODB_URI", "mongodb://localhost:27017"))


mongo_client = _create_mongo_client()
mongo_db = mongo_client[_get_env("MONGODB_DB_NAME", "the_mirror")]
chat_sessions = mongo_db["chat_sessions"]
chatbot = MirrorMemoryChatbot()

app = FastAPI(title="The Mirror AI Backend", version="0.1.0")


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


def _session_messages(document: dict[str, object] | None, dialogue_id: str) -> list[StoredChatMessage]:
    raw_messages = document.get("messages", []) if document else []
    normalized: list[StoredChatMessage] = []
    for index, raw_message in enumerate(raw_messages):
        if not isinstance(raw_message, dict):
            continue
        role = raw_message.get("role")
        content = raw_message.get("content")
        if role not in {"user", "assistant", "system"}:
            continue
        if not isinstance(content, str) or not content.strip():
            continue
        normalized.append(
            StoredChatMessage(
                id=f"{dialogue_id}:{index}",
                role=role,
                content=content,
            )
        )
    return normalized


def _extract_json_payload(raw_text: str) -> dict[str, object] | None:
    stripped = raw_text.strip()
    if not stripped:
        return None

    fence_match = re.match(r"^```(?:json)?\s*(.*?)\s*```$", stripped, flags=re.DOTALL)
    if fence_match:
        stripped = fence_match.group(1).strip()

    candidates = [stripped]
    object_match = re.search(r"\{.*\}", stripped, flags=re.DOTALL)
    if object_match and object_match.group(0) != stripped:
        candidates.append(object_match.group(0))

    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            return parsed

    return None


def _coerce_bool(value: object) -> bool | None:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"true", "yes", "1"}:
            return True
        if lowered in {"false", "no", "0"}:
            return False
    return None


def _coerce_int(value: object, default: int = 0) -> int:
    if isinstance(value, bool):
        return default
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        try:
            return int(value.strip())
        except ValueError:
            return default
    return default


def _parse_ai_response(mode: Mode, raw_text: str, *, score_allowed: bool) -> tuple[str, int, bool | None]:
    payload = _extract_json_payload(raw_text) or {}
    message = str(payload.get("message") or raw_text).strip()
    if not message:
        message = raw_text.strip() or "..."

    if mode == "debate":
        agreed = _coerce_bool(payload.get("agreed"))
        if agreed is None:
            agreed = _coerce_bool(payload.get("agreement"))
        if agreed is None:
            agreed = _coerce_int(payload.get("points"), default=0) >= 10
        if not score_allowed:
            return message, 0, False
        return message, 10 if agreed else 0, agreed

    if not score_allowed:
        return message, 0, None

    points = max(0, min(10, _coerce_int(payload.get("points"), default=0)))
    return message, points, None


def _build_internal_starter_message(
    mode: Mode,
    cognitive_level: Level,
    selection: str,
    debate_profile: DebateProfilePayload | None,
    roleplay_profile: RoleplayProfilePayload | None,
) -> HumanMessage:
    if mode == "debate":
        name = (debate_profile.philosopher_name if debate_profile else selection).strip() or selection
        personality = debate_profile.personality if debate_profile else "Not specified"
        debate = debate_profile.debate if debate_profile else "Not specified"
        move = debate_profile.move if debate_profile else "Not specified"
        style = debate_profile.style if debate_profile else "Not specified"
        opening_thesis = debate_profile.opening_thesis if debate_profile else "Not specified"
        formatted_thesis = opening_thesis.strip() or "Not specified"
        if formatted_thesis[-1:] not in ".!?":
            formatted_thesis = f"{formatted_thesis}."
        return HumanMessage(
            content=(
                "Begin this debate by directly engaging the user's opening thesis. "
                f"Adopt the perspective of {name}. Use this personality: {personality}. "
                f"Use this debate method: {debate}. Favor this opening move: {move}. "
                f"Express it in this style: {style}. "
                f"The user's opening thesis is: {formatted_thesis} "
                f"The user's cognitive level is {cognitive_level}. "
                "Start with a brief in-character greeting or form of address that this philosopher or archetype would plausibly use. "
                "Challenge, refine, or pressure-test that thesis immediately. "
                "Return exactly one short line that invites the user to respond. "
                "Do not use a paragraph, list, or multi-line answer."
            )
        )

    return HumanMessage(
        content=(
            f"Begin this roleplay scene as {roleplay_profile.ai_role if roleplay_profile else 'the AI role'} "
            f"speaking to {roleplay_profile.user_role if roleplay_profile else 'the user role'}. "
            f"The user's cognitive level is {cognitive_level}. "
            f"The setup is {selection}. The relationship is {roleplay_profile.relationship if roleplay_profile else selection}. "
            f"Use this user-described scene detail in the opening line: {((roleplay_profile.scene_text if roleplay_profile else 'Not specified').strip() + ('' if (roleplay_profile.scene_text if roleplay_profile else 'Not specified').strip()[-1:] in '.!?' else '.'))} "
            "Start with a brief greeting or form of address that fits this role naturally. "
            "Establish the situation and tension naturally, then stop so the user has a concrete starting point to answer. "
            "Return exactly one short line."
        )
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/chat/session/{dialogue_id}", response_model=ChatSessionResponse)
def get_chat_session(dialogue_id: str) -> ChatSessionResponse:
    document = chat_sessions.find_one({"_id": dialogue_id}) or {}
    return ChatSessionResponse(
        dialogue_id=dialogue_id,
        messages=_session_messages(document, dialogue_id),
        success=bool(document.get("success", False)),
        score_events=int(document.get("score_events", 0) or 0),
        total_points=int(document.get("total_points", 0) or 0),
        updated_at=document.get("updated_at") if isinstance(document.get("updated_at"), str) else None,
    )


@app.post("/chat/respond", response_model=ChatResponse)
def respond(payload: ChatRequest) -> ChatResponse:
    try:
        langchain_messages = _to_langchain_messages(payload.messages)
        score_allowed = any(message.role == "user" for message in payload.messages)
        if not langchain_messages:
            langchain_messages = [
                _build_internal_starter_message(
                    payload.mode,
                    payload.cognitive_level,
                    payload.selection,
                    payload.debate_profile,
                    payload.roleplay_profile,
                )
            ]
        reply_message = chatbot.generate_reply(
            mode="roleplay" if payload.mode == "open" else payload.mode,
            cognitive_level=payload.cognitive_level,
            selection=payload.selection,
            messages=langchain_messages,
            debate_profile=payload.debate_profile.model_dump() if payload.debate_profile else None,
            roleplay_profile=payload.roleplay_profile.model_dump() if payload.roleplay_profile else None,
        )
        raw_reply_text = chatbot.message_text(reply_message).strip()
        reply_text, awarded_points, agreed = _parse_ai_response(
            payload.mode,
            raw_reply_text,
            score_allowed=score_allowed,
        )
        timestamp = datetime.now(UTC).isoformat()

        existing_session = chat_sessions.find_one({"_id": payload.dialogue_id}) or {}
        previous_score_events = int(existing_session.get("score_events", 0) or 0)
        previous_total_points = int(existing_session.get("total_points", 0) or 0)
        scored_this_turn = payload.mode == "debate" and awarded_points > 0
        score_events = previous_score_events + (1 if scored_this_turn else 0)
        total_points = previous_total_points + awarded_points
        success = payload.mode == "debate" and score_events >= 3

        stored_messages = [message.model_dump() for message in payload.messages]
        stored_messages.append({"role": "assistant", "content": reply_text})

        scoring_history = list(existing_session.get("scoring_history", []))
        if awarded_points > 0 or (payload.mode == "debate" and agreed is not None):
            scoring_history.append(
                {
                    "mode": payload.mode,
                    "points": awarded_points,
                    "agreed": agreed,
                    "created_at": timestamp,
                }
            )

        chat_sessions.update_one(
            {"_id": payload.dialogue_id},
            {
                "$set": {
                    "mode": payload.mode,
                    "cognitive_level": payload.cognitive_level,
                    "selection": payload.selection,
                    "debate_profile": payload.debate_profile.model_dump()
                    if payload.debate_profile
                    else None,
                    "roleplay_profile": payload.roleplay_profile.model_dump()
                    if payload.roleplay_profile
                    else None,
                    "messages": stored_messages,
                    "score_events": score_events,
                    "total_points": total_points,
                    "success": success,
                    "scoring_history": scoring_history,
                    "updated_at": timestamp,
                },
                "$setOnInsert": {
                    "created_at": timestamp,
                },
            },
            upsert=True,
        )

        return ChatResponse(
            message=reply_text,
            points=awarded_points,
            agreed=agreed if payload.mode == "debate" else None,
            success=success,
            score_events=score_events,
            total_points=total_points,
            dialogue_id=payload.dialogue_id,
            stored_at=timestamp,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc