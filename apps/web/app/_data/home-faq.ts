/**
 * The home page's FAQ and its FAQPage data: 5 questions worded the way people search, each answer one
 * paragraph of 40-60 words that starts with the direct answer. Facts come from the debugsy README, the
 * package README and CHANGELOG, and the site's own pages. The visible text and the structured data are made
 * from this one list, so they can't differ. A `code` span is written between backticks.
 */
export interface HomeFaq {
  readonly q: string;
  readonly a: string;
}

export const HOME_FAQ: readonly HomeFaq[] = [
  {
    q: "What is a React debug panel?",
    a: "A React debug panel is a panel inside your running app that shows what your components are doing. debugsy is one: you mount it in your own app, and it shows one ordered, virtualised log of your debug messages, the changed values you track and render-count warnings, in the page you're debugging.",
  },
  {
    q: "How do I add a debug panel to a React app?",
    a: "Install the package with `npm i @n-uf/debugsy`, then mount `<DebugsyLook />` from a client component. That's the whole setup: no CSS import, no Tailwind and no bundler config. It needs React 19. Press ⌘+D (Ctrl+D) to show the panel and Esc to close it.",
  },
  {
    q: "How do I keep a React debug panel out of production?",
    a: "Load it only in development. debugsy doesn't remove itself, so import it behind a `NODE_ENV` check to keep it out of production builds. Its console command, `window.debugsy`, is also left off in production builds. It makes no network requests and sends no telemetry, and its settings stay in localStorage.",
  },
  {
    q: "How can I see why a React component re-rendered?",
    a: "Use `useWhyDidYouUpdate`. With Deps switched on, it compares the values you pass with the previous render and logs each key that changed, with its old and new value. `useRenderTracker` adds a warning when a component reaches its render threshold, and it calls your callback. It doesn't stop renders.",
  },
  {
    q: "Does debugsy work with Next.js, Vite and Tailwind?",
    a: "Yes. debugsy works in the Next.js App Router, in Vite and in other React 19 apps. It is client only, so import it from client components. The panel renders its own scoped stylesheet, so it looks the same in a Tailwind app and a plain one, and your app's CSS doesn't leak into it.",
  },
];

/** An answer without its backticks: the text the structured data carries. */
export const plainAnswer = (a: string): string => a.replaceAll("`", "");
