---
title: "useEffect runs twice: why it happens and how to fix it"
description: "useEffect runs twice on mount in development because Strict Mode adds a setup and cleanup cycle. Why React does it, how to fix it, and real causes."
h1: "Why your useEffect runs twice, and what to do about it"
mainKeyword: "useeffect runs twice"
kind: what-is
published: 2026-11-19
updated: 2026-11-19
draft: true
author: n-uf
takeaways:
  - "In development, Strict Mode makes React run one extra setup and cleanup cycle for every effect after mount, so a mount logs setup, cleanup, setup. A production build runs the effect once."
  - "An empty dependency array doesn't prevent it: [] says when the effect runs again, not how often Strict Mode mounts the component."
  - "React's docs say the fix isn't to run the effect once. It's a cleanup that undoes the setup, so nobody can tell one run from setup, cleanup, setup."
  - "An effect that runs again after the page has settled is a real re-run: a missing array, a changed dependency, or a component that was unmounted and mounted again."
  - "A log in both setup and cleanup tells the cases apart: setup, cleanup, setup with the same values right after mount is Strict Mode; a cleanup with old values and a setup with new ones is a dependency change."
faq:
  - q: "Does useEffect run twice in Strict Mode?"
    a: "Yes, in development. React's StrictMode page says that with Strict Mode on, React runs one extra setup and cleanup cycle for every effect, to find effects that are missing a cleanup. The extra cycle doesn't happen in a production build."
  - q: "Why is useEffect running twice in my Next.js or Vite app?"
    a: "Most likely the app is wrapped in Strict Mode. Next.js's reactStrictMode page says Strict Mode has been on by default with the app router since 13.5.1, and the Vite React template renders the app inside StrictMode. The extra run is development-only in both, so a production build runs the effect once."
  - q: "How do I make useEffect run only once?"
    a: "In production it already does, for an effect with an empty array. In development, react.dev says the right question is how to make the effect work after remounting, and the usual answer is a cleanup function that undoes the setup. A ref that blocks the second run hides the symptom and leaves the bug."
  - q: "Why does my fetch run twice in development?"
    a: "The extra effect cycle runs the fetch again. React's docs say there is nothing wrong with two requests in the Network tab as long as the cleanup ignores or aborts the first. For one request in development too, use a framework's data fetching or a client cache that deduplicates requests."
  - q: "Can I turn Strict Mode off?"
    a: "Yes, but react.dev recommends keeping it on, because the extra run finds real bugs. For a short debugging session you can remove the StrictMode wrapper, or set reactStrictMode to false in a Next.js app, and then turn it back on."
sources:
  - title: "React: StrictMode"
    url: "https://react.dev/reference/react/StrictMode"
    checked: 2026-11-03
  - title: "React: useEffect"
    url: "https://react.dev/reference/react/useEffect"
    checked: 2026-11-03
  - title: "React: Synchronizing with Effects"
    url: "https://react.dev/learn/synchronizing-with-effects"
    checked: 2026-11-03
  - title: "React: Preserving and Resetting State"
    url: "https://react.dev/learn/preserving-and-resetting-state"
    checked: 2026-11-03
  - title: "React: You Might Not Need an Effect"
    url: "https://react.dev/learn/you-might-not-need-an-effect"
    checked: 2026-11-03
  - title: "Next.js: reactStrictMode"
    url: "https://nextjs.org/docs/app/api-reference/config/next-config-js/reactStrictMode"
    checked: 2026-11-03
  - title: "Vite: create-vite React TypeScript template (main.tsx)"
    url: "https://raw.githubusercontent.com/vitejs/vite/main/packages/create-vite/template-react-ts/src/main.tsx"
    checked: 2026-11-03
  - title: "MDN: AbortSignal"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal"
    checked: 2026-11-03
  - title: "MDN: RequestInit"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/RequestInit"
    checked: 2026-11-03
related:
  - /use-cases/useeffect-which-dependency-changed
  - /blog/useeffect-dependency-array
  - /blog/when-does-react-re-render
---

Your useEffect runs twice on mount in development because Strict Mode is on. React's StrictMode page says it runs one extra setup and cleanup cycle for every effect, so a mount logs setup, cleanup, setup. A production build runs the effect once. The extra cycle tests your cleanup code, so the fix is to write the cleanup, not to stop the second run.

If it runs again after the page has settled, or twice in production too, the cause is something else, and the second half of this article tells the two apart.

## Why does useEffect run twice in development?

Strict Mode is a component, `<StrictMode>`, that you wrap around your app, and the extra effect run is one of its development-only checks. You may not have written the wrapper yourself. The Vite React template renders `<App />` inside `<StrictMode>` in `src/main.tsx`. Next.js's `reactStrictMode` page says Strict Mode has been on by default with the app router since 13.5.1; with the pages router you set `reactStrictMode: true` in `next.config.js`.

With the wrapper in place, React remounts every component once right after its initial mount and keeps the state and DOM it already has (the Synchronizing with Effects page). An effect that logs in its setup and its cleanup prints setup, cleanup, setup. None of this reaches the production build.

