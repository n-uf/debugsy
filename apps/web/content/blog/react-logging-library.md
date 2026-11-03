---
title: "React logging library: console, debug, pino and more"
description: "Which React logging library to use: plain console, debug, loglevel, pino, consola or debugsy, with what each does in the browser and when to pick it."
h1: "How to choose a React logging library"
mainKeyword: "react logging library"
kind: comparison
published: 2026-11-16
updated: 2026-11-16
author: n-uf
takeaways:
  - "Plain console has levels, groups, tables and timers, but no namespaces and no level you can set from your own code."
  - "debug switches namespaces on with localStorage.debug. loglevel keeps a level per named logger and saves it. pino and consola can pass log objects to code you write."
  - "A logging library writes where you point it. Catching errors in your users' browsers is the job of an error-reporting service."
  - "React can run a component's body twice in development, so log from event handlers and effects, not from render."
  - "debugsy keeps debug points you toggle in an in-page panel. It sends nothing anywhere."
faq:
  - q: "What is the best React logging library?"
    a: "There isn't one best choice, because the libraries solve different problems. Plain console is enough for a small app. debug fits when you want to switch one area on by name, loglevel when you want levels that persist, and pino or consola when you want log objects you can route to your own code. An error-reporting service covers errors in your users' browsers, which none of the loggers do on their own."
  - q: "Should I use console.log in production?"
    a: "Not for debugging noise, because anyone who opens the console can read it. Next.js's compiler can remove console calls at build time, and its docs show an exclude option to keep console.error. loglevel's README says its logging is filtered to warn level by default to keep a live site clean. debugsy doesn't remove itself from production builds, so guard its import or mount yourself."
  - q: "How do I turn logs on and off in the browser?"
    a: "With debug, set localStorage.debug in the console and reload. With loglevel, call setLevel, which saves the level in localStorage, or in a cookie if localStorage isn't available. debugsy has a toggle per debug point in its panel and window.debugsy.enable(\"cart\") in the console, and keeps that choice in localStorage. pino's browser options have a disabled flag."
  - q: "Can I log structured data in the browser console?"
    a: "Yes. console.log accepts objects and shows them as expandable trees, console.table lays an object or array out as a table, and the %o and %O substitutions format objects. MDN notes that the console reads an object when you first view it, not when it was logged, so clone an object first if you'll change it afterwards. pino's browser option asObject logs a {msg, level, time} object instead of a string."
  - q: "Does debugsy send logs to a server?"
    a: "No. debugsy isn't a remote logger. Its source makes no network requests: log entries stay in memory in the page (the last 10,000), and its settings are saved in localStorage. If you want logs or errors on a server, use pino's transmit option with your own endpoint, or an error-reporting service."
sources:
  - title: "console (MDN)"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/console"
    checked: 2026-11-03
  - title: "console.debug() (MDN)"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/console/debug_static"
    checked: 2026-11-03
  - title: "debug README (GitHub)"
    url: "https://github.com/debug-js/debug"
    checked: 2026-11-03
  - title: "loglevel README (GitHub)"
    url: "https://github.com/pimterry/loglevel"
    checked: 2026-11-03
  - title: "pino README (GitHub)"
    url: "https://github.com/pinojs/pino"
    checked: 2026-11-03
  - title: "pino Browser API (GitHub)"
    url: "https://github.com/pinojs/pino/blob/main/docs/browser.md"
    checked: 2026-11-03
  - title: "pino API reference (GitHub)"
    url: "https://github.com/pinojs/pino/blob/main/docs/api.md"
    checked: 2026-11-03
  - title: "consola README (GitHub)"
    url: "https://github.com/unjs/consola"
    checked: 2026-11-03
  - title: "consola source: constants.ts (log levels)"
    url: "https://github.com/unjs/consola/blob/main/src/constants.ts"
    checked: 2026-11-03
  - title: "Sentry for React (Sentry docs)"
    url: "https://docs.sentry.io/platforms/javascript/guides/react/"
    checked: 2026-11-03
  - title: "BugSnag React integration guide (BugSnag docs)"
    url: "https://docs.bugsnag.com/platforms/javascript/react/"
    checked: 2026-11-03
  - title: "Next.js Compiler: Remove Console (nextjs.org)"
    url: "https://nextjs.org/docs/architecture/nextjs-compiler"
    checked: 2026-11-03
  - title: "StrictMode (react.dev)"
    url: "https://react.dev/reference/react/StrictMode"
    checked: 2026-11-03
  - title: "Keeping Components Pure (react.dev)"
    url: "https://react.dev/learn/keeping-components-pure"
    checked: 2026-11-03
  - title: "debugsy source and README (GitHub)"
    url: "https://github.com/n-uf/debugsy"
    checked: 2026-11-03
