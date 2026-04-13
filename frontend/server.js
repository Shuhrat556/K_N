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

app.get("*", (_req, res) => {
  const indexPath = path.join(staticDir, "index.html");
  res.sendFile(indexPath);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Serving static files from: ${staticDir}`);
});
