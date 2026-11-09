---
title: "useEffect dependency array: what it does and what goes in it"
description: "The useEffect dependency array decides when an effect runs again. How React compares it, why objects and functions trip it up, and how to fix that."
h1: "How the useEffect dependency array works"
mainKeyword: "useeffect dependency array"
kind: what-is
published: 2026-11-09
updated: 2026-11-09
draft: false
author: n-uf
takeaways:
  - "With no dependency array an effect runs after every commit. With [] it runs after the initial commit only. With [a, b] it runs after the initial commit and after commits where a or b changed."
  - "React compares each dependency with its value from the previous render using Object.is, so an object or function created during render counts as changed on every render, even when its contents are the same."
  - "You don't choose the dependencies: the array has to list every reactive value the effect reads (props, state and everything declared in the component body), and the exhaustive-deps lint rule checks that."
  - "To keep an object or function from changing, create it inside the effect, move it out of the component, depend on its primitive values, or, as a last resort, memoize it with useMemo or useCallback."
  - "useEffectEvent, one of the new features in React 19.2, lets an effect read the latest props and state without them being dependencies."
faq:
  - q: "Does useEffect need a dependency array?"
    a: "No, the argument is optional. Without it, the effect runs after every commit of the component. React's useEffect reference shows a chat effect that reconnects whenever you edit a message it doesn't even read, and says that's why you'll usually specify the array. An effect with no array that also sets state is a common way to get an endless loop."
  - q: "What does an empty dependency array do in useEffect?"
    a: "It makes the effect run after the initial commit only. That's correct only when the effect reads no reactive values (props, state or anything declared in the component body). React's reference notes that it still runs one extra time in development, and the lint rule reports the missing dependencies if you use [] for an effect that reads props or state."
  - q: "Can a useEffect dependency be a function?"
    a: "Yes. React compares it by reference with Object.is, so a function declared in the component body counts as changed after every render and the effect re-runs every time. React's reference says creating the function isn't a problem; using it as a dependency is. Declare it inside the effect, move it out of the component if it uses no reactive values, or wrap it in useCallback as a last resort."
  - q: "Why does an object in the dependency array make my effect run on every render?"
    a: "Object.is treats two separately created objects as different, even when their contents match. An object created during render is a new object on every render, so React sees a changed dependency each time. Create the object inside the effect, depend on its primitive values, or memoize it with useMemo."
  - q: "Is it okay to disable the exhaustive-deps lint rule?"
    a: "No. React's docs say that suppressing it lies to React about which values the effect depends on, and recommend treating the lint error as a compilation error. If the dependency the rule asks for makes the effect run too often, change the code (move the value inside the effect, use an updater function or an Effect Event), not the array."
sources:
  - title: "React: useEffect"
    url: "https://react.dev/reference/react/useEffect"
    checked: 2026-11-03
  - title: "React: Removing Effect Dependencies"
    url: "https://react.dev/learn/removing-effect-dependencies"
    checked: 2026-11-03
  - title: "React: Lifecycle of Reactive Effects"
    url: "https://react.dev/learn/lifecycle-of-reactive-effects"
    checked: 2026-11-03
  - title: "React: Render and Commit"
    url: "https://react.dev/learn/render-and-commit"
    checked: 2026-11-03
  - title: "React: exhaustive-deps (eslint-plugin-react-hooks)"
    url: "https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps"
    checked: 2026-11-03
  - title: "React: eslint-plugin-react-hooks"
    url: "https://react.dev/reference/eslint-plugin-react-hooks"
    checked: 2026-11-03
  - title: "React: useEffectEvent"
    url: "https://react.dev/reference/react/useEffectEvent"
    checked: 2026-11-03
  - title: "React 19.2 release post"
    url: "https://react.dev/blog/2025/10/01/react-19-2"
    checked: 2026-11-03
  - title: "React: useMemo"
    url: "https://react.dev/reference/react/useMemo"
    checked: 2026-11-03
  - title: "React: useCallback"
    url: "https://react.dev/reference/react/useCallback"
    checked: 2026-11-03
  - title: "React: StrictMode"
    url: "https://react.dev/reference/react/StrictMode"
    checked: 2026-11-03
  - title: "React: You Might Not Need an Effect"
    url: "https://react.dev/learn/you-might-not-need-an-effect"
    checked: 2026-11-03
