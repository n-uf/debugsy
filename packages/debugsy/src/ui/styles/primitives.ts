/**
 * Primitives fragment: kavun's engraved words, lamps, meters, chips, keycaps
 * and notices, renamed `dbg-`. Controls are words, not icons; state lives in
 * `data-*` attributes, never in class names.
 *
 * LED cyan = indicator, action, progress. Caution pink = active choice,
 * destructive, alert. Green (`ok`) = done. Amber and red only for log levels.
 */

export const PRIMITIVES_CSS = `
.dbg-chrome{font-family:var(--dbg-font);text-transform:uppercase;letter-spacing:.06em;font-size:var(--dbg-fs-chrome);line-height:1.1}
.dbg-engraved{color:rgb(var(--dbg-dim));text-shadow:var(--dbg-engrave)}
.dbg-word{position:relative;display:inline-flex;align-items:center;gap:5px;height:22px;min-width:0;margin:0;padding:0 6px;
  border:0;border-radius:var(--dbg-radius);background:transparent;cursor:pointer;white-space:nowrap;user-select:none;
  font-family:var(--dbg-font);text-transform:uppercase;letter-spacing:.06em;font-size:var(--dbg-fs-chrome);font-weight:500;
  line-height:1;color:rgb(var(--dbg-dim));text-shadow:var(--dbg-engrave);text-decoration:none;
  transition:color .12s,background-color .12s,box-shadow .12s}
.dbg-word:hover{color:rgb(var(--dbg-text));background:rgb(var(--dbg-hover))}
.dbg-word:focus-visible{outline:2px solid rgb(var(--dbg-led));outline-offset:1px}
.dbg-word:disabled{opacity:.4;cursor:default;pointer-events:none}
.dbg-word[data-size="sm"]{height:18px;padding:0 4px}
.dbg-word[data-block="true"]{display:flex;width:100%}
.dbg-word[data-align="center"]{justify-content:center}
.dbg-word[data-active="true"]{color:rgb(var(--dbg-text));font-weight:700}
.dbg-word[data-pill="true"][data-active="true"]{color:rgb(var(--dbg-caution));font-weight:600;background:transparent;
  box-shadow:inset 0 0 0 1px rgb(var(--dbg-caution))}
.dbg-word[data-tone="led"]{color:rgb(var(--dbg-led));font-weight:600}
.dbg-word[data-tone="caution"]{color:rgb(var(--dbg-caution));font-weight:600}
.dbg-word[data-tone="warn"]{color:rgb(var(--dbg-warn));font-weight:600}
.dbg-word[data-variant="button"]{height:24px;padding:0 9px;font-weight:600;color:rgb(var(--dbg-led));text-shadow:none;overflow:hidden;
  background:linear-gradient(180deg,rgb(var(--dbg-led) / .12) 0%,rgb(var(--dbg-led) / .05) 100%);
  box-shadow:inset 0 0 0 1px rgb(var(--dbg-led) / .28)}
.dbg-word[data-variant="button"]:hover{background:linear-gradient(180deg,rgb(var(--dbg-led) / .2) 0%,rgb(var(--dbg-led) / .1) 100%)}
.dbg-word[data-variant="button"][data-tone="caution"]{color:rgb(var(--dbg-caution));
  background:linear-gradient(180deg,rgb(var(--dbg-caution) / .12) 0%,rgb(var(--dbg-caution) / .05) 100%);
  box-shadow:inset 0 0 0 1px rgb(var(--dbg-caution) / .28)}
.dbg-word[data-busy="true"]{animation:dbg-k-breathe 1.6s ease-in-out infinite}
.dbg-word[data-flash="true"]{color:rgb(var(--dbg-on-accent));background:rgb(var(--dbg-caution));text-shadow:none}
.dbg-word-label{position:relative;min-width:0;overflow:hidden;text-overflow:ellipsis}
.dbg-mark{position:absolute;left:50%;top:-1px;width:10px;height:3px;margin-left:-5px;border-radius:1.5px;
  background:rgb(var(--dbg-led));box-shadow:0 0 5px rgb(var(--dbg-led) / .85)}
.dbg-fill{position:absolute;left:0;bottom:0;height:2px;background:rgb(var(--dbg-led));box-shadow:0 0 5px rgb(var(--dbg-led) / .8);
  transition:width .3s ease;pointer-events:none}
.dbg-word[data-tone="caution"] .dbg-fill{background:rgb(var(--dbg-caution));box-shadow:0 0 5px rgb(var(--dbg-caution) / .8)}
.dbg-count{font-size:calc(var(--dbg-fs-chrome) - .5px);letter-spacing:.02em;font-variant-numeric:tabular-nums;opacity:.85}
.dbg-signal{width:6px;height:6px;border-radius:50%;flex:none;background:rgb(var(--dbg-led));box-shadow:0 0 6px rgb(var(--dbg-led));
  animation:dbg-k-signal 1.4s ease-in-out infinite}
.dbg-lamp{display:inline-block;width:7px;height:7px;border-radius:50%;flex:none;background:rgb(var(--dbg-led-off));
  box-shadow:inset 0 1px 1px rgb(0 0 0 / .35)}
.dbg-lamp[data-state="on"]{background:rgb(var(--dbg-led));box-shadow:0 0 6px rgb(var(--dbg-led) / .9)}
.dbg-lamp[data-state="partial"]{background:linear-gradient(90deg,rgb(var(--dbg-led)) 50%,rgb(var(--dbg-led-off)) 50%);
  box-shadow:0 0 4px rgb(var(--dbg-led) / .55)}
.dbg-lamp[data-state="ok"]{background:rgb(var(--dbg-ok));box-shadow:0 0 6px rgb(var(--dbg-ok) / .8)}
.dbg-lamp[data-state="warn"]{background:rgb(var(--dbg-warn));box-shadow:0 0 6px rgb(var(--dbg-warn) / .8)}
.dbg-lamp[data-state="busy"]{background:rgb(var(--dbg-led));box-shadow:0 0 6px rgb(var(--dbg-led) / .9);animation:dbg-k-signal 1s ease-in-out infinite}
.dbg-lamp[data-state="alert"]{background:rgb(var(--dbg-caution));box-shadow:0 0 7px rgb(var(--dbg-caution) / .9)}
.dbg-segs{display:inline-flex;align-items:center;gap:2px;flex:none}
.dbg-segs>i{display:block;width:4px;height:7px;border-radius:1px;background:rgb(var(--dbg-led-off));box-shadow:inset 0 1px 1px rgb(0 0 0 / .3)}
.dbg-segs>i[data-on="true"]{background:rgb(var(--dbg-led));box-shadow:0 0 4px rgb(var(--dbg-led) / .8)}
.dbg-meter{position:relative;display:block;height:3px;border-radius:2px;background:rgb(var(--dbg-line));overflow:hidden}
.dbg-meter>i{position:absolute;top:0;bottom:0;left:0;border-radius:2px;background:rgb(var(--dbg-led));
  box-shadow:0 0 5px rgb(var(--dbg-led) / .8);transition:width .3s ease}
.dbg-meter[data-tone="ok"]>i{background:rgb(var(--dbg-ok));box-shadow:0 0 5px rgb(var(--dbg-ok) / .8)}
.dbg-meter[data-tone="caution"]>i{background:rgb(var(--dbg-caution));box-shadow:0 0 5px rgb(var(--dbg-caution) / .8)}
.dbg-meter[data-tone="warn"]>i{background:rgb(var(--dbg-warn));box-shadow:0 0 5px rgb(var(--dbg-warn) / .8)}
.dbg-meter[data-indeterminate="true"]>i{width:30%!important;animation:dbg-k-sweep 1.2s ease-in-out infinite}
.dbg-divider{display:block;width:1px;align-self:stretch;min-height:14px;margin:0 4px;flex:none;background:rgb(var(--dbg-line))}
.dbg-chip{display:inline-flex;align-items:center;gap:4px;height:18px;min-width:0;padding:0 5px;border:0;border-radius:var(--dbg-radius);
  cursor:pointer;white-space:nowrap;font-family:var(--dbg-font);font-size:var(--dbg-fs-chrome);letter-spacing:.03em;line-height:1;
  color:rgb(var(--dbg-dim));background:rgb(var(--dbg-hover));box-shadow:inset 0 0 0 1px rgb(var(--dbg-line));
  font-variant-numeric:tabular-nums;transition:color .12s,box-shadow .12s,background-color .12s}
.dbg-chip:hover{color:rgb(var(--dbg-led));box-shadow:inset 0 0 0 1px rgb(var(--dbg-led) / .7)}
.dbg-chip:focus-visible{outline:2px solid rgb(var(--dbg-led));outline-offset:1px}
.dbg-chip[data-active="true"]{color:rgb(var(--dbg-led));background:rgb(var(--dbg-led) / .12);box-shadow:inset 0 0 0 1px rgb(var(--dbg-led) / .6)}
.dbg-keycap{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 4px;border-radius:var(--dbg-radius);
  font-family:var(--dbg-font);font-size:var(--dbg-fs-chrome);line-height:1;color:rgb(var(--dbg-text));white-space:nowrap;
  box-shadow:inset 0 0 0 1px rgb(var(--dbg-line)),0 1px 0 rgb(var(--dbg-line))}
.dbg-notice{display:flex;align-items:center;gap:8px;width:100%;min-height:28px;padding:6px 12px;border:0;text-align:left;
  font-family:var(--dbg-sans);font-size:var(--dbg-fs-body);line-height:1.35;color:rgb(var(--dbg-text));background:transparent;
  box-shadow:inset 3px 0 0 rgb(var(--dbg-dim));border-bottom:1px solid rgb(var(--dbg-line));animation:dbg-k-drop .18s ease-out}
.dbg-notice[data-tone="info"]{background:rgb(var(--dbg-led) / .07);box-shadow:inset 3px 0 0 rgb(var(--dbg-led))}
.dbg-notice[data-tone="ok"]{background:rgb(var(--dbg-ok) / .07);box-shadow:inset 3px 0 0 rgb(var(--dbg-ok))}
.dbg-notice[data-tone="warn"]{background:rgb(var(--dbg-warn) / .08);box-shadow:inset 3px 0 0 rgb(var(--dbg-warn))}
.dbg-notice[data-tone="caution"]{background:rgb(var(--dbg-caution) / .08);box-shadow:inset 3px 0 0 rgb(var(--dbg-caution))}
button.dbg-notice{cursor:pointer}
button.dbg-notice:hover{background-color:rgb(var(--dbg-hover))}
button.dbg-notice:focus-visible{outline:2px solid rgb(var(--dbg-led));outline-offset:-2px}
.dbg-notice-body{flex:1;min-width:0}
.dbg-notice-actions{display:inline-flex;align-items:center;gap:2px;flex:none}
.dbg-field{display:block;min-width:0;height:22px;padding:3px 6px;border:0;border-radius:var(--dbg-radius);outline:none;
  font-family:var(--dbg-font);font-size:var(--dbg-fs-chrome);line-height:1.4;letter-spacing:.02em;color:rgb(var(--dbg-text));
  background:rgb(var(--dbg-canvas));box-shadow:inset 0 0 0 1px rgb(var(--dbg-line));transition:box-shadow .2s,background-color .2s}
.dbg-field:focus{box-shadow:inset 0 0 0 1px rgb(var(--dbg-led))}
.dbg-field[data-miss="true"]{background:rgb(var(--dbg-caution) / .08);box-shadow:inset 0 0 0 1px rgb(var(--dbg-caution))}
textarea.dbg-field{height:auto;min-height:22px;resize:none;overflow:hidden}
.dbg-scroll{overflow:auto;scrollbar-width:thin;scrollbar-color:rgb(var(--dbg-dim) / .35) transparent}
.dbg-scroll::-webkit-scrollbar{width:6px;height:6px}
.dbg-scroll::-webkit-scrollbar-track{background:transparent}
.dbg-scroll::-webkit-scrollbar-thumb{background:rgb(var(--dbg-dim) / .35);border-radius:3px}
.dbg-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@keyframes dbg-k-breathe{0%,100%{opacity:1}50%{opacity:.55}}
@keyframes dbg-k-signal{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes dbg-k-sweep{0%{transform:translateX(-100%)}100%{transform:translateX(340%)}}
@keyframes dbg-k-drop{from{transform:translateY(-6px);opacity:0}to{transform:none;opacity:1}}
`;
