---
title: "Prevent re-renders in React: what to try, in order"
description: "How to prevent re-renders in React: measure first, move state down, pass children, use memo with stable props, and know what the Compiler changes."
h1: "How to prevent unnecessary re-renders in React"
mainKeyword: "prevent re render react"
kind: how-to
published: 2026-11-26
updated: 2026-11-26
author: n-uf
takeaways:
  - "Check that a re-render costs something before you fix it. React's memo page says memoizing pays off only when a component re-renders often with the same props and its rendering is expensive."
  - "Fix the structure first: keep state in the component that uses it, and pass slow subtrees in as children so a wrapper's own state update doesn't render them."
  - "memo skips a child only while every prop is equal under Object.is, so a new object, array or function prop on each render defeats it. useMemo and useCallback keep those props the same."
  - "memo doesn't stop a render caused by the component's own state or by a context it reads."
  - "react.dev's memo page says that with React Compiler enabled you typically don't need memo. The compiler's introduction calls it a build-time tool and still an optional addition to React today."
faq:
  - q: "What should I try first to cut re-renders?"
    a: "Measure, then fix the structure before you memoize. Keep state in the component that uses it, pass slow subtrees in as children, and wrap a child in memo only when its props stay equal between renders. React's memo page says memoizing is valuable only when a component re-renders often with the same props and its rendering is expensive."
  - q: "How do I stop a child component from re-rendering when its parent re-renders?"
    a: "Wrap the child in memo, so React skips it while every prop is equal under Object.is. Objects, arrays and functions made during the parent's render are new every time, so keep them stable with useMemo and useCallback, or pass single values instead. If it's the parent's own state that changes, passing the child in as children works too."
  - q: "Why is React.memo not preventing re-renders?"
    a: "Usually a prop is new on every render: an object, array or function written in the parent, or JSX passed as children. The memo page also says a memoized component still re-renders when its own state or a context it uses changes. In the DevTools Profiler, the \"Why did this render?\" section names the changed props."
  - q: "Do I still need memo, useMemo and useCallback with the React Compiler?"
    a: "Often not. The memo page says that with the compiler enabled you typically don't need memo, and the compiler introduction says useMemo and useCallback stay available as an escape hatch, for example for a value used as an effect dependency. For existing code it recommends leaving memoization in place or testing carefully before removing it."
  - q: "Is it bad if a component re-renders a lot?"
    a: "Not by itself. A re-render that returns the same output changes no DOM, and the memo page says that if there is no perceptible lag, memo is unnecessary. Look into it when the page feels slow, or when the render count keeps climbing while nobody touches the page."
sources:
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
  - title: "Profiler (react.dev)"
    url: "https://react.dev/reference/react/Profiler"
    checked: 2026-11-03
  - title: "React Developer Tools (react.dev)"
    url: "https://react.dev/learn/react-developer-tools"
    checked: 2026-11-03
  - title: "Render and Commit (react.dev)"
    url: "https://react.dev/learn/render-and-commit"
    checked: 2026-11-03
  - title: "Passing Props to a Component (react.dev)"
    url: "https://react.dev/learn/passing-props-to-a-component"
    checked: 2026-11-03
  - title: "React Compiler: Introduction (react.dev)"
    url: "https://react.dev/learn/react-compiler/introduction"
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
  - title: "React DevTools source: Profiler.js (Flamegraph and Ranked views)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Profiler/Profiler.js"
    checked: 2026-11-03
related:
  - /blog/when-does-react-re-render
  - /use-cases/why-did-this-component-render
  - /use-cases/react-render-count
---

To prevent re-renders in React, first check that the extra renders cost something you can notice. Then fix the structure before you add memoization: keep state in the component that uses it, pass the slow part in as `children`, and only after that wrap a child in `memo` with props that stay equal between renders. If `memo` seems to do nothing, a prop is usually a new object or function on every render, or the render has a cause `memo` doesn't look at, such as the component's own state or a context.

