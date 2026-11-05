---
title: "Too many re-renders in React: causes and fixes"
description: "Too many re-renders in React means state is set during render. The exact message, the usual causes with fixes, and how to find the component."
h1: "Fix the \"Too many re-renders\" error in React"
mainKeyword: "too many re-renders react"
kind: how-to
published: 2026-11-19
updated: 2026-11-19
draft: true
author: n-uf
takeaways:
  - "React throws \"Too many re-renders. React limits the number of renders to prevent an infinite loop.\" when a component keeps setting state while it renders. A production build shows it as Minified React error #301."
  - "The usual cause is a set function that runs during render: called in the component body, or written as onClick={setOpen(true)} or onClick={handleClick()} where JSX needs a function."
  - "In React's v19.3.1 source, RE_RENDER_LIMIT is 25: React throws instead of starting a 26th extra pass of the same render. A set call made during render counts even when it sets the same value."
  - "To find it, reproduce it in a development build and read the component name React logs and the component stack. In our own test with React 19.3.1, the thrown error's JavaScript stack held only React's frames."
  - "debugsy can't show this error: its hooks log from effects, and a render that throws never commits. It warns about loops that do commit and never stops one."
faq:
  - q: "What does \"Too many re-renders. React limits the number of renders to prevent an infinite loop\" mean?"
    a: "A component is setting state while it renders, so each render causes another one. react.dev's useState page says this typically means you're unconditionally setting state during render, very often through a mistake in an event handler such as onClick={handleClick()}. React stops with this error instead of looping forever."
  - q: "How do I fix this error with useState?"
    a: "Find the set function that runs during render. Move it into an event handler, or pass a function instead of calling one: onClick={() => setOpen(true)}. If you copy a prop into state during render, calculate the value during render instead, reset the state with a key, or guard the call with a comparison against the previous value. The useState and You Might Not Need an Effect pages on react.dev describe all three."
  - q: "What is Minified React error #301?"
    a: "It's the production form of this error. Production builds leave out the full message to reduce the bytes sent, and react.dev/errors/301 shows the original text: \"Too many re-renders. React limits the number of renders to prevent an infinite loop.\" To see which component caused it, reproduce the bug in a development build."
  - q: "What is React's limit for re-renders?"
    a: "In React's source at tag v19.3.1, ReactFiberHooks.js sets RE_RENDER_LIMIT to 25. After the first call to your component, React calls it again for as long as a state update is scheduled during render, and it throws if that is still happening after 25 extra passes. The number comes from the source, not from a docs page, so it can change between releases."
  - q: "Is it the same as the useEffect infinite loop error?"
    a: "No. This error is thrown while React is still rendering one component, before that render is committed. The useEffect loop error is about updates that keep arriving after commits, and it is usually fixed in the effect and its dependency array. Each has its own guide on this site."
sources:
  - title: "React: Minified React error #301"
    url: "https://react.dev/errors/301"
    checked: 2026-11-03
  - title: "React: Minified Error Decoder"
    url: "https://react.dev/errors"
    checked: 2026-11-03
  - title: "React: useState (reference and troubleshooting)"
    url: "https://react.dev/reference/react/useState"
    checked: 2026-11-03
  - title: "React: useReducer (reference and troubleshooting)"
    url: "https://react.dev/reference/react/useReducer"
    checked: 2026-11-03
  - title: "React: Responding to Events"
    url: "https://react.dev/learn/responding-to-events"
    checked: 2026-11-03
  - title: "React: Keeping Components Pure"
    url: "https://react.dev/learn/keeping-components-pure"
    checked: 2026-11-03
  - title: "React: You Might Not Need an Effect"
    url: "https://react.dev/learn/you-might-not-need-an-effect"
    checked: 2026-11-03
  - title: "React: Render and Commit"
    url: "https://react.dev/learn/render-and-commit"
    checked: 2026-11-03
  - title: "React: useEffect"
    url: "https://react.dev/reference/react/useEffect"
    checked: 2026-11-03
  - title: "React: createRoot (error callbacks)"
    url: "https://react.dev/reference/react-dom/client/createRoot"
    checked: 2026-11-03
  - title: "React source, v19.3.1: ReactFiberHooks.js (RE_RENDER_LIMIT, renderWithHooksAgain, dispatchSetStateInternal)"
    url: "https://raw.githubusercontent.com/facebook/react/v19.3.1/packages/react-reconciler/src/ReactFiberHooks.js"
    checked: 2026-11-03
  - title: "React source, v19.3.1: ReactFiberErrorLogger.js (development messages)"
    url: "https://raw.githubusercontent.com/facebook/react/v19.3.1/packages/react-reconciler/src/ReactFiberErrorLogger.js"
    checked: 2026-11-03
  - title: "React source, v19.3.1: ReactDOMRoot.js (your error handler replaces the default one)"
    url: "https://raw.githubusercontent.com/facebook/react/v19.3.1/packages/react-dom/src/client/ReactDOMRoot.js"
    checked: 2026-11-03
  - title: "React source: formatProdErrorMessage.js (minified error text)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/shared/formatProdErrorMessage.js"
    checked: 2026-11-03
  - title: "React source: scripts/error-codes/codes.json (error 301 text)"
    url: "https://raw.githubusercontent.com/facebook/react/main/scripts/error-codes/codes.json"
    checked: 2026-11-03
