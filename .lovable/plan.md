# Mirror of Perspectives — Plan

A typography-first website for philosophical dialogue. Conversations are rendered as a **Platonic dialogue script** (`SOCRATES: …` / `YOU: …`) on warm paper-like canvas, set in a classical editorial serif. The AI doesn't just answer — it questions, contradicts, and reasons in character.

---

## 1. Visual & Typographic Direction

**Editorial serif, journal-like.**
- Headings: a high-contrast display serif (Fraunces or EB Garamond), large, generous tracking
- Body & dialogue: a readable book serif at comfortable measure (~65ch)
- Background: warm off-white (#F7F3EC), ink (#1A1A1A), muted accent (deep claret / oxblood)
- Drop caps on the first speaker line of each dialogue
- Hairline rules, small caps for speaker names, no boxes/cards/rounded UI chrome where avoidable
- Quiet, deliberate motion — fade/slide on entry, no bouncy animations
- Fully responsive; mobile keeps the same single-column reading rhythm

A small dark-mode toggle (parchment ↔ midnight) is included.

---

## 2. Pages & Navigation

Separate routes (each with its own metadata for sharing/SEO):

- `/` — **Home / Manifesto.** Large typographic hero ("A mirror of perspectives"), a short philosophical preface, and three entry points: *Begin a Dialogue*, *Browse the Library*, *Create a Character*.
- `/library` — **Character Library.** Filterable by category: Philosophers, Everyday Roles, Archetypes, Your Custom. Each entry is a typographic card with name, era/role, and a one-line credo.
- `/character/$id` — **Character page.** Portrait-style typographic layout: name, dates, school of thought, core beliefs, conversational tendencies, and a "Begin dialogue" CTA.
- `/dialogue/new` — **Setup.** Pick character, your role (optional), AI's role (optional, for roleplay), cognitive level, and mode (Debate / Roleplay / Open dialogue).
- `/dialogue/$id` — **The dialogue itself.** Script-format conversation.
- `/dialogues` — **Your archive.** List of past conversations, searchable.
- `/create` — **Custom character forge.** Form to define a new character (name, beliefs, voice, era, opening stance).
- `/auth` — Sign in / sign up.

---

## 3. Character Library (curated + custom)

**Built-in (~12), hand-written persona briefs:**
- *Philosophers:* Socrates, Nietzsche, Kant, Simone de Beauvoir, Confucius, Hannah Arendt
- *Everyday roles:* Strict Teacher, Curious 5-Year-Old, Worried Parent, Skeptical Scientist
- *Archetypes:* The Devil's Advocate, The Mystic

Each character has a structured persona used by the AI:
- Worldview & first principles
- Argumentative style (e.g., Socratic elenchus, aphoristic provocation, categorical reasoning)
- Vocabulary register, rhetorical tics, what they refuse to concede
- Opening move tendencies

**Custom characters:** users can author their own with the same fields. Saved to their account, available in the Library.

---

## 4. Modes

1. **Philosophical Debate** — pick a character, pick a topic (or write your own thesis). The AI argues *as that thinker would*, pressing assumptions, offering counterexamples, surfacing contradictions in your position.
2. **Roleplay Debate** — assign a role to yourself and a role to the AI (e.g., parent ↔ 5-year-old, student ↔ strict teacher). The AI inhabits motivations, limits, and emotional register of its role.
3. **Open Dialogue** — looser, exploratory; still in character.

**Adaptive Cognitive Level** (Child / Teen / Adult / Scholar) adjusts vocabulary, sentence length, depth of reference, and how much the AI scaffolds vs. challenges. Selectable per dialogue and changeable mid-conversation.

**Relational dynamics:** the system passes the *relationship* between roles (authority, dependence, conflict, care, mentorship) to the model so the dialogue evolves with that tension instead of treating each turn in isolation.

---

## 5. Dialogue Interface (script format)

Rendered as a typeset Platonic dialogue, not chat bubbles:

```
SOCRATES.   And tell me — when you say "freedom," do you mean
            absence of restraint, or the power to choose well?

YOU.        I mean… the first, I think.

SOCRATES.   Then is a man free who is enslaved to his appetites?
```

- Speaker name in small caps, hanging indent for each turn
- Streamed token-by-token so reasoning feels live
- Subtle "thinking" ellipsis while the AI prepares its move
- A discreet toolbar (bottom of page): *change cognitive level*, *concede / press further / change topic*, *export as PDF*, *end dialogue*
- The composer is a single quiet input below the rule, full-width, serif

---

## 6. Backend & AI

**Lovable Cloud** for accounts, conversation storage, and characters:
- Email + Google sign-in
- Tables: `profiles`, `characters` (built-in + user-owned with RLS), `dialogues`, `messages`, plus a `user_roles` table for future moderation
- RLS: users can only read/write their own dialogues and custom characters; built-in characters are readable by all

**Lovable AI Gateway** powers the dialogue (default model: `google/gemini-3-flash-preview`; the deeper-reasoning `google/gemini-2.5-pro` is used automatically when the cognitive level is *Scholar* or when the character is a philosopher in Debate mode).

The streaming edge function builds the system prompt server-side from:
- the character's persona brief
- the user's role + AI's role + relationship dynamic
- the chosen cognitive level
- the mode (Debate / Roleplay / Open)
- a standing instruction to question assumptions, present counterarguments, and avoid empty agreement

The full message history is sent on every turn so the philosophical thread stays coherent.

Friendly toasts surface rate-limit (429) and credit (402) errors.

---

## 7. Out of Scope (for v1)

- Voice input/output
- Multi-character dialogues (more than one AI participant)
- Public sharing of dialogues / community feed
- Payments

These can come in a follow-up once the core experience feels right.
