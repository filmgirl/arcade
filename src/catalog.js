const ACCENTS = new Set(["lavender", "mint", "coral"]);
const LAYOUTS = new Set(["document", "portrait"]);

function requiredText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

// Local paths resolve beside index.html, including GitHub Pages project subpaths.
export function resolveSafeUrl(value, base, field, remoteOnly = false) {
  const text = requiredText(value, field);
  const isAbsolute = /^[a-z][a-z\d+.-]*:/i.test(text);
  if (remoteOnly && !isAbsolute) throw new Error(`${field} must be an absolute HTTPS URL.`);
  if (text.startsWith("//") || text.includes("\\") || /[\u0000-\u0020]/.test(text)) {
    throw new Error(`${field} must be a relative path or an HTTPS URL without spaces.`);
  }
  const url = new URL(text, base);
  if (isAbsolute || remoteOnly) {
    if (url.protocol !== "https:") throw new Error(`${field} must use HTTPS.`);
  } else if (!["http:", "https:"].includes(url.protocol) || url.origin !== new URL(base).origin) {
    throw new Error(`${field} must resolve to a local HTTP(S) path.`);
  }
  if (url.username || url.password) throw new Error(`${field} must not contain credentials.`);
  return url.href;
}

export function validateCatalog(raw, base) {
  if (!Array.isArray(raw)) throw new Error("The game catalog must be an array.");
  const games = [];
  const errors = [];
  const ids = new Set();
  raw.forEach((entry, index) => {
    const label = `Game ${index + 1}`;
    try {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        throw new Error("entry must be an object.");
      }
      const id = requiredText(entry.id, "id");
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error("id must be a lowercase slug.");
      if (ids.has(id)) throw new Error(`duplicate id "${id}".`);
      const title = requiredText(entry.title, "title");
      const description = requiredText(entry.description, "description");
      const instructions = requiredText(entry.instructions, "instructions");
      if (!Array.isArray(entry.controls) || entry.controls.length === 0) {
        throw new Error("controls must contain at least one key/action pair.");
      }
      const controls = entry.controls.map((control) => ({
        keys: requiredText(control?.keys, "control keys"),
        action: requiredText(control?.action, "control action")
      }));
      if (entry.viewport !== undefined && (!entry.viewport || typeof entry.viewport !== "object" || Array.isArray(entry.viewport))) {
        throw new Error("viewport must be an object when provided.");
      }
      const viewport = { layout: "document", height: 960, mobileHeight: 1100, ...entry.viewport };
      if (!LAYOUTS.has(viewport.layout)) throw new Error("viewport.layout must be document or portrait.");
      for (const field of ["height", "mobileHeight"]) {
        if (!Number.isInteger(viewport[field]) || viewport[field] < 320 || viewport[field] > 2400) {
          throw new Error(`viewport.${field} must be an integer between 320 and 2400.`);
        }
      }
      const accent = entry.accent ?? "lavender";
      if (!ACCENTS.has(accent)) throw new Error("accent must be lavender, mint or coral.");
      const game = {
        id, title, description, instructions, controls, viewport, accent,
        category: entry.category === undefined ? "Arcade game" : requiredText(entry.category, "category"),
        url: resolveSafeUrl(entry.url, base, "url"),
        repository: resolveSafeUrl(entry.repository, base, "repository", true),
        art: resolveSafeUrl(entry.art, base, "art"),
        coverArt: entry.coverArt === undefined ? null : resolveSafeUrl(entry.coverArt, base, "coverArt"),
        coverCharacter: entry.coverCharacter === undefined ? null : resolveSafeUrl(entry.coverCharacter, base, "coverCharacter")
      };
      ids.add(id);
      games.push(game);
    } catch (error) {
      errors.push(`${label}: ${error.message}`);
    }
  });
  return { games, errors };
}

export function gameFromHash(hash) {
  if (hash === "" || hash === "#" || hash === "#library") return { id: null };
  const match = /^#game\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(hash);
  return match ? { id: match[1] } : { error: "That game link is not valid. Choose a game below." };
}
