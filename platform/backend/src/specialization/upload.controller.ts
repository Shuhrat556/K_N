import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ExcelParserService } from "./excel-parser.service";
import { SpecializationService } from "./specialization.service";

@Controller()
export class UploadController {
  constructor(
    private readonly parser: ExcelParserService,
    private readonly spec: SpecializationService,
  ) {}

  @Post("upload-excel/preview")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 52 * 1024 * 1024 },
    }),
  )
  preview(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("File is required");
    if (!file.originalname.toLowerCase().endsWith(".xlsx")) {
      throw new BadRequestException("Only .xlsx files are allowed");
    }
    return this.parser.previewBuffer(file.buffer);
  }

  @Post("upload-excel")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 52 * 1024 * 1024 },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("File is required");
    if (!file.originalname.toLowerCase().endsWith(".xlsx")) {
      throw new BadRequestException("Only .xlsx files are allowed");
    }

    const rows = this.parser.parseBuffer(file.buffer);
    if (!rows.length) {
      throw new BadRequestException("No valid data rows found; check headers and sheet content");
    }

    const { inserted, skipped } = await this.spec.bulkInsert(rows);

    return {
      ok: true,
      filename: file.originalname,
      parsed: rows.length,
      inserted,
      skipped,
    };
  }
}
