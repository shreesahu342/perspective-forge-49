import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Dialogue = Database["public"]["Tables"]["dialogues"]["Row"] & {
  characters: { name: string; era: string | null } | null;
};

export const Route = createFileRoute("/dialogues")({
  head: () => ({
    meta: [
      { title: "The Archive — The Mirror" },
      { name: "description", content: "Your past dialogues, kept like letters." },
    ],
  }),
  component: ArchivePage,
});

function ArchivePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    // auth removed — anonymous sessions
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("dialogues")
        .select("*, characters(name, era)")
        .order("updated_at", { ascending: false });
      if (!active) return;
      setDialogues((data as unknown as Dialogue[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const filtered = dialogues.filter((d) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.characters?.name.toLowerCase().includes(q) ||
      d.topic?.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this dialogue? This cannot be undone.")) return;
    const { error } = await supabase.from("dialogues").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDialogues((prev) => prev.filter((d) => d.id !== id));
    toast.success("Removed.");
  };

  return (
    <div className="min-h-screen paper-bg">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="small-caps text-claret mb-4">The Archive</p>
        <h1 className="font-display mb-4">Your dialogues.</h1>
        <p className="font-serif text-lg text-muted-foreground mb-12 measure-wide">
          A record of what was said, and to whom. Old conversations often hold
          more than they did the day they ended.
        </p>

        <div className="hairline-b pb-4 mb-10 flex items-center justify-between gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="flex-1 bg-transparent font-serif text-lg focus:outline-none placeholder:text-muted-foreground/60"
          />
          <Link to="/dialogue/new" className="small-caps ink-link whitespace-nowrap">
            + New
          </Link>
        </div>

        {loading ? (
          <p className="font-serif text-muted-foreground">Reading the archive…</p>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-serif italic text-muted-foreground mb-6">
              {dialogues.length === 0
                ? "Nothing here yet. Begin a dialogue and it will be kept."
                : "No dialogues match that search."}
            </p>
            {dialogues.length === 0 && (
              <Link to="/library" className="ink-link small-caps">
                Choose an interlocutor →
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-foreground/15">
            {filtered.map((d) => (
              <li key={d.id} className="py-6 flex items-start justify-between gap-6 group">
                <Link
                  to="/dialogue/$dialogueId"
                  params={{ dialogueId: d.id }}
                  className="flex-1 min-w-0"
                >
                  <p className="small-caps text-muted-foreground mb-2">
                    {d.mode === "debate" ? "Debate" : d.mode === "roleplay" ? "Scene" : "Open"}
                    {d.characters?.name ? ` · with ${d.characters.name}` : ""}
                    {" · "}
                    {new Date(d.updated_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <h3 className="font-display text-2xl group-hover:text-claret transition-colors">
                    {d.title}
                  </h3>
                  {d.topic && (
                    <p className="font-serif italic text-muted-foreground mt-1 line-clamp-2">
                      {d.topic}
                    </p>
                  )}
                </Link>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="small-caps text-muted-foreground/50 hover:text-destructive transition-colors mt-2"
                  aria-label="Delete"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