related:
  - /blog/how-to-debug-react-app
  - /blog/react-debugging-tools
  - /
---

You may not need a React logging library at all. Plain `console` already has levels, groups, tables and timers, and for a small app that's enough. A library earns its place when you need something `console` lacks: namespaces you can switch on without a redeploy (`debug`), levels that survive a reload (`loglevel`), log objects you can hand to your own code (`pino`, `consola`), or a log that lives in the page instead of the browser console (debugsy). Sending errors from your users' browsers to a server is a separate job, and error-reporting services do it.

This article is on the debugsy site, and debugsy is one of the options. It comes last, with its limits. What's said about the other tools comes from their own READMEs and docs, read on 2026-11-03.

## What a React logging library needs to do

Six things decide whether a logger helps:

1. **Levels.** Keep `error` and `warn` on all the time, and turn `debug` on while you chase something.
2. **Namespaces.** A name per area, like `cart` or `auth`, so one area can be loud while the rest stay quiet.
3. **A switch you can flip at runtime.** If seeing a log line means a rebuild, you won't use it.
4. **Objects as objects.** Most React bugs are about a value. You want to open it, not read a string of it.
5. **Quiet for your users.** Anyone who opens the console can read what's in it, so decide what ships.
6. **A way to send errors, if you want one.** Most loggers leave that to you.

## Is plain console enough?

Often, yes. Most React debug logging starts as a few `console` calls in an event handler:

```tsx
import { useState } from "react";

type Item = { id: string; qty: number };

export function AddButton({ item }: { item: Item }) {
  const [added, setAdded] = useState<Item[]>([]);

  function handleClick() {
    console.group("cart: add");
    console.table(item);
    console.log("already in cart:", added.length);
    console.groupEnd();
    setAdded([...added, item]);
  }

  return <button onClick={handleClick}>Add ({added.length})</button>;
}
```

MDN's `console` page lists what's there beyond `log`: `info`, `warn`, `error` and `debug` for levels, `group` and `groupEnd` for nesting, `table`, `count`, `trace`, and `time` with `timeEnd`. Browsers add filter controls to show only some levels.

Two details catch people. `console.debug` only shows if the console is set to display debug output, which MDN says may be called the Debug or Verbose level. And `console.log(obj)` doesn't take a snapshot: the console reads the object when you first view it, not when it was logged. If you'll change the object afterwards, log a copy, such as `console.log(structuredClone(obj))`.

What `console` lacks is namespaces, a level you set from your code, and a way to leave the calls out of a build. Next.js can do the last part. Its compiler docs show `removeConsole`, which removes `console.*` calls from application code, with an `exclude` list for the ones to keep:

```js
// next.config.js
module.exports = {
  compiler: {
    removeConsole: { exclude: ["error"] },
  },
};
```

Stay on plain `console` when you log a few things in a few places. For a bug you can reproduce, a breakpoint often beats a log; the walkthrough on how to [debug a React app](/blog/how-to-debug-react-app) covers both.

## debug and its namespaces

`debug` calls itself a tiny debugging utility that works in Node.js and web browsers. You pass it a namespace and get back a decorated `console.error` to log through. In the browser, you switch namespaces on from `localStorage`:

```ts
import createDebug from "debug";

const debug = createDebug("shop:cart");

debug("added %o", { id: "sku-1", qty: 2 });
```

```js
// in the browser console, then reload the page
localStorage.debug = "shop:*";
```

`*` is a wildcard and a leading `-` excludes a namespace, so `shop:*,-shop:payment` turns on everything under `shop` except payment. Formatting is printf-style, with codes such as `%o`, `%O` and `%j`. One browser catch from the README: in Chromium-based browsers, `debug` output shows only if the console's Verbose level is on.

The README doesn't describe log levels. Output goes to stderr unless you override the `log` method. Pick `debug` when you want to turn one area on by name and don't need levels.

## loglevel and its saved levels

loglevel's README describes a deliberately small library: five methods (`trace`, `debug`, `info`, `warn`, `error`) plus a `silent` setting that turns everything off. It states a size of 1.4 KB minified and gzipped, with no dependencies. By default it filters to `warn`.

`getLogger(name)` gives each part of your app its own logger and level. `setLevel` saves the level in localStorage, or in a cookie if localStorage isn't available. `setDefaultLevel` sets one only when nothing is saved, so the level you picked in the console survives the next page load.

```ts
import log from "loglevel";

const cartLog = log.getLogger("cart");
cartLog.setDefaultLevel("error");

if (process.env.NODE_ENV !== "production") {
  Object.assign(window, { log }); // so you can reach it from the console
}

cartLog.debug("total", 42); // silent until the level is lowered
```

