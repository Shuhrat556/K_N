/**
 * Pure helpers for the assessment engine (easy to unit test, no DB).
 */

export type ClusterScores = Record<string, number>;

export type RankRow = { clusterId: number; score: number };

export function sortRanking(scores: ClusterScores): RankRow[] {
  return Object.entries(scores)
    .map(([k, v]) => ({ clusterId: Number(k), score: v }))
    .sort((a, b) => b.score - a.score || a.clusterId - b.clusterId);
}

/**
 * Adaptive follow-up when the runner-up is within 10% of the leader (relative to leader score).
 * Leader must be strictly positive so "all zeros" doesn't trigger extra questions.
 */
export function shouldRunAdaptive(top: RankRow | undefined, second: RankRow | undefined): boolean {
  if (!top || !second) return false;
  if (top.score <= 0) return false;
  return second.score >= top.score * 0.9;
}

export function sumMainScoresPerCluster(
  mainQuestionIds: number[],
  answersByQuestionId: Map<number, number>,
  clusterByQuestionId: Map<number, number | null | undefined>,
  mapValueToScore: (v: number) => number,
): ClusterScores {
  const scores: ClusterScores = {};
  for (const qid of mainQuestionIds) {
    const ans = answersByQuestionId.get(qid);
    if (ans === undefined) continue;
    const cid = clusterByQuestionId.get(qid);
    if (!cid) continue;
    const contrib = mapValueToScore(ans);
    const key = String(cid);
    scores[key] = (scores[key] ?? 0) + contrib;
  }
  return scores;
}
