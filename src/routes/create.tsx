import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Category = Database["public"]["Enums"]["character_category"];

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "The Forge — The Mirror" },
      { name: "description", content: "Author a new mind: credo, worldview, method, voice." },
    ],
  }),
  component: CreatePage,
});

const CATEGORIES: Array<{ value: Category; label: string }> = [
  { value: "philosopher", label: "Philosopher" },
  { value: "everyday", label: "Everyday role" },
  { value: "archetype", label: "Archetype" },
];

function CreatePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [era, setEra] = useState("");
  const [category, setCategory] = useState<Category>("philosopher");
  const [credo, setCredo] = useState("");
  const [worldview, setWorldview] = useState("");
  const [argumentStyle, setArgumentStyle] = useState("");
  const [voice, setVoice] = useState("");
  const [refusals, setRefusals] = useState("");
  const [openingMove, setOpeningMove] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // anonymous
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim() || !credo.trim() || !worldview.trim() || !argumentStyle.trim() || !voice.trim()) {
      toast.error("Name, credo, worldview, method, and voice are required.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("characters")
        .insert({
          owner_id: user.id,
          is_builtin: false,
          name: name.trim(),
          era: era.trim() || null,
          category,
          credo: credo.trim(),
          worldview: worldview.trim(),
          argument_style: argumentStyle.trim(),
          voice: voice.trim(),
          refusals: refusals.trim() || null,
          opening_move: openingMove.trim() || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Forged.");
      navigate({ to: "/character/$characterId", params: { characterId: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not forge character");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen arena-bg vignette text-foreground">
      <SiteHeader />
      <main className="relative mx-auto max-w-3xl px-6 py-12 md:py-16">
        <Link to="/library" className="small-caps text-foreground/50 hover:text-claret transition-colors text-[0.7rem] tracking-[0.25em]">
          ← Back
        </Link>

        <div className="mt-6 mb-12 text-center">
          <p className="small-caps text-claret tracking-[0.4em] glitch-flicker mb-4">
            ◆  The Forge  ◆
          </p>
          <h1 className="font-display text-5xl md:text-6xl uppercase tracking-tight">
            Author a <span className="text-claret italic">mind</span>
          </h1>
          <p className="mt-5 mx-auto max-w-2xl font-serif text-foreground/65 leading-relaxed">
            Write someone into being — historical, fictional, or composite. The more
            specific you are about how they think, the more they will sound like
            themselves rather than like everyone.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="hud-frame p-6 md:p-10 relative space-y-8">
            <span className="hud-corner tl" />
            <span className="hud-corner tr" />
            <span className="hud-corner bl" />
            <span className="hud-corner br" />

            <FieldRow>
              <Field label="Name" required>
                <TextInput value={name} onChange={setName} placeholder="Hypatia of Alexandria" />
              </Field>
              <Field label="Era / role">
                <TextInput value={era} onChange={setEra} placeholder="c. 350–415 CE" />
              </Field>
            </FieldRow>

            <Field label="Category">
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`option-pill px-4 py-2 ${category === c.value ? "active" : ""}`}
                  >
                    <span className="small-caps text-[0.7rem]">{c.label}</span>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Credo (one line)" required>
              <TextInput
                value={credo}
                onChange={setCredo}
                placeholder="A motto they would write above their door."
              />
            </Field>

            <Field label="Worldview & first principles" required>
              <TextArea
                value={worldview}
                onChange={setWorldview}
                rows={4}
                placeholder="What they take to be true about human beings, knowledge, value, the world."
              />
            </Field>

            <Field label="Argumentative method" required>
              <TextArea
                value={argumentStyle}
                onChange={setArgumentStyle}
                rows={3}
                placeholder="How they reason. Do they ask questions? Tell stories? Demand definitions? Cite scripture?"
              />
            </Field>

            <Field label="Voice" required>
              <TextArea
                value={voice}
                onChange={setVoice}
                rows={3}
                placeholder="Vocabulary, register, recurring phrases, sentence rhythm, what they sound like."
              />
            </Field>

            <Field label="What they refuse to concede">
              <TextArea
                value={refusals}
                onChange={setRefusals}
                rows={2}
                placeholder="Lines they will not cross, no matter how clever the argument."
              />
            </Field>

            <Field label="Typical opening move">
              <TextArea
                value={openingMove}
                onChange={setOpeningMove}
                rows={2}
                placeholder="How they tend to begin a conversation."
              />
            </Field>

            <div className="pt-6 border-t border-white/10 flex items-center gap-4">
              <button type="submit" disabled={busy} className="btn-claret">
                {busy ? "Forging…" : "⚒  Forge"}
              </button>
              <Link to="/library" className="btn-ghost">
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="small-caps text-claret/70 tracking-[0.3em] mb-3 text-[0.7rem] flex items-center gap-2">
        <span className="h-px w-8 bg-claret/40" />
        {label} {required && <span className="text-claret">*</span>}
      </p>
      {children}
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-6 md:grid-cols-2">{children}</div>;
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="game-input"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows ?? 3}
      className="game-input resize-none leading-relaxed"
    />
  );
}
