/**
 * Window fragment: the panel's frame. A dark chassis pinned to the bottom of
 * the viewport: a resize edge on top (kavun's resize grip, laid flat), the
 * body (logs, the action rail, the sidebar) and the control tray below.
 * Hairlines, not borders; the sidebar is the raised surface, the logs sit
 * on the canvas.
 */

export const WINDOW_CSS = `
.dbg-window{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:stretch;
  background:rgb(var(--dbg-bg));box-shadow:0 -1px 0 rgb(var(--dbg-line)),var(--dbg-shadow)}
.dbg-window[data-compact="true"]{box-shadow:0 -1px 0 rgb(var(--dbg-line)),var(--dbg-shadow-compact)}
.dbg-edge{position:relative;display:block;width:100%;height:9px;flex:none;cursor:ns-resize;touch-action:none;outline:none;
  background:rgb(var(--dbg-bg));border-bottom:1px solid rgb(var(--dbg-line))}
.dbg-edge::after{content:"";position:absolute;left:50%;top:3px;width:40px;height:3px;margin-left:-20px;border-radius:2px;
  background:rgb(var(--dbg-dim) / .35);transition:background-color .12s,box-shadow .12s,width .12s,margin-left .12s}
.dbg-edge:focus-visible{box-shadow:inset 0 0 0 1px rgb(var(--dbg-led) / .6)}
.dbg-edge:hover::after,.dbg-edge:focus-visible::after,.dbg-edge[data-active="true"]::after{width:64px;margin-left:-32px;
  background:rgb(var(--dbg-led));box-shadow:0 0 6px rgb(var(--dbg-led) / .7)}
.dbg-body{position:relative;display:flex;align-items:stretch;flex:none;overflow:hidden;background:rgb(var(--dbg-canvas))}
.dbg-content{flex:1;min-width:0;min-height:0;display:flex;align-items:stretch;overflow:hidden}
.dbg-rail{flex:none;display:flex;flex-direction:column;align-items:stretch;background:rgb(var(--dbg-bg));
  border-left:1px solid rgb(var(--dbg-line))}
.dbg-actions{display:flex;flex-direction:column;align-items:stretch;gap:3px;width:64px;height:100%;padding:6px 4px}
.dbg-depth{display:flex;flex-direction:column;align-items:stretch;gap:3px;padding:0 0 6px;margin:0 0 3px;border-bottom:1px solid rgb(var(--dbg-line))}
.dbg-depth-label{font-family:var(--dbg-font);font-size:9px;text-transform:uppercase;letter-spacing:.08em;text-align:center;
  color:rgb(var(--dbg-dim));text-shadow:var(--dbg-engrave)}
.dbg-word.dbg-depth-word{flex-direction:column;gap:4px;height:auto;padding:4px 2px}
.dbg-sidebar{flex:none;width:220px;height:100%;display:flex;flex-direction:column;align-items:stretch;overflow-x:hidden;overflow-y:auto;
  background:rgb(var(--dbg-raised));border-left:1px solid rgb(var(--dbg-line))}
.dbg-section{flex:none;padding:8px 10px 9px;border-bottom:1px solid rgb(var(--dbg-line))}
.dbg-section[data-border="none"]{border-bottom:0}
.dbg-section-title{display:flex;align-items:center;justify-content:space-between;gap:6px;margin:0 0 7px;
  font-family:var(--dbg-font);text-transform:uppercase;letter-spacing:.06em;font-size:var(--dbg-fs-chrome);font-weight:500;line-height:1.1;
  color:rgb(var(--dbg-dim));text-shadow:var(--dbg-engrave)}
.dbg-stats{display:grid;grid-template-columns:1fr auto;gap:3px 10px;font-family:var(--dbg-font);font-size:var(--dbg-fs-chrome);line-height:1.3}
.dbg-stat-label{color:rgb(var(--dbg-dim));text-transform:uppercase;letter-spacing:.06em;text-shadow:var(--dbg-engrave)}
.dbg-stat-value{color:rgb(var(--dbg-text));font-variant-numeric:tabular-nums;text-align:right}
.dbg-stat-value[data-tone="led"]{color:rgb(var(--dbg-led))}
.dbg-stat-value[data-tone="ok"]{color:rgb(var(--dbg-ok))}
.dbg-stat-value[data-tone="warn"]{color:rgb(var(--dbg-warn))}
.dbg-stat-value[data-tone="caution"]{color:rgb(var(--dbg-caution))}
.dbg-shortcuts{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:4px 8px;font-size:var(--dbg-fs-small);
  line-height:1.2;color:rgb(var(--dbg-dim))}
.dbg-presets{display:flex;flex-wrap:wrap;gap:2px}
.dbg-control{position:relative;flex:none}
`;
