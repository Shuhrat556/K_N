import { Controller, Get } from "@nestjs/common";
import { ClustersService } from "./clusters.service";

@Controller("clusters")
export class ClustersController {
  constructor(private readonly clusters: ClustersService) {}

  @Get()
  list() {
    return this.clusters.list();
  }
}
