---
title: "Maximum update depth exceeded in React: how to fix it"
description: "Maximum update depth exceeded in React means a state update keeps retriggering itself. Find the component, the value that changes and the fix."
h1: "Fix the \"Maximum update depth exceeded\" error in React"
mainKeyword: "maximum update depth exceeded react"
kind: how-to
published: 2026-11-03
updated: 2026-11-03
author: n-uf
takeaways:
  - "React counts nested state updates. In its v19.3.1 source the limit is 50: past it, React throws (Minified React error #185 in production) or, for useEffect in development, logs a console error and lets the loop run on."
  - "The usual cause is an effect that sets state and either has no dependency array or lists an object, array or function that is new on every render."
  - "\"Too many re-renders\" is a different error: state is being set during render, for example onClick={handleClick()}."
  - "To find the culprit, compare each dependency between two renders with Object.is and fix the one that differs."
  - "debugsy's useWhyDidYouUpdate marks a value that keeps changing. It warns and never stops the loop."
faq:
  - q: "What does \"Maximum update depth exceeded\" mean in React?"
    a: "A component keeps scheduling state updates that trigger more updates, and React has counted too many nested ones. The message on react.dev says React limits the number of nested updates to prevent infinite loops. The fix is to remove whatever re-triggers the update, usually an effect's dependency or a missing guard."
  - q: "What is the limit?"
    a: "In React's source at tag v19.3.1, ReactFiberWorkLoop.js sets NESTED_UPDATE_LIMIT to 50 and throws when the count goes past it. A second constant, NESTED_PASSIVE_UPDATE_LIMIT, is also 50 and drives the development-only warning for useEffect, which logs and doesn't throw. \"Too many re-renders\" has its own limit: RE_RENDER_LIMIT is 25 in ReactFiberHooks.js. These numbers come from the source, not from a docs page, so they can change between releases."
  - q: "Why does it happen with useEffect?"
    a: "An effect that sets state causes a re-render, and the re-render can run the effect again. react.dev says an infinite cycle needs two things: the effect updates state, and that state leads to a re-render that changes the effect's dependencies. With no dependency array the effect runs after every commit; with an object, array or function created during render in the array, the dependency is different every time."
  - q: "What is Minified React error #185?"
    a: "It's the production form of \"Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate.\" Production builds leave out the full text to send fewer bytes, and react.dev/errors/185 shows the original message. To see the component name, reproduce the bug in a development build."
  - q: "How is it different from \"Too many re-renders\"?"
    a: "\"Too many re-renders. React limits the number of renders to prevent an infinite loop.\" is thrown when state is set unconditionally during render, very often by calling a handler instead of passing it (onClick={handleClick()}). \"Maximum update depth exceeded\" is about updates that keep arriving after the render, from effects or lifecycle methods. The fixes differ, so check which one you have."
