# @n-uf/debugsy

Versions are calendar versions, `YY.M.R` (year, month of the release, counter
within the month), the same scheme as `@n-uf/hypr-tiling`.

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