If `<StrictMode>` covers only part of the app, React doesn't re-run effects an extra time on the initial mount, because a child's effects would then fire twice without its parent's, which can't happen in production. Separately, React remounts the effects each time you save a file in development.

Strict Mode renders components an extra time as well. That is a separate double call, explained in [when does React re-render](/blog/when-does-react-re-render).

## useEffect called twice with an empty array

An empty array reads like "run once". It says the effect doesn't depend on any reactive value, so React doesn't re-run it when props or state change. It says nothing about how many times Strict Mode mounts the component.

React's own example is a chat component that connects on mount and never disconnects:

```tsx
import { useEffect } from "react";
import { createConnection } from "./chat";

export function ChatRoom() {
  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    // no cleanup
  }, []);

  return <h1>Welcome to the chat!</h1>;
}
```

`createConnection` stands for your own client. In development this opens two connections, and that is the bug showing up early: a user who leaves the chat screen and comes back mounts the component again while the first connection is still open, so connections pile up.

The fix is the cleanup:

```tsx
useEffect(() => {
  const connection = createConnection();
  connection.connect();
  return () => connection.disconnect();
}, []);
```

Now development runs connect, disconnect, connect, with one connection open at a time.

## Why does React run the extra cycle?

To make a missing cleanup show up on the first day, not the day a user clicks Back. By remounting the component, React checks that navigating away and back wouldn't break your code. Its rule of thumb: the user shouldn't be able to tell an effect that ran once from the sequence setup, cleanup, setup.

## How to write an effect that survives the extra run

The Synchronizing with Effects page says the right question isn't how to run an effect once, but "how to fix my Effect so that it works after remounting". Usually that means a cleanup that stops or undoes whatever the setup started. The page works through these cases:

| The effect | The cleanup | What you see in development |
|---|---|---|
| Adds an event listener | Removes it with the same handler | add, remove, add: one listener at a time |
| Opens a connection | Closes it | connect, disconnect, connect |
| Calls `dialog.showModal()` | Calls `dialog.close()` | `showModal()` throws if called twice in a row, so without the cleanup it fails |
| Animates something in | Resets the start values | on, off, on |
| Fetches data | Ignores or aborts the result | two requests; the first is dropped |
| Sets a value on a non-React widget | Nothing | the same call twice changes nothing |

### Fetching data

A fetch can't be undone, but its result can be ignored. This is react.dev's pattern, with `userId` as the dependency:

```tsx
import { useEffect, useState } from "react";

type Todo = { id: number; title: string };

export function TodoList({ userId }: { userId: string }) {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      const res = await fetch(`/api/users/${userId}/todos`);
      const data: Todo[] = await res.json();
      if (!ignore) setTodos(data);
    }
    load();

    return () => {
      ignore = true;
    };
  }, [userId]);

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

In development you'll see two requests in the Network tab. React's docs say there's nothing wrong with that: the first effect is cleaned up at once, so its `ignore` is `true` and its result is dropped. The same cleanup fixes the race where a slow response for an old `userId` arrives after a newer one.

To cancel the request itself, pass an `AbortSignal`. MDN's AbortSignal page says that `abort()` makes the `fetch()` promise reject with a `DOMException` named `AbortError`, so the catch has to expect it:

```tsx
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/users/${userId}/todos`, { signal: controller.signal })
    .then((res) => res.json())
    .then((data: Todo[]) => setTodos(data))
    .catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error(error);
    });

  return () => controller.abort();
}, [userId]);
```

If the second request still bothers you, react.dev's advice is a solution that deduplicates requests and caches responses: your framework's data fetching, or a client-side cache.

### Don't skip the second run with a ref

The tempting fix is a ref that remembers the effect already ran:

```tsx
const connectionRef = useRef<ReturnType<typeof createConnection> | null>(null);

useEffect(() => {
  // Wrong: hides the second run, fixes nothing
  if (!connectionRef.current) {
    connectionRef.current = createConnection();
    connectionRef.current.connect();
  }
}, []);
```

React's docs call this a pitfall. You see one log in development, but the connection still isn't closed when the user leaves, so the pile-up is back.

### Work that isn't an effect

Sometimes no cleanup can hide the second run, because the effect was the wrong tool:

- A purchase. A `fetch("/api/buy", { method: "POST" })` in an effect fires twice in development, and again when the user goes back to the page. Move it into the Buy button's click handler: buying is caused by a click, not by rendering.
- Analytics. A page-visit POST in an effect also fires twice. React's page says to leave it, since logs from development machines shouldn't skew production metrics anyway. To debug the events, deploy to a staging environment, which runs in production mode, or opt out of Strict Mode for a while.
- One-time app setup, such as checking an auth token. React puts it outside any component, behind a `typeof window !== "undefined"` check.

### Can you turn Strict Mode off?

