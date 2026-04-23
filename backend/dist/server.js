"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const upload_js_1 = require("./routes/upload.js");
const specialties_js_1 = require("./routes/specialties.js");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4001;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN?.split(",") || true,
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use("/api", upload_js_1.uploadRouter);
app.use("/api", specialties_js_1.specialtiesRouter);
// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// Error handling middleware
app.use((err, req, res, next) => {
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
exports.default = app;
//# sourceMappingURL=server.js.map