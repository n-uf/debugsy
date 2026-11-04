---
title: "Debug a Next.js app: server, browser and VS Code"
description: "Debug a Next.js app with --inspect, Chrome DevTools or VS Code: server and browser breakpoints, where logs show up, and why breakpoints stay gray."
h1: "How to debug a Next.js app, server and browser"
mainKeyword: "debug next js app"
kind: how-to
published: 2026-11-30
updated: 2026-11-30
author: n-uf
takeaways:
  - "Next.js's debugging guide (v16.4.5, last updated August 25, 2026) covers browser code in Chrome or Firefox DevTools, server code with the --inspect flag, and VS Code through a .vscode/launch.json file."
  - "For server code, start the dev server with npm run dev -- --inspect, open chrome://inspect and click inspect under Remote Target. --inspect-brk and --inspect-wait have to go through NODE_OPTIONS instead."
  - "A Client Component renders on the server and again in the browser on a direct visit, so its console.log appears in both the terminal and the browser console."
  - "Next.js turns source maps on in development and off for the browser in production builds unless productionBrowserSourceMaps is true. Production builds also omit server source maps."
  - "debugsy is a React component in the page. It can log from Client Components in the browser, and it can't see Server Components, route handlers or any other server code."
faq:
  - q: "How do I debug a Next.js app in VS Code?"
    a: "Create .vscode/launch.json at the project root with the configurations from Next.js's debugging guide, open the Debug panel, pick one such as \"Next.js: debug full stack\" and press F5. The server-side configuration runs npm run dev -- --inspect, and the client-side one opens http://localhost:3000 in Chrome. If your app runs on another port, replace 3000 in the url."
  - q: "How do I debug Next.js server-side code?"
    a: "Start the dev server with the --inspect flag (npm run dev -- --inspect), open chrome://inspect in Chrome, find your app under Remote Target and click inspect. In VS Code, the \"Next.js: debug server-side\" configuration starts the dev server with --inspect. Node.js's debugging guide says the inspector listens on 127.0.0.1:9229 by default."
  - q: "How do I run a Next.js app in debug mode?"
    a: "Pass --inspect to the dev server: npm run dev -- --inspect, or pnpm dev --inspect with pnpm. To pause before your code starts, use --inspect-brk, which Next.js's guide says has to be set through NODE_OPTIONS: NODE_OPTIONS=--inspect-brk next dev. The same goes for --inspect-wait."
  - q: "Why are my Next.js breakpoints not working?"
    a: "A gray, hollow breakpoint in VS Code is unverified: VS Code says that happens when no source map exists or the map can't map between the source and the generated JavaScript. Hover it for the message, then run Debug: Diagnose Breakpoint Problems. Also check that you're debugging next dev, because Next.js disables browser source maps in production builds unless productionBrowserSourceMaps is on."
  - q: "How do I debug Next.js in the browser?"
    a: "Run next dev, open the app, open Chrome DevTools and go to the Sources tab. Code that reaches a debugger statement pauses there, or press Ctrl+P (⌘+P on a Mac) to find a file and set a breakpoint by hand. Your files appear under paths that start with webpack://_N_E/./."
sources:
  - title: "How to use debugging tools with Next.js (nextjs.org, v16.4.5, last updated August 25, 2026)"
    url: "https://nextjs.org/docs/app/guides/debugging"
    checked: 2026-11-03
  - title: "The Server and Client Boundary (nextjs.org)"
    url: "https://nextjs.org/docs/app/guides/server-and-client-boundary"
    checked: 2026-11-03
  - title: "Server and Client Components (nextjs.org)"
    url: "https://nextjs.org/docs/app/getting-started/server-and-client-components"
    checked: 2026-11-03
  - title: "Layouts and Pages (nextjs.org)"
    url: "https://nextjs.org/docs/app/getting-started/layouts-and-pages"
    checked: 2026-11-03
  - title: "logging (next.config.js, nextjs.org)"
    url: "https://nextjs.org/docs/app/api-reference/config/next-config-js/logging"
    checked: 2026-11-03
  - title: "productionBrowserSourceMaps (nextjs.org)"
    url: "https://nextjs.org/docs/app/api-reference/config/next-config-js/productionBrowserSourceMaps"
    checked: 2026-11-03
  - title: "reactStrictMode (nextjs.org)"
    url: "https://nextjs.org/docs/app/api-reference/config/next-config-js/reactStrictMode"
    checked: 2026-11-03
  - title: "Building your application: debug prerender errors (nextjs.org)"
    url: "https://nextjs.org/docs/app/guides/building"
    checked: 2026-11-03
  - title: "Debugging Node.js (nodejs.org)"
    url: "https://nodejs.org/learn/getting-started/debugging"
    checked: 2026-11-03
  - title: "Browser debugging in VS Code"
    url: "https://code.visualstudio.com/docs/nodejs/browser-debugging"
    checked: 2026-11-03
  - title: "Node.js debugging in VS Code: source maps and breakpoint tips"
    url: "https://code.visualstudio.com/docs/nodejs/nodejs-debugging"
    checked: 2026-11-03
  - title: "Using React in Visual Studio Code"
    url: "https://code.visualstudio.com/docs/nodejs/reactjs-tutorial"
    checked: 2026-11-03
  - title: "Debug your original code instead of deployed with source maps (Chrome DevTools)"
    url: "https://developer.chrome.com/docs/devtools/javascript/source-maps"
    checked: 2026-11-03
  - title: "StrictMode (react.dev)"
    url: "https://react.dev/reference/react/StrictMode"
    checked: 2026-11-03
