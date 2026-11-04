---
title: "React render count: 4 ways to check it"
description: "Check a React render count in the DevTools Profiler, with a useRef counter or the Profiler component, or with debugsy's useRenderTracker."
h1: "How to check the React render count of a component"
mainKeyword: "react render count"
kind: use-case
published: 2026-11-05
updated: 2026-11-05
author: n-uf
takeaways:
  - "A render count depends on what you count: commits (DevTools Profiler, the Profiler component), committed renders (a counter in an effect), or calls to your component function (console.count in the body)."
  - "In development, Strict Mode calls a component function twice per render and runs each Effect one extra time on mount, so a body counter doubles and an effect counter reads one too high after mount."
  - "The DevTools Profiler lists the commits each component rendered in, under \"Rendered at:\", for the session you recorded."
  - "debugsy's useRenderTracker counts committed renders per component instance and warns when the count reaches renderThreshold (10 by default). It needs the Deps toggle on and, in version 26.11.0, trackRenders: true."
  - "A count is a pointer, not a verdict: run the same interaction before and after a fix and compare."
faq:
  - q: "How do I count renders in React?"
    a: "Record the interaction in the React DevTools Profiler, or keep a counter in a useRef and increment it in an effect with no dependency array. React's useEffect page says such an Effect re-runs after every commit, so the ref counts committed renders. Don't increment it in the component body: the useRef page says not to read or write ref.current during rendering."
  - q: "Does React DevTools show how many times a component rendered?"
    a: "Not as one number. In a recorded Profiler session, select the component and its details list every commit it rendered in under \"Rendered at:\", or say \"Did not render on the client during this profiling session.\" Count the entries. It covers only the session you recorded (labels from the DevTools source on GitHub, checked 2026-11-03)."
  - q: "Why does my component render twice in development?"
    a: "Most likely Strict Mode. React's StrictMode page says components re-render an extra time in development to find impure code, and re-run Effects an extra time too. These checks are development-only and don't affect the production build."
  - q: "Is a high render count a problem?"
    a: "Not by itself. React's memo page says optimizing with memo is only valuable when a component re-renders often with the same props and its rendering is expensive, and that memo is unnecessary when there's no perceptible lag. Look closer when the page feels slow, or when the count keeps climbing while nobody touches the page."
  - q: "Can I keep a render counter in production?"
    a: "Not without a guard. A useRef counter stays in your bundle until you delete it, and debugsy doesn't remove itself from production builds, so guard the import or the mount yourself. React's Profiler page says the Profiler component is disabled in the production build by default."
sources:
  - title: "React Developer Tools (react.dev)"
    url: "https://react.dev/learn/react-developer-tools"
    checked: 2026-11-03
  - title: "Render and Commit (react.dev)"
    url: "https://react.dev/learn/render-and-commit"
    checked: 2026-11-03
  - title: "Profiler (react.dev)"
    url: "https://react.dev/reference/react/Profiler"
    checked: 2026-11-03
  - title: "StrictMode (react.dev)"
    url: "https://react.dev/reference/react/StrictMode"
    checked: 2026-11-03
  - title: "useRef (react.dev)"
    url: "https://react.dev/reference/react/useRef"
    checked: 2026-11-03
  - title: "useEffect (react.dev)"
    url: "https://react.dev/reference/react/useEffect"
    checked: 2026-11-03
  - title: "memo (react.dev)"
    url: "https://react.dev/reference/react/memo"
    checked: 2026-11-03
  - title: "useCallback (react.dev)"
    url: "https://react.dev/reference/react/useCallback"
    checked: 2026-11-03
  - title: "console: count() static method (MDN)"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/console/count_static"
    checked: 2026-11-03
  - title: "React DevTools source: SidebarSelectedFiberInfo.js (\"Rendered at:\" list)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Profiler/SidebarSelectedFiberInfo.js"
    checked: 2026-11-03
  - title: "React DevTools source: Profiler.js (Flamegraph and Ranked views)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Profiler/Profiler.js"
    checked: 2026-11-03
  - title: "React DevTools source: GeneralSettings.js (setting label)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Settings/GeneralSettings.js"
    checked: 2026-11-03
  - title: "React DevTools source: ProfilerSettings.js (setting label)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Settings/ProfilerSettings.js"
    checked: 2026-11-03
  - title: "React Render Tracker README (GitHub)"
    url: "https://github.com/lahmatiy/react-render-tracker"
    checked: 2026-11-03
  - title: "React Scan README (GitHub)"
    url: "https://github.com/aidenybai/react-scan"
    checked: 2026-11-03
