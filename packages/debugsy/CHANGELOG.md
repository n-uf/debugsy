# @n-uf/debugsy

Versions are calendar versions, `YY.M.R` (year, month of the release, counter
within the month), the same scheme as `@n-uf/hypr-tiling`.

## Unreleased

- Install is `npm i @n-uf/debugsy` and mounting `<DebugsyLook />` from a
  client component. The package now ships one built ES module with type
  definitions and a `"use client"` directive, so Next.js needs no
  `transpilePackages` entry. `react18-json-view` is a dependency now, not a
  peer you install yourself.
- Works in Vite apps: reading `NEXT_PUBLIC_SURFACE_DEBUG` no longer assumes
  a `process` object in the browser. The JSON view also renders where Node
  loads `react18-json-view` itself (server rendering without a bundler,
  tests with external dependencies).
- The "Debugsy System initialized" console line only appears in
  development.
- HEALTH works: it prints a health report to the console, and logs it when
  the `health`, `performance` and `dependencies` points are on. It looked for
  a `surfaceDebug` global that no longer exists, and the snapshot itself
  read dependency settings from a field that had moved. Its runtime metrics
  now log to the built-in `health` point, not an unregistered one.
- The panel styles itself: no Tailwind, no stylesheet import, no
  `transpilePackages` entry for styles. Its CSS is a scoped `dbg-` stylesheet
  that `<DebugsyLook />` renders as a React 19 hoisted style, so it looks the
  same in a Tailwind app and in a plain one. `@n-uf/debugsy/styles` is now an
  empty file, kept so existing imports don't break; you can remove the import.
- A new look, from n-uf's kavun kit, in its dark theme: engraved monospace
  words instead of icon buttons, status lamps and LED segments, LED cyan for
  indicators and progress, caution pink for destructive and alert states,
  amber and red only for log levels. The panel no longer follows the host
  page's harbuz theme variables. An app can retune it by overriding the
  `--dbg-*` tokens on `.dbg-root`.
- The action rail shows COPY, PAUSE and HEALTH as words under a depth control;
  the tray's actions are EXPAND/COMPACT, CLEAR and CLOSE.
- `ModuleNav`'s `theme` prop takes a theme name (see below) for a
  `ModuleNav` used on its own; inside the panel it follows the panel. Any
  other value is ignored, so existing calls still compile.
- debugsy no longer depends on `@n-uf/harbuz`. The parts of the panel that
  came from it (terminal window, log rows, tray display, action toolbar,
  virtualized list and small hooks) are debugsy's own code. The tray display
  dropped harbuz's unused alert mode.
- Removed the unused dependencies `react-window`,
  `react-window-infinite-loader` and `@uidotdev/usehooks`, and the Tailwind
  helpers (`clsx`, `tailwind-merge`, `class-variance-authority`,
  `@radix-ui/react-slot`).
- Fixed: opening a module in the tray no longer logs React's "Cannot update a
  component while rendering a different component" error.
- Light mode and themes: `<DebugsyLook theme="light" />`. `theme` is
  `"dark"` (default, the look above), `"light"`, `"system"` (dark or light,
  following the OS's `prefers-color-scheme`), or one of three more light
  looks: `"surface"` (cool grey), `"paper"` (warm) and `"contrast"` (black
  on white). The `DebugsyTheme` type is exported. Every text colour, dim
  text included, keeps at least 4.5:1 on what it sits on, tinted rows and
  an accent's own wash (an active tag, a button) included; in the light
  themes that makes the accents darker than kavun's lamps. Five texts that
  were faded (point labels, the JSON view's item counts, placeholders,
  word counts, the DEPTH label) now use full colour, in dark too. The
  panel sets `color-scheme`, so its scrollbars and native controls follow
  its theme rather than the page's. Shadows are tokens now too (`--dbg-shadow`,
  `--dbg-shadow-compact`, `--dbg-recess`, `--dbg-well`), and the JSON view
  has its own (`--dbg-json-key`, `-number`, `-string`, `-literal`).
  `.dbg-root { --dbg-led: … }` still overrides a token in every theme;
  `.dbg-root[data-dbg-theme="light"] { … }` overrides it in one.

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
