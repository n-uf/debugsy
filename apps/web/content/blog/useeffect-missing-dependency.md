---
title: "React Hook useEffect has a missing dependency: how to fix it"
description: "React Hook useEffect has a missing dependency means your effect reads a value its array doesn't list. The full message, and the fix for each case."
h1: "How to fix \"React Hook useEffect has a missing dependency\""
mainKeyword: "react hook useeffect has a missing dependency"
kind: how-to
published: 2026-11-23
updated: 2026-11-23
draft: true
author: n-uf
takeaways:
  - "The warning comes from the react-hooks/exhaustive-deps rule, which both recommended presets of eslint-plugin-react-hooks set to warn. It means the effect reads a reactive value (a prop, state, or anything declared in the component) that is missing from its dependency array."
  - "The message always ends with the same two options: include the value or remove the dependency array. Including it is the fix; with no array the effect runs after every commit."
  - "For a function, react.dev's fixes are to declare it inside the effect, move it out of the component, or wrap it in useCallback as a last resort. If it is event logic, useEffectEvent keeps it out of the array (React 19.2 or later)."
  - "React's docs say the set function from useState and dispatch from useReducer have a stable identity, and that you can omit a dependency when the linter lets you. The rule knows that only for setters destructured straight from those hooks in the same component."
  - "Suppressing the rule means you \"lie\" to React about what the effect depends on. react.dev recommends treating the lint error as a compilation error."
faq:
  - q: "What does \"React Hook useEffect has a missing dependency\" mean?"
    a: "It means the effect's code reads a reactive value that isn't listed in its dependency array. The rule's own page says that React then won't re-run the effect when that value changes, which causes stale closures where the effect uses outdated values. Reactive values are props, state, and the variables and functions declared in the component body."
  - q: "How do I fix \"Either include it or remove the dependency array\"?"
    a: "Include it. Add the value the message names to the array, as react.dev's Removing Effect Dependencies page does with roomId. Removing the array makes the effect run after every commit, which is rarely what you want. If the added value makes the effect run too often, change the code instead of the array: move the value inside the effect, use an updater function, or use an Effect Event."
  - q: "Do I need to add dispatch or a setState function to the dependency array?"
    a: "Not if the linter doesn't ask. The useState and useReducer pages say the set function and dispatch have a stable identity, so including them won't make the effect fire. The rule recognises them when they come straight from useState, useReducer or useActionState in the same component; if they arrive from a prop, a custom hook or context, it asks for them, and adding them is safe when they are stable."
  - q: "Can I disable the exhaustive-deps rule for one effect?"
    a: "You can, but react.dev advises against it. Its Removing Effect Dependencies page says that suppressing the linter means you lie to React about the values the effect depends on, and recommends treating the lint error as a compilation error. Its timer example shows the result: the effect keeps using the function from the first render, so the counter stays stuck at 1."
  - q: "Why does adding the missing dependency make my effect run on every render?"
    a: "Because the dependency is an object or function created during render, and React compares dependencies with Object.is. Each new one counts as different, whatever is inside, and the rule then reports that it makes the dependencies change on every render. Declare it inside the effect, move it outside the component, depend on its primitive values, or, as a last resort, wrap it in useMemo or useCallback."
sources:
  - title: "eslint-plugin-react-hooks: ExhaustiveDeps.ts (react/react, GitHub)"
    url: "https://github.com/react/react/blob/main/packages/eslint-plugin-react-hooks/src/rules/ExhaustiveDeps.ts"
    checked: 2026-11-03
  - title: "eslint-plugin-react-hooks: ESLintRuleExhaustiveDeps-test.js (react/react, GitHub)"
    url: "https://github.com/react/react/blob/main/packages/eslint-plugin-react-hooks/__tests__/ESLintRuleExhaustiveDeps-test.js"
    checked: 2026-11-03
  - title: "eslint-plugin-react-hooks: src/index.ts (react/react, GitHub)"
    url: "https://github.com/react/react/blob/main/packages/eslint-plugin-react-hooks/src/index.ts"
    checked: 2026-11-03
  - title: "React: exhaustive-deps (eslint-plugin-react-hooks)"
    url: "https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps"
    checked: 2026-11-03
  - title: "React: Removing Effect Dependencies"
    url: "https://react.dev/learn/removing-effect-dependencies"
    checked: 2026-11-03
  - title: "React: useEffect"
    url: "https://react.dev/reference/react/useEffect"
    checked: 2026-11-03
  - title: "React: useEffectEvent"
    url: "https://react.dev/reference/react/useEffectEvent"
    checked: 2026-11-03
  - title: "React: useCallback"
    url: "https://react.dev/reference/react/useCallback"
    checked: 2026-11-03
  - title: "React: useState"
    url: "https://react.dev/reference/react/useState"
    checked: 2026-11-03
  - title: "React: useReducer"
    url: "https://react.dev/reference/react/useReducer"
    checked: 2026-11-03
  - title: "React 19.2 release post"
    url: "https://react.dev/blog/2025/10/01/react-19-2"
    checked: 2026-11-03
  - title: "React Router: useNavigate"
    url: "https://reactrouter.com/api/hooks/useNavigate"
    checked: 2026-11-03
