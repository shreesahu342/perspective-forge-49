import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Auth has been removed from the user-facing UI. To preserve cloud sync of
 * dialogues and custom characters, we silently establish an anonymous Supabase
 * session in the background. Existing routes can keep calling `useAuth()`
 * unchanged — they just receive an anonymous user.
 */

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function useAnonymousSession(): AuthContextValue {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
    });

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) {
        setSession(data.session);
        setLoading(false);
        return;
      }
      // No session — sign in anonymously so cloud sync still works.
      try {
        const { data: anon, error } = await supabase.auth.signInAnonymously();
        if (!mounted) return;
        if (!error) setSession(anon.session);
      } catch {
        /* ignore — UI degrades gracefully */
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { session, user: session?.user ?? null, loading, signOut };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useAnonymousSession();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  // Fallback: if no provider is mounted, run the hook standalone.
  // This keeps legacy routes working even though the provider is gone.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return ctx ?? useAnonymousSession();
}
