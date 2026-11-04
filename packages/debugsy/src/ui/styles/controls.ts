/**
 * Controls fragment: how groups of words sit together (module and point
 * switches, tag filter, settings). The dependency words and their advanced
 * strip are in the deps fragment.
 */

export const CONTROLS_CSS = `
.dbg-words{display:flex;align-items:center;gap:1px 2px;min-width:0}
.dbg-words[data-wrap="true"]{flex-wrap:wrap}
.dbg-words[data-dir="v"]{flex-direction:column;align-items:stretch}
.dbg-grid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(var(--dbg-rows,2),auto);gap:1px 2px;align-items:center;
  align-content:start;justify-items:stretch}
.dbg-rows{display:flex;flex-direction:column;justify-content:flex-start;gap:1px}
.dbg-rows>.dbg-words{flex-wrap:nowrap}
.dbg-nav{display:flex;align-items:stretch;gap:0;min-width:0}
.dbg-nav>.dbg-divider{margin:2px 6px}
.dbg-tags{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:2px}
.dbg-tags>.dbg-chip{justify-content:flex-start;overflow:hidden;text-overflow:ellipsis}
.dbg-tag-bar{display:flex;align-items:flex-start;gap:2px;margin:0 0 6px}
.dbg-tag-bar>.dbg-field{flex:1}
`;
