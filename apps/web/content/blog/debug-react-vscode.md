---
title: "Debug React in VS Code: launch.json and breakpoints"
description: "Debug React in VS Code: a launch.json for a Vite dev server, breakpoints in components and hooks, and what to check when they don't bind."
h1: "How to debug React in VS Code"
mainKeyword: "debug react in vscode"
kind: how-to
published: 2026-12-03
updated: 2026-12-03
author: n-uf
takeaways:
  - "VS Code's page says it includes a built-in debugger for Edge and Chrome. Every launch configuration has a type, request and name; for a browser, url is the address to open and webRoot is used to resolve source maps."
  - "Vite's dev server listens on port 5173 by default and tries the next free port if that one is taken, unless strictPort is set, so the url in launch.json has to match the address Vite printed."
  - "A hollow gray breakpoint circle means the debugger could not register the breakpoint, for example because the line has no executable code."
  - "In development, Strict Mode calls a component's body twice, so a breakpoint there pauses twice per render. Code inside event handlers is not doubled."
  - "Vite's build.sourcemap defaults to false: a production build you serve with vite preview has no source maps until you turn them on."
faq:
  - q: "How do I debug React in VS Code?"
    a: "Start your dev server, create .vscode/launch.json with a msedge or chrome launch configuration whose url is the dev server's address, and press F5. Click the editor margin next to a line in a component to set a breakpoint. VS Code's React tutorial says code that runs at start-up has already run before the debugger attaches, so refresh the page to hit a breakpoint there."
  - q: "Why are my breakpoints not working in VS Code?"
    a: "Look at the breakpoint's icon first. VS Code's debugging page says a hollow gray circle means the debugger could not register it, for example because the line has no executable code. If the circle is red but never hits, check that the url in launch.json is the port your dev server actually uses, that webRoot points at the folder with your source, and that the Debug Console shows no source map errors."
  - q: "Do I need a launch.json to debug in VS Code?"
    a: "No. VS Code's browser-debugging page says the Debug: Open Link command asks for a URL, opens it and attaches the debugger, using Edge if it's your default browser and otherwise Chrome. A launch.json is worth writing once you want the same setup every time, and it's also how you attach to a browser you started yourself with --remote-debugging-port."
  - q: "Why does my breakpoint hit twice in React?"
    a: "In development, Strict Mode calls your component function twice to find impure code, and react.dev's StrictMode page lists the functions you pass to useState, useMemo and useReducer, and set functions, as called twice too. It also runs one extra setup and cleanup cycle for every Effect on mount. Code inside event handlers is not doubled, and none of this happens in a production build."
  - q: "How do I debug a Next.js app in VS Code?"
    a: "Follow the Next.js debugging guide, which gives a .vscode/launch.json with separate configurations for server-side, client-side and full-stack debugging. A Next.js app has server code that a browser launch configuration can't reach, so the Vite setup in this article covers only the client side."
sources:
  - title: "Browser debugging in VS Code (Visual Studio Code docs)"
    url: "https://code.visualstudio.com/docs/nodejs/browser-debugging"
    checked: 2026-11-03
  - title: "Debug code with Visual Studio Code"
    url: "https://code.visualstudio.com/docs/debugtest/debugging"
    checked: 2026-11-03
  - title: "Configure debugging in Visual Studio Code"
    url: "https://code.visualstudio.com/docs/debugtest/debugging-configuration"
    checked: 2026-11-03
  - title: "Using React in Visual Studio Code"
    url: "https://code.visualstudio.com/docs/nodejs/reactjs-tutorial"
    checked: 2026-11-03
  - title: "Server options: server.port, server.strictPort (Vite)"
    url: "https://vite.dev/config/server-options"
    checked: 2026-11-03
  - title: "Build options: build.sourcemap (Vite)"
    url: "https://vite.dev/config/build-options"
    checked: 2026-11-03
  - title: "Command Line Interface (Vite)"
    url: "https://vite.dev/guide/cli"
    checked: 2026-11-03
  - title: "Getting Started (Vite)"
    url: "https://vite.dev/guide/"
    checked: 2026-11-03
  - title: "Deploying a Static Site: vite preview (Vite)"
    url: "https://vite.dev/guide/static-deploy"
    checked: 2026-11-03
  - title: "Preview options: preview.port (Vite)"
    url: "https://vite.dev/config/preview-options"
    checked: 2026-11-03
  - title: "StrictMode (react.dev)"
    url: "https://react.dev/reference/react/StrictMode"
    checked: 2026-11-03
  - title: "useEffect (react.dev)"
    url: "https://react.dev/reference/react/useEffect"
    checked: 2026-11-03
  - title: "Debugging (Next.js docs, last updated August 25, 2026)"
    url: "https://nextjs.org/docs/app/guides/debugging"
    checked: 2026-11-03
