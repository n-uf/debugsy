---
title: "When does React re-render? The rules, with examples"
description: "When does React re-render? On a state update, a parent render, a context change or a store change. The rules, small examples and how to avoid extra ones."
h1: "When does React re-render a component?"
mainKeyword: "when does react re render"
kind: what-is
published: 2026-11-09
updated: 2026-11-09
author: n-uf
takeaways:
  - "A React component renders again when its own state is updated, when an ancestor renders, when a context it reads gets a new value, or when an external store it subscribes to changes."
  - "A prop never changes by itself: it changes because the parent rendered. By default React renders everything nested inside the component that updated."
  - "State set to the same value (compared with Object.is) is skipped, and so is a mutated object passed back to its set function. Changing ref.current or a plain variable triggers nothing."
  - "memo skips a child only while every prop is equal under Object.is. It doesn't stop renders caused by the component's own state or by a context it reads."
  - "Inside StrictMode, development builds render each component an extra time to find impure code. To render again, change state; to reset a subtree, give it a new key."
faq:
  - q: "What causes a React component to re-render?"
    a: "A state update in the component itself, a parent that renders, a context it reads that gets a different value, or an external store it subscribes to with useSyncExternalStore that returns a different snapshot. React's Render and Commit page names the state update, in the component or one of its ancestors, as the trigger after the first render. The useContext and useSyncExternalStore pages describe the other two. A changed prop is not a separate cause."
  - q: "Does React re-render when state changes?"
    a: "Yes, when the new state is different from the current one. If it is identical under an Object.is comparison, the useState page says React skips re-rendering the component and its children, though it may still need to call your component before skipping them. Mutating an object in state and passing the same object back counts as identical, so nothing renders."
  - q: "Does React re-render when props change?"
    a: "Props change only when a parent renders and passes something new, so the parent's render is the trigger. By default a child renders whenever its parent does, whether or not its props differ. Wrapped in memo, a child skips that render while every prop is equal under Object.is, though the memo page calls this a performance optimization, not a guarantee."
  - q: "Does React re-render all child components?"
    a: "By default, yes: React renders everything nested inside the component whose state updated. A child wrapped in memo can skip it while its props are equal, and JSX passed in as children isn't re-rendered when the wrapper updates its own state. A child with its own state update, or one that reads a context that changed, still renders."
  - q: "How do I force a React component to re-render?"
    a: "Change something it renders from, usually its state. forceUpdate exists only on class components, and react.dev says to avoid it. Data that lives outside React can be read with useSyncExternalStore, which re-renders the component when the snapshot changes. To reset a whole subtree instead, give it a different key: React recreates it from scratch, state included."
sources:
  - title: "Render and Commit (react.dev)"
    url: "https://react.dev/learn/render-and-commit"
    checked: 2026-11-03
  - title: "useState (react.dev)"
    url: "https://react.dev/reference/react/useState"
    checked: 2026-11-03
  - title: "useReducer (react.dev)"
    url: "https://react.dev/reference/react/useReducer"
    checked: 2026-11-03
  - title: "useContext (react.dev)"
    url: "https://react.dev/reference/react/useContext"
    checked: 2026-11-03
  - title: "useSyncExternalStore (react.dev)"
    url: "https://react.dev/reference/react/useSyncExternalStore"
    checked: 2026-11-03
  - title: "useRef (react.dev)"
    url: "https://react.dev/reference/react/useRef"
    checked: 2026-11-03
  - title: "State: A Component's Memory (react.dev)"
    url: "https://react.dev/learn/state-a-components-memory"
    checked: 2026-11-03
  - title: "memo (react.dev)"
    url: "https://react.dev/reference/react/memo"
    checked: 2026-11-03
  - title: "useCallback (react.dev)"
    url: "https://react.dev/reference/react/useCallback"
    checked: 2026-11-03
  - title: "Keeping Components Pure (react.dev)"
    url: "https://react.dev/learn/keeping-components-pure"
    checked: 2026-11-03
  - title: "StrictMode (react.dev)"
    url: "https://react.dev/reference/react/StrictMode"
    checked: 2026-11-03
  - title: "React Compiler: Introduction (react.dev)"
    url: "https://react.dev/learn/react-compiler/introduction"
    checked: 2026-11-03
  - title: "Preserving and Resetting State (react.dev)"
    url: "https://react.dev/learn/preserving-and-resetting-state"
    checked: 2026-11-03
  - title: "Component, forceUpdate (react.dev)"
    url: "https://react.dev/reference/react/Component"
    checked: 2026-11-03
  - title: "useEffect (react.dev)"
    url: "https://react.dev/reference/react/useEffect"
    checked: 2026-11-03
  - title: "React Developer Tools (react.dev)"
    url: "https://react.dev/learn/react-developer-tools"
    checked: 2026-11-03
  - title: "React source, v19.3.1: ReactFiberBeginWork.js (props comparison and bail-out)"
    url: "https://raw.githubusercontent.com/facebook/react/v19.3.1/packages/react-reconciler/src/ReactFiberBeginWork.js"
    checked: 2026-11-03
  - title: "React source, v19.3.1: ReactJSXElement.js (the JSX transform passes a new props object)"
    url: "https://raw.githubusercontent.com/facebook/react/v19.3.1/packages/react/src/jsx/ReactJSXElement.js"
    checked: 2026-11-03