related:
  - /blog/useeffect-dependency-array
  - /use-cases/useeffect-which-dependency-changed
  - /blog/maximum-update-depth-exceeded
---

"React Hook useEffect has a missing dependency" is a warning from the `react-hooks/exhaustive-deps` lint rule. It means your effect reads a prop, a state value or something else declared in the component, and that value isn't in the dependency array. The fix is to add what the message names. If adding it makes the effect run too often, change the effect, not the array: move the value inside, pass an updater function, or use an Effect Event.

The examples are React 19 and TypeScript. The message text comes from the rule's source on GitHub and the fixes from react.dev, all read on 2026-11-03. How the array itself works is in the article on the [useEffect dependency array](/blog/useeffect-dependency-array); this one is about the useEffect missing dependency warning.

## What the "React Hook useEffect has a missing dependency" warning says

The message is built in `ExhaustiveDeps.ts`, in eslint-plugin-react-hooks. Both recommended presets set the rule to `warn`, so it shows as a warning, not an error. The core never changes:

```text
React Hook useEffect has a missing dependency: 'userId'. Either include it or remove the dependency array.
React Hook useEffect has missing dependencies: 'roomId' and 'serverUrl'. Either include them or remove the dependency array.
```

The names are sorted, and three or more read `'a', 'b', and 'c'`. "Remove the dependency array" means an effect that runs after every commit, which is rarely what you want. An effect with no array gets no missing-dependency message, since there's nothing to compare. If it calls a state setter directly in its body, the rule reports a different message, which goes on to suggest an array: `React Hook useEffect contains a call to 'setCount'. Without a list of dependencies, this can lead to an infinite chain of updates.`

Some patterns add a hint after the core message:

| Hint | The rule saw |
|---|---|
| `If 'onSave' changes too often, find the parent component that defines it and wrap that definition in useCallback.` | A destructured function prop that the effect calls |
| `You can also do a functional update 'setCount(c => ...)' if you only need 'count' in the 'setCount' call.` | The state variable read inside its own setter call, as in `setCount(count + 1)` |
| `However, 'props' will change when *any* prop changes, so the preferred fix is to destructure the 'props' object outside of the useEffect call and refer to those specific props inside useEffect.` | A call like `props.onSave()` |

The editor's quick fix is a suggestion titled "Update the dependencies array to be: [...]". It rewrites the array and nothing else.

## Why a missing dependency is a bug, not noise

The rule's page on react.dev says that without the dependency, React won't re-run the effect when the value changes, so the effect uses outdated values. Here the effect fetches a profile once:

```tsx
import { useEffect, useState } from "react";

type User = { id: string; name: string };

// fetchUser stands in for your own request function
function Profile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let ignore = false;
    fetchUser(userId).then((next) => {
      if (!ignore) setUser(next);
    });
    return () => {
      ignore = true;
    };
  }, []); // missing dependency: 'userId'

  return <h1>{user?.name}</h1>;
}
```

Switch to another user while `Profile` stays mounted, and it keeps showing the first one: the effect ran once, with the first `userId`. The fix is the one the message offers:

```tsx
}, [userId]);
```

react.dev says the same of its own `roomId` example: the linter is right, because the value may change over time. If you wanted the effect to run once on mount, the lint page still recommends including the dependency (a ref guard is its fallback). And with Strict Mode on, React runs setup and cleanup one extra time in development, so even `[]` doesn't mean once there (see [why useEffect runs twice](/blog/useeffect-runs-twice)).

## When the missing dependency is a function

