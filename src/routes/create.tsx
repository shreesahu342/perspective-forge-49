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
      { title: "Forge a character — The Mirror" },
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
    if (!authLoading && !user) navigate({ to: "/auth" });
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
    <div className="min-h-screen paper-bg">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="small-caps text-claret mb-4">The Forge</p>
        <h1 className="font-display mb-4">Author a mind.</h1>
        <p className="font-serif text-lg text-muted-foreground mb-12 measure-wide">
          Write someone into being — historical, fictional, or composite. The more
          specific you are about how they think, the more they will sound like
          themselves rather than like everyone.
        </p>

        <form onSubmit={handleSubmit} className="space-y-10">
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
                  className={`small-caps border px-4 py-2 transition-colors ${
                    category === c.value
                      ? "border-claret bg-claret text-claret-foreground"
                      : "border-foreground/30 hover:border-claret hover:text-claret"
                  }`}
                >
                  {c.label}
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

          <div className="flex items-center gap-6 pt-4">
            <button
              type="submit"
              disabled={busy}
              className="bg-claret text-claret-foreground py-4 px-8 small-caps hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {busy ? "Forging…" : "Forge →"}
            </button>
            <Link to="/library" className="small-caps text-muted-foreground hover:text-claret transition-colors">
              Cancel
            </Link>
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
      <p className="small-caps text-muted-foreground mb-3">
        {label} {required && <span className="text-claret">*</span>}
      </p>
      {children}
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-8 md:grid-cols-2">{children}</div>;
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
      className="w-full bg-transparent border-b border-foreground/30 py-3 font-serif text-lg focus:outline-none focus:border-claret transition-colors"
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
      className="w-full bg-transparent border-b border-foreground/30 py-3 font-serif text-lg leading-relaxed focus:outline-none focus:border-claret transition-colors resize-none"
    />
  );
}
