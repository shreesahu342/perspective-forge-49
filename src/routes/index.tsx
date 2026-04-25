import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SocratesEmblem } from "@/components/socrates-emblem";
import socratesLogo from "@/assets/socrates-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Mirror — Enter the Arena of Ideas" },
      {
        name: "description",
        content:
          "Two modes. Infinite minds. Step into the arena of philosophical combat or stage a dialogue across roles. The Mirror awaits.",
      },
      { property: "og:title", content: "The Mirror — Enter the Arena of Ideas" },
      {
        property: "og:description",
        content: "Two modes. Infinite minds. The arena of philosophical dialogue.",
      },
      { property: "og:image", content: socratesLogo },
      { name: "twitter:image", content: socratesLogo },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen arena-bg vignette text-foreground">
      <SiteHeader />

      <main className="relative">
        {/* HERO — Logo + dramatic title */}
        <section className="relative mx-auto max-w-6xl px-6 pt-16 md:pt-24 pb-16 text-center">
          <p className="small-caps text-claret mb-6 tracking-[0.4em] glitch-flicker">
            ⚔  A House of Dialogue  ⚔
          </p>

          {/* Logo with cursor-tracking eyes */}
          <SocratesEmblem />

          <h1 className="font-display text-6xl md:text-8xl uppercase tracking-tight leading-none">
            The <span className="text-claret italic">Mirror</span>
          </h1>
          <p className="small-caps mt-4 text-foreground/60 tracking-[0.5em]">
            Of Perspectives
          </p>

          {/* Dramatic intro */}
          <div className="mt-10 mx-auto max-w-2xl">
            <p className="font-serif italic text-lg md:text-xl text-foreground/75 leading-relaxed">
              "The unexamined life is not worth living."
            </p>
            <p className="small-caps text-claret/70 mt-2">— Socrates, 399 B.C.</p>
            <div className="ornament my-8 max-w-md mx-auto">
              <span className="font-display text-claret">§</span>
            </div>
            <p className="font-serif text-base md:text-lg text-foreground/85 leading-relaxed">
              You stand at the threshold of a house where the dead still argue, where a
              child's <em>why</em> can collapse a kingdom, and where every belief you hold
              must answer for itself. <span className="text-claret">Choose your trial.</span>
            </p>
          </div>
        </section>

        {/* TWO MODES */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <p className="small-caps text-center text-foreground/40 mb-10 tracking-[0.4em]">
            ◆  Choose Your Mode  ◆
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <ModeCard
              numeral="I"
              title="Debate"
              kicker="Combat of Minds"
              body="Pick a philosopher. Offer your thesis. They will press, dismantle, and rebuild — Socratically, aphoristically, categorically — until your position either deepens or breaks."
              cta="Enter the Arena"
              href="/library"
            />
            <ModeCard
              numeral="II"
              title="Roleplay"
              kicker="Theatre of Voices"
              body="Assign a role to yourself, another to your interlocutor. Parent and child. Prophet and skeptic. Tyrant and citizen. The relationship shapes what is said — and what is withheld."
              cta="Stage the Scene"
              href="/dialogue/new"
            />
          </div>

          {/* Forge — secondary action */}
          <div className="mt-10 text-center">
            <Link
              to="/create"
              className="inline-flex items-center gap-3 small-caps text-foreground/50 hover:text-claret transition-colors"
            >
              <span className="h-px w-12 bg-current opacity-50" />
              Or forge your own interlocutor
              <span className="h-px w-12 bg-current opacity-50" />
            </Link>
          </div>
        </section>

        <footer className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-6 py-8 flex flex-wrap items-center justify-between gap-4 small-caps text-foreground/40">
            <span>The Mirror · MMXXVI</span>
            <span>Set in Fraunces & EB Garamond</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function ModeCard({
  numeral,
  title,
  kicker,
  body,
  cta,
  href,
}: {
  numeral: string;
  title: string;
  kicker: string;
  body: string;
  cta: string;
  href: "/library" | "/dialogue/new";
}) {
  // Local helper extracted below; keeping signature stable.
}) {
  return (
    <Link to={href} className="group block">
      <article className="mode-card p-8 md:p-10 h-full">
        <span className="mode-corner tl" />
        <span className="mode-corner tr" />
        <span className="mode-corner bl" />
        <span className="mode-corner br" />

        <div className="relative z-10">
          <div className="flex items-baseline justify-between mb-6">
            <span className="font-display text-7xl md:text-8xl text-claret/80 leading-none">
              {numeral}
            </span>
            <span className="small-caps text-foreground/40">{kicker}</span>
          </div>

          <h2 className="font-display text-4xl md:text-5xl uppercase tracking-tight mb-4 group-hover:text-claret transition-colors">
            {title}
          </h2>

          <p className="font-serif text-foreground/70 leading-relaxed mb-8 min-h-[6rem]">
            {body}
          </p>

          <div className="flex items-center justify-between border-t border-white/10 pt-5">
            <span className="small-caps text-claret group-hover:tracking-[0.3em] transition-all">
              {cta}
            </span>
            <span className="text-claret text-2xl group-hover:translate-x-2 transition-transform">
              →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
