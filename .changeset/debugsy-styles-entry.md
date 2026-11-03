---
"@n-uf/debugsy": minor
---

New `@n-uf/debugsy/styles` entry: import it after `tailwindcss` so Tailwind v4
generates the classes debugsy's components use when the package is installed
from the registry (node_modules is not scanned by default).
