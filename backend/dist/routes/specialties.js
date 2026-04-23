"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.specialtiesRouter = void 0;
const express_1 = require("express");
const prisma_js_1 = require("../lib/prisma.js");
const router = (0, express_1.Router)();
exports.specialtiesRouter = router;
// GET /api/specialties/filters - Get distinct filter values
router.get("/api/specialties/filters", async (req, res) => {
    try {
        const [locations, languages, studyTypes, universities] = await Promise.all([
            prisma_js_1.prisma.specialty.findMany({
                select: { location: true },
                where: { location: { not: null } },
                distinct: ["location"],
                orderBy: { location: "asc" },
            }),
            prisma_js_1.prisma.specialty.findMany({
                select: { language: true },
                where: { language: { not: null } },
                distinct: ["language"],
                orderBy: { language: "asc" },
            }),
            prisma_js_1.prisma.specialty.findMany({
                select: { studyType: true },
                where: { studyType: { not: null } },
                distinct: ["studyType"],
                orderBy: { studyType: "asc" },
            }),
            prisma_js_1.prisma.specialty.findMany({
                select: { university: true },
                distinct: ["university"],
                orderBy: { university: "asc" },
            }),
        ]);
        res.json({
            locations: locations.map((l) => l.location).filter(Boolean),
            languages: languages.map((l) => l.language).filter(Boolean),
            studyTypes: studyTypes.map((s) => s.studyType).filter(Boolean),
            universities: universities.map((u) => u.university).filter(Boolean),
        });
    }
    catch (error) {
        console.error("Filters error:", error);
        res.status(500).json({ error: "Failed to fetch filters" });
    }
});
// GET /api/specialties - Get list with filters and pagination
router.get("/api/specialties", async (req, res) => {
    try {
        const { location, language, studyType, university, search, page = "1", limit = "20", sortBy = "createdAt", sortOrder = "desc", } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;
        // Build where clause
        const where = {};
        if (location) {
            where.location = location;
        }
        if (language) {
            where.language = language;
        }
        if (studyType) {
            where.studyType = studyType;
        }
        if (university) {
            where.university = university;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
                { university: { contains: search, mode: "insensitive" } },
            ];
        }
        // Validate sort field
        const validSortFields = ["createdAt", "code", "name", "university", "price"];
        const sortField = validSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";
        const sortDir = sortOrder === "asc" ? "asc" : "desc";
        // Execute queries in parallel
        const [specialties, total, stats] = await Promise.all([
            prisma_js_1.prisma.specialty.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { [sortField]: sortDir },
            }),
            prisma_js_1.prisma.specialty.count({ where }),
            prisma_js_1.prisma.specialty.aggregate({
                _count: { id: true },
                _avg: { price: true },
                _max: { price: true },
                _min: { price: true },
            }),
        ]);
        res.json({
            data: specialties,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
            stats: {
                totalCount: stats._count.id,
                avgPrice: stats._avg.price || 0,
                maxPrice: stats._max.price || 0,
                minPrice: stats._min.price || 0,
            },
        });
    }
    catch (error) {
        console.error("List error:", error);
        res.status(500).json({ error: "Failed to fetch specialties" });
    }
});
// GET /api/specialties/export - Export to Excel
router.get("/api/specialties/export", async (req, res) => {
    try {
        const { location, language, studyType, university, search } = req.query;
        const where = {};
        if (location)
            where.location = location;
        if (language)
            where.language = language;
        if (studyType)
            where.studyType = studyType;
        if (university)
            where.university = university;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
                { university: { contains: search, mode: "insensitive" } },
            ];
        }
        const specialties = await prisma_js_1.prisma.specialty.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });
        // Import xlsx dynamically to avoid issues
        const XLSX = await import("xlsx");
        const ws = XLSX.utils.json_to_sheet(specialties.map((s) => ({
            ID: s.id,
            "Код": s.code,
            "Номи ихтисос": s.name,
            "Муассиса": s.university,
            "Макон": s.location || "",
            "Шакли таҳсил": s.studyForm || "",
            "Намуди таҳсил": s.studyType || "",
            "Маблағ": s.price,
            "Забон": s.language || "",
            "Накша": s.quota || "",
            "Дарача": s.degree || "",
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", 'attachment; filename="specialties.xlsx"');
        res.send(buf);
    }
    catch (error) {
        console.error("Export error:", error);
        res.status(500).json({ error: "Failed to export specialties" });
    }
});
// GET /api/specialties/:id - Get single specialty
router.get("/api/specialties/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const specialty = await prisma_js_1.prisma.specialty.findUnique({
            where: { id: parseInt(id, 10) },
        });
        if (!specialty) {
            return res.status(404).json({ error: "Specialty not found" });
        }
        res.json(specialty);
    }
    catch (error) {
        console.error("Get error:", error);
        res.status(500).json({ error: "Failed to fetch specialty" });
    }
});
// DELETE /api/specialties/:id - Delete specialty
router.delete("/api/specialties/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_js_1.prisma.specialty.delete({
            where: { id: parseInt(id, 10) },
        });
        res.json({ ok: true, message: "Specialty deleted" });
    }
    catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ error: "Failed to delete specialty" });
    }
});
// DELETE /api/specialties - Clear all specialties
router.delete("/api/specialties", async (req, res) => {
    try {
        await prisma_js_1.prisma.specialty.deleteMany({});
        res.json({ ok: true, message: "All specialties cleared" });
    }
    catch (error) {
        console.error("Clear error:", error);
        res.status(500).json({ error: "Failed to clear specialties" });
    }
});
//# sourceMappingURL=specialties.js.map