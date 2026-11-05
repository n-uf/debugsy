// Tests for check-flip-patch.sh, the push job's guard: it must accept a flip of `draft: true` lines and
// refuse anything else. Each case builds a patch in a scratch git repo and runs the script there.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, beforeEach, test } from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(new URL("./check-flip-patch.sh", import.meta.url));
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
  assert.match(r.stderr, /files other than/);
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

test("refuses an empty patch", () => {
  const r = check(() => {}, "blog/a-post");
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /changes nothing|does not apply/);
});
