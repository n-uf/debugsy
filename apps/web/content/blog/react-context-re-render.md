---
title: "React context re-render: what renders and how to limit it"
description: "A React context re-render hits every component that reads the changed value, memo or not. Why a new object value does it, and the fixes."
h1: "React context re-renders: what a value change renders, and how to limit it"
mainKeyword: "react context re render"
kind: what-is
published: 2026-11-26
updated: 2026-11-26
draft: true
author: n-uf
takeaways:
  - "When a provider gets a value that is different under Object.is, React re-renders every component that reads that context with useContext. Components that don't read it aren't re-rendered by the change."
  - "memo doesn't stop it. A memoized component still re-renders for a context it uses, because memo only compares props."
  - "A provider that writes value={{ items, addItem }} passes a new object each time it renders, so every reader re-renders whenever the provider does. useMemo and useCallback keep the value the same until its data changes."
  - "Splitting state and dispatch into two contexts keeps components that only dispatch out of state updates. A store read with useSyncExternalStore lets each component subscribe to one slice."
  - "debugsy's useWhyDidYouUpdate logs a context value as changed only if you pass it in. It logs and never stops a render."
faq:
  - q: "Does React context re-render all child components?"
    a: "No, only the components that read the context. The useContext page says React re-renders the children that use a particular context, starting from the provider that receives a different value. A component that doesn't call useContext for it isn't re-rendered by the change, as long as the provider receives its children as a prop and not as JSX it creates itself."
  - q: "Does memo prevent a context re-render?"
    a: "No. The useContext page says skipping re-renders with memo doesn't stop children from receiving fresh context values, and the memo page says a memoized component still re-renders when a context it uses changes. To limit it, read the context in an outer component and pass the part you need to a memoized child as a prop."
  - q: "Why does my context re-render when the value hasn't changed?"
    a: "Most likely the provider builds a new object or function for value on every render. React compares the previous and next value with Object.is, and two objects with the same contents are different values. The useContext page fixes it by wrapping the object in useMemo and its functions in useCallback."
  - q: "Is React context bad for performance?"
    a: "Not by itself. The useContext page says the extra renders from a new value object aren't a problem in smaller apps, and the memo page says memo only pays off when a component re-renders often with the same props and its rendering is expensive. Measure with the Profiler first, then cut the re-renders that cost something."
  - q: "How do I re-render only when part of a context changes?"
    a: "Split the component or the data. The memo page suggests an outer component that reads the context and passes what it needs to a memoized child as a prop. You can also split one context into several, or move the data to an external store and read a slice of it with useSyncExternalStore."
sources:
  - title: "useContext (react.dev)"
    url: "https://react.dev/reference/react/useContext"
    checked: 2026-11-03
  - title: "memo (react.dev)"
    url: "https://react.dev/reference/react/memo"
    checked: 2026-11-03
  - title: "createContext (react.dev)"
    url: "https://react.dev/reference/react/createContext"
    checked: 2026-11-03
  - title: "useMemo (react.dev)"
    url: "https://react.dev/reference/react/useMemo"
    checked: 2026-11-03
  - title: "useCallback (react.dev)"
    url: "https://react.dev/reference/react/useCallback"
    checked: 2026-11-03
  - title: "useEffect (react.dev)"
    url: "https://react.dev/reference/react/useEffect"
    checked: 2026-11-03
  - title: "useReducer (react.dev)"
    url: "https://react.dev/reference/react/useReducer"
    checked: 2026-11-03
  - title: "useSyncExternalStore (react.dev)"
    url: "https://react.dev/reference/react/useSyncExternalStore"
    checked: 2026-11-03
  - title: "Passing Data Deeply with Context (react.dev)"
    url: "https://react.dev/learn/passing-data-deeply-with-context"
    checked: 2026-11-03
  - title: "Scaling Up with Reducer and Context (react.dev)"
    url: "https://react.dev/learn/scaling-up-with-reducer-and-context"
    checked: 2026-11-03
  - title: "Render and Commit (react.dev)"
    url: "https://react.dev/learn/render-and-commit"
    checked: 2026-11-03
  - title: "zustand README (GitHub)"
    url: "https://raw.githubusercontent.com/pmndrs/zustand/main/README.md"
    checked: 2026-11-03
  - title: "React DevTools source: WhatChanged.js (\"Why did this render?\" and \"Context changed\")"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Profiler/WhatChanged.js"
    checked: 2026-11-03
  - title: "React DevTools source: ProfilerSettings.js (setting label)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Settings/ProfilerSettings.js"
    checked: 2026-11-03
