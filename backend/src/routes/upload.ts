import { Router } from "express";
import multer from "multer";
import { parseExcelBuffer, previewExcel } from "../services/excel-parser.js";
import { prisma } from "../lib/prisma.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 52 * 1024 * 1024 }, // 52MB limit
});

// POST /api/upload-excel/preview - Preview Excel file
router.post("/api/upload-excel/preview", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "File is required" });
    }

    if (!file.originalname.toLowerCase().endsWith(".xlsx")) {
      return res.status(400).json({ error: "Only .xlsx files are allowed" });
    }

    const preview = previewExcel(file.buffer, 10);
    res.json({
      ok: true,
      filename: file.originalname,
      headers: preview.headers,
      rows: preview.rows,
      totalRows: preview.rows.length,
    });
  } catch (error) {
    console.error("Preview error:", error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : "Failed to parse Excel file" 
    });
  }
});

// POST /api/upload-excel - Upload and import Excel file
router.post("/api/upload-excel", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "File is required" });
    }

    if (!file.originalname.toLowerCase().endsWith(".xlsx")) {
      return res.status(400).json({ error: "Only .xlsx files are allowed" });
    }

    const rows = parseExcelBuffer(file.buffer);
    if (!rows.length) {
      return res.status(400).json({ error: "No valid data rows found; check headers and sheet content" });
    }

    // Bulk insert with upsert to prevent duplicates
    let inserted = 0;
    let skipped = 0;

    for (const row of rows) {
      try {
        // Use empty string for null studyForm in unique constraint
        const studyFormKey = row.studyForm || "";
        
        await prisma.specialty.upsert({
          where: {
            specialty_unique: {
              code: row.code,
              university: row.university,
              studyForm: studyFormKey,
            },
          },
          create: {
            code: row.code,
            name: row.name,
            university: row.university,
            location: row.location,
            studyForm: row.studyForm,
            studyType: row.studyType,
            price: row.price,
            language: row.language,
            quota: row.quota,
            degree: row.degree,
          },
          update: {
            name: row.name,
            location: row.location,
            studyForm: row.studyForm,
            studyType: row.studyType,
            price: row.price,
            language: row.language,
            quota: row.quota,
            degree: row.degree,
          },
        });
        inserted++;
      } catch {
        skipped++;
      }
    }

    res.json({
      ok: true,
      filename: file.originalname,
      parsed: rows.length,
      inserted,
      skipped,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to upload Excel file" 
    });
  }
});

export { router as uploadRouter };