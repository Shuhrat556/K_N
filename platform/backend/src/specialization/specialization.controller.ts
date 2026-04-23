import { Controller, Get, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import * as XLSX from "xlsx";
import { ListSpecializationsDto } from "./dto/list-specializations.dto";
import { SpecializationService } from "./specialization.service";

@Controller()
export class SpecializationController {
  constructor(private readonly spec: SpecializationService) {}

  @Get("specializations/filters")
  filters() {
    return this.spec.distinctFilters();
  }

  @Get("specializations")
  list(@Query() q: ListSpecializationsDto) {
    return this.spec.findMany(q);
  }

  @Get("specializations/export")
  async export(@Query() q: ListSpecializationsDto, @Res({ passthrough: false }) res: Response) {
    const rows = await this.spec.findManyForExport(q);
    const ws = XLSX.utils.json_to_sheet(
      rows.map((r) => ({
        ID: r.externalId ?? "",
        самт: r.direction ?? "",
        "рамз ва номи ихтисос": r.code_name,
        Муассиса: r.institution,
        макон: r.city ?? "",
        "шакли таҳсил": r.education_form ?? "",
        "намуди таҳсил": r.education_type ?? "",
        забон: r.language ?? "",
        нақша: r.quota ?? "",
        category: r.category,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", 'attachment; filename="specializations.xlsx"');
    res.send(buf);
  }
}
