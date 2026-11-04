# @n-uf/debugsy

Versions are calendar versions, `YY.M.R` (year, month of the release, counter
within the month), the same scheme as `@n-uf/hypr-tiling`.

## 26.11.1

- `useRenderTracker(name, { … })` counts renders and mounts again. The options
  form left `trackRenders` and `trackMounts` undefined, so it counted nothing;
  both now default to `true`, as documented. Passing them is still fine.
- Remounts are counted per component name, so `mountThreshold` catches a
  component that keeps remounting (a changing `key`, a component re-created
  by its parent). The count used to live in the instance and started at 0
  on every remount. `mount.mountCount` now counts remounts: instances on
  screen together and Strict Mode's second mount don't add to it.
- The default render threshold is 10 and comes from
  `DEPS_CONFIG_DEFAULTS.renderRateDefaultThreshold`, which said 3.
- In development, a log call to a point no module registered warns once in
  the console. Point keys are bare: `"session"`, not `"auth.session"`.
- The built-in Errors point is described as what it is, a point your app
  logs errors to; debugsy doesn't listen for uncaught errors.
- README: the example logs to a bare point key and gives `registerModule`
  the `description` fields it requires.
- Tests: vitest, run in CI.

## 26.11.0

- First calendar-versioned release. Same code as 0.2.0.
- Licence: PolyForm Perimeter 1.0.1, as for hypr-tiling.

## 0.2.0

- New `@n-uf/debugsy/styles` entry: import it after `tailwindcss` so Tailwind
  v4 generates the classes debugsy's components use when the package is
  installed from the registry (node_modules is not scanned by default).

## 0.1.0

- Extracted from finfactory/pdf-n-uf (`packages/debugsy`) with its history.
- One entry point: everything public is exported from the package root.
