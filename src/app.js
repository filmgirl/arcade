import { gameFromHash, validateCatalog } from "./catalog.js";

const $ = (id) => document.getElementById(id);
const base = new URL("./", location.href);
const catalogUrl = new URL("games.json", base);
let games = [];
let activeGame = null;
let loadTimer;
let focusMode = false;
let nativeFullscreen = false;
let returnId = null;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function notice(id, message) {
  $(id).textContent = message;
  $(id).hidden = !message;
}

function gameArt(game) {
  const image = element("img", "game-art");
  image.src = game.art;
  image.alt = "";
  image.width = 640;
  image.height = 360;
  image.loading = "lazy";
  image.addEventListener("error", () => {
    image.hidden = true;
    console.warn(`Artwork could not be loaded for ${game.id}: ${game.art}`);
  });
  return image;
}

function renderCatalog() {
  const query = $("game-search").value.trim().toLowerCase();
  const shown = games.filter((game) => `${game.title} ${game.category} ${game.description}`.toLowerCase().includes(query));
  $("game-grid").replaceChildren(...shown.map((game) => {
    const card = element("button", `game-card ${game.accent}`);
    card.type = "button";
    card.dataset.gameId = game.id;
    card.setAttribute("aria-label", `Play ${game.title}`);
    const art = element("span", "art-wrap");
    art.append(gameArt(game), element("span", "game-category micro", game.category));
    const info = element("span", "game-info");
    const title = element("span", "game-name", game.title);
    const description = element("span", "game-description", game.description);
    const launch = element("span", "launch-label", "PLAY");
    const arrow = element("span", "launch-arrow", "↗");
    arrow.setAttribute("aria-hidden", "true");
    launch.append(arrow);
    info.append(title, description, launch);
    card.append(art, info);
    card.addEventListener("click", () => { location.hash = `game/${game.id}`; });
    return card;
  }));
  $("empty-results").hidden = shown.length > 0 || games.length === 0;
  $("library").classList.toggle("has-many", games.length > 4);
  $("library-footnote").textContent = games.length > 4 ? "Scroll for more games" : "Made for the joy of it ♡";
  $("game-count").textContent = `${games.length} GAME${games.length === 1 ? "" : "S"} / ALWAYS FREE`;
  $("search-wrap").hidden = games.length < 6;
}

function guide(game) {
  const fragment = document.createDocumentFragment();
  const list = element("dl", "controls-list");
  for (const { keys, action } of game.controls) {
    const pair = element("div");
    const term = element("dt");
    term.append(element("kbd", "", keys));
    pair.append(term, element("dd", "", action));
    list.append(pair);
  }
  fragment.append(list, element("p", "game-instructions", game.instructions));
  return fragment;
}

function removeGame() {
  clearTimeout(loadTimer);
  $("frame-host").replaceChildren();
}

function mountGame(game) {
  removeGame();
  const iframe = element("iframe");
  iframe.title = `${game.title} — interactive game`;
  iframe.src = game.url;
  iframe.referrerPolicy = "no-referrer";
  // No bridge is assumed. Sandbox isolates remote games without breaking scripts/storage.
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-pointer-lock");
  iframe.setAttribute("allow", "fullscreen; gamepad");
  $("frame-host").dataset.layout = game.viewport.layout;
  $("frame-host").style.setProperty("--game-height", `${game.viewport.height}px`);
  $("frame-host").style.setProperty("--mobile-height", `${game.viewport.mobileHeight}px`);
  notice("frame-status", `Opening ${game.title}… If it stays blank, use Open game.`);
  iframe.addEventListener("load", () => {
    if (iframe !== $("frame-host").firstElementChild) return;
    clearTimeout(loadTimer);
    notice("frame-status", "Blank screen or trouble playing? Use Open game. Audio and pause are controlled inside the game.");
  });
  iframe.addEventListener("error", () => {
    if (iframe !== $("frame-host").firstElementChild) return;
    clearTimeout(loadTimer);
    notice("frame-status", "The embedded game could not be loaded. Try Reload game or Open game.");
  });
  $("frame-host").append(iframe);
  loadTimer = setTimeout(() => {
    notice("frame-status", "The game is taking longer than expected. Try Open game or Reload game.");
  }, 15000);
}

function launch(game) {
  if (activeGame?.id === game.id) return;
  activeGame = game;
  returnId = game.id;
  $("library").hidden = true;
  $("player").hidden = false;
  $("cabinet").classList.add("is-playing");
  $("cabinet").dataset.game = game.id;
  $("instruction-title").textContent = game.title;
  $("instruction-content").replaceChildren(guide(game));
  $("player-guide").replaceChildren(guide(game));
  $("player-art").replaceChildren(gameArt(game));
  $("player-title").textContent = game.title;
  $("open-game").href = game.url;
  const repo = element("a", "game-repo", "Game source ↗");
  repo.href = game.repository;
  repo.target = "_blank";
  repo.rel = "noopener noreferrer";
  $("instruction-content").append(repo);
  $("deck-focus").disabled = false;
  document.title = `${game.title} · GitHub Arcade`;
  mountGame(game);
  $("return-button").focus({ preventScroll: true });
  $("screen").scrollIntoView({ block: "start", behavior: "instant" });
}