You can, and react.dev recommends keeping it on, because the extra cycle finds real bugs. For a debugging session, remove the `<StrictMode>` wrapper (in Vite's `src/main.tsx`) or set `reactStrictMode: false` in the Next.js config, which the Next.js page says is still possible. Put it back afterwards.

## When useEffect runs twice for a real reason

Strict Mode explains the double run at mount, and only there. A run after that, or a double run in production, comes from your code:

| Cause | What you see | Where to look |
|---|---|---|
| No dependency array | Setup after every commit | The call: `useEffect(fn)` with no second argument |
| A dependency changed | Cleanup with the old values, then setup with the new ones | The values; the [useEffect dependency array](/blog/useeffect-dependency-array) article explains how React compares them |
| An object or function dependency that is new on every render | The same, after every render | Create it inside the effect or move it out; [the fixes](/blog/useeffect-dependency-array) are in the same article |
| The effect sets state it depends on | A loop, not two runs | The article on [Maximum update depth exceeded](/blog/maximum-update-depth-exceeded) |
| The component unmounted and mounted again | Cleanup, setup, and the component's state is back to its initial value | The `key` on it or its parents, conditional rendering, how the component is defined |

The remount row is the easiest to overlook. React's Preserving and Resetting State page says a different key resets a subtree's state, and so does rendering a different component at the same position. A component defined inside another one is the classic accident:

```tsx
import { useEffect } from "react";

export function Profile({ name }: { name: string }) {
  // Wrong: a new Avatar function on every render of Profile,
  // so React unmounts and mounts it again each time
  function Avatar() {
    useEffect(() => {
      console.log("avatar setup");
      return () => console.log("avatar cleanup");
    }, []);
    return <img src={`/avatars/${name}.png`} alt={name} />;
  }

  return <Avatar />;
}
```

The fix is to move `Avatar` out of `Profile`: the page says to declare component functions at the top level and not to nest their definitions. A conditional like `{open && <Panel />}` is different. It mounts and unmounts `Panel` each time `open` flips, so its effects run each time, and that's working as intended.

## How to tell which one you have

Log in the setup and in the cleanup, with the values the effect reads:

```tsx
useEffect(() => {
  console.log("setup", { userId });
  return () => console.log("cleanup", { userId });
}, [userId]);
```

Then read the order:

| The log shows | It means |
|---|---|
| `setup {42}`, `cleanup {42}`, `setup {42}`, once right after a mount, development only | Strict Mode. Check that the cleanup mirrors the setup |
| `cleanup {42}`, then `setup {43}` | A dependency changed from 42 to 43. [Find which dependency changed](/use-cases/useeffect-which-dependency-changed) |
| `cleanup {42}`, `setup {42}`, and the component's state reset | A remount. Look at keys and conditional rendering |
| Setup after every render | No array, or a dependency that is new each render |

To confirm Strict Mode, run a production build or remove the wrapper for a minute. If the double run goes away, it was the development check. A component that renders more often than you expect is a different question: what [triggers a render](/blog/when-does-react-re-render).

## See the sequence in debugsy

The console is enough for one effect. When you want setup, cleanup and your own messages in one ordered log, debugsy is an in-process [React debug panel](/): a component you mount in your own app that shows debug messages, render counts and dependency changes in one list. It is independent and not affiliated with Meta, the React team, Vercel or the Vite project.

It isn't on npmjs yet: a public release there is in preparation, and the home page has the mount steps. Declare a debug point for the effect, then log from the setup and the cleanup:

```tsx
import { useEffect } from "react";
import { dsy, registerModule, useWhyDidYouUpdate } from "@n-uf/debugsy";

registerModule("effects", {
  label: "Effects",
  emoji: "🔁",
  description: "Effect setup and cleanup",
  points: {
    todos: {
      emoji: "📋",
      label: "Todos",
      description: "TodoList effect",
    },
  },
});

export function TodoList({ userId }: { userId: string }) {
  useWhyDidYouUpdate("TodoList", { userId });

  useEffect(() => {
    dsy.log("todos", "effect setup", { userId });
    return () => dsy.log("todos", "effect cleanup", { userId });
  }, [userId]);

  // ...
}
```

A call to a debug point that isn't switched on is dropped, so switch `todos` on in the panel (⌘+D shows it) and reload, or open the page with `?debug=todos`. A mount in Strict Mode then logs `effect setup`, `effect cleanup` and `effect setup`, each with the same `{ userId }`.

`useWhyDidYouUpdate` adds the other half. After each render it compares the values you pass with the previous render's, by reference, and logs only what changed. Strict Mode's extra cycle re-runs the same render's effect with the same values, so it produces no change line; a real dependency change does. The hook does nothing until the `dependencies` point is on (the panel's Deps toggle, or `window.debugsy.enable("dependencies")`), and the first render after that is the baseline. For a string like `userId`, the default level writes the summary line `🔄 [TodoList] Dependencies changed:` with the values as its data. The Verbose level, set with the panel's level button, adds a line of its own:

```text
🔧 [TodoList] userId: string → string (#1) 🚀
```

The `🚀` marks debugsy's start-up phase, which ends 5 seconds after the last tracked change.

The use case on how to [see which dependency changed](/use-cases/useeffect-which-dependency-changed) covers the hook in full. debugsy sees only the components where you call its hooks and the values you pass, and it never stops an effect or a loop. It doesn't remove itself from production builds either, so guard the import or the mount yourself, for example behind `process.env.NODE_ENV !== "production"`.
