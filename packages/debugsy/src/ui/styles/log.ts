/**
 * Log fragment: the log list, log rows, the JSON and diff views, the empty
 * state and the truncation notice.
 *
 * A collapsed row is exactly 24px high (the list virtualizes and follows the
 * scroll with that height). State lives in `data-*` attributes. Class
 * prefixes: `dbg-log` (list, row, tags), `dbg-json` (JSON view frame),
 * `dbg-diff` (change view) and `dbg-trunc` (truncation notice).
 *
 * The `.json-view` rules style react18-json-view's own class names under
 * `.dbg-root`, so the package imports no CSS file.
 */

export const LOG_CSS = `
.dbg-log-scroll{flex:1;min-height:0;display:flex;flex-direction:column;padding:0 0 24px;background:rgb(var(--dbg-canvas));
  font-family:var(--dbg-mono)}
.dbg-log-banners{position:sticky;top:0;z-index:2;flex:none;background:rgb(var(--dbg-canvas))}
.dbg-log-note{font-family:var(--dbg-mono);font-size:var(--dbg-fs-small);letter-spacing:.02em}
.dbg-log-note-hint{margin-left:8px;color:rgb(var(--dbg-dim));font-size:var(--dbg-fs-chrome);letter-spacing:.06em;text-transform:uppercase}
.dbg-log-list{flex:1 0 auto;outline:none}
.dbg-log-list[data-empty="true"]{display:flex}
.dbg-log-empty{margin:auto;padding:20px;text-align:center;white-space:pre-line;font-family:var(--dbg-mono);
  font-size:var(--dbg-fs-small);line-height:1.6;color:rgb(var(--dbg-dim))}
.dbg-log-vempty{display:flex;align-items:center;justify-content:center;padding:32px}

.dbg-log-item{display:block}
.dbg-log-row{position:relative;display:flex;align-items:center;gap:8px;height:24px;padding:0 10px 0 8px;overflow:hidden;
  border-bottom:1px solid rgb(var(--dbg-line));font-family:var(--dbg-mono);font-size:11.5px;line-height:16px;white-space:nowrap;
  color:rgb(var(--dbg-text));cursor:text;transition:background-color .12s,box-shadow .12s}
.dbg-log-row[data-alt="true"]{background-color:rgb(var(--dbg-text) / .025)}
.dbg-log-row[data-level="info"]{box-shadow:inset 2px 0 0 rgb(var(--dbg-dim) / .45)}
.dbg-log-row[data-level="warn"]{background-color:rgb(var(--dbg-warn) / .06);box-shadow:inset 2px 0 0 rgb(var(--dbg-warn))}
.dbg-log-row[data-level="error"]{background-color:rgb(var(--dbg-error) / .08);box-shadow:inset 2px 0 0 rgb(var(--dbg-error))}
.dbg-log-row[data-expandable="true"]{cursor:pointer}
.dbg-log-row:hover,.dbg-log-row[data-expanded="true"]{background-image:linear-gradient(rgb(var(--dbg-hover)),rgb(var(--dbg-hover)))}
.dbg-log-row[data-copied="true"]{background-color:rgb(var(--dbg-ok) / .14)}
.dbg-log-row[data-expanded="true"]{height:auto;min-height:24px;align-items:flex-start;padding-top:4px;padding-bottom:4px;
  border-bottom-color:transparent}
.dbg-log-chev{flex:none;display:flex;align-items:center;justify-content:center;width:12px;height:16px;color:rgb(var(--dbg-dim))}
.dbg-log-chev[data-hidden="true"]{visibility:hidden}
.dbg-log-chev svg{width:8px;height:8px;transition:transform .12s}
.dbg-log-chev[data-open="true"] svg{transform:rotate(90deg)}
.dbg-log-row:hover .dbg-log-chev{color:rgb(var(--dbg-led))}
.dbg-log-time{flex:none;min-width:62px;font-size:var(--dbg-fs-chrome);letter-spacing:.02em;color:rgb(var(--dbg-dim));
  font-variant-numeric:tabular-nums}
.dbg-log-point{flex:none;display:flex;align-items:center;gap:3px;min-width:0;max-width:120px;color:rgb(var(--dbg-led) / .85)}
.dbg-log-point>span:last-child{min-width:0;overflow:hidden;text-overflow:ellipsis}
.dbg-log-tags{flex:none;display:flex;align-items:center;gap:3px;max-width:140px;overflow:hidden}
.dbg-log-tag{flex:none;display:inline-flex;align-items:center;height:15px;padding:0 4px;border-radius:var(--dbg-radius);
  font-size:10px;line-height:1;letter-spacing:.02em;color:rgb(var(--dbg-dim));background:rgb(var(--dbg-hover));
  box-shadow:inset 0 0 0 1px rgb(var(--dbg-line));transition:color .12s,background-color .12s,box-shadow .12s}
.dbg-log-tag[data-clickable="true"]{cursor:pointer}
.dbg-log-tag[data-clickable="true"]:hover{color:rgb(var(--dbg-led));box-shadow:inset 0 0 0 1px rgb(var(--dbg-led) / .7)}
.dbg-log-tag[data-clickable="true"]:focus-visible{outline:2px solid rgb(var(--dbg-led));outline-offset:1px}
.dbg-log-tag[data-active="true"]{color:rgb(var(--dbg-led));background:rgb(var(--dbg-led) / .12);
  box-shadow:inset 0 0 0 1px rgb(var(--dbg-led) / .6)}
.dbg-log-tag[data-active="true"][data-clickable="true"]:hover{color:rgb(var(--dbg-dim));text-decoration:line-through;
  background:rgb(var(--dbg-hover));box-shadow:inset 0 0 0 1px rgb(var(--dbg-line))}
.dbg-log-main{flex:1;min-width:0;display:flex;align-items:center;gap:8px}
.dbg-log-row[data-expanded="true"] .dbg-log-main{align-items:flex-start}
.dbg-log-msg{flex:0 1 auto;min-width:24px;overflow:hidden;text-overflow:ellipsis;color:rgb(var(--dbg-text))}
.dbg-log-row[data-expanded="true"] .dbg-log-msg{white-space:normal;overflow-wrap:anywhere;overflow:visible}
.dbg-log-row[data-level="error"] .dbg-log-msg{color:rgb(var(--dbg-error))}
.dbg-log-freq{flex:none;font-size:var(--dbg-fs-chrome);font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgb(var(--dbg-warn))}
.dbg-log-data{flex:1 1 0;min-width:0;overflow:hidden;text-overflow:ellipsis;font-size:11px;color:rgb(var(--dbg-dim))}
.dbg-log-copied{position:absolute;top:4px;right:8px;display:flex;align-items:center;height:16px;padding:0 6px;pointer-events:none;
  border-radius:var(--dbg-radius);font-size:var(--dbg-fs-chrome);font-weight:600;letter-spacing:.06em;text-transform:uppercase;
  color:rgb(var(--dbg-ok));background:rgb(var(--dbg-canvas));box-shadow:inset 0 0 0 1px rgb(var(--dbg-ok) / .6)}

.dbg-log-expand{margin:2px 10px 8px 28px;padding:8px 10px;overflow-x:auto;border-radius:var(--dbg-radius);
  font-family:var(--dbg-mono);font-size:11px;line-height:1.5;color:rgb(var(--dbg-dim));background:rgb(var(--dbg-raised) / .6);
  box-shadow:inset 0 0 0 1px rgb(var(--dbg-line));scrollbar-width:thin;scrollbar-color:rgb(var(--dbg-dim) / .35) transparent}
.dbg-json{min-width:0}

.dbg-diff{margin-top:6px;padding:6px 8px;border-radius:var(--dbg-radius);font-family:var(--dbg-mono);font-size:11px;
  background:rgb(var(--dbg-canvas) / .6);box-shadow:inset 0 0 0 1px rgb(var(--dbg-line))}
.dbg-diff:first-child{margin-top:0}
.dbg-diff-head{display:flex;align-items:center;gap:8px;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid rgb(var(--dbg-line))}
.dbg-diff-tag{font-size:var(--dbg-fs-chrome);font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgb(var(--dbg-led))}
.dbg-diff-summary{color:rgb(var(--dbg-dim))}
.dbg-diff-list{display:flex;flex-direction:column;gap:4px;max-height:120px;overflow-y:auto;scrollbar-width:thin;
  scrollbar-color:rgb(var(--dbg-dim) / .35) transparent}
.dbg-diff-more{padding:2px;text-align:center;font-size:var(--dbg-fs-chrome);letter-spacing:.06em;text-transform:uppercase;color:rgb(var(--dbg-dim))}
.dbg-diff-entry{padding:3px 6px;border-radius:var(--dbg-radius);background:rgb(var(--dbg-hover));box-shadow:inset 2px 0 0 rgb(var(--dbg-dim) / .5)}
.dbg-diff-entry[data-type="added"]{box-shadow:inset 2px 0 0 rgb(var(--dbg-ok))}
.dbg-diff-entry[data-type="removed"]{box-shadow:inset 2px 0 0 rgb(var(--dbg-error))}
.dbg-diff-entry[data-type="changed"]{box-shadow:inset 2px 0 0 rgb(var(--dbg-led))}
.dbg-diff-keyline{display:flex;align-items:center;gap:6px}
.dbg-diff-sym{min-width:8px;font-weight:700;color:rgb(var(--dbg-dim))}
.dbg-diff-entry[data-type="added"] .dbg-diff-sym{color:rgb(var(--dbg-ok))}
.dbg-diff-entry[data-type="removed"] .dbg-diff-sym{color:rgb(var(--dbg-error))}
.dbg-diff-entry[data-type="changed"] .dbg-diff-sym{color:rgb(var(--dbg-led))}
.dbg-diff-key{font-weight:500;color:rgb(var(--dbg-text))}
.dbg-diff-val{display:flex;align-items:baseline;gap:6px;min-width:0;margin-left:14px;color:rgb(var(--dbg-dim))}
.dbg-diff-val>span:last-child{min-width:0;overflow-wrap:anywhere}
.dbg-diff-val[data-kind="old"]{color:rgb(var(--dbg-error))}
.dbg-diff-val[data-kind="new"]{color:rgb(var(--dbg-ok))}
.dbg-diff-prop{margin-bottom:8px}
.dbg-diff-prop:last-child{margin-bottom:0}
.dbg-diff-prophead{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:4px}
.dbg-diff-propname{font-size:var(--dbg-fs-small);font-weight:600;letter-spacing:.02em;color:rgb(var(--dbg-text))}
.dbg-diff-meta{font-size:var(--dbg-fs-chrome);font-weight:600;letter-spacing:.04em;color:rgb(var(--dbg-dim))}
.dbg-diff-meta[data-hot="true"]{color:rgb(var(--dbg-warn))}
.dbg-diff-impact{font-size:var(--dbg-fs-small);font-weight:500;color:rgb(var(--dbg-dim))}
.dbg-diff-impact[data-impact="low"]{color:rgb(var(--dbg-ok))}
.dbg-diff-impact[data-impact="medium"]{color:rgb(var(--dbg-warn))}
.dbg-diff-impact[data-impact="high"]{color:rgb(var(--dbg-error))}
.dbg-diff-perf{padding:1px 4px;border-radius:var(--dbg-radius);font-size:var(--dbg-fs-chrome);font-weight:600;letter-spacing:.06em;
  color:rgb(var(--dbg-warn));background:rgb(var(--dbg-warn) / .1)}
.dbg-diff-perf[data-level="significant"]{color:rgb(var(--dbg-error));background:rgb(var(--dbg-error) / .1)}
.dbg-diff-detail{margin-top:6px;padding:6px 8px;border-radius:var(--dbg-radius);background:rgb(var(--dbg-canvas) / .6);
  box-shadow:inset 0 0 0 1px rgb(var(--dbg-line))}
.dbg-diff-detailhead{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.dbg-diff-kind{font-size:var(--dbg-fs-chrome);letter-spacing:.06em;text-transform:uppercase;color:rgb(var(--dbg-dim))}
.dbg-diff-desc{flex:1;min-width:0;color:rgb(var(--dbg-dim))}
.dbg-diff-lines{display:flex;flex-direction:column;gap:3px;margin-top:4px}
.dbg-diff-line{display:flex;align-items:baseline;gap:6px;min-width:0}
.dbg-diff-line>.dbg-diff-value{min-width:0;overflow-wrap:anywhere;color:rgb(var(--dbg-text))}
.dbg-diff-label{min-width:34px;font-size:var(--dbg-fs-chrome);font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.dbg-diff-line[data-kind="old"] .dbg-diff-label{color:rgb(var(--dbg-error))}
.dbg-diff-line[data-kind="new"] .dbg-diff-label{color:rgb(var(--dbg-ok))}
.dbg-diff-type{font-size:var(--dbg-fs-chrome);letter-spacing:.06em;text-transform:uppercase;color:rgb(var(--dbg-dim))}

.dbg-trunc{margin-top:4px;border-top:1px solid rgb(var(--dbg-line))}
.dbg-trunc-text{font-family:var(--dbg-mono);font-size:var(--dbg-fs-small);letter-spacing:.02em}
.dbg-trunc-meta{display:block;margin-top:2px;font-size:var(--dbg-fs-chrome);letter-spacing:.04em;color:rgb(var(--dbg-dim));
  font-variant-numeric:tabular-nums}

.dbg-root .json-view{display:block;text-align:left;font-family:var(--dbg-mono);font-size:11.5px;line-height:1.6;
  color:rgb(var(--dbg-text));
  --json-property:rgb(var(--dbg-text));--json-index:rgb(var(--dbg-dim));--json-number:rgb(var(--dbg-led));
  --json-string:rgb(var(--dbg-ok));--json-boolean:rgb(var(--dbg-caution));--json-null:rgb(var(--dbg-caution))}
.dbg-root .json-view .json-view--property{color:var(--json-property)}
.dbg-root .json-view .json-view--index{color:var(--json-index)}
.dbg-root .json-view .json-view--number{color:var(--json-number)}
.dbg-root .json-view .json-view--string{color:var(--json-string);overflow-wrap:anywhere}
.dbg-root .json-view .json-view--boolean{color:var(--json-boolean)}
.dbg-root .json-view .json-view--null{color:var(--json-null)}
.dbg-root .json-view .jv-indent{padding-left:1em}
.dbg-root .json-view .jv-chevron{display:inline-block;vertical-align:-20%;width:1em;height:1em;cursor:pointer;opacity:.4;
  color:rgb(var(--dbg-dim))}
.dbg-root .json-view .jv-chevron:hover,.dbg-root .json-view .jv-size:hover+.jv-chevron{opacity:.9;color:rgb(var(--dbg-led))}
.dbg-root .json-view .jv-size{margin-left:.5em;cursor:pointer;opacity:.55;font-size:.875em;font-style:normal;line-height:1;
  vertical-align:-5%;color:rgb(var(--dbg-dim));font-variant-numeric:tabular-nums}
.dbg-root .json-view :is(.json-view--copy,.json-view--edit),.dbg-root .json-view .json-view--link svg{display:none;width:1em;height:1em;
  margin-left:.25em;cursor:pointer;color:rgb(var(--dbg-dim));vertical-align:-10%}
.dbg-root .json-view :is(.json-view--copy,.json-view--edit):hover{color:rgb(var(--dbg-led))}
.dbg-root :is(.json-view:hover,.json-view--pair:hover)>:is(.json-view--copy,.json-view--edit),
.dbg-root :is(.json-view:hover,.json-view--pair:hover)>.json-view--link svg{display:inline-block}
.dbg-root .json-view .json-view--input{width:120px;margin-left:.25em;padding:0 4px;border-radius:var(--dbg-radius);
  border:1px solid rgb(var(--dbg-led) / .6);background:transparent;font-size:87.5%;line-height:1.25;color:inherit;outline:none}
.dbg-root .json-view .json-view--input:focus{border-color:rgb(var(--dbg-led))}
.dbg-root .json-view .json-view--deleting{outline:1px solid rgb(var(--dbg-error));background:rgb(var(--dbg-error) / .1);
  text-decoration-line:line-through}
.dbg-root .json-view .jv-button{border:0;outline:none;background:transparent;color:inherit;cursor:pointer}
.dbg-root .json-view .cursor-pointer{cursor:pointer}
.dbg-root .json-view svg{vertical-align:-10%}
.dbg-root .json-view .jv-size-chevron~svg{vertical-align:-16%}
`;
