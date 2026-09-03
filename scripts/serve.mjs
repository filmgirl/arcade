import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? "127.0.0.1";
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".ttf": "font/ttf" };

const server = createServer(async (request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let path;
  try {
    path = decodeURIComponent(new URL(request.url, `http://${host}`).pathname);
  } catch {
    response.writeHead(400).end("Invalid path");
    return;
  }
  let target = resolve(root, `.${path}`);
  if ((target !== root && !target.startsWith(`${root}${sep}`)) || path.split("/").some((part) => part.startsWith("."))) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  try {
    if ((await stat(target)).isDirectory()) target = resolve(target, "index.html");
    const body = await readFile(target);
    response.writeHead(200, { "Content-Type": `${types[extname(target)] ?? "application/octet-stream"}; charset=utf-8`, "Cache-Control": "no-store" });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") response.writeHead(404).end("Not found");
    else {
      console.error("Preview request failed:", error);
      response.writeHead(500).end("Preview server error");
    }
  }
});
server.listen(port, host, () => console.log(`GitHub Arcade preview: http://${host}:${server.address().port}`));
