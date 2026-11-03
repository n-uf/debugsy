pnpm + turbo monorepo: the library `@n-uf/debugsy` (`packages/debugsy`) and its
site (`apps/web`, debugsy.n-uf.com). See README.md.

- The library exposes only its root (`index.ts`). Re-export anything consumers
  need from there; never add `./src/*` exports.
- Inside the library, import siblings by relative path, never by the package
  name.
- Versions are calendar versions `YY.M.R`, as in hypr-tiling: a release PR
  runs `pnpm version:bump` and adds a CHANGELOG entry; merging to `main`
  publishes that version. Never hand-type a version or reuse a burned one.
- This repo is public. Deploys only through the Vercel Git connection to this
  repo (root `apps/web`); never `vercel deploy`. The Vercel Hobby cap (about
  100 deploys a day) is shared with all other projects: batch changes.
- Locally: lint, check-types and build for the changed package only.
- Git over HTTPS only.