related:
  - /blog/maximum-update-depth-exceeded
  - /blog/when-does-react-re-render
  - /use-cases/why-did-this-component-render
---

Too many re-renders in React means a component keeps setting state while it renders, so each render triggers another one, and React stops at its limit instead of looping forever. The full message is "Too many re-renders. React limits the number of renders to prevent an infinite loop." A production build shows it as "Minified React error #301". Almost every case is a set function that runs during render: called in the component body, or written as `onClick={setOpen(true)}` or `onClick={handleClick()}` where JSX needs a function. Move the call into an event handler, or pass a function that makes the call.

The snippets below are React 19. We ran each one under jsdom with React 19.3.1 on 2026-11-03, in a development and a production build. Every broken one threw this error, and none of the fixed ones did.

## What the error means

Rendering in React is meant to be pure. react.dev's Keeping Components Pure page says side effects usually belong in event handlers, which don't run during rendering. A set call during render isn't banned outright (the useState page allows a guarded one, shown further down), but React has to deal with it before it moves on. The useState page describes how. React re-renders that component right after it returns, before rendering the children, and throws away the result of the pass that made the call. If the next pass sets state again, you're in a loop: render, set state, render, set state.

For a render that follows a click or a prop change, [when does React re-render](/blog/when-does-react-re-render) lists the triggers. This error is narrower. It's about the passes inside one render, not about how often the component renders over time.

In development you get the full text. It matches the sentence on react.dev's useState page and the entry for code 301 in React's error code table (`codes.json`). React also logs a warning that names the component. With no error boundary, it reads like this in the source (`ReactFiberErrorLogger.js`, v19.3.1):

```
An error occurred in the <Counter> component.
```

If an error boundary caught it, the line starts "The above error occurred in the <Counter> component." instead. In production you get only the minified form, which React's `formatProdErrorMessage.js` builds:

```
Minified React error #301; visit https://react.dev/errors/301 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
```

The page at react.dev/errors/301 puts the original message back together. What users see is usually a blank page. In our test, with no error boundary around the component, the root container was empty afterwards.

## What causes "Too many re-renders" with useState?

Four patterns cover nearly all of it. `useReducer` behaves the same way: its page on react.dev has the same troubleshooting entry, with "dispatching an action" in place of "setting state".

| In your code | Why it loops | Fix |
|---|---|---|
| `setCount(count + 1)` in the component body | It runs on every render pass | Move it into an event handler |
| `onClick={setOpen(true)}` or `onClick={handleClick()}` | JSX runs the call while rendering | Pass a function: `onClick={() => setOpen(true)}` |
| `onClick={setSelected(tag)}` inside `map` | One call per item on every pass | `onClick={() => setSelected(tag)}` |
| `setName(user.name)` after reading a prop | Nothing ever makes it stop | Calculate it during render, use a `key`, or guard it |

### A set function in the component body

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  setCount(count + 1); // 🚩 runs on every render, then renders again

  return <p>{count}</p>;
}
```

Nobody writes this on purpose, but it hides well inside a function. A `loadItems()` that ends in `setItems(...)`, called in the body, does the same thing. Put the set call where something happens, which is usually an event handler:

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>;
}
```

