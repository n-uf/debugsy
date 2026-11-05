---
title: "Debug a React app: from symptom to cause"
description: "How to debug a React app: reproduce the bug, read the error, inspect in DevTools, pause with breakpoints, log on purpose, then handle production."
h1: "How to debug a React app, from symptom to cause"
mainKeyword: "debug react app"
kind: how-to
published: 2026-11-16
updated: 2026-11-16
draft: true
author: n-uf
takeaways:
  - "Chrome's DevTools tutorial says finding a series of actions that reproduces the bug every time is the first step of debugging."
  - "A React error's component stack lists the component that threw and the names and source locations of its parents. In production the names are minified, and source maps decode them."
  - "A production build of React leaves out the full error text. The minified error links to react.dev/errors/<code>, which rebuilds the message."
  - "Next.js leaves browser source maps off in production builds unless productionBrowserSourceMaps is true, and Vite's build.sourcemap defaults to false."
  - "A breakpoint shows one moment. To see which value changed on which render, an in-page log such as debugsy's useWhyDidYouUpdate records the sequence for the values you pass in."
faq:
  - q: "How do I debug React in Chrome?"
    a: "Install the React Developer Tools extension for Chrome and use its Components panel to inspect props and state. To pause code, click a line number in the Sources panel, add a conditional breakpoint, or put a debugger statement in your code. The Network panel shows each request's status, size, time and what initiated it."
  - q: "How do I debug a React app in production?"
    a: "Start from the minified error code: react.dev/errors/<code> rebuilds the full message. Then build source maps so stack frames and component names map back to your files. Next.js leaves browser source maps off in production unless you set productionBrowserSourceMaps, and Vite's build.sourcemap defaults to false. An error boundary that sends componentStack to your reporting service shows you what users hit."
  - q: "How do I debug React in VS Code?"
    a: "Create .vscode/launch.json with a chrome or msedge launch configuration, set url to your dev server and webRoot to ${workspaceFolder}, start the dev server and press F5. VS Code's React tutorial says you can then step through your source with F10, inspect variables and see the call stack. Conditional breakpoints and logpoints are in the editor margin's context menu."
  - q: "How do I find which component threw an error?"
    a: "Read the component stack. An error boundary's componentDidCatch receives info.componentStack, which holds the component that threw and its parents' names and source locations. In production those names are minified, and React's Component page says you decode them with source maps like any JavaScript stack. In development, React also prints a warning, 'An error occurred in the <Name> component', for an uncaught error."
  - q: "What does a minified React error mean?"
    a: "It's a production error with the text left out to save bytes, such as 'Minified React error #31'. The message links to react.dev/errors/31, which shows the original text, and the link's args[] parameters carry the values that fill its %s placeholders. react.dev recommends reproducing it in a development build to debug it."
