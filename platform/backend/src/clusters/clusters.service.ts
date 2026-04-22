import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ClustersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.cluster.findMany({ orderBy: { id: "asc" } });
  }
}
