---
title: "React JS debugging tools, by the job you need done"
description: "React JS debugging tools sorted by job: components, renders, profiling, breakpoints, network, Next.js and logs, with where each one runs."
h1: "React JS debugging tools, sorted by what you need to see"
mainKeyword: "react js debugging tools"
kind: best-tools
published: 2026-11-12
updated: 2026-11-12
draft: true
author: n-uf
takeaways:
  - "No one tool covers every debugging job in a React app: React Developer Tools shows components, props and state, Chrome DevTools or VS Code handle breakpoints, and render tools like React Scan report re-renders."
  - "React Developer Tools runs as a browser extension for Chrome, Firefox and Edge, as a standalone app for Safari and other browsers, and as the built-in React Native DevTools in React Native."
  - "React Scan, why-did-you-render, React Render Tracker and debugsy all report re-renders, but they hook in differently: a script or extension, a patch of React, a script plus a UI, or a hook you call per component."
  - "Next.js documents debugging server and client code with VS Code, Chrome DevTools or Firefox DevTools, using a launch.json file or the --inspect flag."
  - "debugsy is one entry among these. It's a panel inside your app for React 19, it sees only the components where you call its hooks, and it doesn't replace React DevTools."
faq:
  - q: "What is the best tool to debug React?"
    a: "There isn't one; it depends on the job. React's own page calls the React Developer Tools browser extension the easiest way to debug websites built with React, and it covers components, props and state. To step through code you set breakpoints in Chrome DevTools or VS Code, and for re-renders you add a render tool."
  - q: "Is there a React DevTools alternative?"
    a: "Not for the component tree, going by the pages we read. React Developer Tools comes in three forms (browser extension, standalone app, React Native DevTools), and the other forms are the answer when the extension isn't available. For render information, React Scan, why-did-you-render, React Render Tracker and debugsy each add something, though React Render Tracker calls itself a complement to React DevTools and debugsy doesn't replace it either."
  - q: "What is React Scan?"
    a: "React Scan is a tool that, its README says, automatically detects performance issues in a React app and highlights the components to optimize. You add it with a script tag, with the react-scan package (npx -y react-scan@latest init sets it up), or with a browser extension. It's MIT licensed, and its README now opens with a note recommending React Doctor, a separate tool."
  - q: "How do I debug a Next.js app?"
    a: "Follow the Next.js debugging guide, which covers three routes: VS Code with a .vscode/launch.json file, Chrome or Firefox DevTools for client code, and the --inspect flag on the dev server for server code. It says both frontend and backend code get full source maps. For React-specific inspection it points to the React Developer Tools extension."
  - q: "Does React DevTools work in production builds?"
    a: "The extension still shows its tabs there, going by its own popup in React's repository: on a page using the production build of React, it says the Components and Profiler tabs will appear. React's DevTools page on react.dev doesn't cover production builds. React Render Tracker's README says, for its own tool, that a production build captures less data."