sources:
  - title: "React: Minified React error #185"
    url: "https://react.dev/errors/185"
    checked: 2026-11-03
  - title: "React: Minified React error #301"
    url: "https://react.dev/errors/301"
    checked: 2026-11-03
  - title: "React: Error decoder overview"
    url: "https://react.dev/errors"
    checked: 2026-11-03
  - title: "React: useEffect (reference and troubleshooting)"
    url: "https://react.dev/reference/react/useEffect"
    checked: 2026-11-03
  - title: "React: useState (reference and troubleshooting)"
    url: "https://react.dev/reference/react/useState"
    checked: 2026-11-03
  - title: "React: You Might Not Need an Effect"
    url: "https://react.dev/learn/you-might-not-need-an-effect"
    checked: 2026-11-03
  - title: "React: useMemo"
    url: "https://react.dev/reference/react/useMemo"
    checked: 2026-11-03
  - title: "React: useCallback"
    url: "https://react.dev/reference/react/useCallback"
    checked: 2026-11-03
  - title: "React: useLayoutEffect"
    url: "https://react.dev/reference/react/useLayoutEffect"
    checked: 2026-11-03
  - title: "React: Component (componentDidUpdate)"
    url: "https://react.dev/reference/react/Component"
    checked: 2026-11-03
  - title: "React: React Developer Tools"
    url: "https://react.dev/learn/react-developer-tools"
    checked: 2026-11-03
  - title: "React source, v19.3.1: ReactFiberWorkLoop.js (nested update limits, messages)"
    url: "https://github.com/facebook/react/blob/v19.3.1/packages/react-reconciler/src/ReactFiberWorkLoop.js"
    checked: 2026-11-03
  - title: "React source, v19.3.1: ReactFiberConcurrentUpdates.js (where the check runs)"
    url: "https://github.com/facebook/react/blob/v19.3.1/packages/react-reconciler/src/ReactFiberConcurrentUpdates.js"
    checked: 2026-11-03
  - title: "React source, v19.3.1: ReactFiberHooks.js (re-render limit)"
    url: "https://github.com/facebook/react/blob/v19.3.1/packages/react-reconciler/src/ReactFiberHooks.js"
    checked: 2026-11-03
  - title: "React source, v19.3.1: ReactFiberErrorLogger.js (development messages)"
    url: "https://github.com/facebook/react/blob/v19.3.1/packages/react-reconciler/src/ReactFiberErrorLogger.js"
    checked: 2026-11-03
  - title: "React source: formatProdErrorMessage.js (minified error text)"
    url: "https://github.com/facebook/react/blob/main/packages/shared/formatProdErrorMessage.js"
    checked: 2026-11-03
  - title: "React source: scripts/error-codes/codes.json (error 185 and 301 text)"
    url: "https://github.com/facebook/react/blob/main/scripts/error-codes/codes.json"
    checked: 2026-11-03
related:
  - /use-cases/why-did-this-component-render/
  - /
---

Maximum update depth exceeded in React means a component keeps scheduling state updates in a cycle, and React reports it once more than 50 nested updates stack up. Most often it's an effect that sets state while it has no dependency array, or while one of its dependencies is a new object, array or function on every render. To fix it, find the component and the value that changes on every render, then break the cycle. Below are the exact messages (including "Minified React error #185" from production), a way to find the loop, the usual causes with a fix for each, and how to watch the loop with debugsy.

## What the error says

React has more than one message with these words. The first is the text react.dev shows for error #185:

> Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.

This one is thrown. It names class lifecycle methods, but function components hit it too. In React's source (v19.3.1) the check runs every time a state update is scheduled, and the count grows when a commit leaves another update for the same root right behind it. That's what `setState` in `componentDidUpdate` does, and so does a `set` call in `useLayoutEffect`.

The second is a development-only `console.error` that points straight at effects:

> Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.

