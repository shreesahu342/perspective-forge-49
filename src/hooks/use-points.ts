import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function usePoints() {
  const { user } = useAuth();
  const [points, setPoints] = useState<number>(0);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [{ data: prog }, { data: unlocks }] = await Promise.all([
      supabase.from("user_progress").select("points").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_unlocks").select("character_id").eq("user_id", user.id),
    ]);
    setPoints(prog?.points ?? 0);
    setUnlockedIds(new Set((unlocks ?? []).map((u) => u.character_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void refresh();
  }, [user, refresh]);

  return { points, unlockedIds, loading, refresh };
}
