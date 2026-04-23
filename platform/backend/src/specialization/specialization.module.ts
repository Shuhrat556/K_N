import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ExcelParserService } from "./excel-parser.service";
import { SpecializationController } from "./specialization.controller";
import { SpecializationService } from "./specialization.service";
import { UploadController } from "./upload.controller";

@Module({
  imports: [PrismaModule],
  controllers: [UploadController, SpecializationController],
  providers: [ExcelParserService, SpecializationService],
  exports: [SpecializationService, ExcelParserService],
})
export class SpecializationModule {}
