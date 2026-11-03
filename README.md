# debugsy

In-process React debugging panel: structured logs, render and dependency
tracking, module LEDs and a virtualised log view, mounted inside your app.
Site: https://debugsy.n-uf.com

| Folder | What |
| --- | --- |
| `packages/debugsy` | `@n-uf/debugsy`, the library (TypeScript source, one entry point) |
| `apps/web` | the showcase site (Next.js), debugsy.n-uf.com |
| `packages/eslint-config`, `packages/typescript-config` | internal shared configs |

Extracted from `finfactory/pdf-n-uf` (`packages/debugsy`, `apps/debugsy-app`)
with its history on 2026-11-02.

## Use it

`@n-uf/debugsy` is published to GitHub Packages:

```sh
# .npmrc
@n-uf:registry=https://npm.pkg.github.com
```

```tsx
import { DebugsyLook, useDebugsy, dsy, registerModule } from "@n-uf/debugsy";
```

The package exports only its root; the folders under `src/` are internal. It
ships TypeScript source, so Next.js consumers add it to `transpilePackages`.

## Develop

```sh
pnpm install              # needs a GitHub token with read:packages for @n-uf/*
pnpm dev                  # the site on http://localhost:3004
pnpm turbo lint check-types build
```

### Live editing from an app (HMR)

An app that uses `scripts/local-lib-links.mjs` (pdf-n-uf's web, admin; this
repo's site for harbuz) can alias `@n-uf/debugsy` to this checkout's source,
so edits hot-reload in the app:

```sh
LOCAL_LIB_REPOS=/opt/projects/n-uf/debugsy pnpm --dir apps/web dev
```

## Release

Add a changeset (`pnpm changeset`) to a PR. Merging to `main` versions and
publishes `@n-uf/debugsy` (`.github/workflows/release.yml`). Vercel deploys
the site from `main` through its GitHub connection (root `apps/web`).

## Licence

PolyForm Perimeter 1.0.1, see `LICENSE`.