sources:
  - title: "React Developer Tools (react.dev)"
    url: "https://react.dev/learn/react-developer-tools"
    checked: 2026-11-03
  - title: "react-devtools README (React repository on GitHub)"
    url: "https://github.com/facebook/react/tree/main/packages/react-devtools"
    checked: 2026-11-03
  - title: "React DevTools extension popup for production builds (React repository)"
    url: "https://github.com/facebook/react/blob/main/packages/react-devtools-extensions/popups/production.html"
    checked: 2026-11-03
  - title: "React DevTools source: GeneralSettings.js (setting label)"
    url: "https://github.com/facebook/react/blob/main/packages/react-devtools-shared/src/devtools/views/Settings/GeneralSettings.js"
    checked: 2026-11-03
  - title: "React DevTools source: ProfilerSettings.js (setting label)"
    url: "https://github.com/facebook/react/blob/main/packages/react-devtools-shared/src/devtools/views/Settings/ProfilerSettings.js"
    checked: 2026-11-03
  - title: "React DevTools source: WhatChanged.js (\"Why did this render?\")"
    url: "https://github.com/facebook/react/blob/main/packages/react-devtools-shared/src/devtools/views/Profiler/WhatChanged.js"
    checked: 2026-11-03
  - title: "Chrome DevTools overview (Chrome for Developers)"
    url: "https://developer.chrome.com/docs/devtools/overview"
    checked: 2026-11-03
  - title: "Debug JavaScript (Chrome for Developers)"
    url: "https://developer.chrome.com/docs/devtools/javascript"
    checked: 2026-11-03
  - title: "Inspect network activity (Chrome for Developers)"
    url: "https://developer.chrome.com/docs/devtools/network"
    checked: 2026-11-03
  - title: "React Scan README (GitHub)"
    url: "https://github.com/aidenybai/react-scan"
    checked: 2026-11-03
  - title: "why-did-you-render README (GitHub)"
    url: "https://github.com/welldone-software/why-did-you-render"
    checked: 2026-11-03
  - title: "React Render Tracker README (GitHub)"
    url: "https://github.com/lahmatiy/react-render-tracker"
    checked: 2026-11-03
  - title: "Browser debugging in VS Code"
    url: "https://code.visualstudio.com/docs/nodejs/browser-debugging"
    checked: 2026-11-03
  - title: "Using React in Visual Studio Code"
    url: "https://code.visualstudio.com/docs/nodejs/reactjs-tutorial"
    checked: 2026-11-03
  - title: "How to use debugging tools with Next.js (nextjs.org)"
    url: "https://nextjs.org/docs/app/guides/debugging"
    checked: 2026-11-03
  - title: "Reactotron README (GitHub)"
    url: "https://github.com/infinitered/reactotron"
    checked: 2026-11-03
  - title: "Reactotron quick start for React JS (Infinite Red docs)"
    url: "https://docs.infinite.red/reactotron/quick-start/react-js/"
    checked: 2026-11-03
  - title: "react-devtools on npm (registry data: licence)"
    url: "https://registry.npmjs.org/react-devtools/latest"
    checked: 2026-11-03
  - title: "react-scan on npm (registry data: licence, React peer range)"
    url: "https://registry.npmjs.org/react-scan/latest"
    checked: 2026-11-03
  - title: "@welldone-software/why-did-you-render on npm (registry data: licence, React peer range)"
    url: "https://registry.npmjs.org/@welldone-software/why-did-you-render/latest"
    checked: 2026-11-03
  - title: "react-render-tracker on npm (registry data: licence)"
    url: "https://registry.npmjs.org/react-render-tracker/latest"
    checked: 2026-11-03
  - title: "reactotron-react-js on npm (registry data: licence)"
    url: "https://registry.npmjs.org/reactotron-react-js/latest"
    checked: 2026-11-03
related:
  - /blog/why-did-you-render-alternative
  - /use-cases/react-render-count
  - /
---

Most React JS debugging tools do one job, so pick them by the job in front of you. React Developer Tools shows the component tree with props and state. Chrome DevTools, or the debugger built into VS Code, sets breakpoints and shows network requests. React Scan, why-did-you-render, React Render Tracker and debugsy each report re-renders, in different ways. Reactotron is a desktop app for state and API calls, and Next.js has a debugging guide for its server and client code. Below: what each one is, where it runs and what it asks of you.

This isn't a ranking. What we say about another tool comes from its own README or docs page, read on 2026-11-03; where a page is silent, so are we. debugsy is made by n-uf, who publish this site. It gets one section here, and that section says what it doesn't do.

## The React debug tools at a glance

| Tool | Job | Where it runs | Setup | Licence or cost, as its pages say |
|---|---|---|---|---|
| Chrome DevTools | Breakpoints, console, network, performance | Built into Chrome | Open it | Not stated |
| React Developer Tools | Components, props, state, profiling | Browser extension, standalone app, React Native DevTools | Install the extension, or `react-devtools` | MIT (npm) |
| React Scan | Highlights renders and slow components | In the page: script tag, package or browser extension | `npx -y react-scan@latest init` | MIT |
| why-did-you-render | Logs potentially avoidable re-renders | In your app, patches React | Dev dependency, Babel `importSource`, `wdyr.js` | MIT |
| React Render Tracker | Component tree over time, update events | In the page, a browser devtools tab or another tab | One `<script>` tag | MIT |
| VS Code debugger | Breakpoints and stepping in the editor | Editor | `launch.json` | Not stated |
| Next.js debugging | Server and client code of a Next.js app | VS Code, Chrome or Firefox DevTools | `launch.json` or `--inspect` | Not stated |
| Reactotron | State, API requests, logs, benchmarks | Desktop app plus a dev dependency | Download the app, `reactotron-react-js` | Open source and free to use (README) |
| debugsy | Render and dependency logs, debug messages | Panel inside your app | Install (npmjs release in preparation), mount, hooks | PolyForm Perimeter 1.0.1; no price published |

