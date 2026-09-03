import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { gameFromHash, resolveSafeUrl, validateCatalog } from "../src/catalog.js";

const base = "https://filmgirl.github.io/github-arcade/";
const deployedRoot = new URL("../", import.meta.url);
const catalog = JSON.parse(await readFile(new URL("../games.json", import.meta.url), "utf8"));
const guide = await readFile(new URL("../docs/adding-games.md", import.meta.url), "utf8");

test("shipped games validate and resolve art under the Pages project path", async () => {
  const { games, errors } = validateCatalog(catalog, base);
  assert.deepEqual(errors, []);
  assert.ok(games.length > 0);
  assert.deepEqual(new Set(games.map(({ id }) => id)), new Set(catalog.map(({ id }) => id)));
  for (const entry of catalog) {
    for (const field of ["art", "coverArt", "coverCharacter"]) {
      const reference = entry[field];
      if (reference === undefined || /^[a-z][a-z\d+.-]*:/i.test(reference)) continue;
      const artwork = new URL(reference, deployedRoot);
      const file = await stat(artwork);
      assert.ok(file.isFile() && file.size > 0, `${entry.id}.${field} must be a non-empty deployed file`);
    }
  }
  const byId = new Map(games.map((game) => [game.id, game]));
  assert.equal(byId.get("mona-maze").url, "https://filmgirl.github.io/mona-maze/");
  assert.equal(byId.get("flappy-copilot").viewport.layout, "portrait");
});

test("the adding-games guide contains a schema-valid catalog example", () => {
  const example = guide.match(/```json\n([\s\S]*?)\n```/)?.[1];
  assert.ok(example, "guide should contain a JSON catalog example");
  const { games, errors } = validateCatalog([JSON.parse(example)], base);
  assert.equal(games.length, 1);
  assert.deepEqual(errors, []);
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
