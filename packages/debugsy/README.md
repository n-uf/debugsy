# @n-uf/debugsy

In-process React debugging panel: structured logs, render and dependency
tracking, module LEDs and a virtualised log view. https://debugsy.n-uf.com

```sh
# .npmrc
@n-uf:registry=https://npm.pkg.github.com
```

```sh
pnpm add @n-uf/debugsy
```

```tsx
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

export function Root() {
  return <DebugsyLook />;
}
```

A point logs nothing until it's on: its LED in the panel, `?debug=session` in
the URL, or `dsy.enable("session")`. In development, a call that names a point
no module registered warns once in the console.

The package exports only its root. It ships TypeScript source: Next.js apps
add `@n-uf/debugsy` to `transpilePackages`. Peer dependencies: `react`,
`react-dom` 19 and `react18-json-view`.

Licence: PolyForm Perimeter 1.0.1.