This is the "maximum update depth exceeded" useEffect message, and it's also the diagnosis. In the source it fires after more than 50 nested updates scheduled from passive effects (`useEffect`). That branch only logs. Nothing in it stops the cycle, so the effect keeps running and the warning can come back. In a production build this check doesn't run at all: a `useEffect` loop shows no error, and the page just keeps rendering and burning CPU. We ran both kinds of loop against React 19.3.1 on 2026-11-03: the `useEffect` one rendered tens of thousands of times in under two seconds, while the `useLayoutEffect` one stopped at the limit with the first message, thrown (error #185 in the production build).

The third is a different error: "Too many re-renders. React limits the number of renders to prevent an infinite loop."

| Message | How it shows | What triggers it | Usual fix |
|---|---|---|---|
| Maximum update depth exceeded … componentWillUpdate or componentDidUpdate | Thrown. Production: Minified React error #185 | More than 50 nested updates of the same root, from `componentDidUpdate` or `useLayoutEffect` | Guard the update, or fix the value that changes every time |
| Maximum update depth exceeded … setState inside useEffect | Console error, development only. The loop goes on | More than 50 nested updates scheduled from `useEffect` | Add or correct the dependency array |
| Too many re-renders | Thrown. Production: Minified React error #301 | State set during render; React's limit is 25 re-renders in one pass | Pass the handler instead of calling it, or guard the `set` call |

### Minified React error #185 in production

A production build leaves out the long text. The format comes from `formatProdErrorMessage.js` in React's repository:

```
Minified React error #185; visit https://react.dev/errors/185 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
```

React's page for #185 reassembles the original message. Its errors overview recommends the development build for local debugging, because it tracks extra debug information and warns about more problems. So when a "minified react error 185" report comes in, reproduce it locally in development. The useEffect message only exists there.

### "Too many re-renders" is a different bug

With "Too many re-renders", look at the call site, not the effects. react.dev says it typically means you're setting state unconditionally during render, very often through a mistake in an event handler:

```jsx
// 🚩 Wrong: calls the handler during render
return <button onClick={handleClick()}>Click me</button>

// ✅ Correct: passes down the event handler
return <button onClick={handleClick}>Click me</button>
```

`onClick={setOpen(true)}` has the same problem: it runs while rendering.

## How to debug Maximum update depth exceeded in React

Start with the development build. It prints the full message, and when React can name the component it adds a line like `An error occurred in the <Results> component.` (or `The above error occurred in the <Results> component.` if an error boundary caught it), followed by the component stack. In production you get only the error object: the minified message and a JavaScript stack.

Then open the stack. For "Too many re-renders", react.dev's `useState` page tells you to expand the error in the console and look through the JavaScript stack for the `set` call responsible. That works here too. React runs its nested-update check inside the call that schedules the update, so your `set` call is usually in the stack.

If the page still responds, add `console.count("Results effect ran")` to the suspect effect. A count that climbs while nobody touches the page means that effect is in the loop. React Developer Tools helps as well: it adds Components and Profiler panels, and react.dev says it lets you inspect components and edit their props and state.

What finds the cause is logging what changed between two runs. react.dev's `useEffect` page suggests logging your dependencies, storing two of the logged arrays as global variables in the console, and comparing them with `Object.is`. A small hook can do that on every render:

```jsx
import { useEffect, useRef } from "react";

function useLogChangedDeps(name, deps) {
  const previous = useRef(deps);

  useEffect(() => {
    for (const key of Object.keys(deps)) {
      if (!Object.is(previous.current[key], deps[key])) {
        console.log(`[${name}] ${key} changed`, previous.current[key], deps[key]);
      }
    }
    previous.current = deps;
  });
}
```

Call it as `useLogChangedDeps("Results", { filters, onChange })` inside the suspect component.

A key that shows up on every render is your loop. Either it's created fresh each time, or the effect itself keeps rewriting it.

## Causes of the loop and how to fix each

### An effect with no dependency array that sets state

This is the classic React useEffect infinite loop. With no dependency array, react.dev says, an effect runs after every commit. If it also sets state to a new value, the render runs the effect, the effect causes a render, and round it goes.

```jsx
function Panel() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0 });

  useEffect(() => {
    setSize({ width: ref.current.offsetWidth }); // 🚩 new object, no dependency array
  });

  return <div ref={ref}>{size.width}px</div>;
}
```

Add the array, and keep the state a number:

```jsx
function Panel() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setWidth(ref.current.offsetWidth);
  }, []); // ✅ runs once after mount

  return <div ref={ref}>{width}px</div>;
}
```

Why a number? React ignores an update when the next state equals the previous one under `Object.is`, as the `useState` page says. A fresh `{ width }` object is never equal to the last one. That's why these loops involve objects and arrays far more often than strings or numbers.

### A dependency that is a new object, array or function on every render

A dependency created during render is different on every commit. react.dev's `useEffect` page shows exactly this with an `options` object.

```jsx
function Results({ query }) {
  const [rows, setRows] = useState([]);
  const filters = { query, limit: 20 }; // 🚩 new object on every render

  useEffect(() => {
    setRows(search(filters)); // search returns a new array each time
  }, [filters]); // 🚩 always "changed"

  return <List rows={rows} />;
}
```

The `useEffect` page gives two ways out. You can create the object inside the effect and depend on the primitive values:

```jsx
useEffect(() => {
  setRows(search({ query, limit: 20 }));
}, [query]); // ✅ a string
```

Or keep the object outside and memoize it, so it changes only when its inputs do. Use [`useMemo`](https://react.dev/reference/react/useMemo) for objects and arrays and [`useCallback`](https://react.dev/reference/react/useCallback) for functions:

```jsx
const filters = useMemo(() => ({ query, limit: 20 }), [query]);
```

The `useMemo` page says moving the value inside the effect is even better than memoizing it. Both pages also say to rely on `useMemo` and `useCallback` only as performance optimizations: if the code breaks without them, find the underlying problem first.

### State copied from props or other state through an effect

Setting state in an effect to something you could calculate can loop as well, even when the dependency array looks harmless:

```jsx
function List({ items }) {
  const [list, setList] = useState(items);

  useEffect(() => {
    setList(list.filter((item) => item.active)); // 🚩 a new array on every run
  }, [list]); // 🚩 depends on the state it sets
  // ...
}
```

`filter` returns a new array every time, so `list` always changes and the effect runs again. react.dev's [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) says to calculate the value during rendering instead, which also saves the extra cascading updates:

```jsx
function List({ items }) {
  const visible = items.filter((item) => item.active); // ✅ no state, no effect
  // ...
}
```

When an effect reads state only to work out the next state, pass an updater function instead. The `useEffect` page's example uses `setCount(c => c + 1)` so that `count` can leave the dependency list. An updater doesn't help an effect that has no dependency array at all. And to reset state when a prop changes, the same article suggests a `key` instead of an effect.

### A parent and child that update each other

Here a child calls a parent callback from an effect, and the parent rebuilds its props on every render:

```jsx
function Page() {
  const [rows, setRows] = useState([]);
  const filters = { query: "a", limit: 20 }; // 🚩 new object on every render
  const onChange = (next) => setRows(next); // 🚩 new function on every render

  return (
    <>
      <Results filters={filters} onChange={onChange} />
      <p>{rows.length} rows</p>
    </>
  );
}

function Results({ filters, onChange }) {
  useEffect(() => {
    onChange(search(filters)); // updates the parent...
  }, [filters, onChange]); // ...which hands this effect new props
  return null;
}
```

Memoizing both in `Page` breaks the cycle:

```jsx
const filters = useMemo(() => ({ query: "a", limit: 20 }), []);
const onChange = useCallback((next) => setRows(next), []);
```

Removing the effect is better still. In react.dev's "chains of computations" example, effects that trigger each other are replaced by one event handler that sets all the next state, while render calculates the rest.

### Layout effects and componentDidUpdate

The thrown message names `componentDidUpdate` for a reason. A class component that sets state there without a condition loops:

```jsx
componentDidUpdate() {
  this.setState({ loading: true }); // 🚩 runs after every update, including this one
}
```

react.dev says the logic in `componentDidUpdate` should usually be wrapped in conditions comparing `this.props` with `prevProps` and `this.state` with `prevState`, "otherwise, there's a risk of creating infinite loops":

```jsx
componentDidUpdate(prevProps) {
  if (this.props.userId !== prevProps.userId) {
    this.setState({ loading: true }); // ✅ only when the user changes
  }
}
```

`useLayoutEffect` loops the same way, and it costs more: state updates scheduled inside it block the browser from repainting, so react.dev says to prefer `useEffect` when you can. `getBoundingClientRect()` returns a new object on every call, so storing it in state with no dependency array never settles:

```jsx
useLayoutEffect(() => {
  setRect(ref.current.getBoundingClientRect()); // 🚩 a new object, no dependency array
});
```

The fix is the same as for the first cause, a dependency array and a number in state:

```jsx
useLayoutEffect(() => {
  setHeight(ref.current.getBoundingClientRect().height);
}, []); // ✅ measures once after mount
```

## Debugging a render loop with debugsy

debugsy is an [in-app React debug panel](/) that shows structured logs, render counts and dependency changes in one ordered list inside your own app. Two of its hooks fit this bug. The package comes from GitHub Packages, which asks for a GitHub token with `read:packages` even though the source is public; the install steps are on the home page.

Put both hooks in the looping component, here `Results` from the parent and child example:

```jsx
import { useEffect } from "react";
import { useRenderTracker, useWhyDidYouUpdate } from "@n-uf/debugsy";

function Results({ filters, onChange }) {
  useWhyDidYouUpdate("Results", { filters, onChange });
  useRenderTracker("Results", {
    renderThreshold: 20,
    onExcessiveRenders: (info) => {
      console.warn("Results render alert", info.renderCount, info.timeElapsed);
    },
  });

  useEffect(() => {
    onChange(search(filters));
  }, [filters, onChange]);

  return null;
}
```

Both hooks do nothing until the `dependencies` debug point is on: flip the Deps toggle in the panel, or run `window.debugsy.enable("dependencies")` in the console. Mount `<DebugsyLook />` once near the app root. It stays hidden until you press ⌘+D.

`useWhyDidYouUpdate` compares each key with the previous render by reference (`!==`), so a new `{ query: "a", limit: 20 }` counts as changed even when its contents are the same. For a loop that starts with the page, the log looks like this, with your own counts:

```
🔄 [Results] Dependencies changed:
📦 [Results] filters: object changed (#5) 🚀 📋 INIT
📝 [Results] onChange: function changed (#5) (function → function) 🚀 📋 INIT
```

The first entry carries the from and to values for each key. `📋 INIT` marks a key that keeps changing while debugsy is still in its start-up phase, and `🚀` marks every line logged in that phase. Start-up ends five seconds after the last tracked change, and every change restarts that timer. So a loop that never pauses stays in start-up and keeps the `📋 INIT` mark. If the loop starts later, after five quiet seconds (say, on a click), the same lines end in ` ⚠️ FREQUENT` and are logged as warnings. A key's first change is never marked.

Logs are throttled to one per 100 ms by default, so a fast loop won't log every render, and the `#` number counts logged changes rather than renders. An optional third argument, `onFrequentChanges`, and the returned `{ changesCount, hasFrequentChanges, changeTypes, frequentChangeTypes }` give you the same answer in code.

`useRenderTracker` counts renders. When the count reaches `renderThreshold` (10 if you leave it out), it writes a warning, shows a short notice in the panel, calls `onExcessiveRenders` and starts counting again:

```
⚠️ [Results] Excessive render rate detected: 41.67 renders/sec (20 in 480ms)
```

It counts renders, not time. A healthy component reaches 20 too, only slowly, so read the renders per second in the line.

debugsy warns. It doesn't stop the loop or block a render or a state update. In `onExcessiveRenders` you can log the info or set a flag in a ref, but the code still has to change. React itself throws only on the `componentDidUpdate` and `useLayoutEffect` paths; a loop through `useEffect`, like this one, gets the development warning and keeps going. debugsy also sees only the components where you call its hooks, and only the values you pass in.

One more limit comes from how the hooks work. They log from effects, which run after a commit, so they see loops that go through effects. "Too many re-renders" is thrown while React is still rendering the component (the check is in `renderWithHooksAgain` in React's source), before that render is committed. For that error, use the stack trace, not the panel.

debugsy is independent and not affiliated with Meta or the React team. It doesn't remove itself from production builds, so guard the import or the mount yourself, for example behind `process.env.NODE_ENV !== "production"`. If the loop turns out to be a plain extra render and not an infinite one, the sibling guide on how to [find what causes a re-render in React](/use-cases/why-did-this-component-render/) covers that case.

## A checklist for next time

1. Reproduce it in a development build, so you get the full message and the component name.
2. Open the error's JavaScript stack and find the `set` call.
3. Look at the effect. Does it have a dependency array? Does the array hold an object, array or function created during render?
4. Could the value being set be calculated during render? If so, delete the state and the effect. For an ordinary extra render, see [why a component re-rendered](/use-cases/why-did-this-component-render/).
5. Log the dependencies between two renders with `Object.is`, or let [debugsy's useWhyDidYouUpdate](/) do it, and fix the one that differs.
6. Setting state in `componentDidUpdate` or a layout effect? Put a comparison in front of it.
7. Run it again with `console.count` in the effect. The count should stop growing after the first few runs.
