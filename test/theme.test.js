import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../src/theme.js", import.meta.url), "utf8");

function boot({ dark = false, saved = null, query = "", blocked = false, quota = false } = {}) {
  const listeners = {};
  const attributes = {};
  const warnings = [];
  const root = { dataset: {} };
  const meta = {};
  const button = {
    disabled: true,
    setAttribute: (name, value) => { attributes[name] = value; },
    addEventListener: (name, handler) => { listeners[name] = handler; }
  };
  const system = {
    matches: dark,
    addEventListener: (name, handler) => { listeners.systemChange = handler; }
  };
  const storage = new Map(saved === null ? [] : [["github-arcade-theme", saved]]);
  const window = {
    location: new URL(`https://example.com/arcade/${query}#game/flappy-copilot`),
    matchMedia: () => system,
    history: {
      state: { retained: true },
      replaceState(state, title, url) {
        assert.equal(state, this.state);
        window.location = new URL(url);
      }
    },
    get localStorage() {
      if (blocked) throw new Error("Storage blocked");
      return {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => {
          if (quota) throw new Error("Storage quota exceeded");
          storage.set(key, value);
        }
      };
    }
  };
  const document = {
    documentElement: root,
    querySelector: () => meta,
    getElementById: () => button,
    addEventListener: (name, handler) => { listeners[name] = handler; }
  };
  runInNewContext(source, { window, document, URL, URLSearchParams, console: { warn: (...args) => warnings.push(args) } });
  const initialTheme = root.dataset.theme;
  listeners.DOMContentLoaded();
  return {
    root, meta, attributes, storage, warnings, button, window, initialTheme,
    click: () => listeners.click(),
    setSystem(value) { system.matches = value; listeners.systemChange(); }
  };
}

test("system theme applies before DOM readiness and follows system changes", () => {
  const app = boot();
  assert.equal(app.initialTheme, "light");
  assert.equal(app.button.disabled, false);
  app.setSystem(true);
  assert.equal(app.root.dataset.theme, "dark");
  assert.equal(app.attributes["aria-pressed"], "true");
  assert.equal(app.meta.content, "#292630");
  app.setSystem(false);
  assert.equal(app.root.dataset.theme, "light");
  assert.equal(app.storage.size, 0);
});

test("saved preferences override the system and ignore invalid stored values", () => {
  const app = boot({ saved: "light", dark: true });
  assert.equal(app.initialTheme, "light");
  app.setSystem(false);
  app.setSystem(true);
  assert.equal(app.root.dataset.theme, "light");
  assert.equal(boot({ saved: "invalid", dark: true }).initialTheme, "dark");
});

test("button toggles persist, update accessible state, and stop following the system", () => {
  const app = boot();
  app.click();
  assert.equal(app.root.dataset.theme, "dark");
  assert.equal(app.storage.get("github-arcade-theme"), "dark");
  assert.equal(app.attributes["aria-pressed"], "true");
  assert.match(app.attributes["aria-description"], /not the games/);
  app.setSystem(false);
  assert.equal(app.root.dataset.theme, "dark");
  app.click();
  assert.equal(app.storage.get("github-arcade-theme"), "light");
  assert.equal(app.attributes["aria-pressed"], "false");
});

test("blocked storage still permits an explicit theme for this visit", () => {
  const app = boot({ dark: true, blocked: true });
  assert.equal(app.initialTheme, "dark");
  app.click();
  assert.equal(app.root.dataset.theme, "light");
  app.setSystem(true);
  assert.equal(app.root.dataset.theme, "light");
  assert.match(app.button.title, /cannot be saved/);
  assert.equal(app.warnings.length, 2);
  assert.equal(boot({ dark: true, blocked: true }).initialTheme, "dark");
});

test("write failures do not prevent toggling", () => {
  const app = boot({ quota: true });
  app.click();
  assert.equal(app.root.dataset.theme, "dark");
  assert.equal(app.storage.size, 0);
  assert.match(app.attributes["aria-description"], /cannot be saved/);
  assert.equal(app.warnings.length, 1);
});

test("preview theme stays valid and toggles without losing the selected game URL", () => {
  const app = boot({ query: "?scoutTheme=dark&v=preview", saved: "light" });
  assert.equal(app.initialTheme, "dark");
  app.click();
  assert.equal(app.window.location.searchParams.get("scoutTheme"), "light");
  assert.equal(app.window.location.searchParams.get("v"), "preview");
  assert.equal(app.window.location.hash, "#game/flappy-copilot");
  assert.equal(boot({ query: "?scoutTheme=invalid", saved: "light", dark: true }).initialTheme, "light");
});
