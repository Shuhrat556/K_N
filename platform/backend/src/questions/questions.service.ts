import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, QuestionPhase } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(clusterId?: number, phase?: QuestionPhase) {
    return this.prisma.question.findMany({
      where: {
        ...(clusterId != null ? { clusterId } : {}),
        ...(phase != null ? { phase } : {}),
      },
      orderBy: [{ phase: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
      include: { cluster: true },
    });
  }

  async create(body: CreateQuestionDto) {
    if (body.phase === QuestionPhase.MAIN) {
      if (!body.clusterId) {
        throw new BadRequestException("clusterId is required for MAIN questions");
      }
      const c = await this.prisma.cluster.findUnique({ where: { id: body.clusterId } });
      if (!c) throw new NotFoundException("Cluster not found");
    } else if (body.phase === QuestionPhase.READINESS) {
      if (body.clusterId != null) {
        throw new BadRequestException("READINESS questions must not be assigned to a cluster");
      }
      const w = body.readinessWeights;
      if (!w || w.length !== 3 || !w.every((x) => Number.isFinite(Number(x)))) {
        throw new BadRequestException("readinessWeights must be an array of 3 numbers");
      }
    }

    return this.prisma.question.create({
      data: {
        text: body.text,
        phase: body.phase,
        clusterId: body.phase === QuestionPhase.MAIN ? body.clusterId! : null,
        sortOrder: body.sortOrder ?? 0,
        readinessWeights: body.phase === QuestionPhase.READINESS ? body.readinessWeights : undefined,
      },
    });
  }

  async update(id: number, body: UpdateQuestionDto) {
    const existing = await this.prisma.question.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Question not found");

    const nextPhase = body.phase ?? existing.phase;
    const nextClusterId = body.clusterId !== undefined ? body.clusterId : existing.clusterId;

    if (nextPhase === QuestionPhase.MAIN) {
      if (!nextClusterId) throw new BadRequestException("clusterId is required for MAIN questions");
      const c = await this.prisma.cluster.findUnique({ where: { id: nextClusterId } });
      if (!c) throw new NotFoundException("Cluster not found");
    } else if (nextPhase === QuestionPhase.READINESS) {
      if (nextClusterId != null) {
        throw new BadRequestException("READINESS questions must not be assigned to a cluster");
      }
    }

    const readinessWeights =
      body.readinessWeights === undefined ? existing.readinessWeights : body.readinessWeights;
    if (nextPhase === QuestionPhase.READINESS) {
      const w = readinessWeights as unknown;
      if (!Array.isArray(w) || w.length !== 3) {
        throw new BadRequestException("readinessWeights must be an array of 3 numbers");
      }
    }

    const data: Prisma.QuestionUncheckedUpdateInput = {};
    if (body.text !== undefined) data.text = body.text;
    if (body.phase !== undefined) data.phase = body.phase;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
    if (body.clusterId !== undefined) {
      data.clusterId = nextPhase === QuestionPhase.MAIN ? body.clusterId : null;
    }
    if (body.readinessWeights !== undefined) {
      data.readinessWeights =
        nextPhase === QuestionPhase.READINESS ? (body.readinessWeights as Prisma.InputJsonValue) : Prisma.DbNull;
    }

    return this.prisma.question.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    try {
      await this.prisma.question.delete({ where: { id } });
    } catch {
      throw new NotFoundException("Question not found");
    }
    return { ok: true };
  }
}
