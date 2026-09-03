import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { gameFromHash, resolveSafeUrl, validateCatalog } from "../src/catalog.js";

const base = "https://filmgirl.github.io/arcade/";
const catalog = JSON.parse(await readFile(new URL("../games.json", import.meta.url), "utf8"));

test("shipped games validate and resolve art under the Pages project path", () => {
  const { games, errors } = validateCatalog(catalog, base);
  assert.deepEqual(errors, []);
  assert.equal(games.length, catalog.length);
  const mona = games.find((game) => game.id === "mona-maze");
  const flappy = games.find((game) => game.id === "flappy-copilot");
  assert.ok(mona);
  assert.ok(flappy);
  assert.equal(mona.art, `${base}assets/mona-maze.png`);
  assert.equal(mona.coverArt, `${base}assets/mona-cover.svg`);
  assert.equal(mona.coverCharacter, `${base}assets/octocat-candy.svg`);
  assert.equal(flappy.coverArt, `${base}assets/flappy-cover.svg`);
  assert.equal(flappy.coverCharacter, `${base}assets/copilot-candy.svg`);
  assert.equal(mona.url, "https://filmgirl.github.io/mona-maze/");
  assert.equal(flappy.viewport.layout, "portrait");
});

test("every local catalog artwork reference points to a shipping asset", async () => {
  const root = new URL("../", import.meta.url);
  for (const game of catalog) {
    for (const field of ["art", "coverArt", "coverCharacter"]) {
      const reference = game[field];
      if (reference === undefined || /^https:/i.test(reference.trim())) continue;
      const asset = new URL(reference, root);
      assert.ok(asset.href.startsWith(root.href), `${game.id}.${field} must stay within the project`);
      const relative = asset.href.slice(root.href.length);
      assert.match(relative, /^(assets|games|src)\//, `${game.id}.${field} must be included in the deployment`);
      const info = await stat(asset);
      assert.ok(info.isFile() && info.size > 0, `${game.id}.${field} must be a non-empty file`);
    }
  }
});

test("local games work under project paths and HTTP development servers", () => {
  assert.equal(resolveSafeUrl("./games/example/index.html", base, "url"), `${base}games/example/index.html`);
  assert.equal(resolveSafeUrl("games/example/", "http://localhost:4173/arcade/", "url"), "http://localhost:4173/arcade/games/example/");
});

test("unsafe protocols, network paths, credentials and disguised URLs are rejected", () => {
  for (const url of ["http://example.com/game", "javascript:alert(1)", "data:text/html,test", "//evil.example/game", "\\\\evil.example", "https://user:pass@example.com", "https:\n//example.com", "file:///tmp/game.html"]) {
    assert.throws(() => resolveSafeUrl(url, base, "url"), undefined, url);
  }
  assert.throws(() => resolveSafeUrl("./local", base, "repository", true));
});

test("invalid entries produce actionable errors without hiding valid games", () => {
  const invalid = [
    { ...catalog[0], id: "Bad ID" },
    { ...catalog[0], url: "javascript:alert(1)" },
    { ...catalog[0], title: "" },
    { ...catalog[0], controls: [] },
    { ...catalog[0], controls: [null] },
    { ...catalog[0], viewport: null },
    { ...catalog[0], viewport: "portrait" },
    { ...catalog[0], viewport: { height: "900" } },
    { ...catalog[0], viewport: { layout: "crop" } },
    { ...catalog[0], viewport: { mobileHeight: 100 } },
    { ...catalog[0], accent: "unknown" },
    { ...catalog[0], coverArt: "javascript:alert(1)" },
    { ...catalog[0], coverCharacter: "http://example.com/cat.png" },
    null
  ];
  const result = validateCatalog([...invalid, catalog[0], catalog[0]], base);
  assert.equal(result.games.length, 1);
  assert.equal(result.errors.length, invalid.length + 1);
  assert.match(result.errors[0], /Game 1: id/);
  assert.match(result.errors.at(-1), /duplicate id/);
});

test("catalog is data-driven for large collections; optional metadata has safe defaults", () => {
  const entries = Array.from({ length: 15 }, (_, index) => ({ ...catalog[0], id: `game-${index}` }));
  delete entries[0].viewport;
  delete entries[0].accent;
  delete entries[0].category;
  delete entries[0].coverArt;
  delete entries[0].coverCharacter;
  const result = validateCatalog(entries, base);
  assert.equal(result.games.length, 15);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.games[0].viewport, { layout: "document", height: 960, mobileHeight: 1100 });
  assert.equal(result.games[0].accent, "lavender");
  assert.equal(result.games[0].coverArt, null);
  assert.equal(result.games[0].coverCharacter, null);
});

test("empty and structurally invalid catalogs are distinguished", () => {
  assert.deepEqual(validateCatalog([], base), { games: [], errors: [] });
  assert.throws(() => validateCatalog({}, base), /must be an array/);
});

test("hash routing handles direct links, library and malformed paths", () => {
  for (const hash of ["", "#", "#library"]) assert.deepEqual(gameFromHash(hash), { id: null });
  assert.deepEqual(gameFromHash("#game/mona-maze"), { id: "mona-maze" });
  for (const hash of ["#game/%", "#game/../bad", "#game/a/b", "#something"]) {
    assert.match(gameFromHash(hash).error, /not valid/);
  }
});
