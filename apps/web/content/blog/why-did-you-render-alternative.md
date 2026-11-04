---
title: "Why did you render alternative: 5 options compared"
description: "A why did you render alternative for React 19, Next.js or Vite: the DevTools Profiler, React Scan, React Render Tracker, a small hook or debugsy."
h1: "Choosing a why did you render alternative for React"
mainKeyword: "why did you render alternative"
kind: comparison
published: 2026-11-12
updated: 2026-11-12
author: n-uf
takeaways:
  - "why-did-you-render works by patching React. Its README says the latest version was tested with React 19 only, points React 18 to the v8 readme and React 16 and 17 to v7, and says never to use it in production."
  - "The README's setup is a Babel change. In Vite you set @vitejs/plugin-react's jsxImportSource to the library, and in Next.js you set jsxImportSource in tsconfig.json. We tried both in dev servers with React 19.3.1, and it logged."
  - "React DevTools, React Scan and React Render Tracker need no code in each component. debugsy's useWhyDidYouUpdate is a hook you call in each component you want to watch, and it patches nothing."
  - "why-did-you-render is still the better pick when you want every memo component watched automatically, want its \"equal by value\" verdict, or work in React Native."
faq:
  - q: "Does why-did-you-render work with React 19?"
    a: "Yes. Its README says the latest version was tested with React 19 only, and the package on npm lists a react ^19 peer dependency. For React 18 the README points to its v8 readme, and for React 16 and 17 to v7. It also says the library wasn't tested with the React Compiler and that its author believes the two are incompatible."
  - q: "Does why-did-you-render work with Next.js?"
    a: "It can. The README gives only Babel settings, and its link to a Next.js example returns a 404 today. Next.js's docs say Next.js detects jsxImportSource in tsconfig.json, and on 2026-11-03 we ran the library that way in a Next.js 16.4.5 dev app (App Router, a client component importing a wdyr file first): it logged re-renders. A Babel config also works, but Next.js's docs say it makes the app opt out of the Next.js Compiler."
  - q: "Does why-did-you-render work with Vite?"
    a: "Its README has no Vite section. The @vitejs/plugin-react README documents a jsxImportSource option, and with it set to the library's package name we got why-did-you-render logs in a Vite 8.3.5 dev app with React 19.3.1 on 2026-11-03. Load the library only in development, as the Vite example in this article does, or its code ends up in your production bundle."
  - q: "Is there a why-did-you-render for hooks?"
    a: "why-did-you-render tracks hooks itself: its README lists trackHooks (on by default) and trackExtraHooks for custom hooks such as react-redux's useSelector. If you'd rather call a hook yourself, a hand-written one or debugsy's useWhyDidYouUpdate logs which of the values you pass in changed between renders."
  - q: "What's the difference between why-did-you-render and React DevTools?"
    a: "why-did-you-render is a library that patches React inside your app and logs to the console, by default only for re-renders where props or state were equal by value. React DevTools is a browser extension (or a standalone app) whose Profiler can record why each component rendered, for a session you record. DevTools needs no code change; why-did-you-render needs a build setting and an import."
sources:
  - title: "why-did-you-render README (GitHub)"
    url: "https://github.com/welldone-software/why-did-you-render"
    checked: 2026-11-03
  - title: "why-did-you-render on the npm registry (version, peer dependency)"
    url: "https://registry.npmjs.org/@welldone-software/why-did-you-render"
    checked: 2026-11-03
  - title: "why-did-you-render 10.0.1 package files: jsx-runtime.js and jsx-dev-runtime.js"
    url: "https://unpkg.com/@welldone-software/why-did-you-render@10.0.1/jsx-runtime.js"
    checked: 2026-11-03
  - title: "@vitejs/plugin-react README (jsxImportSource)"
    url: "https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md"
    checked: 2026-11-03
  - title: "Next.js Compiler (nextjs.org)"
    url: "https://nextjs.org/docs/architecture/nextjs-compiler"
    checked: 2026-11-03
  - title: "How to configure Babel in Next.js (nextjs.org)"
    url: "https://nextjs.org/docs/pages/guides/babel"
    checked: 2026-11-03
  - title: "React Developer Tools (react.dev)"
    url: "https://react.dev/learn/react-developer-tools"
    checked: 2026-11-03
  - title: "React DevTools source: ProfilerSettings.js (setting label)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Settings/ProfilerSettings.js"
    checked: 2026-11-03
  - title: "React DevTools source: GeneralSettings.js (setting label)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Settings/GeneralSettings.js"
    checked: 2026-11-03
  - title: "React DevTools source: WhatChanged.js (\"Why did this render?\" messages)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Profiler/WhatChanged.js"
    checked: 2026-11-03
  - title: "React Scan README (GitHub)"
    url: "https://github.com/aidenybai/react-scan"
    checked: 2026-11-03
  - title: "react-scan on the npm registry (version, peer dependencies)"
    url: "https://registry.npmjs.org/react-scan"
    checked: 2026-11-03
  - title: "React Render Tracker README (GitHub)"
    url: "https://github.com/lahmatiy/react-render-tracker"
    checked: 2026-11-03
  - title: "react-render-tracker on the npm registry (version, last modified)"
    url: "https://registry.npmjs.org/react-render-tracker"
    checked: 2026-11-03
