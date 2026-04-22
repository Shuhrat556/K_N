import {
  PrismaClient,
  QuestionPhase,
} from "@prisma/client";

const prisma = new PrismaClient();

const CLUSTER_NAMES = ["IT", "Health", "Engineering", "Social", "Creative"] as const;

const READINESS_BANK: { text: string; weights: [number, number, number]; sortOrder: number }[] = [
  { text: "Сегодня вы чувствуете себя энергичным и готовым к концентрации?", weights: [1, 0, -1], sortOrder: 0 },
  { text: "Вам комфортно отвечать честно, даже если ответ неоднозначный?", weights: [1, 0, -1], sortOrder: 1 },
  { text: "Вы можете выделить 20–30 минут без отвлечений?", weights: [1, 0, -1], sortOrder: 2 },
  { text: "Сейчас вы испытываете сильную усталость или раздражение?", weights: [-1, 0, 1], sortOrder: 3 },
  { text: "Вам сложно сосредоточиться на тексте дольше 2–3 минут?", weights: [-1, 0, 1], sortOrder: 4 },
  { text: "Вы чувствуете тревогу, которая мешает принимать решения?", weights: [-1, 0, 1], sortOrder: 5 },
  { text: "Вам приятно думать о своих интересах и будущей профессии?", weights: [1, 0, -1], sortOrder: 6 },
  { text: "Вы готовы продолжить, даже если некоторые вопросы покажутся необычными?", weights: [1, 0, -1], sortOrder: 7 },
];

async function main() {
  await prisma.answer.deleteMany();
  await prisma.result.deleteMany();
  await prisma.testSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.question.deleteMany();
  await prisma.cluster.deleteMany();

  const clusters = [];
  for (const name of CLUSTER_NAMES) {
    clusters.push(await prisma.cluster.create({ data: { name } }));
  }

  for (const r of READINESS_BANK) {
    await prisma.question.create({
      data: {
        text: r.text,
        phase: QuestionPhase.READINESS,
        sortOrder: r.sortOrder,
        readinessWeights: r.weights,
        clusterId: null,
      },
    });
  }

  let sort = 0;
  for (const c of clusters) {
    for (let i = 0; i < 40; i++) {
      await prisma.question.create({
        data: {
          text: `${c.name}: вопрос ${i + 1} (основной блок)`,
          phase: QuestionPhase.MAIN,
          clusterId: c.id,
          sortOrder: sort++,
        },
      });
    }
  }
}

main()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("Seed completed.");
  })
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
