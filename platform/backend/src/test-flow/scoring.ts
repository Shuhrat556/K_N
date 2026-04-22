const MAIN_VALUE_TO_SCORE: Record<number, number> = {
  0: -2,
  1: -1,
  2: 0,
  3: 1,
  4: 2,
};

export function mapMainAnswerToScore(value: number): number {
  const s = MAIN_VALUE_TO_SCORE[value];
  if (s === undefined) {
    throw new Error("Main answer must be an integer 0..4");
  }
  return s;
}

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}
