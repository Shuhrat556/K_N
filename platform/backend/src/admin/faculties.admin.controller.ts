import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { AdminApiKeyGuard } from "./admin-api-key.guard";
import { ExcelImportService } from "./excel-import.service";

const XLSX_MIME = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
]);

@Controller("admin/faculties")
@UseGuards(AdminApiKeyGuard)
export class FacultiesAdminController {
  constructor(private readonly excel: ExcelImportService) {}

  @Post("import")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok =
          (file.mimetype && XLSX_MIME.has(file.mimetype)) ||
          file.originalname.toLowerCase().endsWith(".xlsx");
        if (!ok) {
          return cb(new BadRequestException("Only .xlsx uploads are allowed"), false);
        }
        cb(null, true);
      },
    }),
  )
  importSheet(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { inserted: 0, skippedEmpty: 0, errors: ["file is required"] };
    }
    return this.excel.importFaculties(file);
  }
}
