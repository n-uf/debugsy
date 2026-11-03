pnpm + turbo monorepo: the library `@n-uf/debugsy` (`packages/debugsy`) and its
site (`apps/web`, debugsy.n-uf.com). See README.md.

- The library exposes only its root (`index.ts`). Re-export anything consumers
  need from there; never add `./src/*` exports.
- Inside the library, import siblings by relative path, never by the package
  name.
- Releases: a changeset in the PR; merging to `main` publishes and deploys.
- Deploys only through the Vercel Git connection to the mirror
  `dmetelin/debugsy` (`deploy-mirror.yml`); never `vercel deploy`, never
  commit to the mirror. The Vercel Hobby cap (about 100 deploys a day) is
  shared with all other projects: batch changes.
- Locally: lint, check-types and build for the changed package only.
- Git over HTTPS only.