related:
  - /use-cases/why-did-this-component-render
  - /blog/react-debugging-tools
  - /
---

The right why did you render alternative depends on what's missing for you. If why-did-you-render (WDYR) already works on your React 19 app, keep it. If the Babel setup, the React version or the patching of React is the problem, there are five other ways to see why a component rendered: the React DevTools Profiler (no code change), React Scan (highlights renders across the page), React Render Tracker (a component tree and event log over time), a hook you write yourself, or debugsy's `useWhyDidYouUpdate`, a hook you call in the components you care about. What follows about the other tools comes from their own READMEs and docs, fetched on 2026-11-03.

debugsy is independent. It isn't affiliated with Welldone Software (the authors of why-did-you-render), Meta, the React team, or the authors of React Scan or React Render Tracker.

## What why-did-you-render does

WDYR is a library by Welldone Software that, in its README's words, monkey patches React to notify you about potentially avoidable re-renders. It logs to the console. By default it reports a re-render only when the props or state changed to values that are equal by value, such as a new `style={{ width: '100%' }}` object with the same contents. The `logOnDifferentValues` option reports every re-render.

It watches the components you mark with `Component.whyDidYouRender = true`, or every `memo` and pure component with `trackAllPureComponents: true`. Hooks are tracked by default (`trackHooks`), custom ones too if you name them in `trackExtraHooks`, and `logOwnerReasons` (on by default) shows why the owner component re-rendered.

Three more lines in the README matter when you're choosing. The latest version was tested with React 19 only; React 18 has its own v8 readme, and React 16 and 17 a v7 readme. Setup is a Babel change (the automatic runtime, `importSource` set to the library, `development` mode) plus a `wdyr.js` file imported before everything else. And it should never be used in production, because it slows React down and patches it.

The README also warns that not every re-render is bad, and points to the React DevTools Profiler for measuring a fix. If you're not sure what makes a component render in the first place, [when does React re-render](/blog/when-does-react-re-render) lists the triggers.

## Why people look for a why did you render alternative

You're on a React version the current release doesn't cover. Your build doesn't run Babel: Next.js compiles with SWC unless you add a Babel config, and Vite has its own React plugin. You use the React Compiler, which the README says the library wasn't tested with at all (its author believes they're completely incompatible). Or you'd rather see the answer in the page than in a console group.

## Setting up why-did-you-render in Next.js and Vite

The README links a Next.js example, but the link returns a 404 on GitHub today, and there's no Vite section. Both tools let you set the JSX import source, which is what the README's Babel `importSource` setting does. On 2026-11-03 we tried that in two scratch apps.

In Vite, [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) has a `jsxImportSource` option. We used Vite 8.3.5, plugin-react 6.2.1, React 19.3.1 and WDYR 10.0.1:

```js
// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react({ jsxImportSource: "@welldone-software/why-did-you-render" })],
});
```

```js
// src/wdyr.js
import React from "react";

if (import.meta.env.DEV) {
  const { default: whyDidYouRender } = await import(
    "@welldone-software/why-did-you-render"
  );
  whyDidYouRender(React, { trackAllPureComponents: true });
}
```

Then make `import "./wdyr";` the first line of `src/main.jsx`. The README's own `wdyr.js` uses `require`, which a Vite module doesn't have.

The dynamic import matters. With a plain `import whyDidYouRender from "..."` at the top of `wdyr.js`, the library stays in the production bundle even behind the `DEV` check. We ran `vite build` on the test app (two components, a `memo` child and a button) with both versions of the file: the single minified JavaScript file came out at 315.6 kB with the top-level import and 220.3 kB with the dynamic one, not gzipped. Without WDYR at all it was 219.7 kB. Both builds kept `jsxImportSource` set and built fine. In the 10.0.1 package, `jsx-runtime.js` only re-exports React's own runtime, and `jsx-dev-runtime.js` is the file that wraps elements, so the setting changes nothing in a production build.

In Next.js, [the Next.js Compiler page](https://nextjs.org/docs/architecture/nextjs-compiler) says Next.js detects `jsxImportSource` in `jsconfig.json` or `tsconfig.json` and applies it. The other route is a Babel config. [The Babel page](https://nextjs.org/docs/pages/guides/babel) treats that file as the source of truth, so it must include the `next/babel` preset too, and the compiler page says an existing Babel config makes the app opt out of the Next.js Compiler. We took the tsconfig route in a Next.js 16.4.5 dev app with the App Router:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@welldone-software/why-did-you-render"
  }
}
```

```ts
// app/wdyr.ts
/// <reference types="@welldone-software/why-did-you-render" />
import React from "react";

