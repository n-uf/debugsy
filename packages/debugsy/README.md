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
import { DebugsyLook, useDebugsy, dsy, registerModule } from "@n-uf/debugsy";

registerModule("auth", {
  label: "Auth",
  emoji: "🔐",
  points: { session: { emoji: "🔑", label: "Session" } },
});

dsy.warn("auth.session", "expired", { ttl });

export function Root() {
  return <DebugsyLook />;
}
```

The package exports only its root. It ships TypeScript source: Next.js apps
add `@n-uf/debugsy` to `transpilePackages`. Peer dependencies: `react`,
`react-dom` 19 and `react18-json-view`.

Licence: PolyForm Perimeter 1.0.1.
