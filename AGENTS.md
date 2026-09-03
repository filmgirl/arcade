# Guidance for coding agents

GitHub Arcade is a static cabinet for independently authored browser games. Keep
the cabinet design and player behavior stable while adding catalog entries.

## Adding a game

Read [the adding-games guide](docs/adding-games.md) before changing `games.json`.
Adding a game normally means adding one validated catalog object and its approved
artwork; do not redesign the cabinet or modify game implementations.

- Preserve the existing ivory-and-pastel cabinet, responsive layout, focus mode,
  navigation, and accessibility behavior.
- Do not add shared pause, mute, score, save-state, leaderboard, or
  `postMessage` integrations. A game owns its controls, audio, and state.
- Do not embed an untrusted game or artwork. Keep remote URLs on HTTPS and use
  local files only when their complete game and dependencies are deployed.
- Review artwork before adding it: confirm permission, dimensions, readability,
  loading behavior, and that it does not impersonate cabinet controls.
- Test the embedded page in a desktop browser and on a narrow touch viewport.
  Keep the browser checklist in the guide passing.

Prefer a catalog-only change. Run `npm test` before handing off the work.
