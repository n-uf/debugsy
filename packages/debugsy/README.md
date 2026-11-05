# @n-uf/debugsy

In-process React debugging panel: structured logs, render and dependency
tracking, module LEDs and a virtualised log view. https://debugsy.n-uf.com

```sh
npm i @n-uf/debugsy
```

Mount `<DebugsyLook />` from a client component. That's the whole setup: no
CSS import, no Tailwind, no bundler config.

```tsx
"use client";

import { DebugsyLook, dsy, registerModule } from "@n-uf/debugsy";

registerModule("auth", {
  label: "Auth",
  emoji: "🔐",
  description: "Sign-in and session state",
  points: {
    session: {
      emoji: "🔑",
      label: "Session",
      description: "Session refresh and expiry",
    },
  },
});

// Point keys are bare and shared by all modules: "session", not "auth.session".
dsy.warn("session", "Session expired", { ttlSeconds: 0 });

export function DebugPanel() {
  return <DebugsyLook />;
}
```

Press ⌘+D (Ctrl+D) to show the panel and again to expand it; Esc closes it.

A point logs nothing until it's on: its LED in the panel, `?debug=session` in
the URL, or `dsy.enable("session")`. In development, a call that names a point
no module registered warns once in the console.

- **React 19** (`react` and `react-dom` are peer dependencies). Works in the
  Next.js App Router, Vite and other React 19 apps.
- **Client only.** The package is marked `"use client"`: import it from client
  components. Keep it out of production builds by loading it only in
  development.
- **Styles itself.** The panel renders its own scoped stylesheet, so it looks
  the same in a Tailwind app and a plain one, and the app's CSS doesn't leak
  into it. To retune colours, override the `--dbg-*` tokens on `.dbg-root`.
- **An ES module** with type definitions, for bundlers (Node 22.12+ can also
  `require()` it). The package exports only its root (`@n-uf/debugsy/styles`
  is an empty file kept for older setups).

Licence: PolyForm Perimeter 1.0.1 (source-available). Third-party notices:
THIRD_PARTY_NOTICES.md.
