---
title: "Check which useEffect dependency changed in React"
description: "Check which useEffect dependency changed in React: compare the array with Object.is, paste a small hook, or log it with debugsy's useWhyDidYouUpdate."
h1: "How to check which useEffect dependency changed"
mainKeyword: "react useeffect check which dependency changed"
kind: use-case
published: 2026-11-05
updated: 2026-11-05
author: n-uf
takeaways:
  - "React compares each useEffect dependency with its previous value using Object.is, so a new object or function counts as a change even when its contents are the same."
  - "To find the dependency that changed, compare the arrays from two renders item by item: in the console, with a small hook that keeps the last array in a ref, or with debugsy's useWhyDidYouUpdate."
  - "react.dev's fixes for a dependency that changes every render: create the object or function inside the effect, move it out of the component, or depend on primitive values. The useEffect page keeps useMemo and useCallback as a last resort."
  - "React's useEffect page lists no option for deep comparison, and react.dev's memo page warns that deep equality checks can become incredibly slow."
  - "debugsy's useWhyDidYouUpdate doesn't read your dependency array. You pass the values, it compares each key by reference with the previous render and logs the keys that changed."
faq:
  - q: "Why does my useEffect run twice?"
    a: "In development, most likely Strict Mode. React's useEffect page says that with Strict Mode on, React runs setup and cleanup one extra time before the actual setup, to check that your cleanup undoes what the setup did. If the effect keeps running on later renders too, either the array is missing or a dependency is changing: compare the array between two renders."
  - q: "How does React compare useEffect dependencies?"
    a: "Each dependency is compared with its previous value using Object.is. For objects and functions that means identity: a new object is different from the old one even with the same contents. MDN's Object.is page adds the two cases where it differs from ===: NaN equals NaN, and +0 does not equal -0."
  - q: "Can useEffect deep-compare an object?"
    a: "Not by itself. The useEffect reference documents the Object.is comparison and lists no option to change it. Deep-compare hooks exist, but react.dev's memo page warns that deep equality checks can become incredibly slow, and the use-deep-compare-effect README says to use it only if you really can't find a way to use useEffect."
  - q: "How do I see which dependency changed without a library?"
    a: "Log the dependency array on every render, store two of the logged arrays as global variables in the browser console and compare them with Object.is, as react.dev's useEffect page describes. Or keep the previous array in a ref and log the items that differ, as the hook on this page does."
  - q: "Does debugsy read my dependency array?"
    a: "No. useWhyDidYouUpdate takes an object of the values you want watched, compares each key with the previous render by reference and logs the keys that changed. To watch an effect, pass the same values you list in its array."
sources:
  - title: "useEffect (react.dev)"
    url: "https://react.dev/reference/react/useEffect"
    checked: 2026-11-03
  - title: "Removing Effect Dependencies (react.dev)"
    url: "https://react.dev/learn/removing-effect-dependencies"
    checked: 2026-11-03
  - title: "StrictMode (react.dev)"
    url: "https://react.dev/reference/react/StrictMode"
    checked: 2026-11-03
  - title: "useMemo (react.dev)"
    url: "https://react.dev/reference/react/useMemo"
    checked: 2026-11-03
  - title: "memo (react.dev)"
    url: "https://react.dev/reference/react/memo"
    checked: 2026-11-03
  - title: "useState (react.dev)"
    url: "https://react.dev/reference/react/useState"
    checked: 2026-11-03
  - title: "useEffectEvent (react.dev)"
    url: "https://react.dev/reference/react/useEffectEvent"
    checked: 2026-11-03
  - title: "Object.is() (MDN)"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is"
    checked: 2026-11-03
  - title: "JSON.stringify() (MDN)"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify"
    checked: 2026-11-03
  - title: "use-deep-compare-effect README (GitHub)"
    url: "https://github.com/kentcdodds/use-deep-compare-effect"
    checked: 2026-11-03
related:
  - /use-cases/why-did-this-component-render
  - /blog/maximum-update-depth-exceeded
  - /
---

To check which useEffect dependency changed, compare the dependency array from the previous render with the one from this render, item by item, using `Object.is`. React makes the same comparison, so the item that differs is the reason the effect ran again. You can do it by hand in the browser console, with a small hook you paste in, or with debugsy's `useWhyDidYouUpdate`. If the culprit turns out to be an object or a function, the fixes are further down.

The examples use a search panel that sends a request after every render, not only when the query changes.

```tsx
import { useEffect, useState } from "react";

type Row = { id: string; title: string };
type Props = { query: string; onResults: (rows: Row[]) => void };

// searchApi stands in for your own request function
function SearchPanel({ query, onResults }: Props) {
  const [sort, setSort] = useState("recent");
  const filters = { sort, limit: 20 };

  useEffect(() => {
    let ignore = false;
    searchApi(query, filters).then((rows) => {
      if (!ignore) onResults(rows);
    });
    return () => {
      ignore = true;
    };
  }, [query, filters, onResults]);

  // ...
}

// in the parent
<SearchPanel query={query} onResults={(next) => setRows(next)} />
```