```js
// in the browser console
log.getLogger("cart").setLevel("trace");
```

The README's console example assumes `log` is a global, as it is with a script tag; in a bundled app it isn't, hence the `window` line. loglevel calls the matching `console` method directly, so the browser shows your line number, not a wrapper's. Output stays in the console; for a remote server, the README points to a third-party plugin. Pick it when you want levels per area that persist.

## pino in the browser

pino's README lists Node.js, Bare and Pear as runtimes. Its Browser API page says that in the browser pino uses the matching `console` methods, `console.error` for `fatal`, and that `pino.destination`, `pino.transport` and `pino.multistream` are Node-only. Levels run from `trace` to `fatal`, and the default is `info`.

Two browser options matter here. `asObject` logs an object like `{ msg, level, time }` instead of passing arguments to `console`. `transmit` takes a `send` function that pino calls with the log event for messages at or above a level, so you can post it to an endpoint you run. Child loggers add key-value pairs to every line.

```ts
import pino from "pino";

const logger = pino({
  level: "warn",
  browser: {
    asObject: true,
    transmit: {
      level: "error",
      send: (level, logEvent) => {
        // your code: send logEvent to your own endpoint
      },
    },
  },
});

const cartLogger = logger.child({ area: "cart" });
cartLogger.warn("price mismatch");
```

Where the log goes is up to your `send` function. To turn output down or off, change `level` or set `browser.disabled`; the docs describe no panel or toggle. Pick pino when you want the same log shape in the browser and on a Node server.

## consola

consola's README calls it a console wrapper and lists browser support, tags, pluggable reporters, throttling to prevent log spam, and pause and resume. In the browser it uses a basic reporter, and the smaller builds import from `consola/browser`.

Levels are numbers, from `0` (fatal and error) up to `5` (trace), with `3` (info) as the default; consola shows logs at the configured level or below. The `CONSOLA_LEVEL` environment variable isn't supported in browser builds, so set the level in code. `withTag` gives you a logger that carries a tag.

```ts
import { createConsola } from "consola/browser";

const cart = createConsola({ level: 4 }).withTag("cart");

cart.debug("recalculated", { total: 42 });
```

Pick consola when you want tags and swappable reporters behind one small API.

## Where an error-reporting service fits

The tools above write the logs you decide to write. An error-reporting service catches what you didn't plan for. Sentry's React page says its core error monitoring reports errors, uncaught exceptions and crashes automatically, and lists logs, tracing and session replay among its other features. BugSnag's React guide says you add it to capture and report errors in production automatically, and describes an `ErrorBoundary` for render errors. Both need an account and send data to their service.

Use one to hear about errors users hit that you never saw, not to read your own debug output while you work. debugsy is independent and isn't affiliated with Sentry, BugSnag, Meta or the React team, or with the authors of `debug`, loglevel, pino or consola.

## debugsy's debug points

debugsy is an in-process [React debug panel](/): a component you mount in your own app that shows one ordered log of your debug messages, render counts and dependency changes. Instead of loggers, you declare debug points, named channels grouped into modules. Each point has a toggle in the panel, and a call to a point that's off is dropped.

```tsx
import { useEffect } from "react";
import { dsy, registerModule, useDebugsy } from "@n-uf/debugsy";

registerModule("checkout", {
  label: "Checkout",
  emoji: "🛒",
  description: "cart and payment steps",
  points: {
    cart: { emoji: "🧺", label: "Cart", description: "items added and removed" },
    payment: { emoji: "💳", label: "Payment", description: "payment requests" },
  },
});

type Item = { id: string; price: number };

export function CartTotal({ items }: { items: Item[] }) {
  const debug = useDebugsy();
  const total = items.reduce((sum, item) => sum + item.price, 0);

  useEffect(() => {
    debug.log("cart", "total changed", { total, count: items.length });
  }, [debug, total, items.length]);

  return <p>{total}</p>;
}

export async function charge(body: unknown) {
  dsy.time("payment", "charge");
  const res = await fetch("/api/charge", { method: "POST", body: JSON.stringify(body) });
  dsy.timeEnd("payment", "charge");
  if (!res.ok) dsy.error("payment", "charge failed", { status: res.status });
  return res;
}
```

You log to a point by its bare key (`"cart"`, not `"checkout.cart"`). Keys share one list across modules, so give each a distinct name. `useDebugsy()` is for components, `dsy` works anywhere, `getDebugsy()` gets the same logger lazily, and `window.debugsy` reaches it from the browser console. The calls are `.log(point, message, data?, level?)`, stored as `info` unless you pass a level, and `.warn`, `.error` and `.critical(point, message, data?)`. `.time(point, label)` and `.timeEnd(point, label)` log the time between them. `dsy` and `getDebugsy()` also take an array of tags as the last argument; the types of `useDebugsy()` leave it out.

