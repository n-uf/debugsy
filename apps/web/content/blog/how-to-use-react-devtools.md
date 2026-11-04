---
title: "How to use React DevTools, from install to the Profiler"
description: "How to use React DevTools: install the extension, inspect and edit components, set up the Profiler, and fix a Components tab that won't show."
h1: "How to use React DevTools, tab by tab"
mainKeyword: "how to use react devtools"
kind: how-to
published: 2026-11-30
updated: 2026-11-30
author: n-uf
takeaways:
  - "React's own page says the React Developer Tools browser extension (Chrome, Firefox, Edge) is the easiest way to debug a site built with React, and that you then see Components and Profiler panels."
  - "The Components tab shows the selected component's props, hooks and the components that rendered it, and you can edit values in place. DOM nodes are hidden by default through a component filter."
  - "The Profiler records a session you start and stop. To see why a component rendered, tick \"Record why each component rendered while profiling\" before you record."
  - "The Profiler needs a development or profiling build of React; without one it says \"Profiling not supported.\""
  - "When the tabs are missing or empty, the extension's own messages say what it found: \"This page doesn’t appear to be using React.\" in its popup, or \"Looks like this page doesn't have React, or it hasn't been loaded yet.\" in the panel."
faq:
  - q: "How do I use React DevTools?"
    a: "Install the React Developer Tools extension for Chrome, Firefox or Edge, open your browser's developer tools on a page built with React, and pick the Components or Profiler tab. Components shows the tree and the selected component's props and hooks. Profiler records a session you start and stop (react.dev, checked 2026-11-03)."
  - q: "How do I use the React DevTools Profiler?"
    a: "Open the Profiler tab, press the record button (its tooltip reads \"Start profiling - ⌘E\" on a Mac, \"Start profiling - Ctrl+E\" elsewhere), do the thing you're measuring, and press it again. Then pick a commit and a view, Flamegraph or Ranked. Tick \"Record why each component rendered while profiling\" in the Profiler settings first if you want the reason too (labels from the DevTools source, checked 2026-11-03)."
  - q: "Why is the React DevTools Components tab not showing?"
    a: "The extension's own pages name a few causes: the page doesn't use React, React can't communicate with the devtools, or the page runs from a file:// URL. Its popup says \"This page doesn’t appear to be using React.\" when it finds none, and the README says to tick \"Allow access to file URLs\" for local files in Chrome. For an iframe or another unusual setup, the README suggests the standalone react-devtools app."
  - q: "Can I edit state and props in React DevTools?"
    a: "Yes. Select a component, click a value under props or hooks and type a new one. The field expects valid JSON; Enter applies it and Escape resets it. The change affects the running page only, not your source file."
  - q: "Why doesn't the Profiler show why a component rendered?"
    a: "Because the reason is only recorded when \"Record why each component rendered while profiling\" was ticked before you recorded. Tick it in the Profiler settings, record again, and select the component: the sidebar then has a \"Why did this render?\" section. A recording made without the setting has no reasons to show."
