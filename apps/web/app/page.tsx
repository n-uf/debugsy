import Link from "next/link";
import type React from "react";
import { entriesOf, liveSections } from "./_content/content";
import { jsonLdHtml } from "./_content/jsonld";
import { DebugsyLookMounted } from "./_components/debugsy-look-mounted";
import { HeroTerminal } from "./_components/hero-terminal";
import { Tok } from "./_components/tok";
import { CAPABILITIES } from "./_data/feature-log";
import { HOME_DESCRIPTION, HOME_H1 } from "./home-meta";
import {
  absoluteUrl,
  APP_ID,
  LIB_VERSION,
  LICENSE_NAME,
  LICENSE_URL,
  ORG_ID,
  ORG_NODE,
  REPO_URL,
  SITE_NAME,
  SITE_URL,
  WEBSITE_ID,
} from "./site";
import "./home.css";

// The home page's graph: the n-uf node itself, the website and the library as a SoftwareApplication.
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    ORG_NODE,
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: "en",
      publisher: { "@id": ORG_ID },
    },
    {
      "@type": "SoftwareApplication",
      "@id": APP_ID,
      name: SITE_NAME,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Browser",
      url: SITE_URL,
      description: HOME_DESCRIPTION,
      softwareVersion: LIB_VERSION,
      license: LICENSE_URL,
      codeRepository: REPO_URL,
      image: absoluteUrl("/opengraph-image"),
      // No `offers`: no price is published for debugsy, so the data doesn't state one (not even 0).
      author: { "@id": ORG_ID },
      publisher: { "@id": ORG_ID },
      featureList: [
        "Structured debug logging by named debug points",
        "Which values changed between renders (useWhyDidYouUpdate)",
        "Render and mount count warnings (useRenderTracker)",
        "One ordered, virtualised log inside the page",
        "No telemetry and no network requests",
      ],
    },
  ],
};

const INSTALL = "npm i @n-uf/debugsy";
/** How many of each section's newest pages "Read next" shows. */
const READ_NEXT = 3;

const capability = (num: string) => {
  const c = CAPABILITIES.find((x) => x.num === num);
  if (!c) throw new Error(`home page: no capability ${num} in feature-log.ts`);
  return c;
};

/**
 * The home page (direction B, Grid look; sketches approved 2026-11-06): the hero, the panel docked
 * below it (desktop; one tap away on phones), what the panel shows, how to install it, and the newest
 * use cases and articles. Everything a reader needs is in the server HTML.
 */