sources:
  - title: "React Developer Tools (react.dev)"
    url: "https://react.dev/learn/react-developer-tools"
    checked: 2026-11-03
  - title: "Minified Error Decoder (react.dev)"
    url: "https://react.dev/errors"
    checked: 2026-11-03
  - title: "Minified React error #31 (react.dev)"
    url: "https://react.dev/errors/31"
    checked: 2026-11-03
  - title: "Minified React error #418 (react.dev)"
    url: "https://react.dev/errors/418"
    checked: 2026-11-03
  - title: "Minified React error #185 (react.dev)"
    url: "https://react.dev/errors/185"
    checked: 2026-11-03
  - title: "Component: componentDidCatch, error boundaries (react.dev)"
    url: "https://react.dev/reference/react/Component"
    checked: 2026-11-03
  - title: "createRoot: error handler options (react.dev)"
    url: "https://react.dev/reference/react-dom/client/createRoot"
    checked: 2026-11-03
  - title: "StrictMode (react.dev)"
    url: "https://react.dev/reference/react/StrictMode"
    checked: 2026-11-03
  - title: "useState: troubleshooting (react.dev)"
    url: "https://react.dev/reference/react/useState"
    checked: 2026-11-03
  - title: "useEffect: fetching data, race conditions (react.dev)"
    url: "https://react.dev/reference/react/useEffect"
    checked: 2026-11-03
  - title: "exhaustive-deps lint rule (react.dev)"
    url: "https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps"
    checked: 2026-11-03
  - title: "React source, v19.3.1: ReactChildFiber.js (the error #31 text)"
    url: "https://github.com/facebook/react/blob/v19.3.1/packages/react-reconciler/src/ReactChildFiber.js"
    checked: 2026-11-03
  - title: "React source, v19.3.1: ReactFiberErrorLogger.js (development warning for an uncaught error)"
    url: "https://github.com/facebook/react/blob/v19.3.1/packages/react-reconciler/src/ReactFiberErrorLogger.js"
    checked: 2026-11-03
  - title: "React source, v19.3.1: formatProdErrorMessage.js (minified message format)"
    url: "https://github.com/facebook/react/blob/v19.3.1/packages/shared/formatProdErrorMessage.js"
    checked: 2026-11-03
  - title: "React DevTools source: GeneralSettings.js (setting label)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Settings/GeneralSettings.js"
    checked: 2026-11-03
  - title: "Debug JavaScript (Chrome DevTools)"
    url: "https://developer.chrome.com/docs/devtools/javascript"
    checked: 2026-11-03
  - title: "Pause your code with breakpoints (Chrome DevTools)"
    url: "https://developer.chrome.com/docs/devtools/javascript/breakpoints"
    checked: 2026-11-03
  - title: "JavaScript debugging reference (Chrome DevTools)"
    url: "https://developer.chrome.com/docs/devtools/javascript/reference"
    checked: 2026-11-03
  - title: "Debug your original code instead of deployed with source maps (Chrome DevTools)"
    url: "https://developer.chrome.com/docs/devtools/javascript/source-maps"
    checked: 2026-11-03
  - title: "Preferences: Sources, Enable JavaScript source maps (Chrome DevTools)"
    url: "https://developer.chrome.com/docs/devtools/settings/preferences"
    checked: 2026-11-03
  - title: "Developer Resources: View and manually load source maps (Chrome DevTools)"
    url: "https://developer.chrome.com/docs/devtools/developer-resources"
    checked: 2026-11-03
  - title: "Inspect network activity (Chrome DevTools)"
    url: "https://developer.chrome.com/docs/devtools/network"
    checked: 2026-11-03
  - title: "Open Chrome DevTools"
    url: "https://developer.chrome.com/docs/devtools/open"
    checked: 2026-11-03
  - title: "Debugging (Visual Studio Code)"
    url: "https://code.visualstudio.com/docs/debugtest/debugging"
    checked: 2026-11-03
  - title: "Browser debugging in VS Code"
    url: "https://code.visualstudio.com/docs/nodejs/browser-debugging"
    checked: 2026-11-03
  - title: "Using React in Visual Studio Code"
    url: "https://code.visualstudio.com/docs/nodejs/reactjs-tutorial"
    checked: 2026-11-03
  - title: "productionBrowserSourceMaps (Next.js)"
    url: "https://nextjs.org/docs/app/api-reference/config/next-config-js/productionBrowserSourceMaps"
    checked: 2026-11-03
  - title: "Build options: build.sourcemap (Vite)"
    url: "https://vite.dev/config/build-options"
    checked: 2026-11-03
related:
  - /blog/react-debugging-tools
  - /blog/maximum-update-depth-exceeded
  - /use-cases/why-did-this-component-render
---

To debug a React app, work through five steps: reproduce the bug until it happens on demand, read the error and its component stack, inspect the component and the data it got, pause the code where a value goes wrong, and log on purpose what a pause can't show. Production adds source maps, the react.dev error decoder and an error boundary that reports what it catches.

The examples use an order list with a search box that sometimes shows results for the wrong query.

## Reproduce the bug on demand

Chrome's DevTools tutorial calls finding a series of actions that reproduces a bug every time the first step of debugging. Write down the page, what you typed or clicked, and how fast, then drop steps one at a time until the bug stops happening.