related:
  - /use-cases/why-did-this-component-render
  - /use-cases/react-render-count
  - /blog/useeffect-dependency-array
---

When does React re-render a component? When a state update is queued in that component or in one of its ancestors: React then renders the component that updated and, by default, everything nested inside it. A component also renders again when a context it reads gets a different value, and when the snapshot of an external store it subscribes to changes. A changed prop is not a trigger of its own. Props change because a parent rendered.

"Render" here means React calling your component function. Updating the screen is a separate step that comes after it. The rules below come from react.dev, checked on 2026-11-03. Two details come from elsewhere, and each says so where it appears: one from React's source, one from a test we ran.

## What triggers a re-render in React?

React's Render and Commit page gives two reasons for a component to render: it's the first render, or the state of the component or one of its ancestors has been updated. Context and external stores add two more ways in.

### A state update in the component

Calling a set function queues a render.

```tsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>;
}
```

React batches updates. It updates the screen after all the event handlers have run and called their set functions, so one click doesn't cause several re-renders. `useReducer`'s `dispatch` works the same way.

A set call can also render nothing. If the new value is identical to the current state under `Object.is`, React skips the component and its children. The `useState` page adds that React may still need to call your component before it skips the children. A mutated object counts as identical, because it is the same object:

```tsx
const [form, setForm] = useState({ name: "" });

// 🚩 same object: React ignores it
form.name = "Ada";
setForm(form);

// ✅ a new object: renders
setForm({ ...form, name: "Ada" });
```

An effect that sets state on every run is how a render loop starts. The guide to the [Maximum update depth exceeded error](/blog/maximum-update-depth-exceeded) covers that case.

### A parent renders

```tsx
import { useState } from "react";

function App() {
  const [query, setQuery] = useState("");
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <Results />
    </>
  );
}

function Results() {
  // no props, no state
  return <ul>{/* ... */}</ul>;
}
```

`Results` takes nothing and holds nothing, yet it renders on every keystroke because `App` does. Render and Commit calls the process recursive: if the updated component returns another component, React renders that one next, and so on until nothing is nested any further.

### A context it reads changes

```tsx
import { createContext, useContext, useState } from "react";

const ThemeContext = createContext("light");

function Page() {
  const [theme, setTheme] = useState("light");
  return (
    <ThemeContext value={theme}>
      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>Switch</button>
      <Toolbar />
    </ThemeContext>
  );
}

function Toolbar() {
  return <Button />;
}

function Button() {
  const theme = useContext(ThemeContext); // renders again when theme changes
  return <button className={theme}>OK</button>;
}
```

The `useContext` page says React re-renders the components that read a context, starting from the provider that receives a different value, and compares the previous and next values with `Object.is`.

### An external store it subscribes to changes

```tsx
import { useSyncExternalStore } from "react";
import { todosStore } from "./todos-store";

function TodosApp() {
  const todos = useSyncExternalStore(todosStore.subscribe, todosStore.getSnapshot);
  return <ul>{todos.map((todo) => <li key={todo.id}>{todo.text}</li>)}</ul>;
}
```

When the store calls the callback you gave `subscribe`, React calls `getSnapshot` again. If the value differs under `Object.is`, the component re-renders. The page also says `getSnapshot` must return the same value while the store hasn't changed. If it returns a new object on every call, you get an infinite loop and the error "The result of getSnapshot should be cached".

## Does React re-render when props change?

Yes, but a prop doesn't change on its own. It changes when the parent renders and hands down something new, so the real question is why the parent rendered.

Two details from React's source (v19.3.1). In `ReactFiberBeginWork.js`, before rendering a component, React compares the old and new props objects with `!==`. If they're the same object and no update or context change is pending for that component, it bails out. But a comment in `ReactJSXElement.js` notes that the JSX transform always passes a new props object, so a parent that renders gives every child it returns a new props object, even a child with no props. We also checked it in a jsdom test with a development build of React 19.3.1 on 2026-11-03: a child with no props, like `Results` above, rendered on every render of its parent.