related:
  - /blog/when-does-react-re-render
  - /blog/prevent-re-renders-react
  - /use-cases/why-did-this-component-render
---

A React context re-render happens when a provider receives a value that is different from its last one, compared with `Object.is`. React then re-renders every component that reads that context with `useContext`, however deep it sits, and `memo` doesn't stop it. Components that don't read the context aren't touched by the change. The trap the `useContext` page warns about is a provider that builds a new object for `value` on every render, so the value counts as changed even when the data inside it hasn't.

The rules below come from react.dev pages checked on 2026-11-03. The render counts in the examples come from a test we ran: a development build of React 19.3.1 in jsdom, without Strict Mode (which would call each component twice in development), counting how many times each component function was called. Snippets are TypeScript for React 19, where the context object is its own provider (`<CartContext value={...}>`).

## Does a context change re-render all child components?

No. Only the components that read the context. The `useContext` page says React re-renders the children that use a particular context, starting from the provider that receives a different value. A component that never calls `useContext` for it isn't re-rendered by the change.

```tsx
import { createContext, useContext, useState, type ReactNode } from "react";

type Item = { id: string; name: string };
type CartValue = { items: Item[]; addItem: (item: Item) => void };

const CartContext = createContext<CartValue | null>(null);

function useCart(): CartValue {
  const cart = useContext(CartContext);
  if (cart === null) throw new Error("useCart must be used inside CartProvider");
  return cart;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  function addItem(item: Item) {
    setItems((prev) => [...prev, item]);
    setToast(`Added ${item.name}`);
  }

  return (
    <CartContext value={{ items, addItem }}>
      {children}
      {toast && <button onClick={() => setToast(null)}>Dismiss</button>}
    </CartContext>
  );
}

function CartBadge() {
  const { items } = useCart(); // reads the context
  return <span>{items.length}</span>;
}

function AddButton({ item }: { item: Item }) {
  const { addItem } = useCart(); // reads the context
  return <button onClick={() => addItem(item)}>Add</button>;
}

function Footer() {
  return <footer>Free returns</footer>; // doesn't read it
}
```

Mount it as `<CartProvider><CartBadge /><AddButton item={...} /><Footer /></CartProvider>` and add an item. In our test `CartBadge` and `AddButton` rendered once each and `Footer` didn't render at all.

The `children` prop is why. Those elements were created by whoever rendered `CartProvider`, so when the provider renders because of its own state, React sees the same elements and has no reason to render them again. The `memo` page recommends this shape for a component that visually wraps others. If the provider created `<Footer />` itself, `Footer` would render whenever the provider does. That isn't context at work but the parent rule: when a parent renders, so do the components it returns.

## Why a new value object re-renders every reader

Look again at the provider: `value={{ items, addItem }}` builds a fresh object, and `addItem` is a fresh function, each time `CartProvider` renders. The toast is the provider's own state, so dismissing it renders the provider, which hands every reader a "different" value. `items` didn't change. In our test, dismissing the toast rendered `CartBadge` and `AddButton` once each, and `Footer` zero times. The `useContext` page shows the same trap with an `AuthContext` and notes that in smaller apps it isn't a problem.

Wrapping a reader in `memo` changes nothing. The `memo` page says a memoized component still re-renders when a context it uses changes, because memoization only has to do with props passed from the parent.

## Is a React context re-render a performance problem?

Only sometimes. A context re-render is an ordinary render: your component function runs again, and so do the components it returns. If the output is the same, React leaves the DOM alone (Render and Commit). What matters is how many readers there are and how much work each one does. If you aren't sure the context is behind a render at all, [when does React re-render](/blog/when-does-react-re-render) lists the four triggers. The `memo` page says memo is only valuable when a component re-renders often with the same props and its rendering is expensive, and that without perceptible lag it's unnecessary.

Context performance issues tend to come from a value that changes all the time (a ticking clock, a pointer position, a text field on every keystroke), a context read by many components, or a reader that renders a big chart or table. When you see lag, get numbers first: [count the renders](/use-cases/react-render-count) of a suspect component, or record the interaction. In the React DevTools Profiler settings, tick "Record why each component rendered while profiling", record the slow interaction and select a component. Its "Why did this render?" section says "Context changed" when a context was the reason (labels as they appear in the DevTools source, checked 2026-11-03). If it says that for components you didn't expect, one of the fixes below applies. If it says "The parent component rendered.", the context isn't your problem, and the [rules for what triggers a render](/blog/when-does-react-re-render) cover what you're seeing.