Every point starts off. Turn one on with its toggle in the panel, with `window.debugsy.enable("cart")` in the console, with `?debug=cart,payment` in the page URL, or, in development, with `NEXT_PUBLIC_SURFACE_DEBUG=cart`. A toggle or `enable()` is saved in `localStorage` (`surface-debug-config`). Each entry goes to the panel and is copied to the browser console, through `console.error` for `error` and `critical` and `console.log` for the rest; `window.debugsy.setConsoleEnabled(false)` stops the copy. Entries live in memory, up to the last 10,000. Nothing is sent anywhere.

Mount the panel once near the app root. It's hidden until you press ⌘+D.

```tsx
import { DebugsyLook } from "@n-uf/debugsy";

export function Root() {
  return process.env.NODE_ENV !== "production" ? <DebugsyLook /> : null;
}
```

That guard is yours to write: debugsy doesn't remove itself from production builds. It needs React 19. It isn't a remote logger or an error reporter, and its built-in Errors point is only a channel for your own calls; debugsy doesn't listen for uncaught errors. It installs from GitHub Packages, which asks for a GitHub token with `read:packages` even for public packages. The licence is PolyForm Perimeter 1.0.1, not MIT. The [home page](/) has the install and mount steps, and [React JS debugging tools](/blog/react-debugging-tools) shows where debugsy sits among profilers and DevTools.

Pick it when you want your own debug messages next to render counts and dependency changes in one ordered log, with toggles you can flip without touching code.

## The options side by side

`debug`, `loglevel`, `pino` and `consola` are general JavaScript libraries whose READMEs don't mention React; debugsy is built for it. The table sums up each tool's own page.

| | `console` | `debug` | `loglevel` | `pino` (browser) | `consola` | debugsy |
|---|---|---|---|---|---|---|
| Runs in the browser | Yes | Yes | Yes | Yes, through a Browser API | Yes, basic reporter | Yes, React 19 only |
| Levels | `debug`, `info`, `warn`, `error` | None described | `trace` to `error`, `silent` | `trace` to `fatal` | Numbers 0 to 5, `silent` | `info`, `warn`, `error`, `critical` |
| Namespaces and switches | Browser filter | Namespaces, `localStorage.debug` | Named loggers, saved level | Child loggers, `level`, `disabled` | `withTag`, `level` | Debug points, panel toggles, `enable()` |
| Structured data | Objects, `table`, `%o` | `%o`, `%O`, `%j` | Passes arguments to `console` | `asObject` | Objects and arguments | A `data` argument shown in the panel |
| Where logs go | Browser console | Console | Console | Console, or your `transmit` function | Console, or a reporter you write | The in-page panel, plus the console |

## Logging inside React components

Log from event handlers and effects, not from the render body. React's StrictMode page says that with Strict Mode on, development builds call the component function twice to find impure code, so a log line in the body prints twice. It also runs one extra setup and cleanup cycle for every Effect. With React DevTools installed, `console.log` calls during the second render look slightly dimmed, and DevTools has a setting, off by default, to hide them. Event handlers don't run during rendering, React's page on keeping components pure says, so they don't need to be pure.

A few habits that hold up:

- **Log the value that changed, in an effect.** An effect that depends on `[total]` logs when `total` changes, not on every render, as in the `CartTotal` example.
- **Keep secrets out.** An address or a token in a log line sits in the console, and in debugsy's in-memory log, for anyone with the page open.
- **Count renders with a counter, not a log line.** [React render count](/use-cases/react-render-count) covers counting. To find the value that made a component render, see how to [find what causes a re-render in React](/use-cases/why-did-this-component-render).

## Which one to pick

Pick by the question you're asking:

- A few logs in a small app: `console`, with `removeConsole` or a guard for production.
- One area at a time, switched on by name: `debug`.
- Levels per area that persist between reloads: `loglevel`.
- Log objects, or a hook that posts logs to your own endpoint: `pino`.
- Tags and swappable reporters: `consola`.
- Your debug messages beside render counts and dependency changes, in the page: debugsy.
- Errors from real users: an error-reporting service, on top of any of the above.

They mix well, and `console` calls keep working next to any of them. Beyond logging, the guide to how to [debug a React app](/blog/how-to-debug-react-app) puts logs in order with the other steps, and the [other tools for debugging React](/blog/react-debugging-tools) are sorted by job.
