/**
 * Themes fragment: the panel's colour and shadow tokens, one set per theme.
 *
 * The look is kavun's dossier themes (n-uf's kit): `dark` is "the panel at
 * night", `light` is kavun's "Panel", and `surface`, `paper` and `contrast`
 * keep kavun's names. `system` is `dark`, or `light` when the OS prefers a
 * light scheme. The panel's root carries the choice as `data-dbg-theme`
 * (namespaced, so an app's own `[data-theme]` rules can't match it).
 *
 * Kavun's surfaces and lines are taken as they are. Its accents were tuned
 * for lamps, while debugsy also reads them as small text (log levels, point
 * labels, the JSON view), so the light themes darken them: every text colour
 * keeps at least 4.5:1 on the surfaces it sits on, dim text included, also
 * on the tinted error and warning rows.
 *
 * Every rule here has the specificity of one class, like an app's override
 * `.dbg-root { --dbg-led: … }`, which comes later in the page and so wins in
 * every theme. The defaults go on the outermost `.dbg-root` only: a nested
 * root (ModuleNav inside the panel) inherits its panel's theme instead of
 * resetting to dark.
 *
 * Colours are RGB triplets, used as `rgb(var(--dbg-led) / .3)`; `line` and
 * `hover` carry their own alpha. Shadow tokens are whole shadows; `shadow`,
 * `shadowCompact` and `well` join a list, so they must not be `none` (use
 * `0 0 transparent`).
 */

/** A panel theme: `system` follows the OS's light or dark preference */
export type DebugsyTheme = "dark" | "light" | "system" | "surface" | "paper" | "contrast";

interface ThemeTokens {
  /** Chrome: the tray, the rail, the window edge */
  bg: string;
  /** Recessed surfaces: the log list, the tray readout, fields */
  canvas: string;
  /** The sidebar */
  raised: string;
  /** Hairlines (with alpha) */
  line: string;
  text: string;
  /** Engraved chrome text, at least 4.5:1 on every surface */
  dim: string;
  /** 1px highlight under engraved text */
  engrave: string;
  /** Hover wash (with alpha) */
  hover: string;
  /** Caution pink: active choice, destructive, alert */
  caution: string;
  /** LED cyan: indicators, actions, progress */
  led: string;
  ok: string;
  warn: string;
  error: string;
  /** Text on a solid caution fill */
  onAccent: string;
  /** Unlit lamp */
  ledOff: string;
  /** The extended window's drop shadow */
  shadow: string;
  /** The compact window's drop shadow */
  shadowCompact: string;
  /** Inset shade of lamps and meter segments */
  recess: string;
  /** Inset shade of the tray readout */
  well: string;
  /** JSON view: keys, numbers, strings, booleans and null */
  jsonKey: string;
  jsonNumber: string;
  jsonString: string;
  jsonLiteral: string;
  scheme: "dark" | "light";
}

type NamedTheme = Exclude<DebugsyTheme, "system">;

const LIGHT_SHADE = {
  shadow: "0 -10px 28px rgb(0 0 0 / .12)",
  shadowCompact: "0 -3px 10px rgb(0 0 0 / .08)",
  recess: "inset 0 1px 1px rgb(0 0 0 / .22)",
  well: "inset 0 1px 2px rgb(0 0 0 / .1)",
} as const;

