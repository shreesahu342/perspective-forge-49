import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Mirror — A House of Philosophical Dialogue" },
      {
        name: "description",
        content:
          "An interactive house for philosophical debate and roleplay. Question Socrates, sit with Confucius, argue with Nietzsche — and watch what your own positions become in the light of another mind.",
      },
      { property: "og:title", content: "The Mirror — A House of Philosophical Dialogue" },
      {
        property: "og:description",
        content:
          "An interactive house for philosophical debate and roleplay.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen paper-bg">
      <SiteHeader />

      <main>
        {/* Hero — manifesto */}
        <section className="mx-auto max-w-5xl px-6 pt-24 pb-20 md:pt-36 md:pb-28">
          <p className="small-caps text-claret mb-8">A House of Dialogue · Est. on the page</p>
          <h1 className="font-display leading-[0.95]">
            A mirror
            <br />
            <em className="italic font-normal">of perspectives.</em>
          </h1>
          <div className="mt-12 grid gap-12 md:grid-cols-[1fr_auto] md:items-end">
            <p className="measure-wide font-serif text-xl md:text-2xl leading-relaxed text-foreground/80">
              Sit across from Socrates and be asked what you actually mean.
              Argue with Nietzsche about what you call a virtue. Speak as a
              parent to a five-year-old who will not stop asking <em>why</em>.
              <br />
              <br />
              This is not a chatbot. It is a place to be <em>questioned</em>.
            </p>
            <div className="flex flex-col gap-3 small-caps">
              <Link
                to="/library"
                className="border-y border-foreground/30 py-4 px-2 text-center hover:border-claret hover:text-claret transition-colors"
              >
                Choose an interlocutor →
              </Link>
              <Link
                to="/dialogue/new"
                className="bg-claret text-claret-foreground py-4 px-6 text-center hover:opacity-90 transition-opacity"
              >
                Begin a dialogue
              </Link>
            </div>
          </div>
        </section>

        <div className="ornament mx-auto max-w-3xl px-6">
          <span className="font-display text-2xl text-claret">§</span>
        </div>

        {/* Three doors */}
        <section className="mx-auto max-w-6xl px-6 py-24 grid gap-12 md:grid-cols-3">
          <Door
            number="I."
            title="Philosophical Debate"
            body="Pick a thinker. Offer a thesis. They will press you — Socratically, aphoristically, categorically — until your position either deepens or breaks. The point is not to win. The point is to see."
            cta="Debate a philosopher"
            href="/library"
          />
          <Door
            number="II."
            title="Roleplay Dialogue"
            body="Assign a role to yourself, another to your interlocutor. Parent and child. Student and stern teacher. Believer and skeptic. The relationship between you shapes what is said — and what is withheld."
            cta="Stage a scene"
            href="/dialogue/new"
          />
          <Door
            number="III."
            title="Forge a Character"
            body="Write a mind into being. Give them a credo, a worldview, a method, a voice. Save them to your library. Speak with them whenever the question returns."
            cta="Forge a character"
            href="/create"
          />
        </section>

        <div className="ornament mx-auto max-w-3xl px-6">
          <span className="font-display text-2xl text-claret">§</span>
        </div>

        {/* Preface */}
        <section className="mx-auto max-w-2xl px-6 py-24">
          <p className="small-caps text-muted-foreground mb-6">A short preface</p>
          <div className="drop-cap font-serif text-lg leading-relaxed text-foreground/85">
            We tend to mistake the loudest voice in our heads for our own. A
            philosophical dialogue, done honestly, is a small mirror held up to
            that voice — long enough, and at the right angle, that we begin to
            recognize which thoughts we inherited, which we performed, and which
            are actually ours. This house is a place to do that work, with company
            who will not flatter you.
          </div>
          <div className="mt-12 ornament">
            <span className="font-display text-2xl text-claret">⁂</span>
          </div>
        </section>

        <footer className="hairline mt-12">
          <div className="mx-auto max-w-6xl px-6 py-10 flex flex-wrap items-center justify-between gap-4 small-caps text-muted-foreground">
            <span>The Mirror · A house of dialogue</span>
            <span>Set in Fraunces & EB Garamond</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Door({
  number,
  title,
  body,
  cta,
  href,
}: {
  number: string;
  title: string;
  body: string;
  cta: string;
  href: "/library" | "/dialogue/new" | "/create";
}) {
  return (
    <article className="border-t border-foreground/20 pt-6">
      <p className="font-display text-claret text-3xl mb-4">{number}</p>
      <h3 className="font-display text-2xl mb-4">{title}</h3>
      <p className="font-serif text-foreground/80 leading-relaxed mb-6">{body}</p>
      <Link to={href} className="ink-link small-caps">
        {cta} →
      </Link>
    </article>
  );
}