"Not stated" means the pages we read don't say. "MIT (npm)" comes from the package's npm registry data; the other licences are in the README.

## React debug tools in Chrome

Chrome's overview calls Chrome DevTools a set of web developer tools built directly into the browser. Each panel has a job: Elements for the DOM and CSS, Console for messages and running JavaScript, Sources for debugging JavaScript, Network for network activity, Performance for load and runtime performance, Memory for memory problems.

None of them knows about React components. That's what the React Developer Tools extension adds: on a site built with React, react.dev says, you get Components and Profiler panels. The extension is available for Chrome, Firefox and Edge.

## Inspect components, props and state

This is React Developer Tools' job. react.dev says to use it to inspect components, edit props and state, and identify performance problems, and calls the browser extension the easiest way to debug websites built with React.

For Safari and other browsers, react.dev has you install the `react-devtools` package, run `react-devtools` in a terminal and add `<script src="http://localhost:8097"></script>` at the start of your page's `<head>`. The package's README says to remove that line before you deploy to production. In React Native, react.dev points to React Native DevTools, the built-in debugger that integrates React Developer Tools.

{{live:/blog/how-to-use-react-devtools}}For a walk through the Components tab, the Profiler and the settings worth turning on, see the guide on [how to use React DevTools](/blog/how-to-use-react-devtools).{{/live}}

## See which components render, and why

React Developer Tools can show this without touching your code. Its General settings have "Highlight updates when components render", and its Profiler settings have "Record why each component rendered while profiling". Tick the second, record a session, select a component, and the "Why did this render?" section lists what changed, such as "The parent component rendered." (labels checked in the DevTools source on GitHub). You only get that for the sessions you record.

React Scan's README says it automatically detects performance issues in a React app, needs no code changes, and highlights the components you need to optimize, with a toolbar on the page. Setup is `npx -y react-scan@latest init`, or `npm install -D react-scan` plus a script tag. The README has examples for Next.js (App Router and Pages Router), Vite and Remix, and a guide to the browser extension. Its `dangerouslyForceRunInProduction` option defaults to `false` and is marked "not recommended". The README now opens with a note: you can still use React Scan, but the authors recommend React Doctor, which it describes as bringing React Scan's performance focus to coding agents.

why-did-you-render patches React to notify you about potentially avoidable re-renders. Its README says the latest version was tested with React 19 only (older readmes cover React 18 and 16–17), and that it should never be used in production, because it slows React down and patches it. Setup in Next.js and Vite, and the other options, are in the guide to a [why did you render alternative](/blog/why-did-you-render-alternative).

React Render Tracker shows the component tree over time and an event log for a selected component. Its README says it's not a replacement for React DevTools but a complement, and that it supports React 16.9+, fully only with a development build. You add one `<script>` before your app; `data-config="inpage:true"` opens its UI in the page.

debugsy works the other way round from a patch: you call a hook in the component you care about. More in its section below.

Sometimes you just want a number. A [React render count](/use-cases/react-render-count) is quicker to get than a cause. When you want the cause, the walkthrough on how to [find what causes a re-render in React](/use-cases/why-did-this-component-render) compares three ways.

## Profile what's slow

React Developer Tools has a Profiler panel. Chrome's Performance panel is for finding ways to improve load and runtime performance. The first looks at React's rendering, the second at the whole page.

Measure before you change code. The why-did-you-render README itself says not all re-renders are bad, that cutting them can have a negligible effect, and that you should measure with the React DevTools Profiler. debugsy has no flame charts and isn't a profiler.