related:
  - /use-cases/useeffect-which-dependency-changed
  - /blog/maximum-update-depth-exceeded
  - /blog/when-does-react-re-render
---

The useEffect dependency array is the optional second argument to `useEffect`. It lists the reactive values the effect reads, and React runs the effect again only after a commit where one of them differs from the previous render, compared with `Object.is`. With no array the effect runs after every commit. With `[]` it runs after the initial commit only. With `[a, b]` it runs after the initial commit and after any commit where `a` or `b` changed. Objects and functions are where it gets tricky: they can look unchanged and still count as new.

The examples are React 19 and TypeScript. Every claim about React comes from a react.dev page read on 2026-11-03.

## The three forms of the dependency array

| Form | The effect runs | Fits when |
|---|---|---|
| `useEffect(fn)` | After every commit | It really has to follow every render. Rare |
| `useEffect(fn, [])` | After the initial commit | It reads no reactive values |
| `useEffect(fn, [a, b])` | After the initial commit, and after commits where `a` or `b` changed | It reads `a` and `b` |

A commit is the step after rendering, when React applies the result to the DOM (react.dev's Render and Commit page walks through it). In code:

```tsx
// []: after the initial commit
useEffect(() => {
  function onResize() {
    console.log(window.innerWidth);
  }
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}, []);

// [count]: after the initial commit and whenever count changes
useEffect(() => {
  document.title = `${count} new messages`;
}, [count]);
```

In development, Strict Mode re-runs every effect one extra time to find missing cleanup. That extra run doesn't mean your array is wrong. {{live:/blog/useeffect-runs-twice}}A separate article on [Strict Mode's extra effect run](/blog/useeffect-runs-twice) covers what it checks and how to write a cleanup that passes it.{{/live}}

## Does useEffect need a dependency array?

No. The argument is optional, and without it the effect runs after every commit. React's reference shows why you usually want one: a chat effect with no array reconnects every time you edit a message, a value the effect doesn't even read, because each keystroke re-renders the component.

An effect with no array that also sets state is a common way to get a render loop. The state update renders the component, the render runs the effect, the effect sets state again. The article on [maximum update depth exceeded](/blog/maximum-update-depth-exceeded) shows how to find that loop.

## What goes in the array

You don't choose the dependencies. React's Removing Effect Dependencies page puts it this way: the list describes your code, so to change the list, change the code. Every reactive value the effect reads has to be in it. Reactive values are props, state, and all the variables and functions declared directly in the component body.

A constant declared outside the component isn't a dependency. If an effect calls `createConnection(serverUrl, roomId)`, `roomId` (a prop) goes in the array and `serverUrl` (a constant outside the component) doesn't.

A mutable value such as `location.pathname` or `ref.current` can't be a dependency either. Changing it doesn't trigger a render, so React would never notice.

Leave something out and you get a stale closure: the effect keeps using an outdated value. The lint rule, covered below, catches that.

## How React compares dependencies

After each render React compares every item in the array with the item at the same position from the previous render, using `Object.is`. That's why the list must have a constant number of items and be written inline, like `[dep1, dep2, dep3]`.

Strings, numbers and booleans with the same value are equal. Objects and functions aren't: React's docs say each newly created one is distinct from all the others, whatever is inside.

```js
Object.is("music", "music"); // true
Object.is({ id: 1 }, { id: 1 }); // false: two objects with identical contents
```

What makes a component render in the first place is covered in [when does React re-render](/blog/when-does-react-re-render).

## Objects in the dependency array

React's useEffect page warns that an effect depending on an object or function created during rendering might run too often. Here an object is rebuilt on every render:

