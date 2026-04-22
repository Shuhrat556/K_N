import { Module } from "@nestjs/common";
import { FacultiesAdminController } from "./faculties.admin.controller";
import { ExcelImportService } from "./excel-import.service";
import { QuestionsAdminController } from "./questions.admin.controller";
import { QuestionsModule } from "../questions/questions.module";

@Module({
  imports: [QuestionsModule],
  controllers: [QuestionsAdminController, FacultiesAdminController],
  providers: [ExcelImportService],
})
export class AdminModule {}