## Step through code

For a logic bug, set a breakpoint. Chrome's debugging tutorial says breakpoints can find bugs faster than `console.log`: a breakpoint pauses your code in the middle of its execution and shows the values of all variables at that moment, where `console.log` shows only the ones you thought to print. Open the Sources panel to set one. A `debugger` statement in client code pauses it too, as the Next.js guide notes.

You can do the same from the editor. VS Code's page says it includes a built-in debugger for Edge and Chrome. Create `.vscode/launch.json` and press F5:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "msedge",
      "request": "launch",
      "name": "Launch Edge against localhost",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

Put your dev server's port in `url`, and replace `msedge` with `chrome` to debug in Chrome. VS Code's React tutorial then has you click the gutter to set a breakpoint, step with F10, and inspect variables and the call stack.

A breakpoint shows one moment. "This renders more than I expect" needs something that records over time.

{{live:/blog/how-to-debug-react-app}}[A walkthrough of debugging a React app](/blog/how-to-debug-react-app) shows where breakpoints fit alongside reading the error, React DevTools, logging and production builds.{{/live}}

## Watch network requests and app state

Chrome's Network panel is for checking that resources download or upload as expected, and for inspecting one request's headers, content and size.

Reactotron is a different shape: a desktop app (macOS, Linux and Windows builds on its releases page) that your app connects to. Its README lists viewing application state, showing API requests and responses, quick performance benchmarks and messages similar to `console.log`. It says you plug it in as a dev dependency, so it adds nothing to your production builds. For React on the web, the quick start installs `reactotron-react-js` and calls `Reactotron.configure().connect()`. The same page admits that on its own this is a complicated version of `console.log`, and that Reactotron shines once you plug in Redux, global error tracking and network watching. Neither page says which React versions it supports.

## Log what happened

Chrome's Console panel shows messages and runs JavaScript. Reactotron has `Reactotron.log`. {{live:/blog/react-logging-library}}To pick a logger for the browser, our [React logging library](/blog/react-logging-library) comparison covers `debug`, `loglevel`, `pino`, `consola` and debugsy.{{/live}} debugsy has named debug points, next.

## Where debugsy fits, and what it doesn't do