related:
  - /blog/how-to-debug-react-app
  - /blog/react-debugging-tools
  - /
---

To debug a Next.js app, first work out where the code runs. Browser code is debugged in the browser, in the Sources tab of Chrome or Firefox DevTools or from a VS Code launch configuration. Server code needs the dev server started with `--inspect` and a debugger attached to it, from `chrome://inspect` or VS Code. Next.js's own debugging guide covers both and says frontend and backend code get full source maps. We follow that guide (v16.4.5 on the page we read, last updated August 25, 2026) and add what other Next.js pages say about logs and source maps.

## Where does your Next.js code run?

Next.js's Server and Client Boundary page answers this with a table: a Server Component runs on the server and not in the browser, and a Client Component runs in both. On a direct visit, a Client Component renders on the server and again in the browser during hydration. On a client-side navigation the server sends the RSC Payload, and the component renders in the browser without server-rendered HTML.

| Code | Where it runs | Debug it with |
|---|---|---|
| Server Component | Server only | `--inspect`, from Chrome or VS Code |
| Client Component, direct visit | Server, then the browser | `--inspect` for the server render, browser DevTools for the browser |
| Client Component, client-side navigation | Browser | Browser DevTools, or a VS Code `chrome` configuration |

So a bug in a Client Component can sit in either place. If it shows up only after a client-side navigation, start with the browser.

## Debug Next.js server-side code with --inspect

The guide says to pass `--inspect` to the dev server:

```bash
pnpm dev --inspect      # pnpm
npm run dev -- --inspect  # npm
yarn dev --inspect      # yarn
bun run dev --inspect   # bun
```

The flag's value goes to the underlying Node.js process, and the output starts with a line like this one from the guide:

```text
Debugger listening on ws://127.0.0.1:9229/0cf90313-350d-4466-a748-cd60f4e47c95
```

Node.js's debugging guide says `--inspect` listens on `127.0.0.1:9229` by default. To attach from Chrome, the Next.js guide has four steps:

1. Open a new tab and visit `chrome://inspect`.
2. Look for your Next.js application in the **Remote Target** section.
3. Click **inspect** to open a separate DevTools window.
4. Go to the **Sources** tab.

In Firefox, go to `about:debugging`, click **This Firefox**, find the app under **Remote Targets** and click **Inspect**.

To set a breakpoint, press `Ctrl+P` (`⌘+P` on a Mac) and search for the file. Server files have paths that start with `webpack://{application-name}/./`, where the name comes from your `package.json`.

### Pause before the app code runs

The guide says `--inspect-brk` and `--inspect-wait` have to be set through `NODE_OPTIONS`:

```bash
NODE_OPTIONS=--inspect-brk next dev
```

Node.js's flag table says `--inspect-brk` breaks before user code starts, and `--inspect-wait` waits for a debugger to be attached. Our advice: reach for one of them when the code you want to stop in runs once at start-up, which a debugger attached later would miss.

### Debugging a server in Docker

For a container, the guide suggests `--inspect=0.0.0.0`, which allows remote debugging access from outside localhost. Node.js's page spells out the cost: with the debugger bound to a public IP address or to `0.0.0.0`, any client that can reach it can connect without restriction and run arbitrary code. Put firewalls and access controls in front of it.

### Open the server inspector from the error overlay

On a server error, the error overlay shows a Node.js icon under the Next.js version indicator. Clicking it copies a DevTools URL to your clipboard; open that URL in a new tab to inspect the server process.

## Debug a Next.js app in the browser

Start the dev server as usual with `next dev` and open `http://localhost:3000`, or whatever URL you use. Open DevTools and go to the **Sources** tab in Chrome, or **Debugger** in Firefox.

When client code reaches a `debugger` statement, execution pauses and the file opens in the debug area. You can also press `Ctrl+P` (`⌘+P` on a Mac), find a file and click a line number to set a breakpoint. Your files have paths starting with `webpack://_N_E/./`.