When the name in quotes is a function, as in `missing dependency: 'load'`, the code usually looks like this:

```tsx
function Feed({ topic }: { topic: string }) {
  const [items, setItems] = useState<string[]>([]);

  function load() {
    return fetchItems(topic); // reads the topic prop
  }

  useEffect(() => {
    let ignore = false;
    load().then((next) => {
      if (!ignore) setItems(next);
    });
    return () => {
      ignore = true;
    };
  }, []); // missing dependency: 'load'
  // ...
}
```

Adding `load` to the array doesn't end the matter. A function declared in the body is new on every render, so the effect now runs after every commit, and the rule swaps one warning for another: `The 'load' function makes the dependencies of useEffect Hook (at line …) change on every render. Move it inside the useEffect callback. Alternatively, wrap the definition of 'load' in its own useCallback() Hook.` The effect also sets state, which makes a render loop; the article on [maximum update depth exceeded](/blog/maximum-update-depth-exceeded) shows how to find those. If you can't tell which dependency keeps re-running the effect, [log what changed between renders](/use-cases/useeffect-which-dependency-changed). The fix depends on where the function comes from:

| The function | Fix |
|---|---|
| Only the effect uses it | Declare it inside the effect. It stops being a reactive value, and the array lists what it reads |
| Uses no props or state | Move it outside the component |
| Used by the effect and by other code in the component | Wrap it in `useCallback` with its own dependencies |
| Runs because the user did something | Call it from the event handler and drop the effect |
| A prop the parent builds on every render | Memoize it in the parent, or read it through an Effect Event |

The first row, react.dev's first choice:

```tsx
useEffect(() => {
  let ignore = false;
  fetchItems(topic).then((next) => {
    if (!ignore) setItems(next);
  });
  return () => {
    ignore = true;
  };
}, [topic]); // a string: unchanged unless topic changes
```

The useCallback page agrees that removing the function dependency is better than memoizing it. When you do need `useCallback`, the effect lists the memoized function:

```tsx
const load = useCallback(() => fetchItems(topic), [topic]);
// the effect that calls load() now lists [load]
```

### A function that comes in as a prop

When the effect calls `onReceiveMessage` from props, the parent's inline arrow is new on every render, so the effect would reconnect each time the parent renders (the article on [when React re-renders](/blog/when-does-react-re-render) explains why). react.dev's answer for event logic is `useEffectEvent`, which you import from `react`:

```tsx
import { useEffect, useEffectEvent } from "react";

function ChatRoom({
  roomId,
  onReceiveMessage,
}: {
  roomId: string;
  onReceiveMessage: (message: string) => void;
}) {
  const onMessage = useEffectEvent((message: string) => {
    onReceiveMessage(message); // always the latest prop
  });

  useEffect(() => {
    const connection = createConnection(roomId); // your own chat client
    connection.connect();
    connection.on("message", onMessage);
    return () => connection.disconnect();
  }, [roomId]); // onMessage is an Effect Event: not listed
  // ...
}
```

The React 19.2 release post lists `useEffectEvent` among that version's features, so you need 19.2 or later. Call an Effect Event only from effects or other Effect Events, and don't use it just to skip a dependency: the reference says that hides bugs. The rule reports an Effect Event that ends up in the array: "Functions returned from `useEffectEvent` must not be included in the dependency array."

## When the missing dependency is dispatch or a setter

react.dev's useState page says the set function has a stable identity, so you often see it left out of the dependencies, and including it won't make the effect fire. The useReducer page says the same about `dispatch`. Both add that if the linter lets you omit a dependency without errors, it is safe to do. Here exhaustive-deps asks for neither:

```tsx
const [count, setCount] = useState(0);
const [state, dispatch] = useReducer(reducer, initialState); // yours

useEffect(() => {
  const id = setInterval(() => {
    setCount((c) => c + 1);
    dispatch({ type: "tick" });
  }, 1000);
  return () => clearInterval(id);
}, []); // no missing dependency
```

The source shows how it knows. It treats the second value of `const [a, b] = useState()`, `useReducer()` or `useActionState()` as stable, along with `useTransition`'s start function and `useRef` results. Anything else is assumed to change, so `dispatch` can still be flagged:

```tsx
const { dispatch } = useCart(); // your own hook

useEffect(() => {
  dispatch({ type: "mounted" });
}, [dispatch]); // leave dispatch out and the rule asks for it
```

