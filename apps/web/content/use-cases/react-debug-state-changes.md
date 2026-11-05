---
title: "Debug state changes in React: 4 ways to see them"
description: "Debug a state change in React: see when a value changed, what it changed to and which action did it, with DevTools, a hook, or debugsy."
h1: "How to debug state changes in React"
mainKeyword: "react debug state change"
kind: use-case
published: 2026-11-23
updated: 2026-11-23
draft: true
author: n-uf
takeaways:
  - "To debug a state change you need three things: when the value changed, what it changed to, and which action caused it."
  - "React DevTools shows a component's current hooks and lets you edit them. A Profiler recording lists which hooks changed, by number, but not their values."
  - "An effect that depends on the value runs after each commit where it changed, so it can log the previous and next value. Log the action in the function that dispatches it, not in a reducer: in Strict Mode React calls reducers twice."
  - "debugsy keeps your action logs and the changed values in one ordered log: dsy.log for what you write, useWhyDidYouUpdate for the keys that changed between renders. It sees only the components where you call it."
faq:
  - q: "How do I see when a state value changes in React?"
    a: "Log it from an effect that has the value as its dependency. React's useEffect page says an Effect with dependencies runs after the initial commit and after commits with changed dependencies, compared with Object.is. Keep the previous value in a ref and log both. Two updates inside one event handler show up as one change, because React batches them."
  - q: "Can I edit state in React DevTools?"
    a: "Yes. React's DevTools page says you can use it to inspect components and edit props and state. In the DevTools source (checked 2026-11-03), a function component's values sit under \"hooks\", numbered by position, and a class component's under \"state\". The source also says that, for the time being, only State and Reducer hooks support runtime overrides."
  - q: "Why does console.log in my reducer print twice?"
    a: "Most likely Strict Mode. React's useReducer page says that in Strict Mode React calls your reducer and initializer twice and uses the result of only one call, in development only. Event handlers are never called twice, so log the action where you dispatch it."
  - q: "Why does console.log show the old value right after I call the setter?"
    a: "Because setting state only changes it for the next render. React's State as a Snapshot page says a state variable's value never changes within a render. Log the next value in an effect, or compute it first and log that."
  - q: "Does debugsy track my state by itself?"
    a: "No. debugsy sees only the components where you call useWhyDidYouUpdate or useRenderTracker, and only the values you pass in, compared by reference. Your own dsy.log calls go to a debug point you switch on. debugsy doesn't remove itself from production builds, so guard the import or the mount yourself."
sources:
  - title: "React Developer Tools (react.dev)"
    url: "https://react.dev/learn/react-developer-tools"
    checked: 2026-11-03
  - title: "useEffect (react.dev)"
    url: "https://react.dev/reference/react/useEffect"
    checked: 2026-11-03
  - title: "useReducer (react.dev)"
    url: "https://react.dev/reference/react/useReducer"
    checked: 2026-11-03
  - title: "useState (react.dev)"
    url: "https://react.dev/reference/react/useState"
    checked: 2026-11-03
  - title: "State as a Snapshot (react.dev)"
    url: "https://react.dev/learn/state-as-a-snapshot"
    checked: 2026-11-03
  - title: "Queueing a Series of State Updates (react.dev)"
    url: "https://react.dev/learn/queueing-a-series-of-state-updates"
    checked: 2026-11-03
  - title: "React DevTools source: InspectedElementView.js (sidebar sections)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Components/InspectedElementView.js"
    checked: 2026-11-03
  - title: "React DevTools source: InspectedElementHooksTree.js (hooks section, numbering, \"State\")"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Components/InspectedElementHooksTree.js"
    checked: 2026-11-03
  - title: "React DevTools source: InspectedElementStateTree.js (state section)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Components/InspectedElementStateTree.js"
    checked: 2026-11-03
  - title: "React DevTools source: renderer.js (state shown for class components, hooks for function components)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/backend/fiber/renderer.js"
    checked: 2026-11-03
  - title: "React source: ReactDebugHooks.js (hook names \"State\" and \"Reducer\", which hooks can be edited)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-debug-tools/src/ReactDebugHooks.js"
    checked: 2026-11-03
  - title: "React DevTools source: ProfilerSettings.js (setting label)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Settings/ProfilerSettings.js"
    checked: 2026-11-03
  - title: "React DevTools source: WhatChanged.js (\"Why did this render?\" lines)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Profiler/WhatChanged.js"
    checked: 2026-11-03
  - title: "React DevTools source: HookChangeSummary.js (changed hooks by number)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Profiler/HookChangeSummary.js"
    checked: 2026-11-03
  - title: "debugsy source and README (GitHub)"
    url: "https://github.com/n-uf/debugsy"
    checked: 2026-11-03