There are three values in the array. The question is which of them changes on renders where nobody typed anything.

## Compare the dependencies in the console

React's `useEffect` page describes a method that needs no extra code. Log the array next to the effect:

```tsx
console.log([query, filters, onResults]);
```

In the browser console, right-click the arrays logged by two different renders and choose "Store as a global variable". If they were saved as `temp1` and `temp2`, `Object.is(temp1[1], temp2[1])` tells you whether the second item is the same in both. Repeat for each index. There's nothing to set up. The catch is that you run one comparison per index and keep track of which index is which yourself.

## A hook that logs the changed dependency

If you debug useEffect problems often, a hook saves the bookkeeping. This one keeps the previous array in a ref, and after every render it logs the items that differ under `Object.is`, with the names you give them.

```tsx
import { useEffect, useRef, type DependencyList, type EffectCallback } from "react";

export function useEffectDebugger(
  name: string,
  effect: EffectCallback,
  deps: DependencyList,
  depNames: string[],
) {
  const previous = useRef<DependencyList | null>(null);

  // runs after every render, before the real effect
  useEffect(() => {
    const before = previous.current;
    previous.current = deps;
    // first run, or Strict Mode re-running the effect for the same render
    if (before === null || before === deps) return;

    const changed = deps.flatMap((dep, i) =>
      Object.is(dep, before[i])
        ? []
        : [{ name: depNames[i] ?? `#${i}`, from: before[i], to: dep }],
    );
    if (changed.length > 0) console.log(`[${name}] dependencies changed:`, changed);
  });

  useEffect(effect, deps);
}
```

Use it in place of `useEffect` while you look:

```tsx
useEffectDebugger(
  "SearchEffect",
  () => {
    // the same effect as before
  },
  [query, filters, onResults],
  ["query", "filters", "onResults"],
);
```

On a render where nobody typed, the logged list has an entry for `filters` and one for `onResults`, each with its old and new value, and nothing for `query`. Those two are the culprits. After the first run, a render that logs nothing is a render where the effect didn't run.

The hook watches the same array React sees. Put `useEffect` back when you're done.

## Check which useEffect dependency changed with debugsy

debugsy is an in-process [React debug panel](/): a component you mount in your own app that shows one ordered log of debug messages, render counts and dependency changes. Its `useWhyDidYouUpdate` hook does the comparison for you, and the result lands in that log next to your other messages. The source is on [GitHub](https://github.com/n-uf/debugsy).

It installs from GitHub Packages, not npmjs. Add `@n-uf:registry=https://npm.pkg.github.com` to `.npmrc`, then run `pnpm add @n-uf/debugsy`. GitHub Packages asks for a GitHub token with `read:packages`, even for public packages. Peer dependencies are `react` and `react-dom` 19, and `react18-json-view`. It ships TypeScript source, and so does its dependency `@n-uf/harbuz`, so a Next.js app adds both to `transpilePackages`. Its styles are Tailwind CSS v4 classes, so the app needs Tailwind v4 and imports `@n-uf/harbuz/styles` and `@n-uf/debugsy/styles` after `tailwindcss` in its CSS. The [home page](/) has the install and mount steps.

Mount `<DebugsyLook />` once near the app root, then call the hook next to the effect with the same values you list in its array:

```tsx
import { useEffect, useState } from "react";
import { useWhyDidYouUpdate } from "@n-uf/debugsy";

function SearchPanel({ query, onResults }: Props) {
  const [sort, setSort] = useState("recent");
  const filters = { sort, limit: 20 };

  useWhyDidYouUpdate("SearchEffect", { query, filters, onResults });

  useEffect(() => {
    // the same effect, with [query, filters, onResults]
  }, [query, filters, onResults]);

  // ...
}
```

The hook does nothing until the `dependencies` debug point is on. The panel starts hidden: press ⌘+D to show its controls (press it again for the full log) and switch on Deps. Or run this in the console:

```js
window.debugsy.enable("dependencies")
```

The choice is kept in `localStorage` (`surface-debug-config`). In development, `NEXT_PUBLIC_SURFACE_DEBUG=dependencies` turns it on at start. The first render after you switch it on is the baseline, and changes are logged from the render after that.

### Read the log

After each render, the hook compares every key of the object with the previous render, by reference (`!==`). For the search panel, on a render where nobody typed, it writes:

```text
🔄 [SearchEffect] Dependencies changed:
📦 [SearchEffect] filters: object changed (#3) 🚀 📋 INIT
📝 [SearchEffect] onResults: function changed (#3) (function → function) 🚀 📋 INIT
```

`query` isn't listed, so it stayed the same on that render. The first line carries the from and to value of every changed key as data. `(#3)` counts how many times that key has changed so far; your numbers will differ. A changed primitive, such as the `sort` string, gets its own line only at the verbose or debug level (the panel's Quiet / Normal / Verbose button), but it's always in the first line's data. Logs are throttled, 100 ms by default.