```tsx
function SearchResults({ query, pageSize }: { query: string; pageSize: number }) {
  const [rows, setRows] = useState<string[]>([]);
  const params = { query, pageSize }; // new object on every render

  useEffect(() => {
    let ignore = false;
    fetchRows(params).then((result) => {
      if (!ignore) setRows(result);
    });
    return () => {
      ignore = true;
    };
  }, [params]); // different after every commit

  return <ul>{rows.map((row) => <li key={row}>{row}</li>)}</ul>;
}
```

`fetchRows` stands for your own data function. Because `params` is new on every render, the effect runs after every commit, sets state to a new array, renders again, and fetches on every pass. With several dependencies it isn't always obvious which one keeps changing; [logging each previous and current value](/use-cases/useeffect-which-dependency-changed) settles it. React's docs give these fixes:

| Fix | Use it when |
|---|---|
| Create the object inside the effect | Only the effect uses it |
| Move it outside the component | It doesn't depend on props or state |
| Read primitive values from it | It comes from props: destructure it and list the strings and numbers |
| Wrap it in `useMemo` | Last resort, when the other fixes don't help |

The first fix:

```tsx
useEffect(() => {
  let ignore = false;
  fetchRows({ query, pageSize }).then((result) => {
    if (!ignore) setRows(result);
  });
  return () => {
    ignore = true;
  };
}, [query, pageSize]); // two primitives: unchanged unless you set another value
```

With `useMemo`, the object is recreated only when its inputs change:

```tsx
const params = useMemo(() => ({ query, pageSize }), [query, pageSize]);
```

The `useMemo` page says it returns the value it already calculated when no dependency changed under `Object.is`. It also says to rely on it only as a performance optimization: if your code doesn't work without it, fix the underlying problem first.

## Can a useEffect dependency be a function?

Yes. A function is a value like any other, and React compares it by reference. A function declared in the component body is new on every render, so an effect that lists it re-runs after every commit.

```tsx
function Feed({ topic }: { topic: string }) {
  const [items, setItems] = useState<string[]>([]);
  const load = () => fetchItems(topic); // new function on every render

  useEffect(() => {
    load().then(setItems);
  }, [load]); // different after every commit
  // ...
}
```

React's reference says creating a function on every render isn't a problem by itself and needs no optimizing. The cost shows up when the function is a dependency. The fixes mirror the ones for objects:

- Declare the function inside the effect. Then the effect depends on `topic`, a string.
- Move it outside the component if it uses no props or state. It's no longer reactive.
- If it runs because the user did something, call it from the event handler and drop the effect. The `exhaustive-deps` page says that in most cases you don't need the effect.
- Wrap it in `useCallback` if it has to stay in the component. The useCallback page adds that React Compiler memoizes values and functions automatically, which reduces the need for manual calls.

When the function comes in as a prop, the parent decides whether it's stable. An inline `onResults={(rows) => ...}` is new every time the parent renders (see [what triggers a render](/blog/when-does-react-re-render)). Memoizing it in the parent works, and so does the next section.

## Reading state or props without depending on them

Sometimes an effect reads a value only to use it, not to react to it. React's docs show two tools.

The first is an updater function. An effect that does `setCount(count + 1)` has to list `count`, which restarts the interval on every tick. Pass an updater and `count` is no longer read:

```tsx
useEffect(() => {
  const id = setInterval(() => setCount((c) => c + 1), 1000);
  return () => clearInterval(id);
}, []); // count isn't read here, so it isn't a dependency
```

The second is `useEffectEvent`, for code that is conceptually an event fired from an effect, such as calling a callback prop. The React 19.2 release post lists it among that version's new features, so you need React 19.2 or later.

```tsx
function SearchResults({
  query,
  onResults,
}: {
  query: string;
  onResults: (rows: string[]) => void;
}) {
  const onLoaded = useEffectEvent((rows: string[]) => {
    onResults(rows); // always the latest onResults
  });

  useEffect(() => {
    let ignore = false;
    fetchRows({ query, pageSize: 20 }).then((rows) => {
      if (!ignore) onLoaded(rows);
    });
    return () => {
      ignore = true;
    };
  }, [query]); // onLoaded is an Effect Event: not listed
  // ...
}
```

