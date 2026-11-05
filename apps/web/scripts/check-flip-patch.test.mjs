// Tests for check-flip-patch.sh, the push job's guard: it must accept a flip of `draft: true` lines and
// refuse anything else. Each case builds a patch in a scratch git repo and runs the script there.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { after, beforeEach, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(new URL("./check-flip-patch.sh", import.meta.url));
const RECHECK = fileURLToPath(new URL("./recheck-rebased-flip.sh", import.meta.url));
const page = (draft, extra = "", body = "") =>
  `---\ntitle: "A page"\npublished: 2026-11-09\nupdated: 2026-11-09\ndraft: ${draft}\nauthor: n-uf\n---\n\nBody text.${extra}\n${body}`;
// The fixtures go live on 2026-11-09; the script reads "today" from FLIP_TODAY in the tests.
const DUE_DAY = "2026-11-09";

let repo;
const git = (...args) => {
  const r = spawnSync("git", ["-c", "core.hooksPath=/dev/null", ...args], { cwd: repo, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout;
};
const write = (rel, text) => {
  fs.mkdirSync(path.dirname(path.join(repo, rel)), { recursive: true });
  fs.writeFileSync(path.join(repo, rel), text);
};
/** Make the edits, save them as the build job would (git diff --binary), restore the tree, run the check. */
const check = (edit, slugs, today = DUE_DAY) => {
  edit();
  const patch = path.join(repo, "..", `flip-${Math.random().toString(36).slice(2)}.patch`);
  spawnSync("sh", ["-c", `git add -N . && git diff --binary -- . > "${patch}"`], { cwd: repo });
  git("reset", "-q", "--hard");
  git("clean", "-q", "-fd");
  return spawnSync("bash", [SCRIPT, patch, slugs], {
    cwd: repo,
    encoding: "utf8",
    env: { ...process.env, FLIP_TODAY: today },
  });
};

const roots = [];
beforeEach(() => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "flip-check-"));
  roots.push(root);
  repo = path.join(root, "repo");
  fs.mkdirSync(repo);
  git("init", "-q", "-b", "main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  write("apps/web/content/blog/a-post.md", page("true"));
  write("apps/web/content/use-cases/b-case.md", page("true"));
  write("apps/web/content/blog/live-post.md", page("false", "", "\n```yaml\ndraft: true\n```\n"));
  write("apps/web/app/page.tsx", "export default 1;\n");
  git("add", ".");
  git("commit", "-q", "-m", "fixture");
});
after(() => roots.forEach((r) => fs.rmSync(r, { recursive: true, force: true })));

test("accepts a draft flip and prints the commit message", () => {
  const r = check(() => write("apps/web/content/blog/a-post.md", page("false")), "blog/a-post");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), "publish: blog/a-post");
  assert.match(git("diff", "--cached", "--name-only"), /apps\/web\/content\/blog\/a-post\.md/);
});

test("accepts flips in two sections, in path order", () => {
  const r = check(() => {
    write("apps/web/content/blog/a-post.md", page("false"));
    write("apps/web/content/use-cases/b-case.md", page("false"));
  }, "blog/a-post, use-cases/b-case");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), "publish: blog/a-post, use-cases/b-case");
});

test("refuses a flip that also changes the body (a non-draft hunk)", () => {
  const r = check(() => write("apps/web/content/blog/a-post.md", page("false", " Injected.")), "blog/a-post");
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /exactly one line|other than a draft/);
});

test("refuses a change to a line that isn't the draft line", () => {
  const r = check(
    () => write("apps/web/content/blog/a-post.md", page("true").replace("author: n-uf", "author: evil")),
    "blog/a-post",
  );
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /other than a draft: true line/);
});

test("refuses turning a live page back into a draft", () => {
  const r = check(
    () => write("apps/web/content/blog/live-post.md", page("true", "", "\n```yaml\ndraft: true\n```\n")),
    "blog/live-post",
  );
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /other than a draft: true line/);
});

test("refuses a page that isn't due yet", () => {
  const r = check(() => write("apps/web/content/blog/a-post.md", page("false")), "blog/a-post", "2026-11-08");
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /isn't due/);
});

test("refuses flipping a `draft: true` line in the body (a code sample), not the front matter", () => {
  const r = check(
    () => write("apps/web/content/blog/live-post.md", page("false", "", "\n```yaml\ndraft: false\n```\n")),
    "blog/live-post",
  );
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /outside the front matter/);
});

test("refuses a change outside the content pages", () => {
  const r = check(() => {
    write("apps/web/content/blog/a-post.md", page("false"));
    write("apps/web/app/page.tsx", "export default 2;\n");
  }, "blog/a-post");
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /file other than apps\/web\/content/);
});