So a child can render with props whose values are all the same as before. That's the gap `memo` is for. To check which case you have in a real component, [trace the render back to its cause](/use-cases/why-did-this-component-render).

## Does React re-render all child components?

By default, yes. The `memo` page says React normally re-renders a component whenever its parent re-renders. Render and Commit calls this default not optimal for performance when the updated component sits very high in the tree, then adds: don't optimize prematurely.

There are two ways to cut it down.

### What memo changes

`memo` makes a component skip the render while its props are unchanged. It compares every prop with `Object.is`, and the `memo` page puts it this way: `Object.is(3, 3)` is true, `Object.is({}, {})` is false. A primitive prop is fine. An object or function written in JSX is a new value on every render:

```tsx
import { memo } from "react";

type ResultsProps = {
  limit?: number;
  filters?: { limit: number };
  onPick?: () => void;
};

const Results = memo(function Results(props: ResultsProps) {
  return <ul>{/* ... */}</ul>;
});

function Search({ id, select }: { id: string; select: (id: string) => void }) {
  return (
    <>
      <Results limit={20} />                {/* skipped while limit stays 20 */}
      <Results filters={{ limit: 20 }} />   {/* new object each render: memo can't skip */}
      <Results onPick={() => select(id)} /> {/* new function each render: same */}
    </>
  );
}
```

The page's fixes: pass individual values instead of an object, declare a function outside the component so it never changes, or memoize in the parent. Inside `Search`, with `limit` as a prop as well:

```tsx
const filters = useMemo(() => ({ limit }), [limit]);
const onPick = useCallback(() => select(id), [id, select]);
```

