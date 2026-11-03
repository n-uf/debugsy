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

## Versions and release

Calendar versions, `YY.M.R`, the same scheme as `@n-uf/hypr-tiling`:

- `YY` the year, `M` the calendar month of the release (no leading zero),
  `R` a counter within that month that starts at 0.
- `pnpm release:next-version` prints the next version; `pnpm version:bump`
  writes it to `packages/debugsy/package.json`. Prefer them over a hand-typed
  version: `M` is always the release month, never "the last month + 1".
- A release PR bumps the version and adds an entry to
  `packages/debugsy/CHANGELOG.md`. Merging it to `main` publishes that version
  to GitHub Packages and tags it `v<version>` (`.github/workflows/release.yml`);
  merges without a bump publish nothing.
- Never reuse a version number that was published and then removed; record it
  in `BURNED_VERSIONS` in `packages/debugsy/scripts/calendar-version-bump.mjs`.

Vercel deploys the site from `main` through its GitHub connection (root
`apps/web`).

## Licence

PolyForm Perimeter 1.0.1, the same licence as hypr-tiling; see `LICENSE`.
