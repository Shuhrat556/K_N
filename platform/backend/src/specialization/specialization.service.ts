import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { ParsedSpecializationRow } from "./excel-parser.service";

export type ListSpecializationsQuery = {
  page?: number;
  limit?: number;
  city?: string;
  institution?: string;
  education_form?: string;
  education_type?: string;
  language?: string;
  category?: string;
  search?: string;
};

const BATCH = 500;
const MAX_EXPORT = 50_000;

function buildWhere(q: ListSpecializationsQuery): Prisma.SpecializationWhereInput {
  const where: Prisma.SpecializationWhereInput = {};

  if (q.city?.trim()) {
    where.city = { contains: q.city.trim(), mode: "insensitive" };
  }
  if (q.institution?.trim()) {
    where.institution = { contains: q.institution.trim(), mode: "insensitive" };
  }
  if (q.education_form?.trim()) {
    where.educationForm = { contains: q.education_form.trim(), mode: "insensitive" };
  }
  if (q.education_type?.trim()) {
    where.educationType = { contains: q.education_type.trim(), mode: "insensitive" };
  }
  if (q.language?.trim()) {
    where.language = { contains: q.language.trim(), mode: "insensitive" };
  }
  if (q.category?.trim()) {
    where.category = { contains: q.category.trim(), mode: "insensitive" };
  }
  if (q.search?.trim()) {
    const s = q.search.trim();
    where.OR = [
      { codeName: { contains: s, mode: "insensitive" } },
      { institution: { contains: s, mode: "insensitive" } },
    ];
  }

  return where;
}

function mapRow(r: {
  id: number;
  externalId: number | null;
  direction: string | null;
  codeName: string;
  institution: string;
  city: string | null;
  educationForm: string | null;
  educationType: string | null;
  language: string | null;
  quota: number | null;
  category: string;
  createdAt: Date;
}) {
  return {
    id: r.id,
    externalId: r.externalId,
    direction: r.direction,
    code_name: r.codeName,
    institution: r.institution,
    city: r.city,
    education_form: r.educationForm,
    education_type: r.educationType,
    language: r.language,
    quota: r.quota,
    category: r.category,
    created_at: r.createdAt.toISOString(),
  };
}

@Injectable()
export class SpecializationService {
  constructor(private readonly prisma: PrismaService) {}

  async bulkInsert(rows: ParsedSpecializationRow[]): Promise<{ inserted: number; skipped: number }> {
    if (!rows.length) return { inserted: 0, skipped: 0 };

    const data: Prisma.SpecializationCreateManyInput[] = rows.map((r) => ({
      externalId: r.externalId ?? undefined,
      direction: r.direction ?? undefined,
      codeName: r.code_name,
      institution: r.institution,
      city: r.city ?? undefined,
      educationForm: r.education_form ?? undefined,
      educationType: r.education_type ?? undefined,
      language: r.language ?? undefined,
      quota: r.quota ?? undefined,
      category: r.category,
    }));

    let inserted = 0;
    for (let i = 0; i < data.length; i += BATCH) {
      const chunk = data.slice(i, i + BATCH);
      const res = await this.prisma.specialization.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      inserted += res.count;
    }

    const skipped = rows.length - inserted;
    return { inserted, skipped };
  }

  async findMany(q: ListSpecializationsQuery) {
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(100, Math.max(1, q.limit ?? 20));
    const skip = (page - 1) * limit;
    const where = buildWhere(q);

    const [total, rows] = await Promise.all([
      this.prisma.specialization.count({ where }),
      this.prisma.specialization.findMany({
        where,
        orderBy: [{ institution: "asc" }, { codeName: "asc" }],
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: rows.map(mapRow),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findManyForExport(q: ListSpecializationsQuery): Promise<ParsedSpecializationRow[]> {
    const where = buildWhere(q);
    const rows = await this.prisma.specialization.findMany({
      where,
      orderBy: [{ institution: "asc" }, { codeName: "asc" }],
      take: MAX_EXPORT,
    });

    return rows.map((r) => ({
      externalId: r.externalId,
      direction: r.direction,
      code_name: r.codeName,
      institution: r.institution,
      city: r.city,
      education_form: r.educationForm,
      education_type: r.educationType,
      language: r.language,
      quota: r.quota,
      category: r.category,
    }));
  }

  async distinctFilters() {
    const [cities, institutions, categories, forms, types, langs] = await Promise.all([
      this.prisma.specialization.findMany({
        select: { city: true },
        distinct: ["city"],
        where: { city: { not: null } },
      }),
      this.prisma.specialization.findMany({
        select: { institution: true },
        distinct: ["institution"],
      }),
      this.prisma.specialization.findMany({
        select: { category: true },
        distinct: ["category"],
      }),
      this.prisma.specialization.findMany({
        select: { educationForm: true },
        distinct: ["educationForm"],
        where: { educationForm: { not: null } },
      }),
      this.prisma.specialization.findMany({
        select: { educationType: true },
        distinct: ["educationType"],
        where: { educationType: { not: null } },
      }),
      this.prisma.specialization.findMany({
        select: { language: true },
        distinct: ["language"],
        where: { language: { not: null } },
      }),
    ]);

    return {
      cities: cities.map((c) => c.city).filter(Boolean) as string[],
      institutions: institutions.map((i) => i.institution),
      categories: categories.map((c) => c.category),
      education_forms: forms.map((f) => f.educationForm).filter(Boolean) as string[],
      education_types: types.map((t) => t.educationType).filter(Boolean) as string[],
      languages: langs.map((l) => l.language).filter(Boolean) as string[],
    };
  }
}