Sometimes the update really belongs to the component appearing on screen, not to anything the user did. You Might Not Need an Effect keeps Effects for "code that should run because the component was displayed". Then how you write its [dependency array](/blog/useeffect-dependency-array) decides whether you've fixed the bug or swapped it for a different loop error.

### A handler called instead of passed

This is the cause react.dev names on both the `useState` and `useReducer` pages. JavaScript inside JSX braces runs right away, so `handleClick()` runs while rendering and `onClick` gets whatever it returns.

```jsx
// 🚩 Wrong: calls the setter while rendering
<button onClick={setOpen(true)}>Open</button>

// 🚩 Wrong: calls the handler while rendering
<button onClick={handleClick()}>Open</button>

// ✅ Correct: passes the handler
<button onClick={handleClick}>Open</button>

// ✅ Correct: passes an inline function
<button onClick={() => setOpen(true)}>Open</button>
```

The Responding to Events page makes the same point with `alert('...')`: written directly, it fires every time the component renders. A handler that needs an argument can't be passed bare, because `onClick={handleClick(id)}` is a call. Wrap it: `onClick={() => handleClick(id)}`.

A call during render doesn't always loop. In our test, a `remove(item.id)` written this way, in a list that shrinks with every call, threw nothing. It stopped once no item was left to call it, and the list came out empty. No error doesn't mean no bug.

### A set function inside map

The same mistake in a list runs once per item on every pass:

```jsx
function Tags({ tags }) {
  const [selected, setSelected] = useState(null);

  return (
    <ul>
      {tags.map((tag) => (
        <li key={tag} onClick={setSelected(tag)}>{/* 🚩 called, not passed */}
          {tag}
        </li>
      ))}
    </ul>
  );
}
```

Pass a function that makes the call:

```jsx
<li key={tag} onClick={() => setSelected(tag)}>
  {tag}
</li>
```

### State copied from props, with no guard

You want local state to follow a prop, so you set it while rendering:

```jsx
function Profile({ user }) {
  const [name, setName] = useState(user.name);
  setName(user.name); // 🚩 no condition, runs on every pass

  return <h1>{name}</h1>;
}
```

Setting the same value doesn't save you. React doesn't compare old and new state for a set call made during render. In `dispatchSetStateInternal` the update is queued and another pass is scheduled; the equal-value shortcut sits in the branch for updates made outside render. Our test of this component threw too, with the prop never changing.

react.dev's You Might Not Need an Effect page gives three ways out, and says to check the first two before adjusting state during render. Calculate the value during render, so there is no state to adjust:

```jsx
function Profile({ user }) {
  return <h1>{user.name}</h1>; // ✅ no state, no loop
}
```

Or give the component a `key`, so React starts it fresh when the identity changes:

```jsx
function EditProfile({ user }) {
  return <ProfileForm key={user.id} user={user} />; // ✅ new key, new state
}
```

Or, when neither fits, set state during render behind a condition that becomes false. The useState page calls this "storing information from previous renders" and says the pattern is rarely needed:

```jsx
function ProfileForm({ user }) {
  const [prevUser, setPrevUser] = useState(user);
  const [draft, setDraft] = useState(user.name);

  if (prevUser !== user) {
    setPrevUser(user); // ✅ makes the condition false on the next pass
    setDraft(user.name);
  }

  return <input value={draft} onChange={(e) => setDraft(e.target.value)} />;
}
```

The same page sets two limits. The set call has to sit inside a condition, and something inside that condition has to make it false, or the component loops until it crashes. And you can only update the state of the component that is rendering.

## How to debug Too many re-renders

Start with a development build. It gives you the full message and the component name; production gives you neither.

### Read the component name

