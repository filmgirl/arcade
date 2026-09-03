# Adding a game

GitHub Arcade is a catalog and cabinet, not a game engine. A game addition
should be predictable: approve the game and its artwork, add one object to
`games.json`, deploy all local files, and verify the embedded experience.

## Catalog entry

Copy this shape and replace the example values:

```json
{
  "id": "branch-runner",
  "title": "Branch Runner",
  "description": "Jump over merge conflicts on the way to your next release.",
  "category": "Platformer",
  "url": "./games/branch-runner/index.html",
  "repository": "https://github.com/your-name/branch-runner",
  "art": "./assets/branch-runner.svg",
  "coverArt": "./assets/branch-runner-cover.svg",
  "coverCharacter": "./assets/branch-runner-character.svg",
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

`id` is a stable lowercase hyphenated slug. Titles, descriptions, instructions,
control keys, and actions are non-empty plain text. `repository` must be an
HTTPS source link. `url`, `art`, `coverArt`, and `coverCharacter` may be local
relative paths or HTTPS URLs; credentials, HTTP URLs, network-path URLs, and
unsafe protocols are rejected. `coverArt` and `coverCharacter` are optional.
`category` defaults to `Arcade game`, and `accent` is `lavender`, `mint`, or
`coral`.

Relative paths are resolved beside `index.html`, not beside `src/`. Use
`./assets/...` and `./games/...`, never root-relative `/assets/...`: the Pages
workflow publishes the site under a project path. For a local game, put the
complete game and every dependency under `games/<id>/`. For a remote game, use
the HTTPS deployment URL and confirm that its owner permits embedding.

## Artwork review

Artwork appears in library cards and, for cover fields, in the playing header.
Before adding a local or remote reference:

1. Confirm the contributor has permission to use and redistribute the image.
   Keep attribution or license information in the repository when required.
2. Check that the image is non-empty, readable at card size, and appropriate for
   the ivory-and-pastel cabinet. Prefer optimized local SVG or PNG artwork.
3. Use `coverArt` for an illustrated background and `coverCharacter` only for a
   transparent foreground character. Do not use artwork that looks like a
   cabinet button, status indicator, or fake control.
4. Verify every local artwork file is included in the deployed directory. The
   catalog tests check `art`, `coverArt`, and `coverCharacter` references.

Do not copy a game's implementation into the cabinet or silently redraw another
project's artwork. The game repository remains the source of gameplay.

## Embedding restrictions

The iframe is intentionally isolated from the cabinet. It allows scripts,
same-origin storage, pointer lock, fullscreen, and gamepad, but does not allow
popups or top-level navigation. The cabinet has no shared game API and does not
inspect cross-origin errors. Do not add `postMessage` contracts or cabinet
controls for game state, audio, scores, or saves.

Only embed games and dependencies you trust. A local game on the cabinet's own
origin is not made safe by iframe sandboxing, and remote games may reject
embedding with `X-Frame-Options` or CSP. Always retain the **Open game** link so
players have a direct fallback.

## Viewport guidance

`viewport.height` and `viewport.mobileHeight` are iframe hints, in pixels, from
320 through 2400. Use `document` (the default) for pages with headers, controls,
or content that should scroll naturally. Use `portrait` for a height-driven
canvas such as Flappy Copilot; narrow screens cap it to a 3:4 shape. These
values do not resize the inner canvas and focus mode has its own available
space. Never hide a game's touch controls, minimap, audio settings, or header by
choosing a smaller value.

## Browser acceptance checklist

Before merging a catalog addition:

- [ ] `npm test` passes, including catalog validation and non-empty artwork checks.
- [ ] The library card has the right title, category, artwork, and accent.
- [ ] Launching, reloading, switching games, Back/Forward, and `#library` work.
- [ ] The game receives keyboard focus and its own controls work.
- [ ] Touch controls, scrolling, audio/settings controls, and pause behavior work
      on a narrow mobile viewport.
- [ ] Focus mode, native fullscreen fallback, **Open game**, and return-to-card
      behavior still work.
- [ ] No cabinet key, button, audio, score, or save behavior was introduced.
- [ ] A desktop browser and a real or emulated touch browser show no clipped
      game UI or broken artwork.
