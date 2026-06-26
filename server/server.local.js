// Local development and Docker server for QueueStorm.
//
// Reuses the real Vercel-style functions in api/ so local, Docker, and
// deployed behavior all run through the same classify -> handle -> gemini ->
// safety pipeline. When a built frontend exists in dist/, this server also
// serves it and falls back to index.html for client-side routes.

const http = require("http");
const fs = require("fs");
const path = require("path");
const health = require("../api/health");
const sortTicket = require("../api/sort-ticket");

const PORT = process.env.PORT || 3001;
const DIST_DIR = path.join(__dirname, "..", "dist");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function enhance(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    if (!res.getHeader("content-type")) res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(obj));
    return res;
  };
  return res;
}

function serveStatic(url, res) {
  if (!fs.existsSync(DIST_DIR)) return false;

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(url === "/" ? "/index.html" : url);
  } catch {
    return false;
  }

  const requested = path.normalize(path.join(DIST_DIR, decodedPath));
  const relativePath = path.relative(DIST_DIR, requested);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) return false;

  let filePath = requested;
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  res.statusCode = 200;
  res.setHeader("content-type", MIME_TYPES[ext] || "application/octet-stream");
  fs.createReadStream(filePath).pipe(res);
  return true;
}

const server = http.createServer((req, res) => {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }

  enhance(res);
  const url = (req.url || "").split("?")[0];

  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    if (body) { try { req.body = JSON.parse(body); } catch { req.body = body; } }
    try {
      if (url === "/health") return health(req, res);
      if (url === "/sort-ticket") return sortTicket(req, res);
      if (req.method === "GET" && serveStatic(url, res)) return;
      res.status(404).json({ error: "not_found" });
    } catch (err) {
      res.status(500).json({ error: "server_error", message: String(err && err.message) });
    }
  });
});

server.listen(PORT, () => {
  const llm = process.env.USE_LLM !== "false" && !!process.env.GEMINI_API_KEY;
  console.log("\nQueueStorm server -> http://localhost:" + PORT);
  console.log("   GET  /health");
  console.log("   POST /sort-ticket");
  console.log("   UI: " + (fs.existsSync(DIST_DIR) ? "enabled from dist/" : "disabled - dist/ not found"));
  console.log("   LLM: " + (llm ? "enabled (Gemini escalation active)" : "disabled - rules-only (set GEMINI_API_KEY to enable)") + "\n");
});
