import { entriesOf, liveSections } from "../_content/content";
import { HOME_DESCRIPTION, HOME_TITLE } from "../home-meta";
import { absoluteUrl, LIB_VERSION, LICENSE_NAME, REPO_URL, SITE_URL } from "../site";

export const dynamic = "force-static";

/** /llms.txt (llmstxt.org): what debugsy is and every page, made from the same data as the pages. */
export function GET(): Response {
  const lines: string[] = [
    "# debugsy",
    "",
    "> debugsy is an in-process React debugging panel by n-uf: a React component you mount inside your own app. It shows one ordered log of your structured debug messages, the changed values you track between renders and render-count warnings.",
    "",
    `- Package: \`@n-uf/debugsy\` ${LIB_VERSION}. Not on npmjs yet: a public release there is in preparation.`,
    "- Needs React 19 and react-dom 19 (peer dependencies, plus react18-json-view).",
    "- Main API: `<DebugsyLook />` (the panel), `useDebugsy()` / `dsy` / `window.debugsy` (logging), `registerModule()` (debug points), `useWhyDidYouUpdate()` (which values changed between renders), `useRenderTracker()` (render and mount count warnings).",
    '- `useWhyDidYouUpdate()` and `useRenderTracker()` log nothing until the dependencies debug point is on: the panel\'s Deps toggle, or `window.debugsy.enable("dependencies")` in the console.',
    "- It warns; it doesn't stop render loops. It makes no network requests. It doesn't remove itself from production builds: guard the import.",
    `- Licence: ${LICENSE_NAME}. Source: ${REPO_URL}`,
    "",
    "## Pages",
    "",
    `- [${HOME_TITLE}](${SITE_URL}): ${HOME_DESCRIPTION}`,
  ];
  for (const s of liveSections()) {
    lines.push(`- [${s.title}](${absoluteUrl(s.path)}): ${s.description}`);
  }
  for (const s of liveSections()) {
    lines.push("", `## ${s.section === "blog" ? "Articles" : "Use cases"}`, "");
    for (const e of entriesOf(s.section)) {
      lines.push(`- [${e.h1}](${absoluteUrl(e.path)}): ${e.description}`);
    }
  }
  return new Response(`${lines.join("\n")}\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