`useCallback` returns the same function until a dependency changes, again judged by `Object.is`. [React compares an effect's dependencies](/blog/useeffect-dependency-array) the same way.

`memo` has limits. The page calls it a performance optimization, not a guarantee, so React may still render a memoized component. And it only watches props: a memoized component still re-renders for its own state or a context it uses.

### Pass JSX as children

```tsx
import { useState, type ReactNode } from "react";

function Wrapper({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)}>{open ? "Hide" : "Show"}</button>
      {children}
    </div>
  );
}

// in the parent: <Wrapper><Results /></Wrapper>
```

The `memo` page recommends this shape for components that wrap others: when the wrapper updates its own state, React knows its children don't need to re-render. The same page says to keep state local and not lift it further up than necessary.

## When does React re-render because of context?

When the provider gets a value that's different under `Object.is`, every component that reads that context re-renders. `memo` doesn't help here: the `useContext` page says skipping re-renders with `memo` doesn't stop children from receiving fresh context values.

The usual way to make a context change too often is an inline object:

```tsx
// a new object each time MyApp renders, so every reader renders too
return (
  <AuthContext value={{ currentUser, login }}>
    <Page />
  </AuthContext>
);
```

The page's fix is to wrap `login` in `useCallback` and the object in `useMemo`, so the value changes only when `currentUser` does. It also says that in smaller apps these extra renders aren't a problem. To re-render only for part of a context, the `memo` page suggests splitting the component: read the context in an outer component and pass the part you need to a memoized child as a prop.

## How does React re-render? Render, then commit

Rendering isn't the same as changing the page. The Render and Commit page splits it into three steps: trigger, render (React calls your components), then commit (React updates the DOM). On a re-render, React works out the minimal changes while rendering and applies only those in the commit. Its example re-renders a clock every second with a new `time`. Text you type into the `<input>` beside it stays, because that part of the output didn't change and React leaves it alone.

So a re-render that returns the same output touches no DOM. It still costs your function running, plus the functions of everything nested inside it, and how much that matters depends on the work those components do. The `memo` page says memoizing pays off only when a component re-renders often with the same props and its rendering is expensive. If there's no perceptible lag, it's unnecessary.

React can call your components this freely because it assumes each one is pure: the same props, state and context give the same JSX. The Keeping Components Pure page names those three as the inputs a component reads while rendering. A component that writes to a variable declared outside it during render gives different output when it's called twice, which is the kind of bug Strict Mode is built to surface.

### What doesn't trigger a render

Mutating state in place triggers nothing, as shown above. Neither do these:

- Changing `ref.current`. The `useRef` page says React doesn't re-render when you change it, because a ref is a plain JavaScript object. If you show `ref.current` in JSX, it won't update.
- Changing a local variable. The State page says local variables don't persist between renders, and changing one doesn't trigger a render.

## Why does React render twice in development?

Most likely Strict Mode. The `StrictMode` page lists its development-only checks: components re-render an extra time to catch impure rendering, effects re-run an extra time to catch missing cleanup, and ref callbacks re-run an extra time to catch missing ref cleanup. Your component body is called twice, and so are the functions you pass to `useState`, `useMemo` or `useReducer` and the updater functions you pass to set functions. None of it happens in production. The other source of an extra call is a set call with the current value, described earlier.

You'll notice it in two places. A `console.log` in the body prints twice per render; with React DevTools installed, the page says the second render's logs appear slightly dimmed, and a setting (off by default) hides them. And a counter you increment in the component body counts the extra calls too. The [React render count](/use-cases/react-render-count) guide shows how to count committed renders instead of function calls.

## What the React Compiler changes

React Compiler is a build-time tool. The react.dev introduction says it applies the equivalent of manual memoization automatically, and names skipping cascading re-renders (re-rendering a parent re-renders many components below it) as one of its two main uses. The `memo` page says that with it enabled you typically don't need `memo`, and that the compiler also memoizes intermediate values and expensive computations, which `memo` alone doesn't.

For existing code, react.dev recommends leaving current memoization in place or testing carefully before removing it. `useMemo` and `useCallback` stay available when you want exact control, for example for a value used as an effect dependency. The introduction calls the compiler stable, and still an optional addition today.

Everything above describes React without it. If you build with the compiler, many of the cascading re-renders these rules predict are skipped for you.

## How do you force a React component to re-render?

Change something the component renders from. In a function component that's usually state: set it to a value that's new under `Object.is`.

If the data lives outside React, read it with `useSyncExternalStore`, so a change in the store re-renders the component. The `Component` page says this hook has superseded `forceUpdate` for reading external data. `forceUpdate` still exists on class components and skips `shouldComponentUpdate`, but the same page says to avoid all uses of it.

The other lever is `key`. The Preserving and Resetting State page says a different key forces a subtree to reset its state:

```tsx
<Chat key={contact.id} contact={contact} />
```

That isn't a re-render of the same component. When the key changes, React recreates `Chat` from scratch, including any state in the tree below it. Use it when you want a reset.

What you can't do is make React render "just because". A component's output follows its props, state and context, so one of those has to change.

## Summary table: what re-renders what

| What happens | Re-renders? | How to avoid it |
|---|---|---|
| A set function gets a different value | The component and, by default, everything inside it | Keep state local, pass JSX as `children`, `memo` the children |
| A set function gets the same value, or a mutated object | No. React may still call the component before skipping its children | Nothing to do |
| A parent renders | Yes, every child it returns | `memo` with props that stay equal under `Object.is` |
| A context value changes | Every reader, `memo` or not | Memoize the value, or read the context in an outer component and pass the part as a prop |
| A store's snapshot changes | The subscribed component | Nothing to avoid. Keep `getSnapshot` returning the same value while the store is unchanged |
| `ref.current` or a local variable changes | No | Use state if the screen depends on it |
| Strict Mode, in development | An extra render each time | Development only |

## How to see which of these is happening in your app

The rules narrow the search, but only your app can tell you which one fired. To [find what causes a re-render in React](/use-cases/why-did-this-component-render) for a given component, compare the props, state and context it got on two renders and look for the one that's a new value. That guide does it three ways: the React DevTools Profiler (react.dev says DevTools adds Components and Profiler panels to a page), a small hook you paste in, and debugsy. If the render comes from an effect's dependencies, [check which useEffect dependency changed](/use-cases/useeffect-which-dependency-changed). To put a number on it, [counting renders](/use-cases/react-render-count) works from the same rules.

debugsy is an in-process [React debug panel](/): a component you mount in your own app, with one ordered log for debug messages, render counts and dependency changes. Its `useWhyDidYouUpdate` hook compares the values you pass with the previous render, key by key, by reference (`!==`). That catches the new-object and new-function cases from the memo section:

```tsx
import { useWhyDidYouUpdate } from "@n-uf/debugsy";

type ResultsProps = { filters: { limit: number }; onPick: () => void };

function Results({ filters, onPick }: ResultsProps) {
  useWhyDidYouUpdate("Results", { filters, onPick });
  return <ul>{/* ... */}</ul>;
}
```

A changed object shows up as `📦 [Results] filters: object changed (#2)`, and a changed function as `📝 [Results] onPick: function changed (#3) (function → function)`. When the component renders and none of the keys changed, nothing is logged, which points at the parent, a context or the component's own state. The hook sees only components where you call it and only the values you pass, and it does nothing until the Deps toggle (the `dependencies` debug point) is on. It logs. It never stops a render.

It isn't on npmjs yet: a public release there is in preparation. debugsy doesn't remove itself from production builds, so guard the mount yourself. It is independent and not affiliated with Meta or the React team.
