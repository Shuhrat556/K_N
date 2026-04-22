import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { FilterFacultiesQueryDto } from "./dto/filter-faculties.query";

@Injectable()
export class FacultiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findFiltered(q: FilterFacultiesQueryDto) {
    const where: Prisma.FacultyWhereInput = {};

    if (q.clusterId != null) {
      where.clusterId = q.clusterId;
    } else if (q.cluster?.trim()) {
      const c = await this.prisma.cluster.findFirst({
        where: { name: { equals: q.cluster.trim(), mode: "insensitive" } },
      });
      if (!c) {
        return [];
      }
      where.clusterId = c.id;
    }

    if (q.city?.trim()) {
      where.city = { contains: q.city.trim(), mode: "insensitive" };
    }
    if (q.language?.trim()) {
      where.language = { contains: q.language.trim(), mode: "insensitive" };
    }
    if (q.type) {
      where.type = q.type;
    }
    if (q.mode) {
      where.mode = q.mode;
    }

    let gte = q.minScore;
    let lte = q.maxScore;
    if (q.userScore != null && q.margin != null) {
      const cap = q.userScore + q.margin;
      lte = lte == null ? cap : Math.min(lte, cap);
    }
    if (gte != null || lte != null) {
      where.scoreRequirement = {};
      if (gte != null) where.scoreRequirement.gte = gte;
      if (lte != null) where.scoreRequirement.lte = lte;
    }

    const take = q.take ?? 200;
    const skip = q.skip ?? 0;

    return this.prisma.faculty.findMany({
      where,
      include: { cluster: true },
      orderBy: [{ university: "asc" }, { name: "asc" }],
      take,
      skip,
    });
  }

  async assertClusterExists(clusterId: number) {
    const c = await this.prisma.cluster.findUnique({ where: { id: clusterId } });
    if (!c) throw new NotFoundException(`Cluster not found: ${clusterId}`);
    return c;
  }
}