In the order list: type `ab`, then `abc` straight away, and the list shows orders for `ab`. Type slowly and it's fine, so the problem is timing. The Network panel's Throttling drop-down (No throttling by default) slows the connection, which makes a timing bug easier to hit.

Do this in a development build. react.dev recommends it for debugging because it tracks extra debug info and warns about more problems.

## Read the error and the component stack

By default, an error thrown during rendering makes React remove the UI from the screen. A blank page after a click usually means there's an error in the Console. Say the list header does this:

```tsx
function OrderHeader({ customer }: { customer: { id: string; name: string } }) {
  return <h2>Orders for {customer}</h2>; // customer is an object, not a string
}
```

In development the message reads:

```text
Objects are not valid as a React child (found: object with keys {id, name}). If you meant to render a collection of children, use an array instead.
```

The message tells you what's wrong: render `customer.name`, not the object. The stack tells you where. React's component stack holds the component that threw plus the names and source locations of its parents, and an error boundary gets it as `info.componentStack`. For an uncaught error, React's development build also prints a warning: `An error occurred in the <Name> component.`

Error boundaries don't catch everything. React's Component page says they miss errors in event handlers, in server rendering, in asynchronous code such as `setTimeout`, and in the boundary itself.

If the message is [Maximum update depth exceeded](/blog/maximum-update-depth-exceeded), a state update keeps retriggering itself. That error has its own page with the causes and fixes.

## Inspect the component and its data

React Developer Tools is the extension for this: react.dev says you can use it to inspect components, edit props and state, and find performance problems. It's available for Chrome, Firefox and Edge, and the standalone `react-devtools` package covers Safari and other browsers. Pages built with React then get Components and Profiler panels.

Select `Orders` in the Components panel and compare its props and state with what you expect. You can edit them there, so you can try the value you suspect without touching the code.

If a component renders more often than it should, turn on "Highlight updates when components render" in the DevTools General settings to see which ones. The walkthrough on how to [find what causes a re-render in React](/use-cases/why-did-this-component-render) goes on from there, and [what triggers a render](/blog/when-does-react-re-render) covers the rules. For profiling, Next.js and render tracking, see the other [React JS debugging tools](/blog/react-debugging-tools).

When the data looks wrong, look at the request before the component. Here's the component, bug included:

```tsx
import { useEffect, useState } from "react";

type Order = { id: string; total: number };

function Orders({ customerId }: { customerId: string }) {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch(`/api/orders?customer=${customerId}&q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => setOrders(data));
  }, [customerId, query]);

  // ...input and list
}
```

In Chrome's Network panel, type `ab`, then `abc`. The Initiator column says what caused each request, and its link takes you to the code that sent it. The Response tab shows what came back. Two requests to `/api/orders`, the first one slower, mean the `ab` response arrived last. If the effect fires more often than the typing explains, [check which useEffect dependency changed](/use-cases/useeffect-which-dependency-changed).

## Pause the code at the wrong value

Chrome's tutorial makes the case that breakpoints get you there faster than `console.log`. You don't edit the source and reload, and DevTools shows every variable's value at the moment it pauses, not just the ones you thought to print. To pause from your own code, add a `debugger` statement:

```tsx
.then((data) => {
  debugger; // pauses here; remove before you commit
  setOrders(data);
})
```

When it pauses, the Scope pane lists local, closure and global variables with their values, and the Call Stack pane shows how you got there. Here `query` in Scope reads `"ab"` while the input says `abc`: the effect run for `ab` is writing its result late.

React's `useEffect` page has the fix. Set a variable to `true` in the cleanup so a late response can't overwrite newer state, because "network responses may arrive in a different order than you sent them".

```tsx
useEffect(() => {
  let ignore = false;

  fetch(`/api/orders?customer=${customerId}&q=${encodeURIComponent(query)}`)
    .then((res) => res.json())
    .then((data) => {
      if (!ignore) setOrders(data);
    });

  return () => {
    ignore = true;
  };
}, [customerId, query]);
```

## Log what a pause can't show

A pause shows one moment. For what happened across several renders or events, log it. Log in event handlers and effects, and print an object so the names travel with the values:

```tsx
console.log("orders response", { query, count: data.length });
```

Two things catch people out:

- **State is a snapshot.** React's `useState` page says calling a set function doesn't change the variable in code that's already running. A `console.log(count)` right after `setCount(count + 1)` prints the old value, so save `const nextCount = count + 1` and log that.
- **Strict Mode doubles things in development.** React calls your component function twice and runs one extra setup and cleanup for every Effect, so a log that shows up twice on mount isn't a second bug. With React DevTools installed, `console.log` calls from the second render are dimmed.

For levels, namespaces and a way to switch logs off, see [how logging libraries for React compare](/blog/react-logging-library).

### When the question is what changed between renders

Breakpoints and `console.log` are weakest at one question: which value changed on which render. debugsy, an in-process [React debug panel](/), is built for that. Mount `<DebugsyLook />` once near the root and call `useWhyDidYouUpdate` in the component you suspect, passing the values to watch:

```tsx
import { useWhyDidYouUpdate } from "@n-uf/debugsy";