related:
  - /blog/how-to-debug-react-app
  - /blog/debug-next-js-app
  - /blog/react-debugging-tools
---

To debug React in VS Code, start your dev server, add a `.vscode/launch.json` that launches Chrome or Edge at the server's address, and press F5. Then click the editor margin next to a line in a component to set a breakpoint, and reload the page. VS Code has a built-in debugger for Edge and Chrome, so there's no extension to install. The example here is a Vite app: the config, breakpoints in components and hooks, attaching to a browser you started yourself, and what to check when a breakpoint won't bind.

Chrome's DevTools can set the same breakpoints in the browser. What VS Code adds is that breakpoints, the call stack and variables sit next to the code you're editing. For the component tree you still want React Developer Tools, which is on the list of [debugging tools for React](/blog/react-debugging-tools). The guide on how to [debug a React app](/blog/how-to-debug-react-app) covers the rest of the process, from reading the error to production builds, with a shorter VS Code part.

## What you need before you press F5

To debug a React app in VS Code, have these ready:

- **A running dev server.** For Vite it's `npm run dev`. Vite's page says `server.port` defaults to 5173 and that if the port is already in use, Vite tries the next available one, so read the address it prints. With `--strictPort` or `server.strictPort` it exits instead. VS Code's React tutorial uses `http://localhost:3000`, where its create-react-app example runs. The tutorial itself notes create-react-app is no longer actively maintained and points to Vite or Next.js; for a Vite app, only the port changes. For a Next.js app, start with the [Next.js guide](/blog/debug-next-js-app).
- **Edge or Chrome.** The debugger drives one of them. VS Code's examples use `msedge` and say to replace it with `chrome` if you'd like Chrome.
- **The project folder open in VS Code.** `launch.json` lives in the `.vscode` folder at the root of your workspace.

## The quickest start: the Open Link command

Before you write any config, open the Command Palette (Cmd+Shift+P on a Mac, Ctrl+Shift+P on Windows and Linux) and run **Debug: Open Link**. VS Code's page says it asks for a URL, opens it and attaches the debugger. It uses Edge if that's your default browser; otherwise it looks for a Chrome install. Type `http://localhost:5173`, set a breakpoint in a component and trigger it.

That's enough for a first look. Once you want the same setup every time, write a `launch.json`.

## Debug React in VS Code with a Vite launch.json

VS Code's page gives a launch config for `msedge`. For a Vite dev server, change `url`, add `webRoot` as the React tutorial does, and, for Chrome, use `chrome`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against Vite",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

What each field does, going by VS Code's pages:

| Field | What it does |
|---|---|
| `type` | Which debugger runs it: `msedge` or `chrome` here |
| `request` | `launch` starts a new browser; `attach` connects to one that's already running |
| `name` | The label in the Run and Debug configuration dropdown |
| `url` | The address to open when the browser launches |
| `webRoot` | The root directory of your source code, your workspace folder by default, used to resolve source maps |

Start the dev server in a terminal, open the Run and Debug view (Cmd+Shift+D, or Ctrl+Shift+D), pick the configuration and press F5. A new browser instance opens at the `url`.

This config doesn't start Vite. A configuration can run a task first with `preLaunchTask`, but a terminal tab running `npm run dev` is less to set up.

If your app lives in a subfolder of the workspace, set `webRoot` to that folder, for example `"${workspaceFolder}/apps/web"`.

### Code that runs at start-up

The React tutorial is plain about this one: code that runs on start-up has already run before the debugger attaches, so you won't hit a breakpoint there until you refresh the page. A breakpoint in `main.tsx`, or in a component's first render, waits for the reload.