Below are the fixes, in the order to try them. What makes React render in the first place is in [when does React re-render](/blog/when-does-react-re-render). Claims about React come from react.dev pages checked on 2026-11-03. The render counts come from our own small test of the snippets below: React 19.3.1 in development mode under jsdom in Node, without Strict Mode, counting calls to each component, run the same day.

## Should you prevent re-renders at all?

Often not. React's Render and Commit page says that rendering everything nested inside an updated component isn't optimal when that component sits very high in the tree, and in the next breath tells you not to optimize prematurely. The `memo` page gives the test. Memoizing is valuable only when a component re-renders often with the same exact props and its re-rendering logic is expensive. If there's no perceptible lag, `memo` is unnecessary.

The same page says most performance problems in React apps come from chains of updates started by Effects, which make components render over and over. If that's your symptom, look at [an effect that sets state on every run](/blog/maximum-update-depth-exceeded) before you memoize anything.

Otherwise, pick one symptom, like a field that stutters as you type, and measure it.

**In React DevTools.** react.dev says that with the extension installed, a site built with React shows Components and Profiler panels. In the Profiler's settings, tick "Record why each component rendered while profiling", record the slow interaction, and select a component in the Flamegraph or Ranked view. Its "Why did this render?" section lists what changed, for example "Props changed:" followed by the prop names. When no props, state, hooks or context changed, it says "The parent component rendered." That's the case `memo` is for. (The labels are from the DevTools source on GitHub.) Without recording, "Highlight updates when components render" in the General settings marks components as they render. The guide on how to [find what causes a re-render in React](/use-cases/why-did-this-component-render) goes through it step by step.

**In code.** React's `<Profiler>` calls your `onRender` callback each time a component in its tree commits an update. It passes `actualDuration`, the time spent rendering the subtree for this update, and `baseDuration`, an estimate of a re-render with no optimizations. The Profiler page says to compare the two to see whether memoization is working.

```tsx
import { Profiler } from "react";
import { Results } from "./results"; // the component you're measuring

export function ProfiledResults() {
  return (
    <Profiler
      id="Results"
      onRender={(id, phase, actualDuration, baseDuration) => {
        console.log(id, phase, { actualDuration, baseDuration });
      }}
    >
      <Results />
    </Profiler>
  );
}
```

`<Profiler>` is disabled in the production build by default, because profiling adds overhead. To profile in production, the page says, you need a special build with profiling enabled. The `useMemo` page adds that development timings aren't the most accurate: with Strict Mode on, each component renders twice. If you only want a number of renders, see [counting committed renders](/use-cases/react-render-count).

## Move state down to the component that uses it

One of the principles the `memo` page lists for making memoization unnecessary: prefer local state, and don't lift state further up than necessary. Its examples of state that doesn't belong at the top of the tree are forms and whether an item is hovered.

Here the query lives in `Page`, so every keystroke renders `ProductList` too, though the list never reads the query:

```tsx
import { useState } from "react";

export function Page() {
  const [query, setQuery] = useState("");

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ProductList />
    </>
  );
}
```

Move the state into a component of its own:

```tsx
import { useState } from "react";

function SearchBox() {
  const [query, setQuery] = useState("");
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}

export function Page() {
  return (
    <>
      <SearchBox />
      <ProductList />
    </>
  );
}
```

Now a keystroke updates `SearchBox`, and React renders that component and whatever is nested inside it. `Page` and `ProductList` stay out of it. In our test, typing five characters rendered `ProductList` six times with the first version (one mount, five keystrokes) and once with the second.

This works only while the slow component doesn't need the state. If `ProductList` filters by `query`, the state stays above both; use the steps below.

## Pass the slow part in as children

A wrapper that holds state and renders something slow has the same problem. For a component that visually wraps others, the `memo` page's advice is to let it accept JSX as `children`. Then, when the wrapper updates its own state, React knows its children don't need to re-render.

```tsx
import { useState, type ReactNode } from "react";

function ColorPicker({ children }: { children: ReactNode }) {
  const [color, setColor] = useState("red");

  return (
    <div style={{ color }}>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      {children}
    </div>
  );
}

export function Page() {
  return (
    <ColorPicker>
      <ExpensiveTree />
    </ColorPicker>
  );
}
```

