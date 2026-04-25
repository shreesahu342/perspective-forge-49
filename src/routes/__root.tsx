import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 paper-bg">
      <div className="max-w-md text-center">
        <p className="small-caps text-claret mb-4">Lost in the colonnade</p>
        <h1 className="font-display text-7xl">404</h1>
        <p className="mt-4 text-muted-foreground">
          The page you sought is not in this library.
        </p>
        <div className="mt-8">
          <Link to="/" className="ink-link">
            Return to the entrance
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "The Mirror — A House of Philosophical Dialogue" },
      {
        name: "description",
        content:
          "Debate Socrates, roleplay as a worried parent, sit with Confucius. An interactive house of philosophical dialogue.",
      },
      { name: "author", content: "The Mirror" },
      { property: "og:title", content: "The Mirror — A House of Philosophical Dialogue" },
      {
        property: "og:description",
        content:
          "Debate Socrates, roleplay as a worried parent, sit with Confucius. An interactive house of philosophical dialogue.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  // Force dark mode globally — the new aesthetic is dark-only.
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}
