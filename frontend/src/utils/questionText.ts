import type { Lang } from "../i18n/translations";

type WithTexts = {
  text?: string | null;
  text_tj?: string | null;
};

/** RU → `text`; TJ → `text_tj` with fallback to RU if TJ missing. */
export function pickQuestionText(q: WithTexts, lang: Lang): string {
  const ru = (q.text ?? "").trim();
  const tj = (q.text_tj ?? "").trim();
  if (lang === "tg") return tj || ru;
  return ru || tj;
}

/** Always prefer primary `text` so question/answers stay in one language. */
export function pickPrimaryQuestionText(q: WithTexts): string {
  const primary = (q.text ?? "").trim();
  const fallback = (q.text_tj ?? "").trim();
  return primary || fallback;
}
