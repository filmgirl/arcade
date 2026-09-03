# GitHub Arcade

**A little less work. A little more play.**

The Commit Cabinet is an ivory-and-pastel candy cabinet for GitHub-themed browser
games. Pick a game on the recessed screen, play the original game, then return to
the library. No accounts, build step, tracking, framework, or runtime dependencies.

## Local preview

Install Node.js 22 or newer, then run:

```sh
npm start
```

Open **http://127.0.0.1:4173**. `PORT=8080 npm start` chooses another port.
The preview server binds to loopback by default; for a trusted local network,
use `HOST=0.0.0.0 npm start`. Do not use the preview server as a production server.
There is nothing to `npm install`. Opening `index.html` as a `file://` URL will not
work because browsers restrict module scripts and fetching the catalog.

Run the dependency-free catalog, routing, and preview-server tests:

```sh
npm test
```

## Games

| Game | Play | Source |
| --- | --- | --- |
| Mona's Merge Maze | [mona-maze](https://filmgirl.github.io/mona-maze/) | [filmgirl/mona-maze](https://github.com/filmgirl/mona-maze) |
| Flappy Copilot | [flappy-copilot](https://filmgirl.github.io/flappy-copilot/) | [filmgirl/flappy-copilot](https://github.com/filmgirl/flappy-copilot) |

The games remain in their own repositories. This project embeds them; it does not
copy or change their implementations. The game covers in `assets/` are actual
gameplay screenshots captured from each live game. The selector crops them to
fit its cards; it does not redraw or recolor the games. The marquee uses a locally hosted
[Silkscreen](https://github.com/googlefonts/silkscreen) font; its SIL Open Font
License is included in `assets/fonts/OFL.txt`. No fonts are fetched from third
parties at runtime.

## Add a game

Add an entry to **`games.json`**. No HTML, routing, or JavaScript changes are needed.
Supply an existing artwork URL, or add an image under `assets/`.

```json
{
  "id": "branch-runner",
  "title": "Branch Runner",
  "description": "Jump over merge conflicts on the way to your next release.",
  "category": "Platformer",
  "url": "./games/branch-runner/index.html",
  "repository": "https://github.com/your-name/branch-runner",
  "art": "./assets/branch-runner.svg",
  "accent": "coral",
  "controls": [
    { "keys": "Arrows", "action": "Move" },
    { "keys": "Space / tap", "action": "Jump" }
  ],
  "instructions": "Reach the release flag. Click or tap the game before using keyboard controls.",
  "viewport": {
    "layout": "document",
    "height": 960,
    "mobileHeight": 1100
  }
}
```

This is an example, not an included game. For a local game, put its complete files
in `games/branch-runner/`. For a remote game, replace `url` with its HTTPS URL.
Choose embeddable games you trust and have permission to host.

| Field | Requirement |
| --- | --- |
| `id` | Unique lowercase slug with hyphens; keep it stable to preserve links. |
| `title`, `description`, `instructions` | Non-empty plain text, rendered without HTML interpretation. |
| `url`, `art` | Relative local path or absolute HTTPS URL. Credentials, non-HTTPS remote URLs, protocol-relative URLs, and unsafe protocols are rejected. |
| `repository` | Absolute HTTPS source link. |
| `controls` | At least one object with non-empty `keys` and `action` strings. |
| `category` | Optional short genre label; defaults to "Arcade game". |
| `accent` | Optional `lavender`, `mint`, or `coral`; defaults to lavender. |
| `viewport.layout` | Optional `document` (default) or `portrait`. |
| `viewport.height` | Optional desktop iframe height, 320–2400 pixels; default 960. |
| `viewport.mobileHeight` | Optional mobile iframe height, 320–2400 pixels; default 1100. |

Relative paths resolve beside `index.html`, **not** beside the JavaScript module.
Use `./assets/...` and `./games/...`, not `/assets/...`, to preserve GitHub Pages
project paths. The Pages workflow publishes `src/`, `assets/`, and the optional
`games/` directory; place local games and all their dependencies in those folders.

`document` gives the whole game page a generous viewport with native internal
scrolling. It does not crop headers, touch controls, minimaps, or audio settings.
`portrait` caps the iframe height to a 3:4 shape at narrow widths and to the supplied
height on larger displays. It suits Flappy Copilot's height-driven canvas.
These are **iframe viewport hints**, not assumptions about the inner game's
canvas. In focus mode, the available screen space determines the viewport instead.
Always test the actual embedded page on desktop and touch devices.

The library uses a responsive grid, with a scrollable screen above four games.
Search appears at six games. Invalid
entries are skipped with specific on-screen errors; valid entries remain playable.
An empty catalog and a failed catalog request have distinct recovery messages.

## Navigation and accessibility

- Share `#game/mona-maze` or `#game/flappy-copilot` after the site URL. Browser
  Back/Forward works; `#library` returns to the selector. Unknown links show a
  useful message instead of launching a different game.
- Only the selected game gets an iframe. Returning, switching games, and reloading
  remove the previous iframe to stop that browsing context's simulation and audio.
- Launch and reload focus the game iframe, so Space goes to the game instead of
  activating a cabinet button. **Focus game controls** restores that focus after
  using the toolbar. Return restores focus to the originating game card.
  The cabinet does not steal key events intended for games.
- **Focus mode** removes the cabinet without depending on browser fullscreen.
  **Fullscreen** requests native fullscreen and falls back to focus mode if denied
  or unsupported. **Exit focus** and **Game library** remain in the player toolbar.
  Escape exits native fullscreen; when focus is in a cross-origin game, its own
  Escape binding still belongs to that game (Mona uses it to pause).
- The joystick and coin slot are labeled/decorative, not fake game controls.
  The pastel buttons perform actual cabinet actions. CRT scanlines start **off**,
  have no flicker, and never intercept pointer input. Reduced-motion preferences
  disable cabinet transitions; embedded games control their own motion settings.
- On phones, the playing cabinet drops its decorative surround and uses the full
  page width. Scroll inside document-style games for their full UI.

## Integration limits

No game advertises a shared `postMessage` API, so there is deliberately **no global
pause, mute, score, save state, or leaderboard**. Use each game's own controls.
The cabinet itself plays no audio. Games may play sound after interaction; use
Mona's music/effects buttons or Flappy's `M` key. The cabinet does not use cookies
or local storage; individual games may store their own preferences or scores.

Remote pages can change or reject embedding. An iframe `load` event is not proof
that a cross-origin game is healthy. The cabinet reports opening/slow-load/error
states without claiming otherwise and always provides **Open game** in a new tab.
It cannot inspect remote errors, automatically measure remote document height,
or bypass `X-Frame-Options` / CSP `frame-ancestors` restrictions.

Iframes allow scripts, same-origin storage, pointer lock, fullscreen and gamepad;
they do not permit popups or top-level navigation. Games that require other
permissions need a deliberate integration review. `allow-scripts` together with
`allow-same-origin` is **not a security boundary for games hosted on the cabinet's
own origin**; host only trusted local games. No game-to-parent messaging is used.

## GitHub Pages deployment

1. In the repository's **Settings → Pages**, choose **GitHub Actions** as the
   build and deployment source.
2. Push or merge the site to `main`, or run **Deploy arcade to GitHub Pages**
   manually from the Actions tab.
3. The workflow runs `npm test`, stages only static site files, uploads the Pages
   artifact, and deploys it. Use the successful deployment's URL.

The expected project URL is `https://filmgirl.github.io/github-arcade/` once Pages
has been enabled and deployment succeeds. Adding the workflow alone does **not**
publish the site. Hash routes do not require rewrites or a custom 404 page.
Any ordinary static HTTP host also works; serve the files at the site root or
a subpath with their relative directory structure intact.

## Project map

```text
index.html              Cabinet structure and accessible UI
styles.css              Enamel, screen, controls, responsive/focus layouts
games.json              The only catalog to edit when adding games
src/catalog.js          Catalog validation and hash parsing
src/app.js              Rendering, iframe lifecycle, navigation and focus
assets/                 Actual gameplay screenshots and cabinet favicon
scripts/serve.mjs        Dependency-free local preview server
test/catalog.test.js    Native Node regression tests
test/serve.test.js      Local preview HTTP smoke test
.github/workflows/      Static GitHub Pages deployment
```

Independent fan project by [@filmgirl](https://github.com/filmgirl). Not affiliated
with or endorsed by GitHub.
