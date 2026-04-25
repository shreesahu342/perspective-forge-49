import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Enter the house — The Mirror" },
      { name: "description", content: "Sign in or create an account to begin a dialogue." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    // Already signed in
    navigate({ to: "/library" });
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/library`,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Welcome. Check your inbox to confirm your account.");
        navigate({ to: "/library" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        navigate({ to: "/library" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/library` },
      });
      if (error) throw error;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      toast.error(msg);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen paper-bg">
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-20">
        <p className="small-caps text-claret mb-4">Enter the house</p>
        <h1 className="font-display text-5xl mb-2">
          {mode === "signin" ? "Welcome back." : "Begin."}
        </h1>
        <p className="font-serif text-muted-foreground mb-10">
          {mode === "signin"
            ? "Continue your dialogues."
            : "An account keeps your conversations and custom characters."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === "signup" && (
            <div>
              <label className="small-caps block mb-2 text-muted-foreground">Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-transparent border-b border-foreground/30 py-3 font-serif text-lg focus:outline-none focus:border-claret transition-colors"
                placeholder="What shall we call you?"
              />
            </div>
          )}
          <div>
            <label className="small-caps block mb-2 text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-foreground/30 py-3 font-serif text-lg focus:outline-none focus:border-claret transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="small-caps block mb-2 text-muted-foreground">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-foreground/30 py-3 font-serif text-lg focus:outline-none focus:border-claret transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-claret text-claret-foreground py-4 small-caps hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="ornament my-8">
          <span className="small-caps">or</span>
        </div>

        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full border border-foreground/30 py-4 small-caps hover:border-claret hover:text-claret transition-colors disabled:opacity-50"
        >
          Continue with Google
        </button>

        <p className="mt-10 text-center text-muted-foreground font-serif">
          {mode === "signin" ? "New here? " : "Already have an account? "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="ink-link"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>

        <p className="mt-6 text-center small-caps text-muted-foreground">
          <Link to="/" className="hover:text-claret transition-colors">
            ← Return to the entrance
          </Link>
        </p>
      </main>
    </div>
  );
}