## Attach to a browser instead of launching one

Launching is the usual choice. Attach when something else starts the browser: VS Code's configuration page says `attach` fits when another tool starts the application, or when you need to connect to a long-running or remote process.

First start Chrome or Edge in debug mode. VS Code's page gives this command, with the executable replaced by the path to your browser binary:

```bash
<path to your Chrome or Edge binary> --remote-debugging-port=9222 --user-data-dir=remote-debug-profile
```

The page explains both flags. `--remote-debugging-port` tells the browser to listen on that port for a debug connection. A separate `--user-data-dir` forces a new browser instance; without it, the command opens a new window of a browser that's already running, which doesn't enter debug mode. If attaching never connects, check this first.

Then add an attach configuration. The page's example sets `port`. `url` is an attach attribute too: with it, VS Code attaches to the tab with that URL, and without it, to all tabs.

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "attach",
      "name": "Attach to Chrome",
      "port": 9222,
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

An `address` property lets you debug a browser running on a different machine.

There's one more option on the same page: `editor-browser` as the `type` debugs inside VS Code's integrated browser, with no external browser at all. VS Code documents that browser in a separate article, which this one doesn't cover.

## Set breakpoints in components and hooks

Click the editor margin next to a line, or press F9. A filled red circle means the breakpoint is enabled. With the app running under the debugger, trigger the code: click the button, type in the field, reload the page.

Where you put the breakpoint matters more in React than elsewhere, because a component function runs more often than you'd guess:

| Where | When it pauses in development |
|---|---|
| Top level of a component or custom hook | Every render, and twice per render with Strict Mode on |
| Event handler | Once per event; Strict Mode doesn't double it |
| Function passed to `useState`, `useMemo` or `useReducer`, or an updater passed to a `set` function | Twice with Strict Mode on |
| Body of `useEffect` | After a commit where its dependencies changed; with Strict Mode on, a mount runs setup, cleanup and setup again |

The Strict Mode rows come from react.dev. The StrictMode page says it calls your component function body twice in development (top-level logic only, not code inside event handlers), and the `useEffect` page says it runs one extra development-only setup and cleanup cycle before the first real setup. None of it happens in a production build. If an effect ran twice and you aren't sure why, the article on [why an effect runs twice on mount](/blog/useeffect-runs-twice) goes through the causes.

A breakpoint in a component body can stop you on every render. VS Code's debugging page lists breakpoint types that cut that down:

- **Conditional breakpoints.** In the margin's context menu choose Add Conditional Breakpoint, then pick an expression (pause when it's true), a hit count, or Wait for breakpoint (activate after another breakpoint is hit). In a `.map` callback over orders, `order.id === "A-1042"` skips the rest.
- **Logpoints.** Add Logpoint writes a message to the Debug Console without pausing. It takes plain text with expressions in curly braces, such as `User ID: {user.id}`. The page notes that logpoints work only when the debugger implements them.
- **Triggered breakpoints.** Add Triggered Breakpoint makes one breakpoint wait until another is hit, for a failure that shows up only after a particular path.

When it pauses, the Run and Debug view shows VARIABLES for the selected stack frame, WATCH for expressions it re-evaluates at each pause, and CALL STACK for the active calls. The Debug Console evaluates an expression in the selected frame. In VARIABLES, Set Value changes a value on the spot, a quick way to try a fix before you edit the code.

F10 steps over, F11 steps into, Shift+F11 steps out and F5 continues. To step into a hook from the component that calls it, press F11 on the hook's line. The browser-debugging page lists `skipFiles`, which skips files matching the glob patterns you give it, so stepping stays out of code you don't care about.

If the real question is why a component rendered at all, [what makes React render a component again](/blog/when-does-react-re-render) lists the triggers.

## VS Code React breakpoints not working: check these in order

Most breakpoints that won't work come down to one of a few causes. Start with the icon.

