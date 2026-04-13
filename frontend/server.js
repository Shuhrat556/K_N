import express from "express";
import path from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT || 3000);

const publicDir = path.join(__dirname, "public");
const distDir = path.join(__dirname, "dist");
const staticDir = existsSync(publicDir) ? publicDir : distDir;

app.use(express.static(staticDir));

// SPA fallback: Express 5 rejects `app.get("*")` with path-to-regexp v8+.
// `express.static` calls `next()` when a file isn't found, so this handler serves `index.html`
// for client-side routes while still allowing real static assets to resolve first.
app.use((_req, res) => {
  res.sendFile(path.join(staticDir, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Serving static files from: ${staticDir}`);
});
