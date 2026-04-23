import "dotenv/config";
import express from "express";
import cors from "cors";
import { uploadRouter } from "./routes/upload.js";
import { specialtiesRouter } from "./routes/specialties.js";

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", uploadRouter);
app.use("/api", specialtiesRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;