The warning "An error occurred in the <Counter> component." tells you where to look. If you own the `createRoot` call, its `onUncaughtError` option receives the error and an `errorInfo` object with a `componentStack` (react.dev's createRoot page). In our test it listed the throwing component first, then its parents. `onCaughtError` does the same for errors an error boundary caught. Your handler replaces React's default one, the one that logs to the console, so log the error there too.

### Check the JavaScript stack, but don't rely on it

react.dev's useState page says that if you can't find the cause, expand the error in the console and look through the JavaScript stack for the set call responsible. Try that first. It didn't work in our own test, though: with a development build of React 19.3.1, under jsdom and again in Chrome 156, the thrown error's stack held only React's frames (`renderWithHooksAgain`, `renderWithHooks`, `updateFunctionComponent` and the work loop). Neither the component nor the set call was in it. That fits the source: the throw happens after your component has returned, at the start of the next pass. If your stack looks the same, go by the component name and the component stack.

### Find the call that runs during render

Open the named component and look at each set function, each `dispatch`, and each function that calls one. A search catches most of the JSX cases. With ripgrep:

```
rg "on[A-Z]\w*=\{[A-Za-z_.]+\(" src
```

It lists lines like `onClick={setOpen(true)}`. It also lists valid code, such as `onClick={makeHandler(id)}` where `makeHandler` returns a function, so read each hit. Then put a breakpoint or a `console.trace()` on each suspect set call. A call that fires before you click anything, with your component in the call stack, is the one running during render. One that fires only after a click, from a handler, is fine.

### Count the passes

Put `console.count("Counter render")` at the top of the component body. With this bug the count jumps by dozens in one go. Without it, the count goes up by about one per interaction. For the general routine of reproducing, reading the stack and logging, see the guide to [debugging a React app](/blog/how-to-debug-react-app).

If the page is slow but nothing throws, you have a different problem: ordinary re-renders. To see why a component renders, [find what causes a re-render in React](/use-cases/why-did-this-component-render) by comparing its props, state and context between renders.

## Where the limit of 25 comes from

React's docs don't give the number. The source does. In `ReactFiberHooks.js` at v19.3.1:

```js
const RE_RENDER_LIMIT = 25;
```

Your component first runs in a normal pass. If it called a set function during that pass, `renderWithHooksAgain` runs it again, and keeps going for as long as render-phase updates keep being scheduled. A comment there says it uses a counter to prevent infinite loops. Before each extra pass it checks the counter against the limit:

```js
if (numberOfReRenders >= RE_RENDER_LIMIT) {
  throw new Error(
    'Too many re-renders. React limits the number of renders to prevent ' +
      'an infinite loop.',
  );
}
```

So 25 extra passes run, and React throws instead of starting the 26th. The counter belongs to a single render. A component that renders a thousand times as you type never hits it, as long as each of those renders is a separate update. If that's the number you want, [count the renders of a React component](/use-cases/react-render-count). The 25 comes from the source, not from a docs page, and it can change between releases.

## How it differs from the useEffect loop

This error is thrown inside one render, before React commits anything. The other loop error comes from updates that keep arriving after commits, usually from an effect that sets state. That one is mostly about the dependency array, and it has a different message and a different limit. The guide to the [Maximum update depth exceeded in React](/blog/maximum-update-depth-exceeded) error covers it. Knowing which one you have tells you where to look: here, at what runs while the component renders; there, at what runs after.

## What debugsy can show, and what it can't

debugsy can't catch this error. Its hooks, `useRenderTracker` and `useWhyDidYouUpdate`, log from effects, and react.dev's useEffect page says React runs an effect's setup when the component commits. A render that throws is never committed, so the hooks don't run and the panel stays quiet. debugsy also doesn't stop or block a render loop: it warns and calls your callback.

It helps with the cases around this one: a component that re-renders too often without throwing, or checking that your fix did what you wanted. `useRenderTracker` counts committed renders (it counts in an effect), so it never sees the extra passes this error is about. Its sibling `useWhyDidYouUpdate` shows [which value changed between renders](/use-cases/why-did-this-component-render) when something does commit too often. Mount `<DebugsyLook />` once near the app root. The panel starts hidden; ⌘+D opens it. Switch on the **Deps** toggle, because both hooks do nothing until the `dependencies` debug point is on, then track the component:

```jsx
import { useRenderTracker } from "@n-uf/debugsy";

function Counter() {
  useRenderTracker("Counter", {
    trackRenders: true, // needed with the options form in 26.11
    renderThreshold: 10,
  });
  // ...
}
```

When the count reaches `renderThreshold`, it logs a warning, shows a short notice in the panel and starts counting again. The [React debug panel](/) isn't on npmjs yet: a public release there is in preparation. debugsy is independent and not affiliated with Meta or the React team. It doesn't remove itself from production builds, so guard the import or the mount yourself, for example behind `process.env.NODE_ENV !== "production"`.