A setter that comes from a prop, a custom hook or context looks like any other value to the rule, so it asks. Add it. If the hook returns the `dispatch` of a `useReducer`, nothing changes; if it builds a new function every render, the effect will re-run, and the fix belongs inside the hook.

Often the flagged name isn't the setter but the state variable, as `'count'` in a `setCount(count + 1)` call. That comes with the functional-update hint from the table above. Write `setCount((c) => c + 1)` and the effect no longer reads `count`, so nothing is missing.

## When it's navigate from a router

This is React Router's `useNavigate`. For another router, check what its own docs say about the function's identity.

```tsx
import { useEffect } from "react";
import { useNavigate } from "react-router";

function RequireUser({ user }: { user: User | null }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);
  // ...
}
```

The rule doesn't know `useNavigate`, so leave `navigate` out and it's reported as missing. Listing it is the fix. React Router's page (version 8.5.1) says the Data and Framework mode implementation can return a stable reference that doesn't change identity across navigations. It says no such thing about Declarative mode (`<BrowserRouter>`), which uses a separate implementation, so there, check whether the effect re-runs. The page also says it's often better to use `redirect` in action or loader functions than this hook, which can remove the effect entirely.

## Objects and the whole props object

An object created in the component body is a reactive value, and it's a new object on every render. React compares dependencies with `Object.is`, so listing it makes the effect run after every commit, and the rule says so: `The 'options' object makes the dependencies of useEffect Hook (at line …) change on every render.`

```tsx
const options = { serverUrl: "https://localhost:1234", roomId };

useEffect(() => {
  const connection = createConnection(options);
  connection.connect();
  return () => connection.disconnect();
}, [options]); // a different object after every render
```

react.dev's fixes: move the object outside the component if it uses no props or state, create it inside the effect and depend on `roomId`, or read primitive values out of an object that comes in as a prop (the [dependency array article](/blog/useeffect-dependency-array) has a table of them). The `props` hint is the same idea: for a call like `props.onSave()` the rule asks for the whole `props` object, which changes when any prop changes. Destructure the prop you use:

```tsx
function Form({ onSave }: { onSave: () => void }) {
  useEffect(() => {
    onSave();
  }, [onSave]);
  // ...
}
```

If `onSave` then changes too often, the fixes for a function prop above apply.

## Why you shouldn't suppress the rule

```tsx
useEffect(() => {
  // ...
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

react.dev's Pitfall box says that when dependencies don't match the code, there is a very high risk of introducing bugs, and that with a suppression you "lie" to React. In its timer example the interval keeps calling `onTick` from the first render, where `count` was 0 and `increment` was 1, so the counter always shows 1 whatever the buttons say. The page's advice is to treat the dependency lint error as a compilation error. Its fix is to add `onTick` to the list, and to make it an Effect Event if the interval should be set up only once.

## Find which dependency keeps changing

After you add the value, the effect may fire more often than you expect. To [check which useEffect dependency changed](/use-cases/useeffect-which-dependency-changed), a small hand-written hook works. debugsy is an in-process React debug panel, and its `useWhyDidYouUpdate` hook compares the values you pass with the previous render, key by key and by reference. It doesn't read your dependency array, so you pass the same values:

```tsx
import { useWhyDidYouUpdate } from "@n-uf/debugsy";

// in Feed, next to the effect that lists [topic, load]
useWhyDidYouUpdate("FeedEffect", { topic, load });
```

Mount `<DebugsyLook />` once near the app root. The hook does nothing until the `dependencies` debug point is on: use the Deps toggle in the panel, or run `window.debugsy.enable("dependencies")` in the console. With `load` declared in the Feed body, the log shows only the key that changed:

```text
🔄 [FeedEffect] Dependencies changed:
📝 [FeedEffect] load: function changed (#3) (function → function) 🚀 📋 INIT
```

`topic` isn't listed, so it stayed the same. `🚀` marks a line logged during debugsy's start-up phase and `📋 INIT` a key that keeps changing in it. Start-up ends five seconds after the last tracked change, so a loop that never pauses keeps both marks. debugsy warns and never stops a loop, and it sees only the components where you call its hooks.

It isn't on npmjs yet: a public release there is in preparation. It doesn't remove itself from production builds, so guard the import or the mount yourself. The mount steps are on [debugsy's home page](/). debugsy is independent and not affiliated with Meta, the React team or the React Router project.