sources:
  - title: "React Developer Tools (react.dev)"
    url: "https://react.dev/learn/react-developer-tools"
    checked: 2026-11-03
  - title: "Profiler (react.dev)"
    url: "https://react.dev/reference/react/Profiler"
    checked: 2026-11-03
  - title: "StrictMode (react.dev)"
    url: "https://react.dev/reference/react/StrictMode"
    checked: 2026-11-03
  - title: "react-devtools README (React repository on GitHub)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools/README.md"
    checked: 2026-11-03
  - title: "React DevTools changelog (version 8.0.0, September 8, 2026; the 4.0.0 entry on \"Why did this render?\")"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools/CHANGELOG.md"
    checked: 2026-11-03
  - title: "React Developer Tools in the Chrome Web Store (description, version, update date)"
    url: "https://chromewebstore.google.com/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi"
    checked: 2026-11-03
  - title: "Introducing the React Profiler (React blog, 2018; flame chart colours, ranked chart order)"
    url: "https://legacy.reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html"
    checked: 2026-11-03
  - title: "React DevTools extension source: main/index.js (tab names, React Element pane, no-React message)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-extensions/src/main/index.js"
    checked: 2026-11-03
  - title: "React DevTools extension source: background/setExtensionIconAndPopup.js (popup per React build type)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-extensions/src/background/setExtensionIconAndPopup.js"
    checked: 2026-11-03
  - title: "React DevTools extension popup: disabled.html (no React found)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-extensions/popups/disabled.html"
    checked: 2026-11-03
  - title: "React DevTools extension popup: production.html"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-extensions/popups/production.html"
    checked: 2026-11-03
  - title: "React DevTools source: ComponentSearchInput.js (search placeholder)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Components/ComponentSearchInput.js"
    checked: 2026-11-03
  - title: "React DevTools source: InspectHostNodesToggle.js (element picker title)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Components/InspectHostNodesToggle.js"
    checked: 2026-11-03
  - title: "React DevTools source: InspectedElementPropsTree.js (props section)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Components/InspectedElementPropsTree.js"
    checked: 2026-11-03
  - title: "React DevTools source: InspectedElementView.js (rendered by section)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Components/InspectedElementView.js"
    checked: 2026-11-03
  - title: "React DevTools source: InspectedElementHooksTree.js (hooks section, hook numbers, parse hook names title)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Components/InspectedElementHooksTree.js"
    checked: 2026-11-03
  - title: "React DevTools source: EditableValue.js (Enter, Escape, valid JSON)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Components/EditableValue.js"
    checked: 2026-11-03
  - title: "React DevTools source: SettingsModalContextToggle.js (\"View settings\")"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Settings/SettingsModalContextToggle.js"
    checked: 2026-11-03
  - title: "React DevTools source: SettingsModal.js (settings tabs)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Settings/SettingsModal.js"
    checked: 2026-11-03
  - title: "React DevTools source: GeneralSettings.js (setting label)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Settings/GeneralSettings.js"
    checked: 2026-11-03
  - title: "React DevTools source: DebuggingSettings.js (setting label)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Settings/DebuggingSettings.js"
    checked: 2026-11-03
  - title: "React DevTools source: ComponentsSettings.js (setting labels, filters)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Settings/ComponentsSettings.js"
    checked: 2026-11-03
  - title: "React DevTools source: ProfilerSettings.js (setting labels)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Settings/ProfilerSettings.js"
    checked: 2026-11-03
  - title: "React DevTools source: utils.js (default component filter)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/utils.js"
    checked: 2026-11-03
  - title: "React DevTools source: Profiler.js (Flamegraph and Ranked views)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Profiler/Profiler.js"
    checked: 2026-11-03
  - title: "React DevTools source: RecordToggle.js (record button title)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Profiler/RecordToggle.js"
    checked: 2026-11-03
  - title: "React DevTools source: ReloadAndProfileButton.js (button title)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Profiler/ReloadAndProfileButton.js"
    checked: 2026-11-03
  - title: "React DevTools source: NoProfilingData.js (empty-state text)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Profiler/NoProfilingData.js"
    checked: 2026-11-03
  - title: "React DevTools source: ProfilingNotSupported.js (message)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Profiler/ProfilingNotSupported.js"
    checked: 2026-11-03
  - title: "React DevTools source: SidebarCommitInfo.js (commit details)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Profiler/SidebarCommitInfo.js"
    checked: 2026-11-03
  - title: "React DevTools source: SidebarSelectedFiberInfo.js (\"Rendered at:\" list)"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Profiler/SidebarSelectedFiberInfo.js"
    checked: 2026-11-03
  - title: "React DevTools source: WhatChanged.js (\"Why did this render?\")"
    url: "https://raw.githubusercontent.com/facebook/react/main/packages/react-devtools-shared/src/devtools/views/Profiler/WhatChanged.js"
    checked: 2026-11-03
related:
  - /blog/react-debugging-tools
  - /use-cases/react-render-count
  - /blog/how-to-debug-react-app
---

How to use React DevTools: install the browser extension, open your browser's developer tools on a page built with React, and work in two tabs. Components shows the component tree and, for the component you select, its props and hooks, which you can edit. Profiler records a session and shows which components rendered in each commit, how long they took and, if you ask, why. Below: the install, the Components tab, the settings worth turning on, one Profiler recording, and what to check when the tabs don't appear.

The labels here come from react.dev and from the React DevTools source and changelog on GitHub, read on 2026-11-03 (DevTools 8.0.0, changelog dated September 8, 2026). Another version may word them differently. For the tools around DevTools (breakpoints, network, render loggers), see the overview of [React JS debugging tools](/blog/react-debugging-tools).

The examples use a cart page. `Cart` holds the items and a note field, and each item is a memoized row:

```tsx
import { memo, useState } from "react";

type Item = { id: number; title: string; qty: number };

const CartRow = memo(function CartRow({
  item,
  onRemove,
}: {
  item: Item;
  onRemove: () => void;
}) {
  return (
    <li>
      {item.title} × {item.qty} <button onClick={onRemove}>Remove</button>
    </li>
  );
});

export function Cart({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial);
  const [note, setNote] = useState("");

  return (
    <>
      <input value={note} onChange={(e) => setNote(e.target.value)} />
      <ul>
        {items.map((item) => (
          <CartRow
            key={item.id}
            item={item}
            onRemove={() =>
              setItems((all) => all.filter((i) => i.id !== item.id))
            }
          />
        ))}
      </ul>
    </>
  );
}
```

