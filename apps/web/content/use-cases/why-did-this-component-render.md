---
title: "Find what causes a re-render in React (3 ways)"
description: "Three ways to find what causes a re-render in React: the DevTools Profiler, a small hook you paste in, and debugsy's useWhyDidYouUpdate."
h1: "How to find what's causing a React component to re-render"
mainKeyword: "react find what causes re render"
kind: use-case
published: 2026-11-03
updated: 2026-11-03
author: n-uf
takeaways:
  - "A React component renders again when its own state changes, when a parent renders, or when a context it reads changes."
  - "memo compares props, and hooks compare dependencies and context values, with Object.is, so a new object or function counts as a change even when its contents are the same."
  - "The React DevTools Profiler can record why each component rendered, but only for a session you record, and it doesn't show where the new value was created."
  - "debugsy's useWhyDidYouUpdate logs which keys of an object you pass changed between renders. It sees only the values you pass in."
faq:
  - q: "What causes a React component to re-render?"
    a: "A component renders again when its own state is updated, when an ancestor's state is updated, or when a context it reads gets a different value. React's Render and Commit page names the state update as the trigger; by default React then renders every component nested inside the one that updated. The useContext page adds that components reading a context re-render when the provider's value changes, compared with Object.is."
  - q: "Does a component re-render when its parent re-renders?"
    a: "Yes, by default. React renders everything nested inside the component whose state changed, whether or not the props changed. Wrapping a child in memo lets it skip that when its props are equal under Object.is, though React's memo page calls this a performance optimization, not a guarantee. The child still re-renders for its own state or for a context it uses."
  - q: "Why does my component render twice in development?"
    a: "Most likely Strict Mode. React's StrictMode page says it calls your component function twice in development to help you find impure code, and runs one extra setup and cleanup cycle for every Effect. These checks are development-only."
  - q: "How do I see re-renders in React DevTools?"
    a: "Turn on \"Highlight updates when components render\" in the DevTools settings to see components as they render. For the reason, tick \"Record why each component rendered while profiling\" in the Profiler settings, record a session, and select the component to read its \"Why did this render?\" section. The labels are taken from the DevTools source on GitHub (checked 2026-11-03)."
  - q: "Can I leave the re-render tracking in production?"
    a: "Not without a guard. debugsy doesn't remove itself from production builds, so guard the import or the mount yourself, for example behind process.env.NODE_ENV !== \"production\". The why-did-you-render README says it should never be used in production. A hook you wrote yourself stays in your bundle until you delete it."
sources:
  - title: "React Developer Tools (react.dev)"
    url: "https://react.dev/learn/react-developer-tools"
    checked: 2026-11-03
  - title: "Render and Commit (react.dev)"
    url: "https://react.dev/learn/render-and-commit"
    checked: 2026-11-03
  - title: "memo (react.dev)"
    url: "https://react.dev/reference/react/memo"
    checked: 2026-11-03
  - title: "useCallback (react.dev)"
    url: "https://react.dev/reference/react/useCallback"
    checked: 2026-11-03
  - title: "useMemo (react.dev)"
    url: "https://react.dev/reference/react/useMemo"
    checked: 2026-11-03
  - title: "useContext (react.dev)"
    url: "https://react.dev/reference/react/useContext"
    checked: 2026-11-03
  - title: "StrictMode (react.dev)"
    url: "https://react.dev/reference/react/StrictMode"
    checked: 2026-11-03
  - title: "why-did-you-render README (GitHub)"
    url: "https://github.com/welldone-software/why-did-you-render"
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
  - title: "React DevTools source: SidebarSelectedFiberInfo.js (where the section is shown)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Profiler/SidebarSelectedFiberInfo.js"
    checked: 2026-11-03
  - title: "React DevTools source: HookChangeSummary.js (how changed hooks are listed)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Profiler/HookChangeSummary.js"
    checked: 2026-11-03
  - title: "React DevTools changelog (GitHub)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools/CHANGELOG.md"
    checked: 2026-11-03
related:
  - /
  - /blog/maximum-update-depth-exceeded/
---

To find what causes a re-render in React, start from the three reasons a component renders again: its own state changed, its parent rendered, or a context it reads changed. To tell which one it was, compare the values the component gets on two renders, by reference, and look for the one that's new. This page shows three ways to do that: the React DevTools Profiler, a small hook you write yourself, and `useWhyDidYouUpdate` from debugsy.

The examples use a checkout form that lags while you type.

## The React DevTools Profiler can say why a component rendered

