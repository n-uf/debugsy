# @n-uf/debugsy

Versions are calendar versions, `YY.M.R` (year, month of the release, counter
within the month), the same scheme as `@n-uf/hypr-tiling`.

## Unreleased

- debugsy no longer depends on `@n-uf/harbuz`. The parts of the panel that
  came from it (terminal window, log rows, tray display, indicator buttons,
  action toolbar, virtualized list and small hooks) are debugsy's own code,
  ported from harbuz 0.6.0 unchanged, so the panel looks the same.
- Removed the unused dependencies `react-window`,
  `react-window-infinite-loader` and `@uidotdev/usehooks`.

## 26.11.1

- `useRenderTracker(name, { … })` now counts renders and mounts. The options
  form left `trackRenders` and `trackMounts` undefined, so it counted nothing;
  both now default to `true`, as documented. Passing them is still fine.
- Remounts are counted per component name, so `mountThreshold` catches a
  component that keeps remounting (a changing `key`, a component re-created
  by its parent). The count used to live in the instance and started at 0
  on every remount. A remount is a new instance mounting within 5 seconds of
  an unmount of the same name, and the count starts again after 5 seconds
  without one (`DEPS_CONFIG_DEFAULTS.mountRateResetMs`). `mount.mountCount`
  now counts remounts: instances on screen together, Strict Mode's second
  mount and an `<Activity>` shown again don't add to it. Rows that other rows
  replace under one name (paging, filtering) do: name each row, or pass
  `trackMounts: false`.
- The default render threshold is 10 and comes from
  `DEPS_CONFIG_DEFAULTS.renderRateDefaultThreshold`, which said 3.
- In development, a log call to a point no module registered warns once in
  the console. Point keys are bare: `"session"`, not `"auth.session"`.
- The built-in Errors point is described as what it is, a point your app
  logs errors to; debugsy doesn't listen for uncaught errors.
- README: the example logs to a bare point key and gives `registerModule`
  the `description` fields it requires. The setup lists both packages for
  `transpilePackages` (`@n-uf/harbuz` ships TypeScript source too) and the
  Tailwind v4 stylesheet imports the panel needs.
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