## Install React DevTools

react.dev calls the React Developer Tools browser extension the easiest way to debug websites built with React and links it for Chrome, Firefox and Edge. Once it's installed, a site built with React gets Components and Profiler panels. In Chrome and Edge the tab names carry an atom (`Components ⚛`, `Profiler ⚛`); in Firefox they're plain. There's also a Suspense tab, which the 8.0.0 changelog turns on by default.

The Chrome Web Store listing says the extension doesn't transmit any data remotely. On 2026-11-03 it showed version 8.0.0, updated September 10, 2026.

For Safari and other browsers, react.dev has you install the `react-devtools` npm package instead:

```sh
npm install -g react-devtools
react-devtools
```

That opens a standalone window. Connect your page by adding `<script src="http://localhost:8097"></script>` at the start of its `<head>` and reloading. The package's README says not to forget to remove that line before you deploy to production. For React Native, react.dev points to React Native DevTools, and to the standalone app for versions before 0.76.

## The React DevTools Components tab

Open your browser's developer tools on a page that runs React and pick Components. The tree lists the components React rendered, from the roots down. Select one and its details appear on the right.

### Find the component you mean

- Type in the search box. Its placeholder reads "Search (text or /regex/)", so `/Row$/` works as well as `CartRow`.
- Click the picker button (tooltip: "Select an element in the page to inspect it"), then click the thing on the page.
- Select an element in the browser's own Elements panel. The Chrome Web Store listing says it will then be selected in the React tree when you switch over. In Chrome and Edge, 8.0.0 also adds a `React Element ⚛` pane to the Elements panel that shows the matching component.

Your `<li>` and `<button>` won't be in the tree. DevTools starts with one component filter on: in the Components settings, under "Hide components where...", it hides type `dom nodes (e.g. <div>)`. Turn it off there if you want them.

### Props and hooks

Select `CartRow` and the right-hand side has a `props` section with `item` and `onRemove`. Select `Cart` and its two `useState` calls are listed under `hooks` as `1 State` and `2 State`, in call order.

The numbers don't say which is which. Click the toggle in the `hooks` header (tooltip: "Parse hook names (may be slow)"), or tick "Always parse hook names from source" in the Components settings, and the variable names appear beside them, like `1 State (items)`.

### Edit a value to try a fix

Click a value under `props` or a hook and type a new one. The field wants valid JSON (its placeholder says "Enter valid JSON"). Enter applies it and Escape resets it. Change `qty` in the `item` prop and the row shows the new number, with no edit to your code and no reload.

That answers "is the bug in the value or in how I show it?" If setting the value by hand fixes the screen, look at whatever sets it. The guide on how to [debug a React app](/blog/how-to-debug-react-app) takes it from there with breakpoints and logging.

### Who rendered it

The `rendered by` section lists the owners: the component that rendered the selected one, the one that rendered that, and so on. For a `CartRow`, that's where you find `Cart`, the component that wrote the `onRemove` prop.

## Settings worth turning on

The settings button in the DevTools toolbar has the tooltip "View settings". Its tabs are General, Debugging, Components and Profiler.

| Tab | Setting | What it does |
|---|---|---|
| General | Highlight updates when components render | Marks components on the page as they render. |
| Profiler | Record why each component rendered while profiling | Keeps a reason for each component in a recording. |
| Profiler | Hide commits below (ms) | Drops short commits from the list. |
| Components | Always parse hook names from source (may be slow) | Names your hooks, as above. |
| Debugging | Hide logs during additional invocations in Strict Mode | Hides the logs from Strict Mode's extra calls. |

The last one is about how [React renders twice in development](/blog/when-does-react-re-render). React's StrictMode page says that with DevTools installed, `console.log` calls from the second render appear slightly dimmed, and that DevTools has a setting, off by default, to hide them.

Try the highlight first. Type in the cart's note field and watch what flashes. A row that flashes on every keystroke when nothing about it changed is a lead.

## How to use the React DevTools Profiler

The highlight shows that something rendered. The Profiler shows what, for how long and, with one setting, why. React's own `<Profiler>` page points to this tab when you want an interactive profiler.

### Record a session

1. In the Profiler settings, tick "Record why each component rendered while profiling". The changelog's 4.0.0 entry (2019) says the feature adds a small amount of overhead, which is why it can be turned off.
2. Press the record button. Its tooltip reads "Start profiling - ⌘E" on a Mac and "Start profiling - Ctrl+E" elsewhere, and changes to "Stop profiling" while recording.
3. Type three characters in the note field, then stop.

To record the page's first render instead of an interaction, use "Reload and start profiling".