export default function HomePage(): React.ReactElement {
  const sections = liveSections();
  const useCases = sections.find((s) => s.section === "use-cases");
  const blog = sections.find((s) => s.section === "blog");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(STRUCTURED_DATA) }}
      />
      <main className="g-frame g-home">
        <section className="g-cell g-hero" aria-label="debugsy">
          <div className="g-hero-grid">
            <div>
              <p className="g-kicker">
                <b>debugsy {LIB_VERSION}</b> · React 19 · {LICENSE_NAME}
              </p>
              <h1 className="g-h1">{HOME_H1}</h1>
              <p className="g-promise">{HOME_DESCRIPTION}</p>
            </div>
            <HeroTerminal
              install={INSTALL}
              links={[
                ...(useCases ? [{ href: useCases.path, label: "Debugging use cases" }] : []),
                ...(blog ? [{ href: blog.path, label: "Articles on React debugging" }] : []),
              ]}
            />
          </div>
          <figure className="g-still">
            <div className="g-still-log" aria-label="sample debugsy log">
              <p className="warn">
                <b>session</b> <i>auth</i> expired <span>{'{"ttl":0}'}</span>
              </p>
              <p className="err">
                <b>refresh</b> <i>auth</i> 5xx <span>{'{"status":503}'}</span>
              </p>
              <p>
                <b>refresh</b> <i>auth</i> renewed <span>{'{"expiresIn":3600}'}</span>
              </p>
              <p>
                <b>session</b> <i>auth</i> synced <span>{'{"userId":42}'}</span>
              </p>
            </div>
            <figcaption>Sample log</figcaption>
          </figure>
        </section>

        <section className="g-cell g-sec" aria-labelledby="shows">
          <h2 id="shows">What the panel shows</h2>
          <div className="g-feat">
            <div>
              <h3>{capability("01").title}</h3>
              <p>{capability("01").summary}</p>
            </div>
            <pre className="g-code">
              <code>
                <Tok kind="kw">const</Tok> debug = <Tok kind="fn">useDebugsy</Tok>()
                {"\n"}debug.<Tok kind="fn">log</Tok>(<Tok kind="str">"session"</Tok>,{" "}
                <Tok kind="str">"synced"</Tok>, {"{ userId }"})
                {"\n"}
                <Tok kind="fn">dsy</Tok>.<Tok kind="fn">warn</Tok>(<Tok kind="str">"session"</Tok>,{" "}
                <Tok kind="str">"expired"</Tok>, {"{ ttl }"})
                {"\n"}
                <Tok kind="fn">getDebugsy</Tok>().<Tok kind="fn">error</Tok>(
                <Tok kind="str">"refresh"</Tok>, <Tok kind="str">"5xx"</Tok>, err)
              </code>
            </pre>
          </div>
          <div className="g-feat">
            <div>
              <h3>{capability("02").title}</h3>
              <p>{capability("02").summary}</p>
            </div>
            <pre className="g-code">
              <code>
                <Tok kind="fn">useWhyDidYouUpdate</Tok>(<Tok kind="str">"Form"</Tok>,{" "}
                {"{ values, errors, onSubmit }"})
              </code>
            </pre>
          </div>
          <div className="g-feat">
            <div>
              <h3>{capability("04").title}</h3>
              <p>{capability("04").summary}</p>
            </div>
            <pre className="g-code">
              <code>
                <Tok kind="fn">useRenderTracker</Tok>(<Tok kind="str">"Modal"</Tok>, {"{"}
                {"\n  "}trackRenders: <Tok kind="kw">true</Tok>,{"    "}
                <Tok kind="comment">{"// needed in 26.11"}</Tok>
                {"\n  "}renderThreshold: 10,{"   "}
                <Tok kind="comment">{"// default"}</Tok>
                {"\n  "}onExcessiveRenders: (info) =&gt; debug.<Tok kind="fn">warn</Tok>(
                <Tok kind="str">"performance"</Tok>, <Tok kind="str">"hot"</Tok>, info),
                {"\n"}
                {"})"}
              </code>
            </pre>
          </div>
          <ul className="g-minor">
            {["05", "03", "06"].map((n) => (
              <li key={n}>
                <h3>{capability(n).title}</h3>
                <p>{capability(n).summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="g-cell g-sec" aria-labelledby="install">
          <h2 id="install">Install</h2>
          <ol className="g-steps">
            <li>
              <h3>Add the package</h3>
              <pre className="g-code">
                <code>
                  <Tok kind="comment">$</Tok> {INSTALL}
                </code>
              </pre>
              <p>Needs React 19 (react and react-dom are peer dependencies).</p>
            </li>
            <li>
              <h3>Mount the panel</h3>
              <pre className="g-code">
                <code>
                  <Tok kind="str">"use client"</Tok>;{"\n\n"}
                  <Tok kind="kw">import</Tok> {"{ DebugsyLook }"} <Tok kind="kw">from</Tok>{" "}
                  <Tok kind="str">"@n-uf/debugsy"</Tok>;{"\n\n"}
                  <Tok kind="kw">export function</Tok> <Tok kind="fn">DebugPanel</Tok>() {"{"}
                  {"\n  "}
                  <Tok kind="kw">return</Tok> {"<"}
                  <Tok kind="fn">DebugsyLook</Tok> {"/>"};{"\n"}
                  {"}"}
                </code>
              </pre>
              <p>
                Mount {"<DebugsyLook />"} from a client component. That's the whole setup: no CSS
                import, no Tailwind, no bundler config.
              </p>
            </li>
            <li>
              <h3>Keep it out of production</h3>
              <pre className="g-code">
                <code>
                  <Tok kind="kw">if</Tok> (process.env.NODE_ENV !=={" "}
                  <Tok kind="str">"production"</Tok>) {"{"}
                  {"\n  "}
                  <Tok kind="kw">await</Tok> <Tok kind="fn">import</Tok>(
                  <Tok kind="str">"@n-uf/debugsy"</Tok>)
                  {"\n"}
                  {"}"}
                </code>
              </pre>
              <p>It doesn't remove itself: load it only in development to keep it out of production builds.</p>
            </li>
          </ol>
        </section>

        {sections.length > 0 ? (
          <section className="g-cell g-sec" aria-labelledby="read-next">
            <h2 id="read-next">Read next</h2>
            <div className="g-reads">
              {sections.map((s) => (
                <div key={s.section}>
                  <p className="g-label">{s.section === "blog" ? "Articles" : "Use cases"}</p>
                  {entriesOf(s.section)
                    .slice(0, READ_NEXT)
                    .map((e) => (
                      <Link key={e.path} className="g-card" href={e.path}>
                        <h3>{e.h1}</h3>
                        <p>{e.description}</p>
                      </Link>
                    ))}
                  <Link className="g-more" href={s.path}>
                    {s.section === "blog" ? "All articles" : "All use cases"} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <DebugsyLookMounted />
    </>
  );
}
