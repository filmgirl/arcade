# Adding a game to the Commit Cabinet

**Goal: one small catalog-and-artwork PR, not a cabinet rewrite.**

This guide is for humans and coding agents. Read [AGENTS.md](../AGENTS.md) for
repository guardrails and the [catalog field reference](../README.md#add-a-game)
for exact accepted values. Validate against `src/catalog.js`; do not invent
manifest fields or assume the player supports them.

## 1. Establish that the game is ready

Collect the following before editing the catalog:

- A stable playable HTTPS URL and a source repository URL.
- The real title, short description, genre, controls, and start/pause/audio
  behavior. Read the game's documentation and actually play it.
- Desktop and touch support, including any limitations.
- A gameplay screenshot for reference, plus permission for any character,
  trademark, font, or artwork you intend to include.

Prefer a standalone game maintained and deployed from its own repository.
Existing games do not need to be ported into this codebase or rewritten in a
framework. For an intentionally local game, put its complete distribution in
`games/<id>/` and use `./games/<id>/index.html`.

Check the real game in an iframe, not only in a top-level tab. A page may return
HTTP 200 while CSP or `X-Frame-Options` prevents embedding. The cabinet cannot
bypass those restrictions. Keep the direct Open game link, and ask for an
integration decision if the game cannot function in the existing sandbox.

Current sandbox permissions allow scripts, same-origin behavior, and pointer
lock. The iframe also delegates fullscreen and gamepad. Popups and top-level
navigation are not enabled. Same-origin local games are trusted code:
`allow-scripts` plus `allow-same-origin` is not a security boundary for them.

## 2. Prepare a matching cover

Use the existing cabinet's art direction:

- Warm ivory, graphite outlines, and lavender/mint/coral accents.
- Simple pixel characters with recognizable features from the real game.
- An illustrated environment that communicates the actual gameplay.
- Low detail that remains legible at card size; no noisy effects or intricate
  character rendering.

For a new game, capture the real gameplay first. Propose a few cover directions
for review before changing an approved design. Do not substitute a generic cat,
robot, or platformer scene that misrepresents the game.

The renderer composes the same assets in the library and player header:

| Field | Role |
| --- | --- |
| `art` | Required base image, usually a gameplay capture. Used when `coverArt` is omitted. It is not an automatic network-error fallback. |
| `coverArt` | Optional illustrated background that replaces `art` on both surfaces. |
| `coverCharacter` | Optional transparent character layered over the background on both surfaces. |
| `accent` | `lavender`, `mint`, or `coral`, used by cabinet styling. |

Prefer a 640x360 landscape SVG or PNG for the background and a square transparent
SVG or PNG for the character. Keep important content away from edges: library
backgrounds use a 16:9 crop, while headers have a different responsive crop.
The renderer positions the character for each surface; test both.

Put shipping assets under `assets/` with descriptive names, for example
`branch-runner.png`, `branch-runner-cover.svg`, and `branch-runner-character.svg`.
Local SVGs should be self-contained; avoid scripts, external font dependencies,
or external images nested inside an SVG. Keep the original captures if useful,
and include required attribution and license terms.

Existing permission for one asset is not blanket permission for every new use.
See the [artwork notes](../README.md#games) before using GitHub characters.

## 3. Register the game

Append an object to the array in `games.json`, or insert it at the intended display
position. Preserve existing IDs and entries. This fictional example includes all
supported fields; replace its URLs, controls, and asset paths with real ones:

```json
{
  "id": "branch-runner",
  "title": "Branch Runner",
  "description": "Jump over merge conflicts on the way to your next release.",
  "category": "Platformer",
  "url": "https://your-name.github.io/branch-runner/",
  "repository": "https://github.com/your-name/branch-runner",
  "art": "./assets/branch-runner.png",
  "coverArt": "./assets/branch-runner-cover.svg",
  "coverCharacter": "./assets/branch-runner-character.svg",
  "accent": "coral",
  "controls": [
    { "keys": "Arrows", "action": "Move" },
    { "keys": "Space / tap", "action": "Jump" },
    { "keys": "P", "action": "Pause" }
  ],
  "instructions": "Reach the release flag. Use the game's own sound controls.",
  "viewport": {
    "layout": "document",
    "height": 960,
    "mobileHeight": 1100
  }
}
```

Omit optional fields you do not need; do not use empty strings or `null` as
placeholders. Describe only controls that actually exist in the new game.
Text fields are plain text, not HTML.

The ID must be a unique lowercase slug, such as `branch-runner`. Its direct link
will be `#game/branch-runner`. Do not rename an existing ID just because a game's
display title changes.

Use relative local paths or absolute HTTPS URLs for game/artwork URLs, and an
absolute HTTPS URL for `repository`. No protocol-relative URLs, credentials,
`javascript:`, `data:`, or remote `http:` URLs. Relative local paths work on the
HTTP preview server and the HTTPS production site.

Paths resolve beside `index.html`. Use `./assets/...` rather than `/assets/...`
so they work under `/arcade/`. The deployment workflow includes `src/`, `assets/`,
and optional `games/`; placing dependencies in arbitrary top-level folders will
not publish them.

## 4. Choose a viewport, not a crop

Use `document` for games with surrounding UI. It gives the full page a generous
iframe height and leaves native scrolling available. Mona's menus and touch
controls are part of its document and must remain reachable.

Use `portrait` for height-driven portrait games such as Flappy. At narrow widths,
the iframe is capped to a 3:4 shape; the configured height remains an upper bound.
Do not assume this layout works for every portrait game.

Both height fields accept integers from 320 to 2400 pixels. The defaults are
960 on desktop and 1100 on mobile; the default layout is `document`. Focus mode
uses available screen space instead, so check it separately.

Do not access a cross-origin DOM to guess a document height, forcibly scale the
whole game with CSS, or hide overflow to disguise broken sizing. If the supported
hints cannot accommodate a game, discuss a reusable enhancement rather than
adding a game-ID-specific workaround.

## 5. Exercise the addition

Run `npm start` and `npm test`. The native tests validate the catalog and local
artwork files and smoke-test the preview server. They do not fetch remote games
or establish that an iframe actually renders.

Use browser automation when available, but inspect the rendered result too:

- [ ] The library shows the new title, description, cover, and correct count.
- [ ] Both cover layers render in the card and playing-screen header.
- [ ] Direct `#game/<id>` links and browser Back/Forward work.
- [ ] The actual game starts and responds to every advertised input.
- [ ] Mouse launch and keyboard launch focus the iframe. Press Space immediately
      after launch and after Reload game; it must not activate a cabinet button.
- [ ] Returning restores focus to the originating card.
- [ ] At most one iframe exists. Return leaves zero; switching detaches the old
      frame and stops its simulation/audio rather than merely hiding it.
- [ ] Open game leads to the correct standalone URL.
- [ ] Phone widths, including 320px and 390px, have no horizontal page overflow.
      Touch controls, menus, audio controls, and any minimap remain reachable.
- [ ] Focus mode and fullscreen retain accessible exits. Check unsupported or
      rejected fullscreen fallback as well.
- [ ] Focus indicators remain visible and reduced motion is respected by the
      cabinet. Report any separate limitations in the embedded game.
- [ ] Existing Mona and Flappy still launch, play, and return correctly.
- [ ] Search works when the catalog reaches six games; the library scrolls above
      four games. Do not replace the grid with a layout hardcoded to this count.
- [ ] Relative assets and local games resolve when the site is served below a
      subpath such as `/arcade/`, not just at the origin root.

In the PR, distinguish actual touch-device testing from browser touch emulation.
Do not claim validation that was not performed.

## 6. Submit and maintain

A normal PR contains the catalog entry, necessary shipping artwork, an update to
the README game list, and any required attribution. Include a library screenshot,
the real game URL, the inputs/layouts exercised, and any known limitations.
Do not edit the test suite's expected total count every time a game is added.

Once Pages is configured, the existing workflow deploys pushes to `main`, so a
merged catalog PR publishes the new listing. Verify the resulting deployment
before calling it live. See [deployment instructions](../README.md#github-pages-deployment).
The intended site slug is `arcade`; do not silently change it.

An independently hosted game can change without an arcade PR. Before releasing
such an update, check it through the cabinet again. Changes to URLs, advertised
controls, viewport needs, or artwork require a catalog/asset update here.
Do not change unrelated game repositories or publish code without authorization.

The cabinet intentionally has no shared score, pause, audio, or save-state API.
If a future game needs a bridge, stop and design an explicit, origin-validated,
capability-gated protocol separately. An ordinary catalog addition is not the
place to invent global controls or silently broaden the sandbox.
