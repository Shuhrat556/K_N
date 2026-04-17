import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchReadinessQuestions, submitReadiness } from "../api/kasbnoma";
import type { ReadinessKind, ReadinessQuestion } from "../api/types";
import { AnswerButton } from "../components/AnswerButton";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ProgressBar } from "../components/ProgressBar";
import { QuestionCard } from "../components/QuestionCard";
import { t } from "../i18n/translations";
import { useAppStore } from "../store/useAppStore";
import { pickOptionLabel, pickQuestionText } from "../utils/questionText";

type OutcomeView = "quiz" | "summary";

export function Readiness() {
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.lang);
  const userId = useAppStore((s) => s.userId);
  const setReadinessOutcome = useAppStore((s) => s.setReadinessOutcome);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ReadinessQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [outcomeView, setOutcomeView] = useState<OutcomeView>("quiz");
  const [serverOutcome, setServerOutcome] = useState<{
    outcome: string;
    allowed: boolean;
    score: number;
    message?: string | null;
  } | null>(null);

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const qs = await fetchReadinessQuestions(userId);
        setQuestions([...qs]);
      } catch {
        setError(t(useAppStore.getState().lang, "error_generic"));
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, navigate]);

  const current = questions[idx];

  const qText = (q: ReadinessQuestion) => pickQuestionText(q, lang);

  const labels = useMemo(() => {
    const L = current?.option_labels;
    const LTj = current?.option_labels_tj;
    if (L && L.length >= 3) {
      return [0, 1, 2].map((i) => ({
        v: i,
        l: pickOptionLabel(lang, L[i] ?? "", LTj?.[i]),
      }));
    }
    const kind: ReadinessKind | undefined = current?.kind;
    if (kind === "emotional") {
      return [
        { v: 0, l: t(lang, "happy") },
        { v: 1, l: t(lang, "uncertain") },
        { v: 2, l: t(lang, "fear") },
      ];
    }
    return [
      { v: 0, l: t(lang, "yes") },
      { v: 1, l: t(lang, "partly") },
      { v: 2, l: t(lang, "no") },
    ];
  }, [current?.id, current?.kind, current?.option_labels, current?.option_labels_tj, lang]);

  const pick = async (choiceIndex: number) => {
    if (!current || submitting) return;
    const nextAnswers = { ...answers, [current.id]: choiceIndex };
    setAnswers(nextAnswers);

    if (idx >= questions.length - 1) {
      setSubmitting(true);
      try {
        const payload = questions.map((q) => ({ question_id: q.id, choice_index: nextAnswers[q.id] ?? 0 }));
        const res = await submitReadiness(userId!, payload);
        setServerOutcome({
          outcome: res.outcome,
          allowed: res.allowed,
          score: res.readiness_score,
          message: res.message,
        });
        setReadinessOutcome(res.outcome as never);
        setOutcomeView("summary");
      } catch {
        setError(t(lang, "error_generic"));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setIdx((v) => v + 1);
  };

  if (!userId) return null;

  if (loading) {
    return (
      <div className="page-shell flex min-h-full flex-col py-8">
        <div className="flex items-center justify-between">
          <div className="h-10 w-40 animate-pulse rounded-2xl bg-white/70 ring-1 ring-slate-200/70 dark:bg-slate-800/70 dark:ring-slate-700/80" />
          <LanguageSwitcher />
        </div>
        <div className="mt-10 h-44 animate-pulse rounded-3xl bg-white/70 ring-1 ring-slate-200/70 dark:bg-slate-800/70 dark:ring-slate-700/80" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell max-w-xl py-16 text-center">
        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/90 p-8 shadow-soft ring-1 ring-slate-200/70 dark:ring-slate-700/80">
          <div className="text-sm font-semibold text-ink-900 dark:text-slate-50">{error}</div>
          <button type="button" className="mt-6 text-sm font-extrabold text-indigo-700" onClick={() => navigate("/")}>
            {t(lang, "back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell flex min-h-full flex-col pb-12 pt-6 sm:pt-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-base font-extrabold text-ink-900 dark:text-slate-50 sm:text-sm">{t(lang, "readiness_title")}</div>
        <LanguageSwitcher />
      </header>

      <div className="mt-6">
        <ProgressBar
          value={outcomeView === "quiz" ? (questions.length ? idx / questions.length : 0) : 1}
          label={t(lang, "readiness_sub")}
          detail={
            outcomeView === "quiz" && questions.length
              ? t(lang, "readiness_counter")
                  .replace("{current}", String(idx + 1))
                  .replace("{total}", String(questions.length))
              : undefined
          }
        />
      </div>

      <AnimatePresence mode="wait">
        {outcomeView === "quiz" ? (
          <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8">
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-base font-medium leading-relaxed text-ink-700 dark:text-slate-300 sm:text-sm"
            >
              {t(lang, "readiness_intro")}
            </motion.p>
            <AnimatePresence mode="wait">
              {current ? (
                <QuestionCard key={current.id}>
                  <h2 className="text-pretty text-xl font-extrabold leading-snug text-ink-900 dark:text-slate-50 sm:text-2xl lg:text-[1.65rem]">
                    {qText(current)}
                  </h2>

                  <div className="mt-8 grid gap-3 sm:gap-4">
                    {labels.map((x) => (
                      <AnswerButton key={x.v} disabled={submitting} onClick={() => pick(x.v)}>
                        {x.l}
                      </AnswerButton>
                    ))}
                  </div>
                </QuestionCard>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-8"
          >
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-slate-900 shadow-soft ring-1 ring-slate-200/80 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:ring-slate-600/90">
              <p className="text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-100">{t(lang, "readiness_summary_prompt")}</p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {serverOutcome?.allowed ? (
                  <motion.button
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => navigate("/test")}
                    className="rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-3 text-sm font-extrabold text-white shadow-soft"
                  >
                    {t(lang, "continue")}
                  </motion.button>
                ) : null}
                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => navigate("/")}
                  className={[
                    "rounded-2xl px-5 py-3 text-sm font-extrabold shadow-card ring-1 ring-slate-300 dark:ring-slate-600",
                    serverOutcome?.allowed
                      ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-50"
                      : "bg-slate-900 text-white dark:bg-slate-950",
                  ].join(" ")}
                >
                  {t(lang, "retry_later")}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
