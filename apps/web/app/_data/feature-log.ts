/**
 * Static, server-side data for the home page: the features it lists.
 *
 * The live debugsy panel itself is the real `<DebugsyLook>` component — see
 * `app/_components/debugsy-look-mounted.tsx`.
 */

// =============================================================================
// Capabilities — major features advertised on the homepage, shown in its
// "What the panel shows" section.
// =============================================================================

export interface Capability {
  readonly num: string;
  readonly title: string;
  readonly summary: string;
}

export const CAPABILITIES: readonly Capability[] = [
  {
    num: "01",
    title: "One log inside your app",
    summary:
      "Your debug messages, changed values and render-count warnings in one ordered, virtualised log, in the page you're debugging.",
  },
  {
    num: "02",
    title: "Which value changed",
    summary:
      "With Deps switched on, useWhyDidYouUpdate compares the values you pass with the previous render and logs each key that changed, with its old and new value.",
  },
  {
    num: "03",
    title: "Values re-created every render",
    summary:
      "A function or object made anew on every render shows up as a \"function changed\" or \"object changed\" line with a running count, flagged FREQUENT once it keeps changing after start-up.",
  },
  {
    num: "04",
    title: "Render count warnings",
    summary:
      "With Deps on (and trackRenders: true in 26.11), useRenderTracker warns when a component reaches its render threshold and calls your callback. It doesn't stop renders.",
  },
  {
    num: "05",
    title: "Debug points by module",
    summary:
      "registerModule groups named debug points, like session and refresh under Auth, each with a label, an emoji and a description, so the log reads by area.",
  },
  {
    num: "06",
    title: "No telemetry",
    summary:
      "No network requests and nothing sent anywhere; settings stay in localStorage. Load it in development only to keep it out of production builds.",
  },
];