related:
  - /use-cases/why-did-this-component-render
  - /blog/maximum-update-depth-exceeded
  - /
---

To check the React render count of a component, record it in the React DevTools Profiler, add a small `useRef` counter, wrap it in React's `<Profiler>` component, or call `useRenderTracker` from debugsy. The four don't count the same thing. The DevTools Profiler and `<Profiler>` count commits, a ref counter in an effect counts committed renders, and `console.count` in the component body counts calls to your function, which Strict Mode doubles in development.

The examples use a search page with three result rows. You type five characters and want to know how often each row rendered.

## What a React render counter counts

React's [Render and Commit](https://react.dev/learn/render-and-commit) page splits an update into steps. "Rendering" is React calling your components; the commit applies the result to the DOM. Not every call ends in a commit: the `memo` page says setting state to its current value may still call your component once more and discard the result. So one page can give you three numbers:

- Calls to your component function, from `console.count` or a counter in the body.
- Committed renders, from an effect that runs after every commit.
- Commits, from the Profiler's commit list. One commit can include many components.

To count how often an effect ran, and see why, start with how to [check which useEffect dependency changed](/use-cases/useeffect-which-dependency-changed).

## Count renders in the React DevTools Profiler

Start here. It needs no change to your code. [React's DevTools page](https://react.dev/learn/react-developer-tools) links the extension for Chrome, Firefox and Edge, and the `react-devtools` npm package for other browsers such as Safari.

1. Open the Profiler panel and start recording.
2. Type the five characters, then stop.
3. Click a row component in the Flamegraph or Ranked view. Its details list every commit it rendered in under "Rendered at:", each with the commit's time and duration (like `12.3s for 0.4ms`). A component that never rendered in the session says "Did not render on the client during this profiling session."

Count the entries and you have the React DevTools render count for that component. For a rough look without recording, switch on "Highlight updates when components render" in the General settings and watch which rows flash as you type.

The Profiler covers only the session you record, and you read the number by eye, so a test can't check it. Tick "Record why each component rendered while profiling" in the Profiler settings first, and the same session also says [why a component rendered](/use-cases/why-did-this-component-render).

## A useRef counter you paste in

This hook counts committed renders. It increments in an effect with no dependency array, which [react.dev's useEffect page](https://react.dev/reference/react/useEffect) says re-runs after every commit. The count lives in an effect rather than the body because the `useRef` page says not to read or write `ref.current` during rendering, except to initialize it.

```tsx
import { useEffect, useRef } from "react";

export function useRenderCount(name: string) {
  const count = useRef(0);

  useEffect(() => {
    count.current += 1;
    console.log(`${name}: committed render ${count.current}`);
  }); // no dependency array: runs after every commit
}
```

A remount starts the count again, since a new instance gets a new ref. Under Strict Mode in development it also reads one too high after mount: React's [StrictMode page](https://react.dev/reference/react/StrictMode) says it runs one extra setup and cleanup cycle for every Effect. In our own small test (React 19.3.1 under jsdom in Node, 2026-11-03), a fresh mount logged `committed render 1` without Strict Mode, and `1` then `2` with it.

### Why console.count in the body counts something else

[MDN](https://developer.mozilla.org/en-US/docs/Web/API/console/count_static) says `console.count()` logs how many times that particular call has been made. In the body, that means calls to your function, and the useRef page says Strict Mode calls the function twice in development. In the same test with Strict Mode on, the body ran twice on mount and four times in total after one update. That's fine for a rough feel and wrong for a before-and-after comparison.

### Using the counter to compare a fix

Here's the search page with the counter in each row and nothing memoized yet.

```tsx
import { useState } from "react";
import { useRenderCount } from "./use-render-count"; // the hook above

type Item = { id: number; title: string };

function ResultRow({ item, onSelect }: { item: Item; onSelect: (id: number) => void }) {
  useRenderCount(`ResultRow ${item.id}`);
  return <li onClick={() => onSelect(item.id)}>{item.title}</li>;
}

export function SearchPage({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const onSelect = (id: number) => console.log("selected", id);

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <p>Searching for {query}</p>
      <ul>
        {items.map((item) => (
          <ResultRow key={item.id} item={item} onSelect={onSelect} />
        ))}
      </ul>
    </>
  );
}
```

Every keystroke sets `query`, so `SearchPage` renders, and by default every row renders with it. In the same jsdom test, without Strict Mode, we simulated typing five characters and read each row's final count:

| Setup | Count per row |
|---|---|
| Rows as written | 6 (one mount, five keystrokes) |
| Rows wrapped in `memo`, `onSelect` still an inline function | 6 |
| Rows wrapped in `memo`, `onSelect` wrapped in `useCallback` | 1 |

The middle row is the one that teaches something. The `memo` page says it compares props with `Object.is` and is useless when you pass a plain function defined during rendering, since every render makes a new one. [`useCallback`](https://react.dev/reference/react/useCallback) gives you the same function until its dependencies change, and then `memo` can skip the rows. Moving state down and passing `children` bring the number down too; the guide on how to [prevent re-renders in React](/blog/prevent-re-renders-react) takes them in order.

## React's Profiler component counts commits in code

To count commits for one part of the tree from code, React has a [`<Profiler>`](https://react.dev/reference/react/Profiler) component. React calls its `onRender` callback every time components inside the profiled tree update.

```tsx
import { Profiler } from "react";
// Item and SearchPage are from the example above

let commits = 0;

export function Results({ items }: { items: Item[] }) {
  return (
    <Profiler
      id="Results"
      onRender={(id, phase) => {
        commits += 1;
        console.log(`${id} ${phase} commit #${commits}`);
      }}
    >
      <SearchPage items={items} />
    </Profiler>
  );
}
```

`phase` is `"mount"`, `"update"` or `"nested-update"`. The number covers the whole subtree, not one component.

## Count renders with debugsy's useRenderTracker

debugsy is an in-process [React debug panel](/): a component you mount in your own app that shows one ordered log of debug messages, render counts and dependency changes. Its `useRenderTracker` hook counts committed renders the same way the ref counter does, and warns when the count reaches a number you set.

debugsy isn't on npmjs yet: a public release there is in preparation. It needs React 19. The [home page](/) has the mount steps.

Mount `<DebugsyLook />` once near the root, then call the hook in the component you want to count.

```tsx
import { useRenderTracker } from "@n-uf/debugsy";

function ResultRow({ item, onSelect }: { item: Item; onSelect: (id: number) => void }) {
  useRenderTracker(`ResultRow ${item.id}`, {
    trackRenders: true,
    renderThreshold: 6,
    onExcessiveRenders: (info) => {
      console.log(`ResultRow ${item.id}: ${info.renderCount} renders in ${info.timeElapsed} ms`);
    },
  });

  return <li onClick={() => onSelect(item.id)}>{item.title}</li>;
}
```

The hook does nothing until the `dependencies` debug point is on. The panel starts hidden. Press ⌘+D to open it (once for the compact controls, again for the full log) and switch on the Deps toggle, or run this in the console:

```js
window.debugsy.enable("dependencies")
```

The choice is kept in `localStorage` (`surface-debug-config`).

Don't leave out `trackRenders: true`. In version 26.11.0 the options form counts renders only when you pass it; without it the hook stays silent and `renderCount` stays at 0. The older positional form, `useRenderTracker("ResultRow", 6, callback)`, turns render tracking on by itself.

When the count reaches `renderThreshold` (10 if you leave it out), the hook logs a warning, shows a short notice in the panel, calls `onExcessiveRenders` with the info and starts counting from zero. With the threshold at 6 and the unmemoized rows above, our jsdom test logged this for each row after the five keystrokes:

```text
⚠️ [ResultRow 1] Excessive render rate detected: 250.00 renders/sec (6 in 24ms)
```

The 24 ms is how fast the test fired its events, not how fast anyone types. The line says "rate", but the trigger is the count: a component that reaches 6 renders over an hour warns just the same, with a tiny rate. Think of `renderThreshold` as "tell me when this reaches N".

Some details from the code:

- A second line, `🚨 HIGH RENDER RATE: …`, and the panel notice appear only if no other notice fired in the last 3 seconds, and that cooldown is shared by every component. In our test only `ResultRow 1` got them; rows 2 and 3 still logged the warning and called the callback.
- The hook returns `{ render: { renderCount, timeElapsed, renderRate, threshold, isExcessive, alertsTriggered }, mount }`, updated in an effect, so a render sees the numbers as of the previous commit. For a current number, use the callback or the log.
- It sees only the components where you call it, and a remounted instance starts a new count. It warns and calls your callback; it doesn't stop a render or a state update. A runaway loop needs the fixes in the guide to [Maximum update depth exceeded](/blog/maximum-update-depth-exceeded).
- It doesn't remove itself from production builds. Guard the import or the mount yourself, for example behind `process.env.NODE_ENV !== "production"`.

## Reading a React render count

How many is too many depends on the interaction. Five renders of the component that holds the input, for five characters, is expected. Five renders of a row that doesn't show the query is worth a look.

- Run the same interaction each time, from a fresh load. Write the number down, change one thing, run it again, as in the table above.
- Don't chase every number. The Render and Commit page says rendering everything nested inside an updated component isn't optimal for performance when that component is high in the tree, and also tells you not to optimize prematurely. To tell an expected render from a surplus one, check the rules for [what makes React render again](/blog/when-does-react-re-render).
- A count that keeps climbing while nobody touches the page is a loop.

A count tells you where to look, not why. To see which prop, state or context did it, read how to [find what causes a re-render in React](/use-cases/why-did-this-component-render).

## Which method to use

| | DevTools Profiler | Ref counter | Profiler component | debugsy `useRenderTracker` |
|---|---|---|---|---|
| Runs | Browser extension or standalone app | Your component code | Wraps a subtree in your code | Hook in your component, log in the panel |
| Counts | Commits, and the ones each component rendered in | Committed renders (+1 on mount in Strict Mode) | Commits of the subtree | Committed renders since the last warning (+1 on mount in Strict Mode) |
| Setup | Install, record | Paste a hook | Wrap, write a callback | Install (npmjs release in preparation), mount, Deps on, `trackRenders: true` |
| In production | Nothing in your code | Stays until deleted | Disabled in production by default | Not removed for you: guard it |

The DevTools Profiler needs nothing in your code, so try it first. A ref counter is enough for a one-off check, and `<Profiler>` for commits of one section. debugsy fits when you want the warning in the same ordered log as your own debug messages and don't mind a hook call in each component.

Two other tools look at the whole tree without a hook in each component:

- React Render Tracker. Its README describes a tool for finding performance issues related to unintended re-renders, showing the component tree over time with each component's number of updates (re-renders). It supports React 16.9 and later: fully functional on a development build, missing some data on profiling and production builds. It calls itself a complement to React DevTools, not a replacement.
- React Scan. Its README says it detects performance issues with no code changes and puts a toolbar on the page. Its `log` option, off by default, logs renders to the console. You start it with `npx -y react-scan@latest init` or a script tag. The README also says you can still use React Scan, but recommends React Doctor.

Both tools, and the rest of the toolbox from breakpoints to network panels, are sorted by job in [this overview of debugging tools](/blog/react-debugging-tools).

They make more sense when you don't know yet which component to count, or don't want to edit components. A ref counter or debugsy makes more sense once you know which components matter and want the number in your own code or log.

debugsy is independent. It isn't affiliated with Meta, the React team or the authors of React Render Tracker and React Scan.
