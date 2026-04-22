import { Controller, Get, Query } from "@nestjs/common";
import { FilterFacultiesQueryDto } from "./dto/filter-faculties.query";
import { FacultiesService } from "./faculties.service";

@Controller("faculties")
export class FacultiesController {
  constructor(private readonly faculties: FacultiesService) {}

  @Get()
  list(@Query() query: FilterFacultiesQueryDto) {
    return this.faculties.findFiltered(query);
  }
}