related:
  - /blog/react-logging-library
  - /use-cases/why-did-this-component-render
  - /
---

To debug state changes in React, you need three facts about the value: when it changed, what it changed to, and which action made it change. Log the previous and next value when it changes, log the action where you trigger it, and read the two together in order. This page shows four ways to get there: the React DevTools Components tab, a small hook of your own, a log in your dispatch function, and debugsy's debug points.

The examples use a shopping cart. Say the total looks wrong after you add a mug, apply a coupon and add the mug again, and you want to see what each step did.

## Inspect and edit state in the DevTools Components tab

This needs no change to your code, so try it first. [React's DevTools page](https://react.dev/learn/react-developer-tools) says you can use DevTools to inspect components and edit props and state, and links the extension for Chrome, Firefox and Edge.

Select `Cart` in the Components tab and look at the sidebar. In the DevTools source (checked 2026-11-03), a function component's values sit under "hooks", numbered by position. `useState` shows up as "State" and `useReducer` as "Reducer". A class component's values sit under "state" instead. Change a value there, say the coupon, and watch the total. A comment in React's source says that "for the time being, only State and Reducer hooks support runtime overrides".

The Profiler tells you which value changed, after the fact. Tick "Record why each component rendered while profiling" in the Profiler settings, record the clicks, and select `Cart` in a commit. Under "Why did this render?" a function component gets a line like "Hook 2 changed", by number. A class component gets "State changed:" and its keys. Neither source file (`WhatChanged.js`, `HookChangeSummary.js`) shows an old or a new value, only names.

The values before and after, and the action behind them, you log yourself. debugsy is independent and isn't affiliated with Meta or the React team.

## Track state changes with a hook of your own

An effect with the value as its dependency runs after the commits where that value changed. [React's useEffect page](https://react.dev/reference/react/useEffect) says React compares each dependency with its previous value using `Object.is`. Keep the previous value in a ref and you can log both.

```tsx
import { useEffect, useRef } from "react";

export function useLogChange<T>(name: string, value: T) {
  const previous = useRef(value);

  useEffect(() => {
    if (Object.is(previous.current, value)) return;
    console.log(`[${name}]`, { from: previous.current, to: value });
    previous.current = value;
  }, [name, value]);
}
```

Call it with each value you care about: `useLogChange("items", items)`. The extra development-only setup and cleanup cycle that the same page describes for Strict Mode is harmless here: on mount the value equals the ref, so nothing is logged.

The hook sees the value after each commit, so two updates in one handler count as one change. React's [queueing page](https://react.dev/learn/queueing-a-series-of-state-updates) says it waits until all the code in the event handlers has run before it processes your state updates. And the hook only says what changed, not which action changed it.

## Log the action where you dispatch it

The action is the missing piece, and the reducer is the wrong place to log it. [React's useReducer page](https://react.dev/reference/react/useReducer) says a reducer must be pure, and that in Strict Mode React calls it twice and ignores the result of one call. So in development a `console.log` in the reducer prints every action twice. The same page says event handlers don't need to be pure, so React never calls them twice. Log where you dispatch.

```tsx
import { useCallback, useReducer } from "react";
import { useLogChange } from "./use-log-change";

export type Item = { id: string; price: number; qty: number };
export type CartState = { items: Item[]; coupon: string | null };
export type Action =
  | { type: "add"; id: string; price: number }
  | { type: "remove"; id: string }
  | { type: "coupon"; code: string | null };

export function cartReducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "add": {
      const found = state.items.some((item) => item.id === action.id);
      const items = found
        ? state.items.map((item) =>
            item.id === action.id ? { ...item, qty: item.qty + 1 } : item,
          )
        : [...state.items, { id: action.id, price: action.price, qty: 1 }];
      return { ...state, items };
    }
    case "remove":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.id),
      };
    case "coupon":
      return { ...state, coupon: action.code };
  }
}

export function Cart() {
  const [{ items, coupon }, dispatch] = useReducer(cartReducer, {
    items: [],
    coupon: null,
  });
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = Math.max(0, subtotal - (coupon === "SPRING" ? 2 : 0));

  useLogChange("items", items);
  useLogChange("total", total);

  const act = useCallback((action: Action) => {
    console.log("cart action", action);
    dispatch(action);
  }, []);

  return (
    <>
      <button onClick={() => act({ type: "add", id: "mug", price: 12 })}>
        Add mug
      </button>
      <button onClick={() => act({ type: "coupon", code: "SPRING" })}>
        Apply coupon
      </button>
      <button onClick={() => act({ type: "remove", id: "mug" })}>Remove mug</button>
      <p>
        {items.length} items, total {total}
      </p>
    </>
  );
}
```

With `useState` it's the same idea: log in the handler, then call the setter. Don't log the state variable right after the setter. [State as a Snapshot](https://react.dev/learn/state-as-a-snapshot) says setting state only changes it for the next render, so you'd print the old value.

We ran this in a jsdom test (React 19.3.1, 2026-11-03). Three clicks wrote these lines (printed as text here).

```text
cart action {"type":"add","id":"mug","price":12}
[items] {"from":[],"to":[{"id":"mug","price":12,"qty":1}]}
[total] {"from":0,"to":12}
cart action {"type":"coupon","code":"SPRING"}
[total] {"from":12,"to":10}
cart action {"type":"add","id":"mug","price":12}
[items] {"from":[{"id":"mug","price":12,"qty":1}],"to":[{"id":"mug","price":12,"qty":2}]}
[total] {"from":10,"to":22}
```

Now it reads as a story: the coupon changed only the total, and the second add raised `qty` to 2. The cost is `console.log` calls spread through your components, to delete when you're done. If you'd rather keep the calls and switch them on by name, the guide to choosing a [React logging library](/blog/react-logging-library) compares the options.

## Debug state changes in React with debugsy

debugsy is an in-process [React debug panel](/): a component you mount in your own app that shows one ordered log of debug messages, render counts and dependency changes. Your action logs and the changed values land in one list, in order. The source is on [GitHub](https://github.com/n-uf/debugsy).

It isn't on npmjs yet: a public release there is in preparation. It needs React 19.

### Declare a debug point for the feature

A debug point is a named log channel. Declare it once with `registerModule`, in a file such as `cart-debug.ts`. The module and every point need a `description`.

```ts
import { registerModule } from "@n-uf/debugsy";

registerModule("shop", {
  label: "Shop",
  emoji: "🛒",
  description: "cart state and the actions behind it",
  points: {
    basket: {
      emoji: "🧺",
      label: "Basket",
      description: "cart actions and state changes",
    },
  },
});
```

You log to a point by its bare key, `"basket"`, not `"shop.basket"`. A call to a point that isn't switched on is dropped.

### Log the action, and let the hook watch the values

This is the `Cart` from before with two changes: `dsy.log` replaces `console.log` in the dispatch function, and one `useWhyDidYouUpdate` call replaces the two `useLogChange` calls. `dsy` works anywhere; in a component you can also call `useDebugsy()`.

```tsx
import { useCallback, useReducer } from "react";
import { dsy, useWhyDidYouUpdate } from "@n-uf/debugsy";
import "./cart-debug"; // registers the "basket" point
import { cartReducer, type Action } from "./cart";

export function Cart() {
  const [{ items, coupon }, dispatch] = useReducer(cartReducer, {
    items: [],
    coupon: null,
  });
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = Math.max(0, subtotal - (coupon === "SPRING" ? 2 : 0));

  useWhyDidYouUpdate("Cart", { items, coupon, total });

  const act = useCallback((action: Action) => {
    dsy.log("basket", `action: ${action.type}`, action);
    dispatch(action);
  }, []);

  return (
    <>
      <button onClick={() => act({ type: "add", id: "mug", price: 12 })}>
        Add mug
      </button>
      <button onClick={() => act({ type: "coupon", code: "SPRING" })}>
        Apply coupon
      </button>
      <button onClick={() => act({ type: "remove", id: "mug" })}>Remove mug</button>
      <p>
        {items.length} items, total {total}
      </p>
    </>
  );
}
```

The signature is `dsy.log(point, message, data?, level?, tags?)`. If you'd rather write your own from and to, keep `useLogChange` and swap its `console.log` line for this one:

```tsx
dsy.log("basket", `${name} changed`, { from: previous.current, to: value });
```

`dsy` also works outside components, in a store or a request callback. Mount `<DebugsyLook />` once near the app root; in Next.js, render it from your own `"use client"` component. It starts hidden: press ⌘+D to open it, once for the compact controls and again for the full log.

### Switch the points on

Two points need to be on: your `basket` point, and the built-in `dependencies` point, because `useWhyDidYouUpdate` does nothing until it is. The quickest switch is the page URL, read when the page loads:

```text
http://localhost:3000/?debug=basket,dependencies
```

The panel's toggles (Basket, and Deps) and `window.debugsy.enable("basket")` work too, and are remembered in `localStorage`.

Name your points in the URL rather than writing `?debug=all`. debugsy expands "all" to the points registered when it loads, which is before your `registerModule` call runs. In our jsdom run of 26.11.0, `?debug=all` logged the dependency entries and none of the `basket` ones.

### Read the log

In the same jsdom run, after the first two clicks, `window.debugsy.getLogs()` held these entries, in order, trimmed to point, message and data (without the `tracking` field debugsy adds to each key).

```text
basket        action: add
              {"type":"add","id":"mug","price":12}
dependencies  🔄 [Cart] Dependencies changed:
              {"items":{"from":[],"to":[{"id":"mug","price":12,"qty":1}]},"total":{"from":0,"to":12}}
dependencies  📦 [Cart] items: object changed (#1) 🚀
basket        action: coupon
              {"type":"coupon","code":"SPRING"}
dependencies  🔄 [Cart] Dependencies changed:
              {"coupon":{"from":null,"to":"SPRING"},"total":{"from":12,"to":10}}
dependencies  📦 [Cart] coupon: object changed (#1) 🚀
```

The "Dependencies changed" entry carries the from and to value of every key that changed, and `(#1)` counts how many times that key has changed so far. A primitive like `total` gets its own line only at the verbose or debug level (the panel's Quiet / Normal / Verbose button), but it's in the summary entry's data either way. The 🚀 marker means debugsy still counts the app as starting up, and `📋 INIT` means a key changed again quickly during start-up. [Find what causes a re-render in React](/use-cases/why-did-this-component-render) explains both.

Don't trust the label on `coupon`. Going from `null` to a string shows as "object changed", because debugsy picks the label with `typeof` and `typeof null` is `"object"`. The data has the real values.

Two more things come from the code. Checks are throttled, 100 ms by default: a render inside that window is skipped, and the next check compares against the last values it looked at, so two quick changes can arrive as one entry. And the first render after you switch the point on is only the baseline; changes show from the render after that.

An entry also keeps a reference to the object you pass, not a copy. State you replace, as the reducer above does, logs fine. If you mutate an array in place after logging it, the entry points at the changed array. Entries are copied to the browser console as well, and nothing is sent anywhere. The [logging library comparison](/blog/react-logging-library) covers that and the rest of debugsy's logger.

## When the log doesn't show the change you expect

Look for a gap between the action and the change.

An action with no change entry after it means the state wasn't replaced. [React's useState page](https://react.dev/reference/react/useState) says React ignores an update when the next state equals the previous one under `Object.is`, and that this usually happens when you change an object or array in state directly and pass it back. React skips the re-render, so neither hook gets to log. Copy instead: `setItems([...items, item])`.

One entry for two actions is batching, or the throttle above. Its `from` is the value at the previous check.

If a change follows the wrong action and nothing you dispatched sits right above it, look for an effect or a store that sets the value. And if the value changes over and over with no clicks at all, it's a loop; this guide to [stopping a render loop](/blog/maximum-update-depth-exceeded) covers that.

If the changed value is an effect's dependency, [see which dependency an effect reacted to](/use-cases/useeffect-which-dependency-changed) with the same hook. For what makes a component render at all, read [the rules for a re-render](/blog/when-does-react-re-render). For breakpoints and the rest of the toolbox, see how to [debug a React app](/blog/how-to-debug-react-app).

## Which method to use

| | DevTools | Hook with `console.log` | Log at dispatch | debugsy |
|---|---|---|---|---|
| Needs a code change | No | Yes, per value | Yes, per action | Yes: a point, a hook, `dsy.log` |
| Shows the old and new value | The current value; the Profiler names what changed | Yes | Only if you log them | Yes, in the "Dependencies changed" entry |
| Shows the action | No | No | Yes | Yes, with `dsy.log` |
| Keeps a history | A Profiler recording | The browser console | The browser console | An ordered log, up to 10,000 entries |
| Edit a value to test a guess | Yes; of hooks, State and Reducer only | No | No | No |
| In production | Nothing in your code | Stays until deleted | Stays until deleted | Not removed for you: guard it |

Use DevTools first, as your React state debugger, when you don't know where the state lives or you want to change a value and see what happens. A hook with `console.log` is enough for one value on one afternoon. Logging at dispatch answers "which action?" whichever tool you use. debugsy makes more sense when the bug takes several steps and you want them in one list with the changed values, switched on from a URL without a rebuild. The price is a hook call in each component you care about.

It sees only the values you pass in and doesn't read React's internals. It never stops a render or an update, and it doesn't remove itself from production builds: put the import or the mount behind a check such as `process.env.NODE_ENV !== "production"`.