A new `onResults` from the parent no longer re-runs the fetch. The rules are strict. Call an Effect Event only from inside effects or other Effect Events, never pass it to other components or hooks, and never list it in the array. The reference also says not to use it just to avoid specifying dependencies, because that hides bugs. The release post says to upgrade `eslint-plugin-react-hooks` to the latest version so the linter doesn't try to insert Effect Events as dependencies.

## The exhaustive-deps lint rule

`react-hooks/exhaustive-deps` is a rule in `eslint-plugin-react-hooks`. Its page says it validates that the dependency arrays of hooks like `useEffect`, `useMemo` and `useCallback` contain all necessary dependencies, and that a missing one causes stale closures. The plugin's page lists it in the recommended preset.

The Removing Effect Dependencies page shows the message like this:

```text
React Hook useEffect has a missing dependency: 'roomId'
```

React's docs say that by suppressing the rule you "lie" to React about what the effect depends on, and recommend treating the lint error as a compilation error. They add that there's always a better solution than ignoring the linter. When it asks for a dependency that makes the effect run too often, use one of the fixes above. {{live:/blog/useeffect-missing-dependency}}The full message, and the fix when the missing value is a function, `dispatch` or a router's `navigate`, are in [React Hook useEffect has a missing dependency](/blog/useeffect-missing-dependency).{{/live}}

## useEffect dependency array best practices

Each comes from React's docs.

1. Let the linter check the array. The list describes the code, so a hand-written one drifts when the effect changes.
2. Don't suppress the rule to control when the effect runs. The effect then keeps stale values.
3. Prefer primitives as dependencies, and create objects and functions inside the effect when only the effect uses them. A string or number changes only when you set another value; an object or function can change on every render.
4. Reach for `useMemo` and `useCallback` last, and only as optimizations. If the code breaks without them, there's a bug to fix first.
5. Use an updater function when you only need the previous state. The state variable leaves the array and the effect stops restarting.
6. Ask whether you need an effect at all. You Might Not Need an Effect says effects are for synchronizing with an external system; if none is involved, you shouldn't need one.
7. Keep one effect per job. React's docs say each effect should represent an independent synchronization process, with its own array.

## How to see which dependency changed

When an effect runs more often than you expect, React's useEffect page gives a console recipe for finding the item that differs: log the array, store the logged arrays from two renders as global variables (`temp1`, `temp2`), and compare items with `Object.is(temp1[0], temp2[0])`.

A hook can do the comparing for you. The use case on how to [check which useEffect dependency changed](/use-cases/useeffect-which-dependency-changed) has a hand-written one and the full debugsy walkthrough.

debugsy is an in-process debug panel for React 19 apps. Its `useWhyDidYouUpdate` hook compares the values you pass with the previous render, key by key and by reference, and logs the ones that changed. It doesn't read the useEffect dependency array, so you pass the same values in:

```tsx
import { useWhyDidYouUpdate } from "@n-uf/debugsy";

// inside SearchResults, next to the effect
useWhyDidYouUpdate("SearchEffect", { query, pageSize, params });
```

Mount `<DebugsyLook />` once near the app root. The hook does nothing until the `dependencies` debug point is on: switch on the Deps toggle in the panel, or run `window.debugsy.enable("dependencies")` in the console. The log then shows only the keys that changed. In the example from the objects section, `query` and `pageSize` stay the same and `params` is the one that changes:

```text
🔄 [SearchEffect] Dependencies changed:
📦 [SearchEffect] params: object changed (#3) 🚀 📋 INIT
```

`🚀` marks lines logged during debugsy's start-up phase, and `📋 INIT` marks a key that keeps changing in that phase. Start-up ends five seconds after the last tracked change, so a loop that never pauses keeps both marks. debugsy warns; it never stops a loop, and it sees only the components where you call its hooks. If the changing dependency sets state, the [article on that error](/blog/maximum-update-depth-exceeded) has a checklist.

Install debugsy with `npm i @n-uf/debugsy`. It doesn't remove itself from production builds, so guard the import or the mount yourself. The mount code is on [debugsy's home page](/). debugsy is independent and not affiliated with Meta or the React team.
