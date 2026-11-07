import Link from "next/link";
import type React from "react";
import { LIB_VERSION } from "../site";
import { CopyCommand } from "./copy-command";
import { OpenPanelButton } from "./open-panel-button";
import { PanelKeys } from "./panel-keys";

/**
 * The hero's terminal (sketch T2, approved 2026-11-07): the install line, the links into the use
 * cases and articles as its menu (the first one highlighted in grey), and the live panel's keys on
 * its bottom row. Everything is real text and real links in the server HTML; the keys and the copy
 * button are the only client parts. On phones the keys row gives way to an "Open the live panel" entry.
 */
export function HeroTerminal({
  install,
  links,
}: {
  readonly install: string;
  readonly links: readonly { readonly href: string; readonly label: string }[];
}): React.ReactElement {
  return (
    <div className="g-term">
      <div className="g-term-h">
        <span>~/your-app</span>
        <span className="g-term-live">
          <i aria-hidden="true" />
          debugsy {LIB_VERSION}
        </span>
      </div>
      <div className="g-term-b">
        <div className="g-term-cmd">
          <span className="g-term-p" aria-hidden="true">
            $
          </span>
          <code>{install}</code>
          <CopyCommand command={install} />
        </div>
        <p className="g-term-cm"># then mount {"<DebugsyLook />"} from a client component</p>
        <ul className="g-term-menu">
          {links.map((l, i) => (
            <li key={l.href}>
              <Link className={`g-term-mi${i === 0 ? " is-sel" : ""}`} href={l.href}>
                <span className="g-term-chev" aria-hidden="true">
                  ›
                </span>
                {l.label}
                <span className="g-term-ret" aria-hidden="true">
                  {i === 0 ? "↵" : "→"}
                </span>
              </Link>
            </li>
          ))}
          <li className="g-term-open">
            <OpenPanelButton className="g-term-mi">
              <span className="g-term-chev" aria-hidden="true">
                ›
              </span>
              Open the live panel
              <span className="g-term-ret" aria-hidden="true">
                ▲
              </span>
            </OpenPanelButton>
          </li>
        </ul>
      </div>
      <div className="g-term-kb">
        <span className="g-term-kb-lbl">The panel below is live</span>
        <PanelKeys />
      </div>
    </div>
  );
}
