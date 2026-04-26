-- 1. Schema additions
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS unlock_cost integer NOT NULL DEFAULT 0;

ALTER TABLE public.dialogues
  ADD COLUMN IF NOT EXISTS victory_claimed boolean NOT NULL DEFAULT false;

-- 2. Per-user point totals
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id uuid NOT NULL PRIMARY KEY,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own progress"
  ON public.user_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own progress"
  ON public.user_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own progress"
  ON public.user_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER user_progress_set_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Per-user unlocks
CREATE TABLE IF NOT EXISTS public.user_unlocks (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  challenge_pending boolean NOT NULL DEFAULT true,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, character_id)
);

ALTER TABLE public.user_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own unlocks"
  ON public.user_unlocks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own unlocks"
  ON public.user_unlocks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own unlocks"
  ON public.user_unlocks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own unlocks"
  ON public.user_unlocks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_unlocks_user_idx ON public.user_unlocks(user_id);

-- 4. RPC: atomic unlock — deducts points and inserts unlock if affordable.
-- Returns the new point total, or NULL if not enough points / already unlocked.
CREATE OR REPLACE FUNCTION public.unlock_character(_character_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _cost integer;
  _current integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT unlock_cost INTO _cost FROM public.characters WHERE id = _character_id;
  IF _cost IS NULL THEN
    RAISE EXCEPTION 'Character not found';
  END IF;

  -- Already unlocked? no-op
  IF EXISTS (SELECT 1 FROM public.user_unlocks
             WHERE user_id = _uid AND character_id = _character_id) THEN
    SELECT points INTO _current FROM public.user_progress WHERE user_id = _uid;
    RETURN COALESCE(_current, 0);
  END IF;

  -- Free character: just record unlock, no charge
  IF _cost = 0 THEN
    INSERT INTO public.user_unlocks (user_id, character_id, challenge_pending)
      VALUES (_uid, _character_id, false);
    SELECT points INTO _current FROM public.user_progress WHERE user_id = _uid;
    RETURN COALESCE(_current, 0);
  END IF;

  -- Make sure progress row exists
  INSERT INTO public.user_progress (user_id, points)
    VALUES (_uid, 0)
    ON CONFLICT (user_id) DO NOTHING;

  SELECT points INTO _current FROM public.user_progress WHERE user_id = _uid FOR UPDATE;

  IF _current < _cost THEN
    RAISE EXCEPTION 'Not enough points';
  END IF;

  UPDATE public.user_progress SET points = points - _cost WHERE user_id = _uid
    RETURNING points INTO _current;

  INSERT INTO public.user_unlocks (user_id, character_id, challenge_pending)
    VALUES (_uid, _character_id, true);

  RETURN _current;
END;
$$;

-- 5. RPC: claim victory points for a roleplay dialogue
CREATE OR REPLACE FUNCTION public.claim_victory(_dialogue_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _mode dialogue_mode;
  _claimed boolean;
  _msg_count integer;
  _award integer;
  _new_total integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT mode, victory_claimed INTO _mode, _claimed
    FROM public.dialogues WHERE id = _dialogue_id AND user_id = _uid;

  IF _mode IS NULL THEN RAISE EXCEPTION 'Dialogue not found'; END IF;
  IF _mode <> 'roleplay' THEN RAISE EXCEPTION 'Only roleplay dialogues award points'; END IF;
  IF _claimed THEN RAISE EXCEPTION 'Already claimed'; END IF;

  SELECT COUNT(*) INTO _msg_count FROM public.messages
    WHERE dialogue_id = _dialogue_id AND role = 'user';

  IF _msg_count < 3 THEN
    RAISE EXCEPTION 'Need at least 3 turns to claim victory';
  END IF;

  -- Award: 10 base + 2 per user turn, capped at 40
  _award := LEAST(10 + _msg_count * 2, 40);

  UPDATE public.dialogues SET victory_claimed = true WHERE id = _dialogue_id;

  INSERT INTO public.user_progress (user_id, points) VALUES (_uid, _award)
    ON CONFLICT (user_id) DO UPDATE SET points = public.user_progress.points + _award
    RETURNING points INTO _new_total;

  RETURN _new_total;
END;
$$;

-- 6. RPC: clear pending challenge after a philosopher delivers it
CREATE OR REPLACE FUNCTION public.clear_pending_challenge(_character_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.user_unlocks
  SET challenge_pending = false
  WHERE user_id = auth.uid() AND character_id = _character_id;
$$;

-- 7. Set unlock costs on built-in philosophers (Socrates is free).
UPDATE public.characters SET unlock_cost = 0  WHERE name = 'Socrates';
UPDATE public.characters SET unlock_cost = 30 WHERE name = 'Confucius';
UPDATE public.characters SET unlock_cost = 50 WHERE name = 'Immanuel Kant';
UPDATE public.characters SET unlock_cost = 60 WHERE name = 'Friedrich Nietzsche';
UPDATE public.characters SET unlock_cost = 70 WHERE name = 'Hannah Arendt';
UPDATE public.characters SET unlock_cost = 70 WHERE name = 'Simone de Beauvoir';
-- Everyday and archetype characters always free
UPDATE public.characters SET unlock_cost = 0 WHERE category IN ('everyday', 'archetype');
-- User-forged characters always free for that user (owner_id is set)
UPDATE public.characters SET unlock_cost = 0 WHERE is_builtin = false;