For React itself, the guide points to the React Developer Tools browser extension, to inspect components, edit props and state and find performance problems. The guide on how to [debug a React app](/blog/how-to-debug-react-app) covers breakpoints, the Network panel and the extension, and the [React JS debugging tools](/blog/react-debugging-tools) comparison sets them next to the render tools.

## Debug Next.js in VS Code with launch.json

Create `.vscode/launch.json` at the project root with the guide's configurations:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev -- --inspect"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Next.js: debug client-side (Firefox)",
      "type": "firefox",
      "request": "launch",
      "url": "http://localhost:3000",
      "reAttach": true,
      "pathMappings": [
        {
          "url": "webpack://_N_E",
          "path": "${workspaceFolder}"
        }
      ]
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/next/dist/bin/next",
      "runtimeArgs": ["--inspect"],
      "skipFiles": ["<node_internals>/**"],
      "serverReadyAction": {
        "action": "debugWithEdge",
        "killOnServerStop": true,
        "pattern": "- Local:.+(https?://.+)",
        "uriFormat": "%s",
        "webRoot": "${workspaceFolder}"
      }
    }
  ]
}
```

Open the Debug panel (`Ctrl+Shift+D` on Windows and Linux, `⇧+⌘+D` on a Mac), select a configuration and press `F5`, or run **Debug: Start Debugging** from the Command Palette.

Pick the entry by where the code runs. "Next.js: debug server-side" starts the dev server with `--inspect` in a terminal. "Next.js: debug client-side" launches Chrome at the URL. "Next.js: debug full stack" runs Next.js under the debugger and opens a browser once the server is ready. The Firefox entry needs the Firefox Debugger extension for VS Code.

For a plain React app with a Vite dev server, which has no server code to attach to, see how to [debug React in VS Code](/blog/debug-react-vscode) with a browser launch configuration.

The guide lists the edits you may need:

- `npm run dev` can be `yarn dev` or `pnpm dev`.
- In the full stack entry, `debugWithEdge` launches Edge. For Chrome, change it to `debugWithChrome`.
- If your app starts on another port, replace `3000` in `http://localhost:3000`.
- If you run Next.js from a directory other than the root, as in a Turborepo, add `cwd` to the server-side and full stack entries, for example `"cwd": "${workspaceFolder}/apps/web"`.

In JetBrains WebStorm, the guide has you create a **JavaScript Debug** configuration with `http://localhost:3000` as the URL and run it. You then have two applications in debug mode: the Next.js Node application and the browser application.

## Where do console.log calls show up?

For a Client Component, the Server and Client Boundary page answers with an example. On a direct visit the log appears in the terminal and in the browser console, because the component renders in both places:

```tsx
'use client'

export default function Hello() {
  console.log('Hello rendered') // on a direct visit: server, then browser
  return <p>Hello</p>
}
```

After a client-side navigation, the page says, the component renders in the browser, so look for its log in the browser console. A Server Component doesn't run in the browser at all, so its logs won't be in the browser console. None of the Next.js pages we read says where a route handler's `console.log` goes. If you can't find the output, run with `--inspect` and read the value at a breakpoint in the handler.

The `logging` page in `next.config.js` covers what the terminal shows during development. Server Function calls are logged by default, with the function name, arguments and duration. `browserToTerminal` forwards browser console output to the terminal, which the page says is useful for debugging client-side code without checking the browser's developer tools:

```js
module.exports = {
  logging: {
    browserToTerminal: true,
  },
}
```