## Cut context re-renders, cheapest fix first

### Memoize the value

The `useContext` page's own fix: wrap the functions in `useCallback` and the object in `useMemo`, so the value changes only when its data does.

```tsx
import { useCallback, useMemo, useState, type ReactNode } from "react";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const addItem = useCallback((item: Item) => {
    setItems((prev) => [...prev, item]);
    setToast(`Added ${item.name}`);
  }, []);
  const value = useMemo(() => ({ items, addItem }), [items, addItem]);

  return (
    <CartContext value={value}>
      {children}
      {toast && <button onClick={() => setToast(null)}>Dismiss</button>}
    </CartContext>
  );
}
```

React compares each dependency with `Object.is`, [as it does for an effect's dependency array](/blog/useeffect-dependency-array), and returns the cached value while none has changed, as the `useMemo` and `useCallback` pages say. Dismissing the toast now renders the provider and nobody else: our test counted zero renders for `CartBadge` and `AddButton`. When an item is added, `items` is new, so the value is new and both readers render. That's correct. Memoizing removes the surplus renders, not the real ones.

Both pages say to rely on these hooks only as performance optimizations: if the code breaks without them, find the underlying problem first.

### Split the context

One context means one value, and a component that reads it re-renders when any part of it changes. `AddButton` only needs `addItem`, but it re-renders when `items` changes because both travel in the same object.

So split it. The Scaling Up with Reducer and Context page builds a task list this way: one context for the tasks and one for the function that dispatches actions. Each context is completely separate from the others, the Passing Data Deeply page says, and ties together the components that use and provide that particular one.

```tsx
import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";

type Action = { type: "added"; item: Item };

function cartReducer(items: Item[], action: Action): Item[] {
  return [...items, action.item];
}

const CartItemsContext = createContext<Item[] | null>(null);
const CartDispatchContext = createContext<Dispatch<Action> | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  return (
    <CartItemsContext value={items}>
      <CartDispatchContext value={dispatch}>{children}</CartDispatchContext>
    </CartItemsContext>
  );
}

export function useCartDispatch(): Dispatch<Action> {
  const dispatch = useContext(CartDispatchContext);
  if (dispatch === null) throw new Error("useCartDispatch must be used inside CartProvider");
  return dispatch;
}
```

The `useReducer` page says `dispatch` has a stable identity, so `CartDispatchContext` never gets a new value. A component that only calls `useCartDispatch()` is no longer re-rendered by context at all. In our test, with `AddButton` switched to `useCartDispatch()` and `CartBadge` reading `CartItemsContext`, adding an item rendered `CartBadge` once and `AddButton` zero times.

Split by speed the same way. Values that change together can share a context; a value that changes far more often than the rest, like a clock, gets its own, so only its few readers render on every tick. A component that reads both renders when either changes.

### Read lower and pass the part down

When one component needs only a slice of a context and has an expensive child, the `memo` page has a pattern for exactly that: split your component in two. Read what you need from the context in the outer component and pass it to a memoized child as a prop.

```tsx
import { createContext, memo, useContext } from "react";

type Settings = { locale: string; density: "compact" | "roomy" };

const SettingsContext = createContext<Settings | null>(null);

const Chart = memo(function Chart({ locale }: { locale: string }) {
  // expensive to render
  return <div>{locale}</div>;
});

export function ChartSection() {
  const settings = useContext(SettingsContext);
  if (settings === null) throw new Error("ChartSection must be used inside SettingsContext");
  return <Chart locale={settings.locale} />;
}
```

When `density` changes, `ChartSection` renders, because it reads the whole value, and `Chart` doesn't: the prop is the same string. In our test a `density` change gave one render of `ChartSection` and none of `Chart`, and a `locale` change rendered both. The outer component still runs on every change, so keep it cheap.

Where the provider sits matters too. The `memo` page says to prefer local state and not to lift state further up than necessary, so keep a provider and its state around the subtree that needs them, not at the root by habit. The sibling guide on [keeping a component from rendering again](/blog/prevent-re-renders-react) covers state placement and `children` in more depth.

### Read a slice from an external store

The outer and inner split still runs the outer component on every change. A store outside React can be more selective. With `useSyncExternalStore`, the `getSnapshot` function returns the piece of the store this component needs, and React re-renders the component only if that value is different under `Object.is`, as the page says.

```tsx
import { useSyncExternalStore } from "react";

type Item = { id: string; name: string };
type CartState = { items: Item[]; coupon: string | null };

let state: CartState = { items: [], coupon: null };
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export const cartStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getState: () => state,
  update(patch: Partial<CartState>) {
    state = { ...state, ...patch };
    emit();
  },
};

export function useCartCount(): number {
  return useSyncExternalStore(
    cartStore.subscribe,
    () => cartStore.getState().items.length,
    () => 0,
  );
}
```

A component that calls `useCartCount()` re-renders when the number of items changes. `cartStore.update({ coupon: "SAVE" })` leaves it alone, and a component that selects `coupon` the same way re-renders only for that. Our test ran both side by side and counted exactly that.

The page sets rules for this. `getSnapshot` must return the same value on repeated calls while the store hasn't changed, and the snapshot must be immutable, so return a number, a string or a stored object, not a new array or object on every call. Declare `subscribe` outside the component, or React re-subscribes on every render. And without the third argument, `getServerSnapshot`, rendering the component on the server throws, which matters in a Next.js app.

The page also says that when you can, built-in `useState` and `useReducer` are the better choice, and that this hook is mostly for integrating non-React code. Third-party state libraries are one such case. Zustand's README (checked 2026-11-03) says you select your state in its hook and the component re-renders on changes, and that it detects changes with strict equality (`old === new`) by default. We haven't tested it. Its README also shows how to put a store in React context, for dependency injection or to initialize the store with props from a component.

Context makes more sense for a value that changes rarely and is read all over the tree, such as a theme or a locale, and for state that belongs to one subtree.

### Which fix for which problem

| Fix | Stops | Doesn't stop | What it costs |
|---|---|---|---|
| Memoize the value | Renders when the provider renders but the data is the same | Renders when the data really changes | `useMemo` and `useCallback` with correct dependencies |
| Split the context | A reader re-rendering for a part it doesn't use | Readers of the part that changed | More providers and hooks |
| Read lower, memoized child | An expensive child re-rendering | The cheap outer component | One extra component |
| External store with a slice | Any component re-rendering for a slice it doesn't select | Components subscribed to the slice that changed | A store outside React and the snapshot rules |

For fixes that aren't about context, such as moving state down or passing JSX as `children`, see how to [prevent re-renders in React](/blog/prevent-re-renders-react) in general.

## See a context re-render happen

The Profiler's "Context changed" line, described above, tells you that a context was the reason for one render. To follow it over time, compare what the component received on two renders. The guide to [finding what causes a re-render in React](/use-cases/why-did-this-component-render) does that three ways.

debugsy is an in-process [React debug panel](/): a component you mount in your own app, with one ordered log of debug messages, render counts and dependency changes. Its `useWhyDidYouUpdate` hook compares the object you pass with the previous render, key by key and by reference. It doesn't watch context on its own, so pass in what you want checked. Put it in the provider to see why the value changed:

```tsx
import { useWhyDidYouUpdate } from "@n-uf/debugsy";

// inside the first example's CartProvider, rendering <CartContext value={value}>
const value = { items, addItem };
useWhyDidYouUpdate("CartProvider", { items, addItem, value });
```

Switch on the Deps toggle (the `dependencies` debug point) in the panel, or run `window.debugsy.enable("dependencies")` in the console. Add an item (the first render after you switch it on only sets the baseline), then dismiss the toast. The log looks like this, with your own counts:

```text
🔄 [CartProvider] Dependencies changed:
📝 [CartProvider] addItem: function changed (#1) (function → function) 🚀
📦 [CartProvider] value: object changed (#1) 🚀
```

The 🚀 marks debugsy's start-up phase, which ends five seconds after the last tracked change. `items` isn't listed because it didn't change: the same array, a new wrapper around it. That's the whole bug. After the `useMemo` fix the same click logs nothing for the provider. In a reader, pass the context value the same way: `const cart = useCart()`, then `useWhyDidYouUpdate("CartBadge", { cart })`. If `CartBadge` renders and no key was reported, the cause wasn't its context but its parent or its own state, and [why a component re-rendered](/use-cases/why-did-this-component-render) shows how to tell those apart.

The hook sees only the components where you call it and only the values you pass, and does nothing while Deps is off. It logs; it never stops a render.

It isn't on npmjs yet: a public release there is in preparation. debugsy doesn't remove itself from production builds, so guard the import or the mount yourself. It is independent and not affiliated with Meta, the React team or the Zustand project.