if (process.env.NODE_ENV === "development") {
  const whyDidYouRender = require("@welldone-software/why-did-you-render");
  whyDidYouRender(React, { trackAllPureComponents: true });
}
```

A client component (`"use client"`) starting with `import "./wdyr";` was enough. With a `memo` child that got `style={{ color: "red" }}`, the console printed the library's "different objects that are equal by value" message on every click. We only ran the dev server there, not a production build.

## React DevTools Profiler

[React's DevTools page](https://react.dev/learn/react-developer-tools) links the browser extension for Chrome, Firefox and Edge, and the standalone `react-devtools` package for other browsers such as Safari. You get Components and Profiler panels, and your code doesn't change.

For the reason behind a render, tick "Record why each component rendered while profiling" in the Profiler settings (the label is from the DevTools source), record a session and select a component. Its "Why did this render?" section lists the props, state, hooks or context that changed, or says the parent component rendered. The General setting "Highlight updates when components render" shows renders as they happen.

It covers only the session you record, it names the prop but not the line that created the new value, and react.dev's page doesn't say which React versions it supports. Pick it over WDYR when you can't change the build or add an import, or for a one-off look at one interaction. It's one of several [tools for debugging React](/blog/react-debugging-tools), each for a different job.

## React Scan

[React Scan's README](https://github.com/aidenybai/react-scan) says it detects performance issues, needs no code changes, highlights the components to optimize, and keeps a toolbar on the page. `npx -y react-scan@latest init` detects your framework and sets it up, or you add a script tag to `index.html` (Vite) or `app/layout.tsx` (Next.js). Its `log` option, off by default, logs renders to the console, and `dangerouslyForceRunInProduction` is marked "not recommended". On npm, its peer dependencies cover React 16.8 to 19.

Use it when you want to see which components render across the whole page without touching each one. The README talks about flagging renders that cause performance issues; it doesn't say it reports which prop changed. It also opens with a note recommending React Doctor, a separate tool for coding agents that this article doesn't cover.

## React Render Tracker

[React Render Tracker](https://github.com/lahmatiy/react-render-tracker) (RRT) shows the component tree over time, including unmounted components and update counts, and an event log for a selected component with the changes in context, state and props. It also has a props update matrix and shows `useMemo` and `useCallback` recomputations. Its README calls it a complement to React DevTools, not a replacement.

You add one `<script>` before your app. The UI opens in the page (`data-config="inpage:true"`), in the browser's devtools through the Rempl extension, or in another tab or device through `rempl-cli`. The README says it supports React 16.9+, fully in a development build, and that more than one React instance on a page isn't supported yet. It doesn't name React 19, and the npm registry shows 0.7.8 as the latest version, last modified 2025-03-31, so try it on your version first.

It suits a question about a sequence ("what happened after I clicked?") more than one about a single component. If all you need is a number for one component, see how to [count renders in React](/use-cases/react-render-count).

## A hook you write yourself

A reference-only version of the idea fits in a short hook: keep the previous values in a ref and, after each render, log the keys that differ under `Object.is`. The [guide to what causes a component to re-render](/use-cases/why-did-this-component-render) has one to copy. No install, no build change, and you delete it when you're done. You do add it to each component by hand, and it can't tell a new object with equal contents from a real change.

## debugsy's useWhyDidYouUpdate

The name borrows the idea, but `useWhyDidYouUpdate` is a hook you call inside a component, not a patch of React. debugsy is an in-process [React debug panel](/): a component you mount in your own app that shows one ordered log of debug messages, render counts and dependency changes.

```tsx
import { DebugsyLook, useWhyDidYouUpdate } from "@n-uf/debugsy";

