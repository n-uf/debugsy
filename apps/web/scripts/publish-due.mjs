#!/usr/bin/env node
/**
 * Scheduled publishing: set `draft: false` on every content page that is `draft: true` and whose
 * `published` (its go-live day, UTC YYYY-MM-DD) is today or earlier. Run daily by
 * .github/workflows/publish.yml; Node built-ins only, so it needs no install.
 *
 *   node scripts/publish-due.mjs [--dry-run] [--message] [--today YYYY-MM-DD] [--content-dir DIR]
 *
 * Prints the due pages, one `<section>/<slug>` per line (blog/my-article), in order, and changes only
 * the `true` of the `draft: true` line in each file: every other byte stays. With --dry-run nothing is
 * written. With --message it prints the commit message instead, `publish: blog/a, use-cases/b`, or
 * nothing when no page is due; the workflow commits exactly that. Notes go to stderr.
 *
 * --today (default: today in UTC) and --content-dir (default: ../content, next to this script) are
 * for the tests.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const FRONT_MATTER = /^(---\r?\n)([\s\S]*?)(\r?\n---)/;
const DRAFT_TRUE = /^(draft:[ \t]*)true([ \t]*(?:#.*)?)(?=\r?$)/m;
const PUBLISHED = /^published:[ \t]*["']?([^\s"'#]*)["']?[ \t]*(?:#.*)?(?=\r?$)/m;

/** Parse the command line; exits with a usage message on anything unknown. */
function parseArgs(argv) {
  const opts = {
    dryRun: false,
    message: false,
    today: new Date().toISOString().slice(0, 10),
    contentDir: fileURLToPath(new URL("../content/", import.meta.url)),
  };
  const fail = (msg) => {
    console.error(`publish-due: ${msg}`);
    console.error("usage: publish-due.mjs [--dry-run] [--message] [--today YYYY-MM-DD] [--content-dir DIR]");
    process.exit(2);
  };
  for (let i = 0; i < argv.length; i += 1) {
    const [flag, inline] = argv[i].split(/=(.*)/s);
    const value = () => {
      if (inline !== undefined) return inline;
      i += 1;
      if (i >= argv.length) fail(`${flag} needs a value`);
      return argv[i];
    };
    if (flag === "--dry-run") opts.dryRun = true;
    else if (flag === "--message") opts.message = true;
    else if (flag === "--today") opts.today = value();
    else if (flag === "--content-dir") opts.contentDir = path.resolve(value());
    else fail(`unknown option ${argv[i]}`);
  }
  const t = new Date(`${opts.today}T00:00:00Z`);
  if (!DAY.test(opts.today) || Number.isNaN(t.getTime()) || t.toISOString().slice(0, 10) !== opts.today) {
    fail(`--today must be a real YYYY-MM-DD day, not "${opts.today}"`);
  }
  return opts;
}

/** Every <section>/<slug>.md under the content dir, sorted by section and slug. */
function contentFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const section of fs.readdirSync(dir).sort()) {
    const sectionDir = path.join(dir, section);
    if (section.startsWith(".") || !fs.statSync(sectionDir).isDirectory()) continue;
    for (const name of fs.readdirSync(sectionDir).sort()) {
      if (SLUG_FILE.test(name)) {
        out.push({ id: `${section}/${name.slice(0, -3)}`, file: path.join(sectionDir, name) });
      }
    }
  }
  return out;
}

const opts = parseArgs(process.argv.slice(2));
const due = [];
const writes = [];
for (const { id, file } of contentFiles(opts.contentDir)) {
  const src = fs.readFileSync(file, "utf8");
  const m = FRONT_MATTER.exec(src);
  if (!m || !DRAFT_TRUE.test(m[2])) continue;
  const published = PUBLISHED.exec(m[2])?.[1] ?? "";
  if (!DAY.test(published)) {
    console.error(`publish-due: ${id}: draft without a YYYY-MM-DD published (got "${published}")`);
    process.exit(1);
  }
  if (published > opts.today) continue;
  due.push(id);
  const front = m[1] + m[2].replace(DRAFT_TRUE, "$1false$2") + m[3];
  writes.push([file, front + src.slice(m[0].length)]);
}
// Every file is read and checked first, so a broken page stops the run before anything is written.
if (!opts.dryRun) for (const [file, text] of writes) fs.writeFileSync(file, text);

if (opts.message) {
  if (due.length > 0) console.log(`publish: ${due.join(", ")}`);
} else {
  for (const id of due) console.log(id);
}
console.error(
  due.length === 0
    ? `publish-due: nothing due on ${opts.today}`
    : `publish-due: ${opts.dryRun ? "would publish" : "published"} ${due.length} page${due.length === 1 ? "" : "s"} (${opts.today})`,
);
