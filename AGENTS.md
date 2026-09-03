# Working on the Commit Cabinet

Read [docs/adding-games.md](docs/adding-games.md) before adding or updating a game.
The field reference and deployment instructions are in [README.md](README.md).
`src/catalog.js` is the executable source of truth for the catalog schema.

## Keep ordinary additions small

- A conventional new game should need only a `games.json` entry, artwork under
  `assets/`, and the README's game list. Local games may additionally live under
  `games/<id>/`. Do not edit player code or add per-game CSS branches just to
  register a game.
- Prefer the game's existing independent repository and HTTPS deployment.
  Do not change another game repository unless explicitly asked.
- Keep IDs stable: `#game/<id>` is a public bookmark. Catalog order is display
  order. There are no hidden registration files or generated route lists.
- Use relative paths such as `./assets/example-cover.svg`. The public
  site is `https://filmgirl.github.io/arcade/`; do not assume deployment at `/`.
- Do not introduce a framework, runtime dependencies, telemetry, authentication,
  a backend, or a global leaderboard for a catalog addition.

## Preserve the player contract

- Create only the selected game's iframe. Remove it on return, switch, or reload;
  hiding a running iframe is not enough.
- Launch and reload focus the iframe, NOT Game library or another toolbar button.
  This prevents Space from ejecting a Flappy player. Return restores card focus.
- Keep the whole embedded document usable, including menus, sound controls,
  minimaps, and touch buttons. Do not crop a game to its canvas.
- Keep Open game available. A cross-origin iframe `load` event is not proof that
  a game started successfully.
- Audio, pause, scores, and storage belong to the game. There is no shared
  messaging API; do not fabricate one or pretend global controls work.
- Preserve mobile layout, visible keyboard focus, reduced-motion behavior, and
  the accessible exits from fullscreen/focus mode. CRT effects start off.
- Do not weaken URL validation or iframe permissions to get one game working.
  Explain the incompatibility and request an integration decision instead.

## Preserve the approved visual direction

The site is a warm ivory candy cabinet, not a dashboard or neon terminal.
Covers combine pastel environments with simple, low-detail pixel characters.
Use the actual game as the reference: Flappy has a pixel Copilot and commit
pipelines; Mona has a pixel Octocat over a lavender maze.

Library cards and playing-screen headers share the same artwork composition via
`gameArtwork()` in `src/app.js`. Do not restore tiny player thumbnails, invent
unrelated game imagery, or redraw existing approved artwork without a request.
For a new visual direction, show a few options and get approval before replacing
the live artwork. Keep alternatives and browser captures outside the repository
unless they are intentional shipping assets.

## Commands and handoff

- Node.js 22 or newer; `npm start` previews at `http://127.0.0.1:4173`.
- `PORT=4175 npm start` selects another port. There is no installation or build
  step for this dependency-free site.
- Run `npm test` and the browser checklist in the adding-games guide. Native
  tests do not prove a remote game is playable.
- Keep tests independent of total game count and catalog ordering. Look up known
  games by stable ID rather than assuming they occupy the first two slots.
- Do not commit credentials, generated caches, or test output. Do not push,
  merge, rename repositories, or enable deployment without user authorization.
- Report the game URL, files changed, browser coverage, and any limitations.
  Never describe an untested touch layout or a failed deployment as working.