// once, near the app root: <DebugsyLook />

function CheckoutForm({ values, errors, onSubmit }: Props) {
  useWhyDidYouUpdate("CheckoutForm", { values, errors, onSubmit });
  // ...
}
```

After each render it compares every key of the object you pass with the previous render, by reference (`!==`), and logs the keys that changed:

```text
🔄 [CheckoutForm] Dependencies changed:
📝 [CheckoutForm] onSubmit: function changed (#3) (function → function)
📦 [CheckoutForm] errors: object changed (#2)
```

A key that keeps changing gets a `⚠️ FREQUENT` mark once start-up is over. Nothing runs until you switch on the Deps toggle in the panel (⌘+D opens it) or run `window.debugsy.enable("dependencies")` in the console. `useRenderTracker` adds render counts, as the [render count guide](/use-cases/react-render-count) shows.

It sees only the components where you call the hook, and only the values you pass in. Because it compares by reference, it can't tell you a new object had equal contents. It doesn't read React's internals, so a context shows up only if you pass its value in. It needs React 19 (the package's peer range starts at 19.2.0), and the sources say nothing about the React Compiler, so test that if you use it. It isn't removed from production builds: guard the import or the mount yourself.

It isn't on npmjs yet: a public release there is in preparation.

## The options side by side

| | How it hooks in | Setup | What it reports | React versions | In production |
|---|---|---|---|---|---|
| why-did-you-render | Patches React | Dev dependency, JSX import source, a `wdyr` file imported first | Re-renders with equal values (all with `logOnDifferentValues`), hooks, owner reasons, in the console | 19 (v8 readme for 18, v7 for 16 and 17) | README says never |
| React DevTools Profiler | Browser extension or standalone app | Install, tick the setting, record | Props, state, hooks or context changed, or the parent rendered | Not stated on react.dev's page | Nothing in your code |
| React Scan | Script tag or package | `init` command or a script tag | Highlights renders that cause performance issues | Peer range 16.8 to 19 on npm | `dangerouslyForceRunInProduction`, default false, "not recommended" |
| React Render Tracker | Script tag, UI in the page or devtools | One `<script>` | Tree over time, event log with context, state and props changes | 16.9+ per README | README: some data isn't captured in production builds |
| Hook you write | Your component code | Paste, call per component | Changed keys you pass | Whatever your app runs | Stays until deleted |
| debugsy `useWhyDidYouUpdate` | Hook in your component, panel in your app | Install (npmjs release in preparation), mount, call the hook, Deps on | From and to per key you pass, a counter, a frequent mark | 19 | Not removed for you: guard it |

## When why-did-you-render is still the better choice

Stay with it, or go back to it, if:

- You're on React 19 and want every `memo` or pure component watched without a call in each one. `trackAllPureComponents` does that, and debugsy has nothing like it.
- You want the verdict "this re-render was avoidable, the values are equal". WDYR compares by value for that. The Profiler and debugsy tell you what changed, and debugsy only by reference.
- You work in React Native. The README says WDYR works there; debugsy doesn't.
- You use a hook library such as react-redux and want its hooks tracked through `trackExtraHooks`.
- You're on React 18 or older. WDYR's older readmes (v8, v7) cover those versions. debugsy needs React 19, so it isn't an option for you.

## How to choose

- No build change, one question to answer: the DevTools Profiler. The how-to walks through it step by step: [find what causes a re-render in React](/use-cases/why-did-this-component-render).
- Which components render across a whole page: React Scan.
- What happened over time, with context and memo details: React Render Tracker.
- React 19, and you want it automatic: WDYR, set up as above.
- The answer in the page, in the same log as your own debug messages, for a hook call per component: debugsy.

Whichever you pick, a re-render isn't a bug by itself; a high count only points you at the cause. What triggers one is covered in [when React re-renders a component](/blog/when-does-react-re-render).