export const THEME_TOKENS: Record<NamedTheme, ThemeTokens> = {
  dark: {
    bg: "24 26 30",
    canvas: "14 16 19",
    raised: "32 35 41",
    line: "255 255 255 / .09",
    text: "226 230 236",
    dim: "150 157 170",
    engrave: "0 -1px 0 rgb(0 0 0 / .7)",
    hover: "255 255 255 / .06",
    caution: "255 105 190",
    led: "40 210 245",
    ok: "74 222 128",
    warn: "250 190 70",
    error: "255 104 104",
    onAccent: "10 12 16",
    ledOff: "60 65 74",
    shadow: "0 -14px 36px rgb(0 0 0 / .45)",
    shadowCompact: "0 -4px 14px rgb(0 0 0 / .22)",
    recess: "inset 0 1px 1px rgb(0 0 0 / .35)",
    well: "inset 0 1px 3px rgb(0 0 0 / .45)",
    jsonKey: "226 230 236",
    jsonNumber: "40 210 245",
    jsonString: "74 222 128",
    jsonLiteral: "255 105 190",
    scheme: "dark",
  },
  light: {
    bg: "236 238 241",
    canvas: "222 226 232",
    raised: "244 245 247",
    line: "0 0 0 / .1",
    text: "36 42 52",
    dim: "76 82 94",
    engrave: "0 1px 0 rgb(255 255 255 / .65)",
    hover: "0 0 0 / .055",
    caution: "190 22 116",
    led: "0 106 142",
    ok: "12 112 50",
    warn: "138 82 0",
    error: "160 18 28",
    onAccent: "255 255 255",
    ledOff: "190 195 204",
    ...LIGHT_SHADE,
    jsonKey: "36 42 52",
    jsonNumber: "0 100 140",
    jsonString: "14 112 50",
    jsonLiteral: "176 20 108",
    scheme: "light",
  },
  surface: {
    bg: "243 244 246",
    canvas: "232 234 238",
    raised: "248 249 250",
    line: "0 0 0 / .09",
    text: "40 46 56",
    dim: "80 86 98",
    engrave: "0 1px 0 rgb(255 255 255 / .7)",
    hover: "0 0 0 / .05",
    caution: "196 24 120",
    led: "0 114 152",
    ok: "16 122 56",
    warn: "150 90 0",
    error: "168 20 30",
    onAccent: "255 255 255",
    ledOff: "196 200 208",
    ...LIGHT_SHADE,
    jsonKey: "40 46 56",
    jsonNumber: "0 104 144",
    jsonString: "16 116 52",
    jsonLiteral: "182 22 112",
    scheme: "light",
  },
  paper: {
    bg: "244 238 224",
    canvas: "232 224 206",
    raised: "250 246 236",
    line: "60 40 20 / .12",
    text: "52 40 28",
    dim: "94 78 60",
    engrave: "0 1px 0 rgb(255 252 244 / .7)",
    hover: "60 40 20 / .06",
    caution: "180 28 100",
    led: "0 104 132",
    ok: "28 112 48",
    warn: "140 82 0",
    error: "160 26 22",
    onAccent: "255 255 255",
    ledOff: "205 196 178",
    shadow: "0 -10px 28px rgb(60 40 20 / .14)",
    shadowCompact: "0 -3px 10px rgb(60 40 20 / .1)",
    recess: "inset 0 1px 1px rgb(60 40 20 / .24)",
    well: "inset 0 1px 2px rgb(60 40 20 / .12)",
    jsonKey: "52 40 28",
    jsonNumber: "0 98 126",
    jsonString: "28 106 46",
    jsonLiteral: "170 26 94",
    scheme: "light",
  },
  // Kavun's contrast reads its pages on white; here the pages are the logs,
  // so the canvas is white and the chrome a light grey
  contrast: {
    bg: "232 234 238",
    canvas: "255 255 255",
    raised: "255 255 255",
    line: "0 0 0 / .4",
    text: "0 0 0",
    dim: "45 45 50",
    engrave: "none",
    hover: "0 0 0 / .08",
    caution: "190 0 100",
    led: "0 95 130",
    ok: "0 105 40",
    warn: "135 80 0",
    error: "160 0 0",
    onAccent: "255 255 255",
    ledOff: "170 170 175",
    shadow: "0 -2px 0 rgb(0 0 0)",
    shadowCompact: "0 -2px 0 rgb(0 0 0)",
    recess: "inset 0 0 0 1px rgb(0 0 0 / .55)",
    well: "inset 0 0 0 1px rgb(0 0 0 / .6)",
    jsonKey: "0 0 0",
    jsonNumber: "0 85 120",
    jsonString: "0 95 35",
    jsonLiteral: "170 0 90",
    scheme: "light",
  },
};

/** A theme's declarations, for a rule body */
function declarations(t: ThemeTokens): string {
  return [
    `--dbg-bg:${t.bg};--dbg-canvas:${t.canvas};--dbg-raised:${t.raised};--dbg-line:${t.line};`,
    `--dbg-text:${t.text};--dbg-dim:${t.dim};--dbg-engrave:${t.engrave};--dbg-hover:${t.hover};`,
    `--dbg-caution:${t.caution};--dbg-led:${t.led};--dbg-ok:${t.ok};--dbg-warn:${t.warn};--dbg-error:${t.error};`,
    `--dbg-on-accent:${t.onAccent};--dbg-led-off:${t.ledOff};`,
    `--dbg-shadow:${t.shadow};--dbg-shadow-compact:${t.shadowCompact};--dbg-recess:${t.recess};--dbg-well:${t.well};`,
    `--dbg-json-key:${t.jsonKey};--dbg-json-number:${t.jsonNumber};--dbg-json-string:${t.jsonString};`,
    `--dbg-json-literal:${t.jsonLiteral};`,
    `color-scheme:${t.scheme}`,
  ].join("\n  ");
}

const rule = (selector: string, t: ThemeTokens): string => `${selector}{\n  ${declarations(t)}}\n`;

const named = (Object.keys(THEME_TOKENS) as NamedTheme[])
  .map((name) => rule(`.dbg-root:where([data-dbg-theme="${name}"])`, THEME_TOKENS[name]))
  .join("");

export const THEMES_CSS = `
${rule(".dbg-root:where(:not(.dbg-root .dbg-root))", THEME_TOKENS.dark)}${named}@media (prefers-color-scheme:light){
${rule('.dbg-root:where([data-dbg-theme="system"])', THEME_TOKENS.light)}}
`;