An empty Profiler says "No profiling data has been recorded" and "Record a session to see which components rendered, how long they took, and why." If it says "Profiling not supported." instead, the next line explains that profiling needs a development or profiling build of React v16.5+. React's `<Profiler>` page says profiling is disabled in the production build by default.

### Read the commits and charts

A recording is split into commits, with one bar per commit in the selector at the top. Select one and the sidebar shows "Committed at", the render duration and, when React recorded it, "What caused this update?"

Two views draw the selected commit: Flamegraph and Ranked. React's 2018 post introducing the Profiler, which the empty Profiler still links to, describes them. In the flame chart each bar is a component; its width is how long it and its children took when they last rendered, and its colour is the time in this commit: yellow for more, blue for less, gray for didn't render. The ranked chart puts the components that took longest at the top. The post is from 2018, so the colours in your version may differ.

### See why a component rendered

Click a `CartRow` in the chart. With the setting ticked before recording, the sidebar has a "Why did this render?" section. For the cart we'd expect "Props changed:" with `onRemove`. That prop is the inline arrow function in `Cart`, a new function on every render, so `memo` sees a new prop each time and the rows render on every keystroke. (We reasoned this from the code and the DevTools source; we didn't record it.) Whether a render was expected at all is a question for the rules of [when React re-renders](/blog/when-does-react-re-render).

Other reasons have their own lines. If nothing the component reads changed, the section says "The parent component rendered." On a mount it says "This is the first time the component rendered." Context changes show as "Context changed".

The same sidebar lists every commit the component rendered in under "Rendered at:". Counting that list is one way to get a [React render count](/use-cases/react-render-count) without touching your code.

When the reason is a new function or object, the usual fix is to make the value stable. The walkthrough on how to [find what causes a re-render in React](/use-cases/why-did-this-component-render) goes through it case by case.

For timing across the whole page, 8.0.0 removed the old Timeline tab, and the changelog points to the browser's Performance panel, which includes React tracks. The Profiler's empty state says those tracks need React 19.2 or newer.

## Components tab not showing?

Start outside DevTools.

1. **Click the extension's toolbar icon.** The extension sets its icon and popup per tab from the React build it finds. On a page with no React, the popup says "This page doesn’t appear to be using React." On a production build it says "This page is using the production build of React." and that the "Components" and "Profiler" tabs will appear.
2. **Read the panel.** In 8.0.0 the extension creates its panels before it detects React, so a tab can be there before React is. If Components says "Looks like this page doesn't have React, or it hasn't been loaded yet.", the extension waited for React and didn't find it. Reload with DevTools open and let the app mount.
3. **Check where the page runs.** The README says the tab won't show if the site doesn't use React, or if React can't communicate with the devtools. For a `file://` URL in Chrome, tick "Allow access to file URLs" on the extensions settings page, or use a local HTTP server. For an app inside an iframe, a Chrome extension or another unusual environment, the README suggests the standalone `react-devtools` app.
4. **If the tab is there but empty,** the README names two causes. On Chrome v101 and earlier, a fallback method can fail to load elements in the Components tab when the page's scripts come from cache; upgrade to v102 or newer. Or open `chrome://extensions`: if React Developer Tools shows "service worker (inactive)", disable and re-enable it, close DevTools, reload the page and open DevTools again.
5. **Check the filters.** If the tree looks thin, open the Components settings and look under "Hide components where..." for a filter someone added.

## What DevTools doesn't keep, and where debugsy fits

The Components tab shows values as they are now, and the Profiler covers the session you recorded. A log of your own values that builds up while you use the page needs code in the page.

debugsy is an in-process [React debug panel](/) by n-uf: a component you mount in your app that shows one ordered log of debug messages, render counts and dependency changes. Its `useWhyDidYouUpdate` hook compares each key of the object you pass with the previous render, by reference, and logs the keys that changed:

```tsx
import { useWhyDidYouUpdate } from "@n-uf/debugsy";

// inside CartRow
useWhyDidYouUpdate("CartRow", { item, onRemove });
```

Mount `<DebugsyLook />` once near the root and switch on the Deps toggle, or run `window.debugsy.enable("dependencies")` in the console: the hook does nothing until the `dependencies` debug point is on. Each change then gets a line that starts `📝 [CartRow] onRemove: function changed`, in order with your other debug messages, for as long as the page runs. `useRenderTracker`, which counts renders, is covered in [counting renders](/use-cases/react-render-count).

It sees only the components where you call its hooks, and only the values you pass in. It has no component tree, no editing and no flame charts, so it doesn't replace React DevTools. It doesn't stop renders, and it doesn't remove itself from production builds: guard the import or the mount yourself. It isn't on npmjs yet: a public release there is in preparation.

debugsy is independent and isn't affiliated with Meta or the React team.