debugsy is an in-process [React debug panel](/) by n-uf: a component you mount in your own app that shows one ordered log of structured debug messages, render counts and dependency changes. The source is on [GitHub](https://github.com/n-uf/debugsy).

```tsx
import { DebugsyLook, dsy, registerModule, useWhyDidYouUpdate } from "@n-uf/debugsy";

// once, near the app root: <DebugsyLook />

registerModule("auth", {
  label: "Auth",
  emoji: "🔐",
  description: "Sign-in and session",
  points: {
    session: { emoji: "🔑", label: "Session", description: "Session lifecycle" },
  },
});

dsy.warn("session", "expired", { ttl: 3600 });

function CheckoutForm({ values, errors, onSubmit }: Props) {
  useWhyDidYouUpdate("CheckoutForm", { values, errors, onSubmit });
  // ...
}
```

A debug point is a named log channel with a bare key like `session`; the module only groups points in the panel. Use `dsy` anywhere, `useDebugsy()` inside components and `window.debugsy` in the browser console. The levels are `.log`, `.warn`, `.error` and `.critical`, plus `.time` and `.timeEnd`. A message sent to a point that's switched off is dropped, so switch points on in the panel or with `window.debugsy.enable(...)`.

`useWhyDidYouUpdate` compares each key of the object you pass with the previous render, by reference, and logs the keys that changed. `useRenderTracker` counts renders (more on [counting renders in React](/use-cases/react-render-count)) and warns when the count reaches a threshold; with the options form, version 26.11 needs `trackRenders: true`. Neither does anything until the `dependencies` debug point is on: the Deps toggle in the panel. The panel starts hidden. ⌘+D opens it, ⌘+K clears the log, Esc closes it. If a component loops until React throws, the guide to [this React error](/blog/maximum-update-depth-exceeded) shows how the two hooks help find it.

What it doesn't do:

- It isn't a browser extension, a profiler with flame charts, or a replacement for React DevTools.
- It sees only the components where you call its hooks, and only the values you pass in. It doesn't patch React, read React's internals or trace context changes on its own.
- It doesn't stop a render loop. `useRenderTracker` warns and calls your callback.
- It needs React 19. No React Native, no React 18.
- It doesn't remove itself from production builds. Guard the import or the mount yourself, for example behind `process.env.NODE_ENV !== "production"`.
- It makes no network requests and sends no telemetry. Settings live in `localStorage`. It isn't a remote logger.

It isn't on npmjs yet: a public release there is in preparation. It needs React 19. The licence is PolyForm Perimeter 1.0.1: the source is public and any use is allowed except providing others a product that competes with debugsy. It isn't MIT, and no price is published. The mount steps are on the [home page](/).

## Next.js debugging tools

Next.js has its own debugging guide (v16.4.5 on the page we read, last updated August 25, 2026). It says you can debug frontend and backend code with full source maps using the VS Code debugger, Chrome DevTools or Firefox DevTools, and that any debugger that can attach to Node.js works too.

For VS Code, the guide gives a `.vscode/launch.json` with configurations named "Next.js: debug server-side" (it runs `npm run dev -- --inspect`), "Next.js: debug client-side" and "Next.js: debug full stack". For client code in Chrome, open the Sources tab; when you search, your files have paths starting with `webpack://_N_E/./`. For server code, start the dev server with `--inspect`, open `chrome://inspect` and pick your app under Remote Target. On a server error, the error overlay shows a Node.js icon; clicking it copies a DevTools URL you can open to inspect the server.

For React-specific inspection, the guide points to the React Developer Tools extension. The render tools above work in a Next.js app too: React Scan's README has App Router and Pages Router examples, and debugsy renders from a Client Component. {{live:/blog/debug-next-js-app}}Our walkthrough on how to [debug a Next.js app](/blog/debug-next-js-app) covers the server, browser and VS Code routes from that guide, and where logs show up.{{/live}}

## React DevTools alternatives

If "alternative" means another way to see the component tree, the pages we read name one tool in three forms: the browser extension, the standalone `react-devtools` app for Safari and other browsers, and React Native DevTools. That's the answer when the extension isn't available to you. It isn't a different product.

If it means other ways to see why something rendered, React Scan, why-did-you-render, React Render Tracker and debugsy all add render information beyond DevTools' update highlighting and recorded Profiler sessions. React Render Tracker calls itself a complement to React DevTools, and debugsy doesn't replace it either: it has no component tree. Reactotron is a second tool for state and network more than for components. The [why-did-you-render alternatives](/blog/why-did-you-render-alternative) guide compares the render tools in detail.

## Which React JS debugging tools to start with

Match the symptom to the tool:

- A component shows the wrong props or state: React Developer Tools, Components panel.
- A function returns the wrong value, or you need to step through it: breakpoints in Chrome's Sources panel or VS Code.
- A request fails or sends the wrong body: Chrome's Network panel, or Reactotron if you want API calls and state in a desktop app.
- The page feels slow and you don't know where: the Profiler for React work, the Performance panel for the whole page.
- Something re-renders and you don't know which component: React DevTools with "Record why each component rendered" first. Then React Scan or React Render Tracker to see it highlighted or tracked over time, why-did-you-render for console notices, or debugsy for a log in the page. The how-to on [why a component re-rendered](/use-cases/why-did-this-component-render) goes through the causes and fixes.
- The page freezes, or React reports "Maximum update depth exceeded": read the [fix for that error](/blog/maximum-update-depth-exceeded), then log which value changes on every render.
- A Next.js error appears on the server: `--inspect`, or the full stack launch configuration from the Next.js guide.

Whatever you pick, watch what reaches production. The why-did-you-render README says never to use it there. React Scan's README marks forcing it to run in production as not recommended, and React Render Tracker's says a production build captures less data. debugsy doesn't remove itself either, so guard it.

debugsy is independent. It isn't affiliated with Meta, the React team, Google, Microsoft, Vercel or the authors of React Scan, why-did-you-render, React Render Tracker or Reactotron.
