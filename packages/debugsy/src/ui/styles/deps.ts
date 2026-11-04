/**
 * Deps fragment: the dependency words in the tray, and the advanced strip
 * the tray's Adv word opens above the tray row.
 *
 * The strip spans the panel's width. Its four groups (level, changes,
 * logged, console) sit in one row on a wide panel, two by two on a mid one
 * and stacked on a phone. The breakpoints are container queries on the
 * strip, so they follow the panel's width, not the window's. The hairlines
 * between groups are the grid's 1px gaps over the line colour, so they
 * follow the column count.
 */

export const DEPS_CSS = `
.dbg-deps{display:flex;flex-direction:column;justify-content:flex-start;min-width:0}
.dbg-advanced{container-type:inline-size;flex:none;min-width:0;background:rgb(var(--dbg-bg));border-top:1px solid rgb(var(--dbg-line))}
.dbg-advanced-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:1px;background:rgb(var(--dbg-line))}
@container (min-width:620px){.dbg-advanced-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container (min-width:1180px){.dbg-advanced-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
.dbg-advanced-group{display:grid;grid-template-columns:64px minmax(0,1fr);column-gap:8px;row-gap:3px;align-items:center;
  align-content:start;min-width:0;padding:7px 10px 8px;background:rgb(var(--dbg-bg))}
.dbg-advanced-group>*{grid-column:2;min-width:0}
.dbg-advanced-group>.dbg-advanced-label{grid-column:1}
.dbg-advanced-label{font-family:var(--dbg-font);font-size:var(--dbg-fs-chrome);text-transform:uppercase;letter-spacing:.06em;
  white-space:nowrap;color:rgb(var(--dbg-dim));text-shadow:var(--dbg-engrave)}
.dbg-advanced-hint{font-family:var(--dbg-sans);font-size:var(--dbg-fs-small);line-height:1.35;color:rgb(var(--dbg-dim))}
.dbg-advanced-hint code{font-family:var(--dbg-mono);color:rgb(var(--dbg-text))}
.dbg-advanced-value{font-family:var(--dbg-mono);font-size:var(--dbg-fs-small);line-height:20px;color:rgb(var(--dbg-text));
  font-variant-numeric:tabular-nums}
.dbg-advanced-value[data-tone="dim"]{color:rgb(var(--dbg-dim))}
.dbg-advanced-tally{color:rgb(var(--dbg-dim))}
.dbg-advanced-code{justify-self:start;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  font-family:var(--dbg-mono);font-size:var(--dbg-fs-small);line-height:20px;color:rgb(var(--dbg-text));
  user-select:all;-webkit-user-select:all;cursor:text}
`;