test("refuses a new file, even one that looks like a flip", () => {
  const r = check(() => write("apps/web/content/blog/new-post.md", page("false")), "blog/new-post");
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /creates, deletes|exactly one line/);
});

test("refuses pages other than the ones the build reported", () => {
  const r = check(() => write("apps/web/content/blog/a-post.md", page("false")), "use-cases/b-case");
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /not the pages the build job reported/);
});

test("accepts a flip on a page larger than the pipe buffer (no SIGPIPE under pipefail)", () => {
  const long = `\n${"A long paragraph of text that makes the page big. ".repeat(3000)}\n`;
  write("apps/web/content/blog/a-post.md", page("true", "", long));
  git("commit", "-q", "-am", "long page");
  const r = check(() => write("apps/web/content/blog/a-post.md", page("false", "", long)), "blog/a-post");
  assert.ok(fs.statSync(path.join(repo, "apps/web/content/blog/a-post.md")).size > 100_000);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), "publish: blog/a-post");
});

test("accepts a quoted published day and refuses a flip with no published day", () => {
  write("apps/web/content/blog/a-post.md", page("true").replace("published: 2026-11-09", 'published: "2026-11-09"'));
  write("apps/web/content/use-cases/b-case.md", page("true").replace("published: 2026-11-09\n", ""));
  git("commit", "-q", "-am", "quoted and missing dates");
  const ok = check(
    () => write("apps/web/content/blog/a-post.md", page("false").replace("published: 2026-11-09", 'published: "2026-11-09"')),
    "blog/a-post",
  );
  assert.equal(ok.status, 0, ok.stderr);
  const bad = check(
    () => write("apps/web/content/use-cases/b-case.md", page("false").replace("published: 2026-11-09\n", "")),
    "use-cases/b-case",
  );
  assert.notEqual(bad.status, 0);
  assert.match(bad.stderr, /no published day/);
});

test("judges the patch before writing anything: a patch that creates a file leaves the repo untouched", () => {
  const r = check(() => {
    write("apps/web/content/blog/a-post.md", page("false"));
    write("apps/web/content/blog/new-post.md", page("false"));
  }, "blog/a-post, blog/new-post");
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /creates, deletes, renames/);
  assert.equal(git("status", "--porcelain"), "", "nothing applied, nothing staged");
});

// After a rejected push, the workflow rebases the flip on the main it fetched and rechecks it there.
describe("recheck after a rebase", () => {
  /** The flip commit, rebased on a main that gained `upstreamEdit` meanwhile. Returns that main's sha. */
  const rebasedFlip = (upstreamEdit) => {
    git("switch", "-q", "-c", "flip");
    write("apps/web/content/blog/a-post.md", page("false"));
    git("commit", "-q", "-am", "publish: blog/a-post");
    git("switch", "-q", "main");
    upstreamEdit();
    git("commit", "-q", "-am", "meanwhile on main");
    const main = git("rev-parse", "HEAD").trim();
    git("switch", "-q", "flip");
    git("rebase", "-q", "main");
    return main;
  };
  const recheck = (main, slugs = "blog/a-post") =>
    spawnSync("bash", [RECHECK, main, slugs, SCRIPT], {
      cwd: repo,
      encoding: "utf8",
      env: { ...process.env, FLIP_TODAY: DUE_DAY },
    });

  test("passes when main gained an unrelated commit, and leaves the flip as one commit on top", () => {
    const main = rebasedFlip(() =>
      write("apps/web/content/blog/live-post.md", page("false", " Edited.", "\n```yaml\ndraft: true\n```\n")),
    );
    const r = recheck(main);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout.trim(), "publish: blog/a-post");
    assert.equal(git("rev-parse", "HEAD~1").trim(), main);
    assert.equal(git("log", "-1", "--format=%s").trim(), "publish: blog/a-post");
  });

  test("refuses when a commit meanwhile moved the due page's published day into the future", () => {
    const main = rebasedFlip(() =>
      write("apps/web/content/blog/a-post.md", page("true").replace("published: 2026-11-09", "published: 2099-01-01")),
    );
    const r = recheck(main);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /isn't due/);
  });

  test("refuses when the flip isn't exactly one commit on top of main", () => {
    const main = rebasedFlip(() => write("apps/web/app/page.tsx", "export default 3;\n"));
    write("apps/web/app/page.tsx", "export default 4;\n");
    git("commit", "-q", "-am", "a second commit");
    const r = recheck(main);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /exactly one commit on top of main/);
  });
});

test("refuses an empty patch", () => {
  const r = check(() => {}, "blog/a-post");
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /changes nothing|does not apply/);
});