`ColorPicker` no longer creates the `<ExpensiveTree />` element. `Page` does, and `Page` doesn't render when the color changes. In our test, typing four characters rendered `ExpensiveTree` five times when it sat in `ColorPicker`'s own JSX (one mount, four updates), and once with this shape. The Passing Props page covers the `children` prop itself.

It helps only with the wrapper's own state. When the wrapper's parent renders, the children are new elements again.

## How do you stop a child re-rendering when its parent does?

Wrap the child in `memo`. React then skips it while every prop equals the previous render's, compared with `Object.is`. The page's example: `Object.is(3, 3)` is true, `Object.is({}, {})` is false. A number or string prop is fine. An object, array or function written in the parent's body is a new value each time. The fixes it gives: pass individual values instead of an object, declare a function outside the component so it never changes, or cache the value in the parent with `useMemo` (objects, arrays) or `useCallback` (functions).

Here toggling the theme renders `SearchPage` but not `ResultsList`:

```tsx
import { memo, useCallback, useMemo, useState } from "react";

type Item = { id: number; title: string; tab: string };
type ResultsProps = { items: Item[]; onPick: (id: number) => void };

const ResultsList = memo(function ResultsList({ items, onPick }: ResultsProps) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id} onClick={() => onPick(item.id)}>
          {item.title}
        </li>
      ))}
    </ul>
  );
});

export function SearchPage({ all, tab, source }: { all: Item[]; tab: string; source: string }) {
  const [theme, setTheme] = useState("light");

  const items = useMemo(() => all.filter((item) => item.tab === tab), [all, tab]);
  const onPick = useCallback(
    (id: number) => {
      console.log("picked", id, "from", source);
    },
    [source],
  );

  return (
    <div className={theme}>
      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>Theme</button>
      <ResultsList items={items} onPick={onPick} />
    </div>
  );
}
```

`useMemo` returns the same array until `all` or `tab` changes, and `useCallback` returns the same function until `source` changes. Both compare dependencies with `Object.is`, [the same way an effect does](/blog/useeffect-dependency-array). Without the two hooks, `items` comes from a fresh `filter` and `onPick` is a new arrow function on every render. In our test, two theme toggles rendered `ResultsList` three times that way (one mount, two toggles) and once with the hooks.

A few cautions from the same pages:

- `useCallback` doesn't stop you creating the function; React hands back the cached one while the dependencies are unchanged. The page says it's only valuable in a few cases, such as passing the function to a `memo` component or using it as another hook's dependency.
- Rely on `useMemo` and `useCallback` only as a performance optimization. Both pages say that if your code doesn't work without them, find the underlying problem first. The `memo` page calls memoization "a performance optimization, not a guarantee", and one value that's always new breaks it for the whole component.
- If you give `memo` your own comparison function, compare every prop, functions included. Otherwise the component can keep "seeing" props and state from a previous render.

## Why memo isn't preventing the re-render

When a memoized component still renders, it's one of the causes below. To tell which, check [which prop, state or context changed](/use-cases/why-did-this-component-render), in DevTools or the debugsy log further down.

| Cause | How it shows | Fix |
|---|---|---|
| A prop is a new object, array or function | "Props changed:" lists its name | Pass single values, declare it outside, or cache it with `useMemo` or `useCallback` in the parent |
| JSX passed as `children` (or as any prop) | The same, with `children` as the name | Drop `memo` from the wrapper if it's cheap, and memoize the slow inner component instead |
| The component's own state changed | It renders though no props changed | `memo` can't help. Move that state down, or make the render cheaper |
| It reads a context that changed | Same, and no prop changed | See the next section |

The `children` row follows from `Object.is`: a JSX element is an object, and the parent creates a new one each time it renders, so `children` never compares equal. Our test agreed. A memoized wrapper with `<Chart />` as its children rendered on every render of its parent.

Rule out the first two rows first. If the cause is upstream, [the rules of when React renders](/blog/when-does-react-re-render) tell you where to look. Inside Strict Mode, development builds render each component twice, so a doubled count may be nothing.

