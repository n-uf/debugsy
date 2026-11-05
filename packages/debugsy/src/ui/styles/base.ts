/**
 * Base fragment: the panel's tokens and the browser defaults its parts rely
 * on. kavun's method: the CSS is a string the panel renders itself, so the
 * app needs no Tailwind, no CSS import and no build config.
 *
 * No cascade layers: a library that names `@layer base` or `components`
 * would set the host page's layer order (React puts this sheet first in
 * `<head>`). Instead every rule is unlayered and scoped by `.dbg-root`:
 * - `.dbg-root` holds the type and the size tokens; the themes fragment
 *   holds the colour and shadow tokens. The app's own stylesheets load after
 *   this one, so an app can override a token with `.dbg-root { --dbg-led: … }`.
 * - The resets select `.dbg-root :where(…)` (one class of specificity), so
 *   an app's global `button`, `h3` or `*` rules can't restyle the panel's
 *   insides, while every part's own `dbg-` class, later in this sheet, still
 *   overrides the reset.
 *
 * Colour tokens are RGB triplets, used as `rgb(var(--dbg-led) / .3)`.
 * `--dbg-line` and `--dbg-hover` carry their own alpha: use them as
 * `rgb(var(--dbg-line))` only.
 */

export const BASE_CSS = `
.dbg-root{
  --dbg-radius:2px;
  --dbg-font:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--dbg-mono:var(--dbg-font);
  --dbg-sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --dbg-fs-chrome:10.5px;--dbg-fs-small:11px;--dbg-fs-body:12px;
  box-sizing:border-box;margin:0;padding:0;
  color:rgb(var(--dbg-text));font-family:var(--dbg-sans);font-size:var(--dbg-fs-body);font-weight:400;font-style:normal;
  line-height:1.4;letter-spacing:normal;text-align:left;text-transform:none;text-shadow:none;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
.dbg-root.dbg-contents{display:contents}
.dbg-root :where(*,::before,::after){box-sizing:border-box;margin:0;padding:0;border:0 solid}
.dbg-root :where(button,input,select,textarea,optgroup){-webkit-appearance:none;appearance:none;font:inherit;
  font-feature-settings:inherit;font-variation-settings:inherit;font-weight:inherit;letter-spacing:inherit;line-height:inherit;
  text-transform:inherit;color:inherit;background:transparent;border-radius:0;box-shadow:none;outline-offset:0;
  width:auto;height:auto;min-width:0;min-height:0}
.dbg-root :where(button,[role="button"]){cursor:pointer}
.dbg-root :where(button:disabled){cursor:default}
.dbg-root :where(ol,ul,menu){list-style:none}
.dbg-root :where(svg,img){display:block;vertical-align:middle}
.dbg-root :where(pre,code,kbd,samp){font-family:var(--dbg-mono);font-size:1em;background:transparent}
.dbg-root :where(b,strong){font-weight:bolder}
.dbg-root :where(a){color:inherit;text-decoration:inherit}
.dbg-root ::placeholder{color:rgb(var(--dbg-dim));opacity:1}
@media (prefers-reduced-motion:reduce){.dbg-root *,.dbg-root ::before,.dbg-root ::after{animation:none!important;transition:none!important}}
`;
