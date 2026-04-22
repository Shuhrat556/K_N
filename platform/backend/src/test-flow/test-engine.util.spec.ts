import { mapMainAnswerToScore } from "./scoring";
import {
  shouldRunAdaptive,
  sortRanking,
  sumMainScoresPerCluster,
} from "./test-engine.util";

describe("mapMainAnswerToScore", () => {
  it("maps 0..4 to -2..+2", () => {
    expect(mapMainAnswerToScore(0)).toBe(-2);
    expect(mapMainAnswerToScore(1)).toBe(-1);
    expect(mapMainAnswerToScore(2)).toBe(0);
    expect(mapMainAnswerToScore(3)).toBe(1);
    expect(mapMainAnswerToScore(4)).toBe(2);
  });

  it("rejects out of range", () => {
    expect(() => mapMainAnswerToScore(-1)).toThrow();
    expect(() => mapMainAnswerToScore(5)).toThrow();
  });
});

describe("sortRanking", () => {
  it("sorts by score desc, then clusterId asc (deterministic ties)", () => {
    const ranking = sortRanking({
      "3": 10,
      "1": 10,
      "2": 5,
    });
    expect(ranking.map((r) => r.clusterId)).toEqual([1, 3, 2]);
    expect(ranking.map((r) => r.score)).toEqual([10, 10, 5]);
  });
});

describe("shouldRunAdaptive", () => {
  it("does not trigger when leader score <= 0", () => {
    expect(shouldRunAdaptive({ clusterId: 1, score: 0 }, { clusterId: 2, score: 0 })).toBe(false);
    expect(shouldRunAdaptive({ clusterId: 1, score: -1 }, { clusterId: 2, score: -1 })).toBe(false);
  });

  it("triggers when runner-up is within 10% of a positive leader", () => {
    expect(shouldRunAdaptive({ clusterId: 1, score: 100 }, { clusterId: 2, score: 90 })).toBe(true);
    expect(shouldRunAdaptive({ clusterId: 1, score: 100 }, { clusterId: 2, score: 89 })).toBe(false);
  });

  it("triggers on exact tie when scores are positive", () => {
    expect(shouldRunAdaptive({ clusterId: 1, score: 30 }, { clusterId: 2, score: 30 })).toBe(true);
  });
});

describe("sumMainScoresPerCluster", () => {
  it("aggregates mixed answers across clusters", () => {
    const qids = [1, 2, 3, 4];
    const answers = new Map<number, number>([
      [1, 0],
      [2, 4],
      [3, 2],
      [4, 3],
    ]);
    const clusters = new Map<number, number | null | undefined>([
      [1, 10],
      [2, 10],
      [3, 20],
      [4, 20],
    ]);
    const scores = sumMainScoresPerCluster(qids, answers, clusters, mapMainAnswerToScore);
    // cluster 10: -2 + 2 = 0; cluster 20: 0 + 1 = 1
    expect(scores["10"]).toBe(0);
    expect(scores["20"]).toBe(1);
  });

  it("all min answers yields -2 per question", () => {
    const qids = [1, 2];
    const answers = new Map<number, number>([
      [1, 0],
      [2, 0],
    ]);
    const clusters = new Map<number, number | null | undefined>([
      [1, 1],
      [2, 1],
    ]);
    const scores = sumMainScoresPerCluster(qids, answers, clusters, mapMainAnswerToScore);
    expect(scores["1"]).toBe(-4);
  });

  it("all max answers yields +2 per question", () => {
    const qids = [1, 2];
    const answers = new Map<number, number>([
      [1, 4],
      [2, 4],
    ]);
    const clusters = new Map<number, number | null | undefined>([
      [1, 1],
      [2, 1],
    ]);
    const scores = sumMainScoresPerCluster(qids, answers, clusters, mapMainAnswerToScore);
    expect(scores["1"]).toBe(4);
  });
});