## When the re-render comes from context

`memo` doesn't help here. The `useContext` page says React re-renders the components that read a context, starting from the provider that receives a different value, and that `memo` doesn't stop them receiving fresh context values. An inline provider value, like `value={{ currentUser, login }}`, is a new object each time its parent renders; the page's fix is `useCallback` for the functions and `useMemo` for the object. The other fixes are in the guide to [why a context change re-renders its readers](/blog/react-context-re-render).

## What the React Compiler changes

React Compiler is a build-time tool. Its react.dev introduction says it does for you the manual memoization of components and values described above, focused on two cases: skipping cascading re-renders (re-rendering a parent re-renders many components below it) and skipping expensive calculations from outside React. The `memo` page says that with the compiler enabled you typically don't need `memo`, and that it goes further, memoizing intermediate values and expensive computations inside components too.

The introduction calls the compiler stable and tested extensively in production, and "still an optional addition to React today". `useMemo` and `useCallback` stay available as an escape hatch, for example for a memoized value used as an effect dependency. For new code it recommends relying on the compiler. For existing code: leave current memoization in place (removing it can change the compiled output), or test carefully before you remove it.

It also says the compiler memoizes only components and hooks, not every function, and to profile an expensive calculation before making code more complicated. That goes for this whole page: profile before you fix, and again after.

## Check that the fix worked, with debugsy

debugsy is an in-process [React debug panel](/): a component you mount in your own app, with one ordered log for debug messages, render counts and dependency changes. When `memo` doesn't skip a child, its `useWhyDidYouUpdate` hook names the props that differ from the previous render. Add it to the memoized component from the snippet above:

```tsx
import { memo } from "react";
import { useWhyDidYouUpdate } from "@n-uf/debugsy";

const ResultsList = memo(function ResultsList({ items, onPick }: ResultsProps) {
  useWhyDidYouUpdate("ResultsList", { items, onPick });
  return <ul>{/* the same list as above */}</ul>;
});
```

With the unfixed `SearchPage`, a theme toggle puts these lines in the log:

```text
🔄 [ResultsList] Dependencies changed:
📦 [ResultsList] items: object changed (#1) 🚀
📝 [ResultsList] onPick: function changed (#1) (function → function) 🚀
```

An array counts as an object here. `(#1)` counts that key's changes since the page loaded, and 🚀 marks debugsy's start-up phase (until 5 seconds after the last tracked change). After the `useMemo` and `useCallback` fix, a toggle logs nothing for `ResultsList`: `memo` skips it, so the hook never runs. We saw both outputs in our jsdom test.

The hook compares the values you pass by reference, and sees only the components where you call it. It does nothing until the Deps toggle (the `dependencies` debug point) is on, in the panel or with `window.debugsy.enable("dependencies")`. By default it skips a render that comes within 100 ms of its last comparison. It logs; it never stops a render. For a count instead of a reason, `useRenderTracker` counts committed renders. The [React render count](/use-cases/react-render-count) guide shows it, with the `trackRenders: true` option that version 26.11.0 needs.

It isn't on npmjs yet: a public release there is in preparation. It needs React 19. Mount `<DebugsyLook />` once near the root; it starts hidden, and ⌘+D opens it. debugsy doesn't remove itself from production builds, so guard the import or the mount, for example behind `process.env.NODE_ENV !== "production"`. It is independent and not affiliated with Meta or the React team.

## Which fix for which problem

| What you see | Try first | What to know |
|---|---|---|
| Typing in one field re-renders a whole page | Move the state into a component of its own | The slow components must not need that state |
| A wrapper with state re-renders a slow subtree | Pass the subtree in as `children` | Helps with the wrapper's own state, not its parent's renders |
| A child renders with the same values as before | `memo` on the child | Every prop must be equal under `Object.is` |
| `memo` is there but the child still renders | Find the changed prop, or the state or context behind it | New objects, arrays, functions and JSX count as changed |
| Many readers re-render on a context change | Cache the provider value | `memo` alone doesn't stop it |
| You'd rather not write any of this by hand | React Compiler | Optional today, per react.dev |
