/**
 * Base fragment: the panel's tokens and the browser defaults its parts rely
 * on. kavun's method: the CSS is a string the panel renders itself, so the
 * app needs no Tailwind, no CSS import and no build config.
 *
 * - `@layer base` holds the resets, selected with `:where()` (no
 *   specificity) and only inside `.dbg-root`. In a Tailwind app they repeat
 *   preflight's values and change nothing; without Tailwind they give the
 *   panel the defaults it was built on.
 * - `@layer components` holds `.dbg-root` itself: the theme tokens and the
 *   type. An app can override a token with its own `.dbg-root { --dbg-led:
 *   … }`, which sits outside the layers and so wins.
 * - Every part's own rules are unlayered `dbg-` classes, so an app's global
 *   `button` or `h3` rules can't restyle them.
 *
 * Tokens are kavun's `dark` theme ("the panel at night") as RGB triplets,
 * used as `rgb(var(--dbg-led) / .3)`, plus the log-level colours kavun has
 * no use for.
 */

export const BASE_CSS = `
@layer base{
:where(.dbg-root,.dbg-root *,.dbg-root ::before,.dbg-root ::after){box-sizing:border-box;margin:0;padding:0;border:0 solid}
:where(.dbg-root) :where(button,input,select,textarea,optgroup){font:inherit;font-feature-settings:inherit;
  font-variation-settings:inherit;letter-spacing:inherit;color:inherit;background-color:transparent;border-radius:0}
:where(.dbg-root) :where(button,[role="button"]){cursor:pointer}
:where(.dbg-root) :where(button:disabled){cursor:default}
:where(.dbg-root) :where(ol,ul,menu){list-style:none}
:where(.dbg-root) :where(svg,img){display:block;vertical-align:middle}
:where(.dbg-root) :where(pre,code,kbd,samp){font-family:var(--dbg-mono);font-size:1em}
:where(.dbg-root) :where(b,strong){font-weight:bolder}
:where(.dbg-root) ::placeholder{color:rgb(var(--dbg-dim) / .75);opacity:1}
}
@layer components{
.dbg-root{
  --dbg-bg:24 26 30;--dbg-canvas:14 16 19;--dbg-raised:32 35 41;--dbg-line:255 255 255 / .09;
  --dbg-text:226 230 236;--dbg-dim:150 157 170;--dbg-engrave:0 -1px 0 rgb(0 0 0 / .7);--dbg-hover:255 255 255 / .06;
  --dbg-caution:255 105 190;--dbg-led:40 210 245;--dbg-ok:74 222 128;--dbg-on-accent:10 12 16;--dbg-led-off:60 65 74;
  --dbg-warn:250 190 70;--dbg-error:255 104 104;--dbg-radius:2px;
  --dbg-font:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--dbg-mono:var(--dbg-font);
  --dbg-sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --dbg-fs-chrome:10.5px;--dbg-fs-small:11px;--dbg-fs-body:12px;
  color:rgb(var(--dbg-text));font-family:var(--dbg-sans);font-size:var(--dbg-fs-body);line-height:1.4;
  text-align:left;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
.dbg-root.dbg-contents{display:contents}
}
@media (prefers-reduced-motion:reduce){.dbg-root *,.dbg-root ::before,.dbg-root ::after{animation:none!important;transition:none!important}}
`;
