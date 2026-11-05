/**
 * Tray fragment: the control tray (the strip along the panel's bottom edge)
 * and its readout (queue rows, single message, recent entries, action words).
 *
 * The readout is kavun's recessed window: canvas background, a hairline
 * frame, monospace rows. A row's tone (ok, warn, caution, led) is a
 * `data-tone` attribute that tints its message; lamps and meters take the
 * tone themselves.
 *
 * The row wraps: the readout keeps at least 240px and drops to a row of its
 * own when less is left. On a narrow panel (the `dbg-panel` container below
 * 720px, where a module's point list can be wider than the panel) the first
 * section (the point list) takes the first row, with a
 * hairline under it in place of the separators, and its words wrap; the
 * dependency words run on one line, or two where one doesn't fit, and the
 * readout shares their row or takes the next.
 */

export const TRAY_CSS = `
.dbg-tray{flex:none;min-width:0;background:rgb(var(--dbg-bg));border-top:1px solid rgb(var(--dbg-line))}
.dbg-tray-row{display:flex;flex-wrap:wrap;align-items:stretch;gap:6px 10px;min-width:0;padding:6px 10px}
.dbg-tray-section{display:flex;align-items:stretch;min-width:0}
.dbg-tray-section[data-separator="true"]{padding-left:10px;border-left:1px solid rgb(var(--dbg-line))}
.dbg-tray-display{flex:1 1 240px;min-width:0}
.dbg-readout{display:flex;align-items:stretch;flex:1 1 0;min-width:0;height:48px;overflow:hidden;border-radius:var(--dbg-radius);
  background:rgb(var(--dbg-canvas));box-shadow:inset 0 0 0 1px rgb(var(--dbg-line)),var(--dbg-well)}
.dbg-readout-screen{position:relative;display:flex;flex-direction:column;justify-content:center;flex:1 1 0;min-width:0;min-height:0;overflow:hidden;
  padding:0 8px;font-family:var(--dbg-mono);font-size:var(--dbg-fs-small);line-height:1.2;color:rgb(var(--dbg-text))}
.dbg-readout-rows{display:flex;flex-direction:column;justify-content:center;min-width:0;min-height:0;height:100%}
.dbg-readout-row{display:flex;align-items:center;gap:6px;flex:1 1 0;min-width:0;min-height:0;max-height:24px;overflow:hidden;
  animation:dbg-k-tray-in .16s ease-out}
.dbg-readout-row+.dbg-readout-row{border-top:1px solid rgb(var(--dbg-line))}
.dbg-readout-single{display:flex;flex-direction:column;justify-content:center;gap:6px;min-width:0;animation:dbg-k-tray-in .16s ease-out}
.dbg-readout-line{display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden}
.dbg-readout-time{flex:none;color:rgb(var(--dbg-dim));font-variant-numeric:tabular-nums;letter-spacing:.02em}
.dbg-readout-emoji{flex:none;font-size:var(--dbg-fs-small)}
.dbg-readout-msg{flex:1 1 0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:rgb(var(--dbg-text))}
.dbg-readout-meter{flex:none}
.dbg-readout [data-tone="ok"] .dbg-readout-msg{color:rgb(var(--dbg-ok))}
.dbg-readout [data-tone="warn"] .dbg-readout-msg{color:rgb(var(--dbg-warn))}
.dbg-readout [data-tone="caution"] .dbg-readout-msg{color:rgb(var(--dbg-caution))}
.dbg-readout-empty{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:rgb(var(--dbg-dim))}
.dbg-readout-more,.dbg-readout-memo{position:absolute;right:6px;padding:0 4px;border-radius:var(--dbg-radius);
  font-family:var(--dbg-font);font-size:var(--dbg-fs-chrome);letter-spacing:.06em;line-height:14px;white-space:nowrap;
  color:rgb(var(--dbg-dim));background:rgb(var(--dbg-canvas) / .9);pointer-events:none}
.dbg-readout-more{bottom:1px}
.dbg-readout-memo{top:1px;text-transform:uppercase;pointer-events:auto;cursor:help}
.dbg-readout-actions{display:grid;grid-template-rows:repeat(2,auto);grid-auto-flow:column;grid-auto-columns:max-content;align-content:center;
  column-gap:2px;flex:none;padding:0 4px;border-left:1px solid rgb(var(--dbg-line))}
@keyframes dbg-k-tray-in{from{opacity:0}to{opacity:1}}

@container dbg-panel (width < 720px){
  .dbg-tray-section:first-child{flex:1 1 100%;padding-bottom:6px;border-bottom:1px solid rgb(var(--dbg-line))}
  .dbg-tray-section[data-separator="true"]{padding-left:0;border-left:0}
  .dbg-tray-section.dbg-tray-display{flex:1 1 240px}
  .dbg-tray .dbg-nav{flex:1 1 auto}
  .dbg-tray .dbg-nav>.dbg-grid:last-child{display:flex;flex-wrap:wrap;align-content:flex-start;gap:1px 2px;flex:1 1 0;min-width:0}
  .dbg-tray .dbg-nav>.dbg-grid:last-child>.dbg-word{flex:1 0 auto;width:auto}
  .dbg-tray .dbg-deps .dbg-rows{flex-direction:row;flex-wrap:wrap;gap:1px 2px}
}
`;