The marks come from start-up. debugsy treats the app as starting up until 5 seconds pass with no tracked change, and every tracked change restarts the timer. During start-up each key line ends with ` 🚀`, and a fast-changing key also gets ` 📋 INIT`. After start-up, a key that keeps changing ends in ` ⚠️ FREQUENT` and is logged as a warning. A request loop that never pauses stays in start-up, so it keeps showing `📋 INIT`.

Some limits. The hook logs what changed between renders; it doesn't know whether your effect ran, so if you pass a value that isn't in the effect's array, you may see a change that never re-ran the effect.

It compares with `!==` where React uses `Object.is`. A `NaN` shows as changed on every render, and a switch between `0` and `-0` doesn't show at all.

It sees only the components where you call it, and it doesn't trace context on its own.

## Why does an object or function dependency change every render?

Because `filters` is built inside the component, it's a new object each render. React's page on removing effect dependencies says each newly created object and function is considered distinct from all the others, whatever is inside:

```js
const a = { sort: "recent", limit: 20 };
const b = { sort: "recent", limit: 20 };
Object.is(a, b); // false
```

The same goes for the inline `onResults` in the parent. react.dev's advice is to avoid objects and functions as dependencies where you can: move them outside the component, inside the effect, or extract primitive values from them. Here the object moves inside the effect, and the effect depends on `sort`, a string:

```tsx
useEffect(() => {
  let ignore = false;
  searchApi(query, { sort, limit: 20 }).then((rows) => {
    if (!ignore) onResults(rows);
  });
  return () => {
    ignore = true;
  };
}, [query, sort, onResults]);
```

The parent can pass `setRows` itself, which the `useState` page says has a stable identity:

```tsx
<SearchPanel query={query} onResults={setRows} />
```

The `useEffect` page keeps `useMemo` and `useCallback` (for functions) as a last resort, for when the other fixes don't help. The `useMemo` page adds that React may throw away a cached value, which would re-fire the effect, and that it's better to move the object inside the effect. For a callback the effect only calls and shouldn't react to, `useEffectEvent` lets the effect read the latest function without depending on it. Its page says to use it only for logic that is genuinely an event fired from Effects, not to avoid listing dependencies.

The page on [why a component re-rendered](/use-cases/why-did-this-component-render) shows the same fixes from the prop side. If the effect sets state straight away, an unstable dependency turns into the loop described in the article on [maximum update depth exceeded](/blog/maximum-update-depth-exceeded).

## Does useEffect deep-compare its dependencies?

No. The `useEffect` reference says React compares each dependency with its previous value using `Object.is`, and it lists no setting for another comparison. A new object with the same contents is a change.

If you can't get rid of the object, you can compare by content instead. Each way has a cost.

- `JSON.stringify` in the array. A string compares by content. MDN's page says `undefined`, functions and symbols are omitted from objects and become `null` in arrays, so a change in those values never shows. It also walks the whole value on every render.
- A deep-compare hook. The use-deep-compare-effect README describes it as `useEffect` with deep comparison on the inputs, and warns near the top to use it only if you really can't find a way to use `useEffect`. It also cautions about an object that holds a function defined during render: that function changes every render, so the effect runs every render again.
- Deep equality in general. react.dev's `memo` page says, about a custom `arePropsEqual`, that deep equality checks can become incredibly slow and can freeze your app for many seconds if someone changes the data structure later. Anything that walks a value on every render pays a similar cost.

A deep comparison hides the unstable reference instead of removing it. It's usually cheaper to find that reference with one of the methods above and fix it where it's created.

## Why does my useEffect run twice in development?

React's `StrictMode` page says that with Strict Mode on, React runs one extra setup and cleanup cycle for every effect in development, and also renders components an extra time. The `useEffect` page places that extra cycle immediately after the component mounts. It isn't a dependency change, so the hook above skips it and debugsy writes nothing for it. If the double run breaks something, the `useEffect` page says your cleanup is missing logic that undoes the setup. To count renders rather than effect runs, see how to read a [React render count](/use-cases/react-render-count).

## Which way to use

| | Console and `Object.is` | Hook you write | debugsy |
|---|---|---|---|
| Runs | Browser console | Your component code | Panel in your app |
| Setup | `console.log` the array, store two as globals | Paste, replace `useEffect` | Token, `pnpm add`, mount, call the hook, switch on Deps |
| You give it | The array itself | Effect, array and names | An object with the values |
| Shows | Same or different, one index at a time | Names, old and new value of what changed | From and to per key, a counter, a frequent flag |
| Reads your real array | Yes | Yes | No, you pass the values |
| In production | Delete the log | Stays until deleted | Not removed for you: guard it |

The console is enough for a one-off. The hook suits several effects without installing anything. debugsy fits when the dependency changes only now and then and you want the change in the same ordered log as your own debug messages. It needs React 19 and a call in each component you care about. If the component re-renders but the effect isn't the problem, start from how to [find what causes a re-render in React](/use-cases/why-did-this-component-render).

debugsy is independent. It isn't affiliated with Meta, the React team or the author of use-deep-compare-effect. It doesn't remove itself from production builds, so guard the import or the mount yourself, for example behind `process.env.NODE_ENV !== "production"`.