`true` forwards all console output, `'warn'` only warnings and errors (the page's table marks it as the default), `'error'` only errors, and `false` turns forwarding off. A `console.log('Hello World')` in a button's click handler in `app/page.tsx` then prints `[browser] Hello World (app/page.tsx:8:17)` in the terminal. The option was added in v16.2.0.

A log that appears twice is usually Strict Mode. Next.js's page says it has been `true` by default with the App Router since 13.5.1, and react.dev says it re-renders components and re-runs Effects an extra time in development. More on the extra render in [when React re-renders](/blog/when-does-react-re-render), and on the Effect in why [useEffect runs twice](/blog/useeffect-runs-twice).

## Why are my Next.js breakpoints not working in VS Code?

Each row comes from a Next.js, VS Code or Chrome page.

| What you see | What the docs say | Try |
|---|---|---|
| Gray, hollow breakpoint in VS Code | Unverified: no source map exists, or it can't map between the source and the generated JavaScript. The hover reads "Breakpoint ignored because generated code not found (source map problem?)" | Run **Debug: Diagnose Breakpoint Problems** while debugging. Check that `.js.map` files or inlined maps exist. Try a `debugger` statement |
| A Server Component breakpoint never hits in browser DevTools | A Server Component doesn't run in the browser | Attach with `--inspect`, or use the server-side entry |
| A breakpoint in start-up code doesn't hit | VS Code's React tutorial: that code ran before the debugger attached, so refresh the page | Refresh. For server start-up, `NODE_OPTIONS=--inspect-brk` |
| Works under `next dev`, not in a build | Browser source maps are off in production builds; server code is minified and its source maps omitted | Debug `next dev`. For prerender errors, `next build --debug-prerender` |
| App on another port, or in a monorepo subfolder | Replace `3000` in the `url`; add `cwd` to the server-side and full stack entries | Edit the entry |
| Chrome shows bundles, not your files | Make sure **JavaScript source maps** is checked under Settings > Preferences > Sources | Check it |

Two more details from VS Code's pages. Opening a folder with the wrong case, such as `code FOO` for a folder `foo/`, can stop source maps resolving. And `webRoot`, the root directory used for source map resolution in browser configurations, defaults to your workspace folder, so the guide's client-side entry gets that without setting it.

### Production builds

Next.js's `productionBrowserSourceMaps` page says browser source maps are disabled in production builds, to prevent leaking your source on the client, unless you set `productionBrowserSourceMaps: true`. That makes `next build` slower and use more memory. For server code, the building page offers `next build --debug-prerender`: it turns off server minification and turns on server source maps, for more detailed stack traces. Don't deploy builds made with it.

Decoding minified React errors and reporting what users hit are covered in [debugging a React app in production](/blog/how-to-debug-react-app).

## Log what a Client Component sees with debugsy

A breakpoint shows one moment. For "which value changed on which render", a log that stays in the page helps, and debugsy is one of several tools that keep one ([how they compare](/blog/react-debugging-tools)). It's an in-process [React debug panel](/) by n-uf: a React component, so it works only where React runs in the browser. It doesn't see Server Components, route handlers or Server Functions, it doesn't replace `--inspect`, and it doesn't stop a render or a loop. It only logs.

It isn't on npmjs yet: a public release there is in preparation. It needs React 19.

The panel needs the browser, so render it from a Client Component of your own; Next.js's docs suggest wrapping third-party components that rely on client-only features this way. The root layout stays a Server Component:

```tsx
// app/debugsy-panel.tsx
"use client";

import { DebugsyLook } from "@n-uf/debugsy";

export function DebugsyPanel() {
  return <DebugsyLook />;
}
```

```tsx
// app/layout.tsx
import type { ReactNode } from "react";
import { DebugsyPanel } from "./debugsy-panel";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.NODE_ENV !== "production" && <DebugsyPanel />}
      </body>
    </html>
  );
}
```

debugsy doesn't remove itself from production builds, hence the guard. The panel starts hidden: ⌘+D (Ctrl+D on Windows and Linux) opens it, a second press shows the full log, ⌘+K or Ctrl+K clears the log and Esc closes it.

Then log from the component you're chasing:

```tsx
"use client";

import { useEffect } from "react";
import { dsy, registerModule, useWhyDidYouUpdate } from "@n-uf/debugsy";

registerModule("cart", {
  label: "Cart",
  emoji: "🛒",
  description: "Cart state and totals",
  points: {
    totals: { emoji: "🧮", label: "Totals", description: "Totals recomputed" },
  },
});

export function CartSummary({ items, coupon }: { items: string[]; coupon: string | null }) {
  useWhyDidYouUpdate("CartSummary", { items, coupon });

  useEffect(() => {
    dsy.log("totals", "items changed", { count: items.length });
  }, [items]);

  return <p>{items.length} items</p>;
}
```

A call to a debug point that isn't switched on is dropped. Switch `totals` on with the panel's toggles, `window.debugsy.enable("totals")` in the browser console or `?debug=totals` in the URL. `useWhyDidYouUpdate` needs the `dependencies` point: the panel's Deps toggle, or `window.debugsy.enable("dependencies")`. It compares each key you pass with the previous render by reference and logs the ones that changed; the page on [finding what causes a re-render](/use-cases/why-did-this-component-render) explains the log lines.

The log call sits in an effect on purpose. debugsy reads the URL parameter and `localStorage` only where `window` exists, so on the server every point is off, and a `dsy.log` in the component body would be dropped during the server render. If the effect fires more often than you expect, see how to check [which dependency changed](/use-cases/useeffect-which-dependency-changed).

debugsy makes no network requests and keeps its settings in `localStorage`. It sees only the components where you call its hooks, and only the values you pass in. For plain logging in the browser, here's [how logging libraries for React compare](/blog/react-logging-library).

debugsy is independent and not affiliated with Vercel, the Next.js project, Microsoft, Google, Mozilla, JetBrains, the Node.js project or Meta.