| What you see | Likely cause | What to do |
|---|---|---|
| Hollow gray circle | The debugger could not register the breakpoint: no executable code on that line, or a source file it doesn't support | Move it to a line that runs, such as a statement inside the function |
| Red circle, never hit, code runs at start-up | The code ran before the debugger attached | Refresh the page after the session starts |
| Red circle, never hit, and the launched page isn't your app | Vite moved to another port, so `url` points somewhere else (our reading; see below) | Compare `url` with the address Vite printed; set `server.strictPort` so the port can't move |
| Red circle, code runs, no pause | Source maps aren't loading, or `webRoot` is wrong | Read the Debug Console for source map errors; fix `webRoot` |
| Attach never connects | The browser wasn't started in debug mode | Use `--remote-debugging-port` with a separate `--user-data-dir` |
| Works in dev, not in a built app | A Vite production build has no source maps by default | Turn on `build.sourcemap` |

Some of these need more than a line.

**The wrong port.** This one isn't in VS Code's or Vite's pages; it follows from Vite's port fallback. Vite tries the next port when the one you asked for is in use, so a second dev server in another terminal can leave your config pointing at the wrong one. With `server.strictPort: true` in `vite.config` (or `--strictPort` on the `vite` command), Vite exits instead of moving, and you find out straight away.

**Source maps.** VS Code's page says the debugger uses source maps to map between your original code and the code running in the browser, and that most modern build tools work with it out of the box. If a source map can't be loaded, the Debug Console shows errors saying which one failed and why, so look there when a red breakpoint never hits. `webRoot` is what the debugger uses to resolve them, and the `trace` attribute enables diagnostic output. Chrome has its own source map setting, covered in the [Chrome part of the general debugging guide](/blog/how-to-debug-react-app).

**A built app.** Vite's `build.sourcemap` defaults to `false`. If you serve `dist` with `vite preview`, which Vite's page says serves it at `http://localhost:4173`, the bundle has no maps unless you opt in. `true` writes a separate map file; `'hidden'` does the same but leaves out the comment in the bundle that points to it. Set it in `vite.config`, or pass `--sourcemap` to `vite build`:

```ts
import { defineConfig } from "vite";

export default defineConfig({
  // your existing options
  build: { sourcemap: true },
});
```

Then point `url` at `http://localhost:4173`.

**Strict Mode pauses.** The breakpoint is bound; it just fires twice. Check whether `StrictMode` wraps your app. If it does, the second pause is React's extra call, not a bug in your code. With React DevTools installed, `console.log` output from the second render is dimmed, which helps with logs but not with breakpoints.

## Next.js is a different setup

Everything above is client-side code in a browser. A Next.js app also has server code, which a browser launch configuration doesn't reach. Next.js documents its own VS Code setup, with configurations for the server, the client and both. The article on how to [debug a Next.js app](/blog/debug-next-js-app) goes through it.

## When a breakpoint is the wrong tool

A breakpoint shows one moment. To find out which prop changed across the last ten renders, you'd press F5 ten times and read VARIABLES each time. A logpoint prints what you wrote into it and doesn't compare with the previous render. The page on how to [see why a component re-rendered](/use-cases/why-did-this-component-render) does that comparison with the tool below.

debugsy is an in-process [React debug panel](/). Mount `<DebugsyLook />` once near the app root, then call `useWhyDidYouUpdate` in the component you were stepping through, with the values you were reading in VARIABLES:

```tsx
import { useWhyDidYouUpdate } from "@n-uf/debugsy";

function OrderTable({ columns, onSort }: Props) {
  useWhyDidYouUpdate("OrderTable", { columns, onSort });
  // ...
}
```

It does nothing until the `dependencies` debug point is on: use the panel's Deps toggle, or run `window.debugsy.enable("dependencies")` in the browser console. After each render it compares each key you passed with the previous render by reference and logs the ones that changed:

```text
🔄 [OrderTable] Dependencies changed:
📦 [OrderTable] columns: object changed (#1) 🚀
📝 [OrderTable] onSort: function changed (#1) (function → function) 🚀
```

It only logs. It doesn't pause, stop a render or watch components you didn't add it to. It installs from GitHub Packages, which asks for a GitHub token with `read:packages` even though the source is public, and it doesn't remove itself from production builds, so guard the mount yourself. The install steps are on the home page.

For the other options, React DevTools' Components panel among them, see the list of [React JS debugging tools](/blog/react-debugging-tools).

debugsy is independent and not affiliated with Microsoft, Google, Meta, Vercel or the Vite project.
