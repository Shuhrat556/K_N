import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AnswerPhase,
  Prisma,
  QuestionPhase,
  SessionStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { mapMainAnswerToScore, shuffle } from "./scoring";
import { SubmitWarmupDto } from "./dto/submit-warmup.dto";
import {
  shouldRunAdaptive,
  sortRanking,
  sumMainScoresPerCluster,
  type ClusterScores,
} from "./test-engine.util";

@Injectable()
export class TestFlowService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession() {
    const user = await this.prisma.user.create({ data: {} });
    const session = await this.prisma.testSession.create({
      data: {
        userId: user.id,
        status: SessionStatus.AWAITING_WARMUP,
      },
    });
    return { userId: user.id, sessionId: session.id };
  }

  async getWarmupQuestions(sessionId: string) {
    await this.requireSession(sessionId, [SessionStatus.AWAITING_WARMUP]);
    const qs = await this.prisma.question.findMany({
      where: { phase: QuestionPhase.READINESS },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        text: true,
        sortOrder: true,
      },
    });
    if (qs.length !== 8) {
      throw new BadRequestException("Catalog misconfigured: readiness bank must contain 8 questions");
    }
    return qs;
  }

  async submitWarmup(sessionId: string, body: SubmitWarmupDto) {
    await this.requireSession(sessionId, [SessionStatus.AWAITING_WARMUP]);
    const questions = await this.prisma.question.findMany({
      where: { phase: QuestionPhase.READINESS },
      orderBy: { sortOrder: "asc" },
    });
    if (questions.length !== 8) {
      throw new BadRequestException("Catalog misconfigured: readiness bank must contain 8 questions");
    }
    const byId = new Map(questions.map((q) => [q.id, q]));
    if (body.answers.length !== 8) {
      throw new BadRequestException("Exactly 8 warmup answers are required");
    }

    const answeredIds = body.answers.map((a) => a.questionId);
    if (new Set(answeredIds).size !== 8) {
      throw new BadRequestException("Warmup answers must reference 8 unique questions");
    }
    const bankIds = new Set(questions.map((q) => q.id));
    for (const id of answeredIds) {
      if (!bankIds.has(id)) {
        throw new BadRequestException(`Unknown warmup question id: ${id}`);
      }
    }

    let total = 0;
    for (const a of body.answers) {
      const q = byId.get(a.questionId)!;
      if (!q.readinessWeights) {
        throw new BadRequestException(`Readiness weights missing for question ${q.id}`);
      }
      const weights = q.readinessWeights as unknown;
      if (!Array.isArray(weights) || weights.length !== 3) {
        throw new BadRequestException(`Readiness weights misconfigured for question ${q.id}`);
      }
      const w = Number(weights[a.choiceIndex]);
      if (!Number.isFinite(w)) {
        throw new BadRequestException(`Invalid readiness weight for question ${q.id}`);
      }
      total += w;
    }

    let outcome: "ALLOW" | "WARNING" | "RETRY_LATER";
    let next: SessionStatus;
    if (total >= 3) {
      outcome = "ALLOW";
      next = SessionStatus.READY_FOR_MAIN;
    } else if (total <= -3) {
      outcome = "RETRY_LATER";
      next = SessionStatus.WARMUP_BLOCKED;
    } else {
      outcome = "WARNING";
      next = SessionStatus.WARMUP_WARNING;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.answer.deleteMany({ where: { sessionId, phase: AnswerPhase.READINESS } });
      await tx.answer.createMany({
        data: body.answers.map((a) => ({
          sessionId,
          questionId: a.questionId,
          value: a.choiceIndex,
          phase: AnswerPhase.READINESS,
        })),
      });
      await tx.testSession.update({
        where: { id: sessionId },
        data: {
          warmupScore: total,
          warmupOutcome: outcome,
          status: next,
        },
      });
    });

    return {
      warmupScore: total,
      outcome,
      canContinue: outcome !== "RETRY_LATER",
      needsWarningAck: outcome === "WARNING",
    };
  }

  async acknowledgeWarmupWarning(sessionId: string) {
    const session = await this.requireSession(sessionId, [SessionStatus.WARMUP_WARNING]);
    await this.prisma.testSession.update({
      where: { id: session.id },
      data: { status: SessionStatus.READY_FOR_MAIN },
    });
    return { ok: true };
  }

  async getMainQuestions(sessionId: string) {
    const session = await this.getSessionOrThrow(sessionId);
    if (session.status === SessionStatus.ADAPTIVE_PENDING) {
      return this.getAdaptiveQuestionsInternal(session);
    }
    if (session.status !== SessionStatus.READY_FOR_MAIN && session.status !== SessionStatus.MAIN_IN_PROGRESS) {
      throw new BadRequestException("Main questions are not available for the current session state");
    }

    let mainIds = (session.mainQuestionIds as number[] | null) ?? null;
    if (!mainIds) {
      const clusters = await this.prisma.cluster.findMany({
        orderBy: { id: "asc" },
        select: { id: true },
      });
      if (clusters.length !== 5) {
        throw new BadRequestException("Catalog misconfigured: expected 5 clusters");
      }
      const clusterIds = new Set(clusters.map((c) => c.id));

      const allMain = await this.prisma.question.findMany({
        where: {
          phase: QuestionPhase.MAIN,
          clusterId: { in: [...clusterIds] },
        },
        select: { id: true, clusterId: true },
      });

      const grouped = new Map<number, number[]>();
      for (const q of allMain) {
        if (!q.clusterId) continue;
        if (!clusterIds.has(q.clusterId)) continue;
        const arr = grouped.get(q.clusterId) ?? [];
        arr.push(q.id);
        grouped.set(q.clusterId, arr);
      }

      for (const c of clusters) {
        const ids = grouped.get(c.id) ?? [];
        if (ids.length < 15) {
          throw new BadRequestException(`Cluster ${c.id} does not have enough MAIN questions (need 15+)`);
        }
      }

      const picked: number[] = [];
      for (const c of clusters) {
        const ids = grouped.get(c.id) ?? [];
        picked.push(...shuffle(ids).slice(0, 15));
      }

      if (picked.length !== 75) {
        throw new BadRequestException("Failed to build main battery (expected 75 questions)");
      }
      if (new Set(picked).size !== 75) {
        throw new BadRequestException("Main battery contains duplicates (catalog misconfigured)");
      }

      mainIds = picked;
      await this.prisma.testSession.update({
        where: { id: sessionId },
        data: {
          mainQuestionIds: picked,
          status: SessionStatus.MAIN_IN_PROGRESS,
        },
      });
    }

    const qs = await this.prisma.question.findMany({
      where: { id: { in: mainIds } },
      select: { id: true, text: true, clusterId: true },
    });
    const byId = new Map(qs.map((q) => [q.id, q]));
    return mainIds.map((id) => {
      const q = byId.get(id);
      if (!q) throw new BadRequestException(`Missing question ${id}`);
      return q;
    });
  }

  async submitMainAnswer(sessionId: string, questionId: number, value: number) {
    const session = await this.requireSession(sessionId, [SessionStatus.MAIN_IN_PROGRESS]);
    this.assertMainLikert(value);
    const mainIds = (session.mainQuestionIds as number[] | null) ?? [];
    if (!mainIds.includes(questionId)) {
      throw new BadRequestException("Question is not part of the current main battery");
    }
    await this.prisma.answer.upsert({
      where: {
        sessionId_questionId_phase: { sessionId, questionId, phase: AnswerPhase.MAIN },
      },
      create: { sessionId, questionId, value, phase: AnswerPhase.MAIN },
      update: { value },
    });
    return { stored: true, phase: "main" };
  }

  async completeMain(sessionId: string) {
    const session = await this.requireSession(sessionId, [SessionStatus.MAIN_IN_PROGRESS]);
    const mainIds = (session.mainQuestionIds as number[] | null) ?? [];
    if (mainIds.length !== 75) {
      throw new BadRequestException("Main battery is not fully configured");
    }
    const answers = await this.prisma.answer.findMany({
      where: { sessionId, phase: AnswerPhase.MAIN },
    });
    const byQ = new Map(answers.map((a) => [a.questionId, a.value]));
    const missing = mainIds.filter((id) => !byQ.has(id));
    if (missing.length) {
      throw new BadRequestException(`Missing answers for ${missing.length} main question(s)`);
    }

    const questions = await this.prisma.question.findMany({
      where: { id: { in: mainIds } },
      select: { id: true, clusterId: true },
    });
    const clusterOfQuestion = new Map(questions.map((q) => [q.id, q.clusterId]));

    const scores = sumMainScoresPerCluster(mainIds, byQ, clusterOfQuestion, (v) => this.assertMainLikertMap(v));
    const ranking = sortRanking(scores);
    const top = ranking[0];
    const second = ranking[1];
    const needsAdaptive = shouldRunAdaptive(top, second);

    await this.prisma.testSession.update({
      where: { id: sessionId },
      data: {
        clusterScoresJson: scores as Prisma.JsonObject,
        topClusterId: top?.clusterId ?? null,
        secondClusterId: second?.clusterId ?? null,
        userClusterScore: top?.score ?? 0,
      },
    });

    if (!needsAdaptive || !top || !second) {
      await this.finalizeSession(sessionId, top?.clusterId ?? null, scores);
      return { status: "completed", needsAdaptive: false };
    }

    const used = new Set(mainIds);
    const adaptiveIds = await this.pickAdaptivePack(used, top.clusterId, second.clusterId, 5, 5);
    await this.prisma.testSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.ADAPTIVE_PENDING,
        adaptiveQuestionIds: adaptiveIds,
        adaptiveClusterPair: [top.clusterId, second.clusterId],
      },
    });
    return { status: "adaptive_required", needsAdaptive: true, questionIds: adaptiveIds };
  }

  async getAdaptiveQuestions(sessionId: string) {
    const session = await this.requireSession(sessionId, [SessionStatus.ADAPTIVE_PENDING]);
    return this.getAdaptiveQuestionsInternal(session);
  }

  private async getAdaptiveQuestionsInternal(session: { adaptiveQuestionIds: unknown }) {
    const ids = (session.adaptiveQuestionIds as number[] | null) ?? [];
    if (ids.length === 0) {
      throw new BadRequestException("Adaptive battery is not configured");
    }
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException("Adaptive battery contains duplicate question ids");
    }
    const qs = await this.prisma.question.findMany({
      where: { id: { in: ids } },
      select: { id: true, text: true, clusterId: true },
    });
    const byId = new Map(qs.map((q) => [q.id, q]));
    return ids.map((id) => {
      const q = byId.get(id);
      if (!q) throw new BadRequestException(`Missing adaptive question ${id}`);
      return q;
    });
  }

  async submitAdaptiveAnswer(sessionId: string, questionId: number, value: number) {
    const session = await this.requireSession(sessionId, [SessionStatus.ADAPTIVE_PENDING]);
    this.assertMainLikert(value);
    const ids = (session.adaptiveQuestionIds as number[] | null) ?? [];
    if (!ids.includes(questionId)) {
      throw new BadRequestException("Question is not part of the adaptive battery");
    }
    await this.prisma.answer.upsert({
      where: {
        sessionId_questionId_phase: { sessionId, questionId, phase: AnswerPhase.ADAPTIVE },
      },
      create: { sessionId, questionId, value, phase: AnswerPhase.ADAPTIVE },
      update: { value },
    });
    return { stored: true, phase: "adaptive" };
  }

  async completeAdaptive(sessionId: string) {
    const session = await this.requireSession(sessionId, [SessionStatus.ADAPTIVE_PENDING]);
    const adaptiveIds = (session.adaptiveQuestionIds as number[] | null) ?? [];
    if (adaptiveIds.length !== 10) {
      throw new BadRequestException("Adaptive battery must contain 10 questions");
    }
    const answers = await this.prisma.answer.findMany({
      where: { sessionId, phase: AnswerPhase.ADAPTIVE },
    });
    const byQ = new Map(answers.map((a) => [a.questionId, a.value]));
    const missing = adaptiveIds.filter((id) => !byQ.has(id));
    if (missing.length) {
      throw new BadRequestException(`Missing answers for ${missing.length} adaptive question(s)`);
    }

    const mainAnswers = await this.prisma.answer.findMany({
      where: { sessionId, phase: AnswerPhase.MAIN },
    });
    const allAnswers = [...mainAnswers, ...answers];

    const questionIds = Array.from(new Set(allAnswers.map((a) => a.questionId)));
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, clusterId: true },
    });
    const clusterOfQuestion = new Map(questions.map((q) => [q.id, q.clusterId]));

    const scores: ClusterScores = {};
    for (const ans of allAnswers) {
      const cid = clusterOfQuestion.get(ans.questionId);
      if (!cid) continue;
      const contrib = this.assertMainLikertMap(ans.value);
      const key = String(cid);
      scores[key] = (scores[key] ?? 0) + contrib;
    }

    const ranking = sortRanking(scores);
    const top = ranking[0];

    await this.prisma.testSession.update({
      where: { id: sessionId },
      data: {
        clusterScoresJson: scores as Prisma.JsonObject,
        topClusterId: top?.clusterId ?? null,
        secondClusterId: ranking[1]?.clusterId ?? null,
        userClusterScore: top?.score ?? 0,
      },
    });

    await this.finalizeSession(sessionId, top?.clusterId ?? null, scores);
    return { status: "completed", needsAdaptive: false };
  }

  async getResult(sessionId: string) {
    const session = await this.getSessionOrThrow(sessionId);
    if (session.status !== SessionStatus.COMPLETED) {
      throw new BadRequestException("Result is not available until the session is completed");
    }
    const result = await this.prisma.result.findUnique({ where: { sessionId } });
    if (!result) {
      throw new BadRequestException("Result row missing");
    }
    const cluster = await this.prisma.cluster.findUnique({ where: { id: result.clusterId } });
    return {
      sessionId,
      topCluster: cluster ? { id: cluster.id, name: cluster.name } : null,
      scoreJson: result.scoreJson,
    };
  }

  private async finalizeSession(sessionId: string, topClusterId: number | null, scores: ClusterScores) {
    if (!topClusterId) {
      throw new BadRequestException("Unable to determine top cluster");
    }
    const session = await this.getSessionOrThrow(sessionId);
    const ranking = sortRanking(scores);
    const totalAbs = ranking.reduce((s, r) => s + Math.max(0, r.score), 0) || 1;
    const percentages: Record<string, number> = {};
    for (const r of ranking) {
      percentages[String(r.clusterId)] = Math.round((Math.max(0, r.score) / totalAbs) * 1000) / 10;
    }
    const scoreJson = {
      clusters: scores,
      ranking,
      percentages,
      topTwo:
        ranking.length >= 2
          ? [
              { clusterId: ranking[0]!.clusterId, score: ranking[0]!.score },
              { clusterId: ranking[1]!.clusterId, score: ranking[1]!.score },
            ]
          : [],
    };

    await this.prisma.$transaction([
      this.prisma.testSession.update({
        where: { id: sessionId },
        data: { status: SessionStatus.COMPLETED },
      }),
      this.prisma.result.upsert({
        where: { sessionId },
        create: {
          userId: session.userId,
          sessionId,
          clusterId: topClusterId,
          scoreJson: scoreJson as Prisma.JsonObject,
        },
        update: {
          clusterId: topClusterId,
          scoreJson: scoreJson as Prisma.JsonObject,
        },
      }),
    ]);
  }

  private async pickAdaptivePack(
    used: Set<number>,
    topClusterId: number,
    secondClusterId: number,
    nTop: number,
    nSecond: number,
  ) {
    const take = async (clusterId: number, n: number) => {
      const rows = await this.prisma.question.findMany({
        where: { phase: QuestionPhase.MAIN, clusterId },
        select: { id: true },
      });
      const candidates = shuffle(rows.map((r) => r.id)).filter((id) => !used.has(id));
      if (candidates.length < n) {
        throw new BadRequestException(`Not enough unused questions in cluster ${clusterId} for adaptive pack`);
      }
      return candidates.slice(0, n);
    };
    const a = await take(topClusterId, nTop);
    const b = await take(secondClusterId, nSecond);
    const out = [...a, ...b];
    if (new Set(out).size !== out.length) {
      throw new BadRequestException("Adaptive battery contains duplicates");
    }
    return out;
  }

  private assertMainLikert(value: number) {
    if (!Number.isInteger(value) || value < 0 || value > 4) {
      throw new BadRequestException("Main answer must be an integer 0..4");
    }
  }

  private assertMainLikertMap(value: number): number {
    this.assertMainLikert(value);
    return mapMainAnswerToScore(value);
  }

  private async getSessionOrThrow(sessionId: string) {
    const session = await this.prisma.testSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException("Session not found");
    return session;
  }

  private async requireSession(sessionId: string, allowed: SessionStatus[]) {
    const session = await this.getSessionOrThrow(sessionId);
    if (!allowed.includes(session.status)) {
      throw new BadRequestException("Invalid session state for this operation");
    }
    return session;
  }
}
