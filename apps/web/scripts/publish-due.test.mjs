import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { after, before, beforeEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(new URL("./publish-due.mjs", import.meta.url));

const page = (front, body = "Body text.\n") => `---\ntitle: A page\n${front}---\n${body}`;

/** The fixture: due and future drafts, a live page, in two sections, plus odd spellings. */
const FIXTURE = {
  "blog/due-draft.md": page("published: 2026-11-01\nupdated: 2026-11-01\ndraft: true\nauthor: n-uf\n"),
  "blog/due-today.md": page('published: "2026-11-05"\nupdated: "2026-11-05"\ndraft: true # go live\n'),
  "blog/future-draft.md": page("published: 2026-12-31\nupdated: 2026-12-31\ndraft: true\n"),
  "blog/live-page.md": page("published: 2026-01-10\nupdated: 2026-02-01\n"),
  "blog/live-explicit.md": page("published: 2026-01-11\nupdated: 2026-01-11\ndraft: false\n"),
  "use-cases/due-case.md": page("published: 2026-10-30\nupdated: 2026-10-30\ndraft: true\n"),
  "use-cases/crlf-due.md": page("published: 2026-10-31\nupdated: 2026-10-31\ndraft: true\n").replace(/\n/g, "\r\n"),
  // `draft: true` in the body, or nested, is not front matter's draft flag.
  "blog/body-mention.md": page("published: 2026-01-12\nupdated: 2026-01-12\n", "draft: true\n\nLine above is body text.\n"),
};

const TODAY = "2026-11-05";
const DUE = ["blog/due-draft", "blog/due-today", "use-cases/crlf-due", "use-cases/due-case"];

let dir;
const read = (rel) => fs.readFileSync(path.join(dir, rel), "utf8");
const snapshot = () => Object.fromEntries(Object.keys(FIXTURE).map((rel) => [rel, read(rel)]));
const run = (...args) =>
  execFileSync(process.execPath, [SCRIPT, "--content-dir", dir, "--today", TODAY, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

before(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "publish-due-"));
});
after(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});
beforeEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
  for (const [rel, text] of Object.entries(FIXTURE)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text);
  }
});

describe("publish-due --dry-run", () => {
  it("lists only the due drafts and changes no file", () => {
    const orig = snapshot();
    assert.equal(run("--dry-run"), `${DUE.join("\n")}\n`);
    assert.deepEqual(snapshot(), orig);
  });

  it("lists nothing, and exits 0, when nothing is due", () => {
    const out = execFileSync(
      process.execPath,
      [SCRIPT, "--dry-run", "--content-dir", dir, "--today", "2026-01-01"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    assert.equal(out, "");
  });

  it("treats a draft as due from its published day on, not before", () => {
    assert.equal(run("--dry-run", "--today", "2026-12-30").includes("future-draft"), false);
    assert.equal(run("--dry-run", "--today", "2026-12-31").includes("blog/future-draft"), true);
  });
});

describe("publish-due (real run)", () => {
  it("flips draft: true to false on due drafts and changes nothing else", () => {
    const orig = snapshot();
    run();
    const now = snapshot();
    for (const rel of Object.keys(FIXTURE)) {
      const id = rel.replace(/\.md$/, "");
      if (DUE.includes(id)) {
        assert.notEqual(now[rel], orig[rel], `${rel} should change`);
        // Reverting the one flipped word gives back the original, byte for byte.
        assert.equal(now[rel].replace(/^(draft:[ \t]*)false/m, "$1true"), orig[rel], `${rel}: only draft changed`);
        assert.match(now[rel], /^draft: false/m);
      }
    }
    assert.match(now["blog/due-today.md"], /^draft: false # go live\n/m, "a trailing comment stays");
    assert.match(now["use-cases/crlf-due.md"], /\r\ndraft: false\r\n/, "CRLF line endings stay");
  });

  it("leaves not-yet-due drafts and live pages untouched", () => {
    const orig = snapshot();
    run();
    const now = snapshot();
    for (const rel of ["blog/future-draft.md", "blog/live-page.md", "blog/live-explicit.md", "blog/body-mention.md"]) {
      assert.equal(now[rel], orig[rel], `${rel} must not change`);
    }
  });

  it("is idempotent: a second run finds nothing", () => {
    run();
    const now = snapshot();
    assert.equal(run(), "");
    assert.deepEqual(snapshot(), now);
  });
});

describe("publish-due output", () => {
  it("prints the slugs, and --message is the line the workflow commits", () => {
    const slugs = run("--dry-run").trim().split("\n");
    assert.deepEqual(slugs, DUE);
    const message = run("--dry-run", "--message");
    assert.equal(message, `publish: ${slugs.join(", ")}\n`);
    // The real run prints the same message and has flipped exactly those pages.
    assert.equal(run("--message"), message);
    assert.equal(run("--dry-run"), "");
  });

  it("prints no message when nothing is due (the workflow makes no commit)", () => {
    assert.equal(run("--message", "--today", "2026-01-01"), "");
  });
});

describe("publish-due errors", () => {
  it("rejects an unknown option and a bad --today", () => {
    const r = spawnSync(process.execPath, [SCRIPT, "--nope"], { encoding: "utf8" });
    assert.equal(r.status, 2);
    const t = spawnSync(process.execPath, [SCRIPT, "--content-dir", dir, "--today", "2026-02-31"], { encoding: "utf8" });
    assert.equal(t.status, 2);
    assert.match(t.stderr, /--today must be a real/);
  });

  it("fails, writing nothing (even for due pages sorted before it), on a draft without a real published day", () => {
    fs.writeFileSync(path.join(dir, "blog/zz-broken.md"), page("published: soon\nupdated: soon\ndraft: true\n"));
    const orig = snapshot();
    const r = spawnSync(process.execPath, [SCRIPT, "--content-dir", dir, "--today", TODAY], { encoding: "utf8" });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /blog\/zz-broken: draft without a YYYY-MM-DD published/);
    assert.deepEqual(snapshot(), orig);
  });
});
