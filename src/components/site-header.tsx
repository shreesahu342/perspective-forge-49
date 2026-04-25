import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const { isDark, toggle } = useTheme();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.navigate({ to: "/" });
  };

  return (
    <header className="hairline-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="font-display text-xl tracking-tight hover:text-claret transition-colors">
          The Mirror
        </Link>

        <nav className="flex items-center gap-7 small-caps">
          <Link
            to="/library"
            className="text-foreground/70 hover:text-claret transition-colors"
            activeProps={{ className: "text-claret" }}
          >
            Library
          </Link>
          <Link
            to="/dialogues"
            className="text-foreground/70 hover:text-claret transition-colors"
            activeProps={{ className: "text-claret" }}
          >
            Archive
          </Link>
          <Link
            to="/create"
            className="text-foreground/70 hover:text-claret transition-colors"
            activeProps={{ className: "text-claret" }}
          >
            Forge
          </Link>
          <button
            onClick={toggle}
            className="text-foreground/70 hover:text-claret transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? "Day" : "Night"}
          </button>
          {user ? (
            <button
              onClick={handleSignOut}
              className="text-foreground/70 hover:text-claret transition-colors"
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/auth"
              className="text-foreground/70 hover:text-claret transition-colors"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