async function setFocusMode(enabled) {
  focusMode = enabled;
  $("cabinet").classList.toggle("is-focused", enabled);
  document.body.classList.toggle("focus-active", enabled);
  $("focus-button").textContent = enabled ? "Exit focus" : "Focus mode";
  $("focus-button").setAttribute("aria-pressed", String(enabled));
  $("deck-focus").setAttribute("aria-pressed", String(enabled));
  if (!enabled && document.fullscreenElement) {
    try {
      await document.exitFullscreen();
    } catch (error) {
      notice("mode-status", "Use your browser's fullscreen exit control to leave fullscreen.");
      console.warn("Exiting fullscreen failed.", error);
    }
  }
}

function showLibrary() {
  const hadGame = activeGame !== null;
  removeGame();
  activeGame = null;
  setFocusMode(false);
  notice("mode-status", "");
  $("library").hidden = false;
  $("player").hidden = true;
  $("cabinet").classList.remove("is-playing");
  delete $("cabinet").dataset.game;
  $("deck-focus").disabled = true;
  $("player-guide").hidden = true;
  $("guide-toggle").setAttribute("aria-expanded", "false");
  $("instruction-title").replaceChildren(document.createTextNode("Pick a game. Take a play break."));
  $("instruction-content").replaceChildren(
    element("p", "", "Choose a game on the screen to get started."),
    element("p", "", "Every game has its own controls. Your quick guide will appear right here.")
  );
  document.title = "GitHub Arcade — The Commit Cabinet";
  if (hadGame) {
    const card = Array.from($("game-grid").children).find((node) => node.dataset.gameId === returnId);
    (card ?? $("screen")).focus({ preventScroll: true });
    $("screen").scrollIntoView({ block: "start", behavior: "instant" });
  }
}

function route() {
  const result = gameFromHash(location.hash);
  const game = games.find((entry) => entry.id === result.id);
  notice("catalog-notice", result.error ?? (result.id && !game
    ? "That game is not in this cabinet. Choose one below."
    : games.length === 0 ? "This cabinet is empty. Add a game to games.json to get started." : ""));
  if (game) launch(game);
  else showLibrary();
}

document.querySelector(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  $("screen").focus();
  $("screen").scrollIntoView({ block: "start", behavior: "instant" });
});
$("game-search").addEventListener("input", renderCatalog);
$("return-button").addEventListener("click", () => { location.hash = "library"; });
$("deck-library").addEventListener("click", () => {
  if (activeGame) location.hash = "library";
  else {
    $("game-grid").querySelector("button")?.focus();
    $("screen").scrollIntoView({ block: "start", behavior: "instant" });
  }
});
for (const id of ["focus-button", "deck-focus"]) {
  $(id).addEventListener("click", () => {
    notice("mode-status", "");
    setFocusMode(!focusMode);
    $("focus-button").focus({ preventScroll: true });
  });
}
$("fullscreen-button").addEventListener("click", async () => {
  setFocusMode(true);
  notice("mode-status", "");
  if (document.fullscreenElement) return;
  if (!$("cabinet").requestFullscreen) {
    notice("mode-status", "Fullscreen is unavailable in this browser. Focus mode is on; use Exit focus to return.");
    return;
  }
  try {
    await $("cabinet").requestFullscreen();
  } catch (error) {
    notice("mode-status", "Fullscreen could not be opened. Focus mode is on; use Exit focus to return.");
    console.warn("Fullscreen request failed.", error);
  }
});
document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement === $("cabinet")) nativeFullscreen = true;
  else if (nativeFullscreen) {
    nativeFullscreen = false;
    setFocusMode(false);
  }
});
document.addEventListener("keydown", (event) => {
  // Keys inside a cross-origin game belong to it (including Mona's pause key).
  if (event.key === "Escape" && focusMode && !document.fullscreenElement) {
    setFocusMode(false);
    $("focus-button").focus({ preventScroll: true });
  }
});
$("effects-button").addEventListener("click", () => {
  const enabled = $("effects-button").getAttribute("aria-pressed") !== "true";
  $("effects-button").setAttribute("aria-pressed", String(enabled));
  $("effects-button").lastElementChild.textContent = `CRT effect: ${enabled ? "on" : "off"}`;
  $("screen").classList.toggle("crt-on", enabled);
});
$("guide-toggle").addEventListener("click", () => {
  const enabled = $("player-guide").hidden;
  $("player-guide").hidden = !enabled;
  $("guide-toggle").setAttribute("aria-expanded", String(enabled));
});
$("reload-game").addEventListener("click", () => {
  if (activeGame) mountGame(activeGame);
});
$("enter-game").addEventListener("click", () => {
  $("frame-host").querySelector("iframe")?.focus();
});
window.addEventListener("hashchange", route);

try {
  const response = await fetch(catalogUrl);
  if (!response.ok) throw new Error(`Catalog request returned HTTP ${response.status}.`);
  const result = validateCatalog(await response.json(), base);
  games = result.games;
  if (result.errors.length) {
    notice("catalog-error", `Some games could not be added: ${result.errors.join(" ")} Fix games.json and refresh.`);
  } else if (games.length === 0) {
    notice("catalog-notice", "This cabinet is empty. Add a game to games.json to get started.");
  }
  renderCatalog();
  route();
} catch (error) {
  notice("catalog-error", `The library could not be opened. ${error.message} Refresh to retry. If previewing locally, run npm start instead of opening index.html directly.`);
  console.error("Catalog loading failed.", error);
} finally {
  $("catalog-loading").hidden = true;
}