Start here. It needs no change to your code. [React's DevTools page](https://react.dev/learn/react-developer-tools) links the extension for Chrome, Firefox and Edge, and the standalone `react-devtools` package for other browsers such as Safari.

Two settings matter (labels as they appear in the DevTools source on GitHub, checked 2026-11-03):

- In General settings, "Highlight updates when components render". It's the quickest way to see React re-renders at all: type, click or scroll, and watch which components light up. For a number instead of a flash, see how to check the [React render count](/use-cases/react-render-count) of a component.
- In Profiler settings, "Record why each component rendered while profiling". Tick it before you record.

Open the Profiler, start recording, do the slow thing once (type one character) and stop. Select the component in a recorded commit. Its details have a "Why did this render?" section with one or more of these lines:

- "Props changed:" and the prop names
- "State changed:" and the state keys
- "Hook 2 changed" or similar: hooks are listed by number, and the full view can also try to parse their names
- "Context changed"
- "The parent component rendered." when none of the above applies
- "This is the first time the component rendered." on a mount

"Why did this render? The parent component rendered." means the component's own props, state, hooks and context were all the same, so the render came from above. React's [Render and Commit](https://react.dev/learn/render-and-commit) page explains it: a state update in a component, or in one of its ancestors, renders everything nested inside it by default.

The Profiler names the prop, not the line where the new value was created. It covers only the session you recorded, and the DevTools changelog says recording the reasons adds a small amount of overhead.

## A hook of your own that logs the changed keys

To trace why a React component is re-rendering in one place, paste this. It keeps the previous values in a ref and, after every render, logs the keys that differ under `Object.is`, the same comparison `memo` uses for props and hooks use for dependencies.

```tsx
import { useEffect, useRef } from "react";

export function useWhyRendered(name: string, values: Record<string, unknown>) {
  const previous = useRef<Record<string, unknown> | null>(null);

  useEffect(() => {
    const before = previous.current;
    previous.current = values;
    // first render, or Strict Mode re-running the effect for the same render
    if (before === null || before === values) return;

    const changed: Record<string, { from: unknown; to: unknown }> = {};
    for (const key of Object.keys({ ...before, ...values })) {
      if (!Object.is(before[key], values[key])) {
        changed[key] = { from: before[key], to: values[key] };
      }
    }

    if (Object.keys(changed).length > 0) {
      console.log(`[${name}] changed:`, changed);
    } else {
      console.log(`[${name}] rendered, nothing watched changed`);
    }
  }); // no dependency array: runs after every render
}
```

Call it with what you suspect: `useWhyRendered("CheckoutForm", { values, errors, onSubmit })`. A function or object that shows up as changed while its contents look identical is an unstable reference. If nothing you watched changed, the cause is something you didn't pass in: the parent, a context, or other state.

It compares by reference only. You add it to each component by hand and take it out again when you're done.

## Find what causes a re-render in React with debugsy

debugsy is an in-process [React debug panel](/): a component you mount in your own app that shows one ordered log of debug messages, render counts and dependency changes. Its `useWhyDidYouUpdate` hook does the same job as the hook above, and the results land in that log, so you can debug a component re-render without leaving the page. The source is on [GitHub](https://github.com/n-uf/debugsy).

It installs from GitHub Packages, not npmjs. Add `@n-uf:registry=https://npm.pkg.github.com` to `.npmrc`, then run `pnpm add @n-uf/debugsy`. GitHub Packages asks for a GitHub token with `read:packages`, even for public packages. Peer dependencies are `react` and `react-dom` 19, and `react18-json-view`. It ships TypeScript source, so a Next.js app adds `@n-uf/debugsy` to `transpilePackages`. The [home page](/) has the install and mount steps.

Mount the panel once near the root, then call the hook in the component you're chasing.

```tsx
import { DebugsyLook, useWhyDidYouUpdate } from "@n-uf/debugsy";

// near the app root: <DebugsyLook />

// inside the component
function CheckoutForm({ values, errors, onSubmit }: Props) {
  useWhyDidYouUpdate("CheckoutForm", { values, errors, onSubmit });
  // ...
}
```

### Turn dependency tracking on

The hook does nothing until the `dependencies` debug point is on. The panel starts hidden. Press ⌘+D to open it (once for the compact controls, again for the full log) and switch on the Deps toggle, or run this in the console:

```js
window.debugsy.enable("dependencies")
```

The choice is kept in `localStorage` (`surface-debug-config`). In development, `NEXT_PUBLIC_SURFACE_DEBUG=dependencies` turns it on at start. The first render after you switch it on becomes the baseline, and changes are logged from the render after that.

### Read the log

After each render, the hook compares every key of the object you passed with the previous render, by reference (`!==`). A change looks like this:

```text
🔄 [CheckoutForm] Dependencies changed:
📝 [CheckoutForm] onSubmit: function changed (#3) (function → function)
📦 [CheckoutForm] errors: object changed (#2)
```

The first line carries the from and to value of every changed key as data. The number in `(#3)` counts how many times that key has changed so far. A primitive gets its own line only at the verbose or debug level (the panel's Quiet / Normal / Verbose button). Logs are throttled, 100 ms by default: a render inside that window is skipped, and the next check compares against the last values it looked at.

A render where none of the keys changed writes nothing. If the form keeps rendering and the log stays quiet, the cause is a value you didn't pass in, the same "parent rendered" case the Profiler reports.

A key that keeps changing gets ` ⚠️ FREQUENT` at the end of its line, and the line is logged as a warning. That only happens after start-up. debugsy treats the app as starting up until 5 seconds pass with no tracked change; each tracked change restarts the 5 seconds. During start-up every key line ends with ` 🚀`, and a fast-changing key gets ` 📋 INIT` instead of the warning. So type a little, stop for five seconds, then type again. A loop that never pauses never leaves start-up, so it shows `📋 INIT`, not `⚠️ FREQUENT`.

"Frequent" means the key changes often, not that it's a bug: `values` should change on every keystroke. The flag is useful on a key you didn't expect to change, like `onSubmit`.

An optional third argument, `onFrequentChanges`, is called with `{ changesCount, hasFrequentChanges, changeTypes, frequentChangeTypes }` when a check finds frequent changes. The hook also returns the latest of that object.

The hook sees only the components where you call it and only the values you pass. It doesn't read React's internals or trace context on its own. To check a context, pass it in: `{ auth: useContext(AuthContext) }`. If a component re-renders in a loop until React gives up, the article on [maximum update depth exceeded](/blog/maximum-update-depth-exceeded/) covers that case.

## What the usual culprits look like, and the fix for each

Most of them come back to one fact: a new object or function is never equal to the old one under `Object.is`, even with the same contents. The rules behind each case, including what `memo` and context change, are in [when does React re-render a component](/blog/when-does-react-re-render).

### A function created in render

An inline handler is a new function on every render. The log shows it as `function changed`.

```tsx
// before
<ShippingForm onSubmit={(order) => post("/buy", { productId, order })} />

// after
const onSubmit = useCallback((order) => post("/buy", { productId, order }), [productId]);
<ShippingForm onSubmit={onSubmit} />
```

[`useCallback`](https://react.dev/reference/react/useCallback) returns the same function until a dependency changes.

### An object or array created in render

`{ theme, locale }` written in JSX is a new object each time (`object changed` in the log).

```tsx
// before
<Chart options={{ theme, locale }} />

// after
const options = useMemo(() => ({ theme, locale }), [theme, locale]);
<Chart options={options} />
// or skip the object: <Chart theme={theme} locale={locale} />
```

[`useMemo`](https://react.dev/reference/react/useMemo) returns the value it already calculated until a dependency changes. The `memo` page also suggests passing individual values instead of a whole object.

### A context provider with a new value each render

Every component that reads the context re-renders when the provider's `value` is a different object. In the Profiler this is "Context changed".

```tsx
// before
<AuthContext value={{ currentUser, login }}>

// after (login wrapped in useCallback)
const value = useMemo(() => ({ currentUser, login }), [currentUser, login]);
<AuthContext value={value}>
```

The [`useContext`](https://react.dev/reference/react/useContext) page uses the same fix. It also says that in smaller apps these extra renders aren't a problem.

### A parent that renders while the child isn't memoized

When a parent renders, its children render too. [`memo`](https://react.dev/reference/react/memo) lets a child skip that when its props are equal.

```tsx
const ShippingForm = memo(function ShippingForm({ onSubmit }: Props) {
  // ...
});
```

`memo` only helps once the props are stable, so fix the first two culprits first. It doesn't stop a render caused by the component's own state or a context it uses.

## Which tool to use when

| | React DevTools Profiler | why-did-you-render | Hook you write | debugsy |
|---|---|---|---|---|
| Runs | Browser extension or standalone app | Library that patches React in your app | Your component code | Panel in your app |
| Setup | Install, tick the setting, record | Dev dependency, JSX `importSource` in Babel, `wdyr.js` as the first import | Paste, call per component | Token, `pnpm add`, mount, call the hook, switch on Deps |
| Shows | Props, state, hooks or context changed, or the parent rendered | Re-renders it flags as potentially avoidable | Changed keys you pass | From and to per key you pass, a counter, a frequent flag |
| React | Not stated on react.dev's DevTools page | Latest version tested with React 19 only; React 18 uses its v8 readme, 16 and 17 v7 | Whatever your app runs | 19 |
| In production | Nothing in your code | README says never | Stays until deleted | Not removed for you: guard it |

The why-did-you-render cells come from its README, checked 2026-11-03. Its setup in Next.js and Vite, and two more tools, React Scan and React Render Tracker, are in [why-did-you-render alternatives](/blog/why-did-you-render-alternative).

Use DevTools first when you don't know what's causing a React component to re-render. It needs no code change and covers the whole tree. why-did-you-render makes more sense when you want every `memo` or pure component watched without a hook call in each one (its README describes `trackAllPureComponents` for that), or when you're on React Native, which its README says it supports and debugsy doesn't. A hand-written hook is enough for a one-off. debugsy fits when the cause comes and goes, you want it in the same ordered log as your own debug messages, and you don't mind a hook call in each component you care about.

debugsy is independent. It isn't affiliated with Meta, the React team or the authors of why-did-you-render.