function OrderList({ filters, onSelect }: Props) {
  useWhyDidYouUpdate("OrderList", { filters, onSelect });
  // ...
}
```

Turn on the panel's Deps toggle (⌘+D opens the panel, and a second press shows the full log), or run `window.debugsy.enable("dependencies")` in the console. From then on, each render that changes one of those keys adds lines like these to the log:

```text
🔄 [OrderList] Dependencies changed:
📦 [OrderList] filters: object changed (#1) 🚀
📝 [OrderList] onSelect: function changed (#1) (function → function) 🚀
```

It compares each key with the previous render by reference, so a new object with the same contents counts as a change. It sees only the components where you call it and the values you pass, and it only logs: it doesn't stop a render or a loop. `(#1)` counts the changes to that key, and 🚀 marks the start-up phase; the page on [finding what causes a re-render](/use-cases/why-did-this-component-render) explains the marks.

debugsy isn't on npmjs yet: a public release there is in preparation, and the home page linked above has the mount steps. It doesn't remove itself from production builds, so guard the import or the mount yourself, for example behind `process.env.NODE_ENV !== "production"`.

## Debug a React app in Chrome

Open DevTools with Cmd+Option+J on a Mac or Ctrl+Shift+J on Windows and Linux to land in the Console, or Cmd+Option+I / Ctrl+Shift+I for the last panel you used. Code lives in the Sources panel: a Page tab with the file tree, the code editor, and a debugger section with Breakpoints, Call Stack, Scope and Watch.

The breakpoint types from Chrome's page that matter most in a React app:

| Breakpoint | Chrome says use it to | In a React app |
|---|---|---|
| Line-of-code | Pause on an exact region of code | A handler or an effect body; in a component body it fires on every render |
| Conditional | Pause on an exact region, only when a condition is true | A component body or a `.map` callback, with a condition such as `query === "abc"` |
| Logpoint | Log a message to the Console without pausing | Watch a value without editing the file |
| Event listener | Pause on the code that runs after an event, such as click | Find the handler behind a button |
| Exception | Pause on the line that throws a caught or uncaught exception | Find where an error starts when the stack is unclear |

For a conditional breakpoint, right-click the line number, choose Add conditional breakpoint and type the condition. Add logpoint works the same way, and its message uses the same syntax as a `console.log` call. Exception breakpoints are the Pause on uncaught exceptions and Pause on caught exceptions checkboxes in the Breakpoints section.

With Enable JavaScript source maps checked (Settings > Preferences > Sources), the Sources panel can show the files you wrote, and the Call Stack names the original file instead of the bundle.

## Debugging React in VS Code

VS Code has a built-in debugger for Edge and Chrome, so breakpoints go in the editor. Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

Change `url` to your dev server's address. VS Code's own examples use `msedge` and say to replace it with `chrome` for Chrome. `webRoot` is used to resolve source maps. Start the dev server, then press F5. Code that runs at start-up has already run by the time the debugger attaches, so VS Code's React tutorial says to refresh the page to hit a breakpoint there. {{live:/blog/debug-next-js-app}}For a Next.js app, the launch configurations for server and browser code are in the guide on how to [debug a Next.js app](/blog/debug-next-js-app).{{/live}}

When it pauses, VARIABLES shows the selected frame's values, WATCH evaluates expressions and CALL STACK shows the active calls. F10 steps over, F11 steps in, Shift+F11 steps out and F5 continues. Conditional breakpoints and logpoints are in the margin's context menu. A logpoint takes plain text with expressions in curly braces, such as `User ID: {user.id}`. {{live:/blog/debug-react-vscode}}The longer guide on how to [debug React in VS Code](/blog/debug-react-vscode) covers attaching to a browser you started yourself, where breakpoints pause in components and hooks, and what to check when one won't bind.{{/live}}

## Debug a React app in production

### Decode the minified error

React's production build leaves out the full error text to send fewer bytes. What you see instead comes from `formatProdErrorMessage` in React's source:

```text
Minified React error #31; visit https://react.dev/errors/31?args[]=object%20with%20keys%20%7Bid%2C%20name%7D for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
```

The link opens a page that reassembles the original message, and the `args[]` values fill its `%s` placeholders.

| Code | Message starts with | First thing to check |
|---|---|---|
| #31 | Objects are not valid as a React child | Render a field of the object, or map an array |
| #185 | Maximum update depth exceeded | A state update loop; see the [fix for this error](/blog/maximum-update-depth-exceeded) |
| #418 | Hydration failed because the server rendered %s didn't match the client | react.dev's list: a `typeof window` branch, `Date.now()` or `Math.random()`, locale date formatting, external changing data, invalid HTML nesting, or a browser extension that edits the HTML |

### Turn stack frames back into your code

In production the stack points into minified files, and the component names in `componentStack` are minified too. React's Component page says you decode them with source maps, the same way as any JavaScript stack.

Whether the maps exist is a build setting. Next.js' page says browser source maps are disabled in production builds to prevent leaking your source on the client, unless you opt in. Turning them on adds `next build` time and memory use:

```js
// next.config.js
module.exports = {
  productionBrowserSourceMaps: true,
};
```

In Vite, `build.sourcemap` defaults to `false`. `true` writes a separate map file; `'hidden'` does the same but leaves the sourcemap comment out of the bundle, so the bundle doesn't point at its map. Chrome can load a map by hand. Its Developer Resources page gives the steps for a production site without maps: host the maps locally, open the deployed file in Sources, right-click it in the editor, choose Add source map and enter the map's URL.

### Report what users hit

An error boundary shows a fallback instead of a blank page, and its `componentDidCatch` can send the error to a reporting service:

```tsx
import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { fallback: ReactNode; children: ReactNode };

export class ErrorBoundary extends Component<Props, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // sendToMyService is your own function
    sendToMyService({ message: error.message, componentStack: info.componentStack });
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
```

`createRoot` also takes `onUncaughtError` and `onCaughtError` options. Both receive the error and an `errorInfo` object with the `componentStack`.

## React debugging tips that save time

- **Keep Strict Mode on.** The double render and extra effect cycle are there to expose impure code and missing cleanup, so what they turn up is worth fixing.
- **Use conditional breakpoints and logpoints inside components.** A component body runs on every render, and a plain breakpoint there stops you every time.
- **Change one thing between runs.** Change two at once and you won't know which one fixed it.
- **Check the Network panel before the component.** When the data is wrong, the Initiator column takes you to the code that sent the request.
- **Put error boundaries where a fallback makes sense.** React's page suggests one around the list of conversations in a messaging app, but not around every avatar.
- **Let the linter find missing dependencies.** react.dev's `exhaustive-deps` rule warns when an effect uses a value that isn't in its array, the cause of stale closures. If you find yourself fighting the linter, restructure the code; [how the dependency array works](/blog/useeffect-dependency-array) explains why.

debugsy is independent and not affiliated with Meta, the React team, Google, Microsoft, Vercel or the Vite project.
