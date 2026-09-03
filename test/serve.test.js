import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";

test("preview serves the site and assets without exposing hidden files", async (t) => {
  const server = spawn(process.execPath, ["scripts/serve.mjs"], {
    cwd: new URL("../", import.meta.url),
    env: { ...process.env, PORT: "0", HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  const exited = once(server, "exit");
  t.after(async () => {
    server.kill();
    await exited;
  });
  const [output] = await once(server.stdout, "data", { signal: AbortSignal.timeout(5000) });
  const base = output.toString().match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
  assert.ok(base, "Preview prints its listening address");
  const home = await fetch(base);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /The Commit Cabinet/);
  for (const path of ["/src/app.js", "/games.json", "/styles.css", "/assets/mona-maze.png", "/assets/flappy-copilot.png", "/assets/fonts/Silkscreen-Regular.ttf"]) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 200, path);
    assert.ok((await response.arrayBuffer()).byteLength > 0, path);
  }
  assert.equal((await fetch(`${base}/.git`)).status, 403);
  assert.equal((await fetch(`${base}/not-a-file`)).status, 404);
  assert.equal((await fetch(base, { method: "POST" })).status, 405);
  const head = await fetch(base, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
});
