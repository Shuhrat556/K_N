import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { fetchQuestions, fetchResult, submitAnswer, submitTest } from "../api/kasbnoma";
import type { MainQuestion } from "../api/types";
import { AnswerButton } from "../components/AnswerButton";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Loader } from "../components/Loader";
import { ProgressBar } from "../components/ProgressBar";
import { QuestionCard } from "../components/QuestionCard";
import { t } from "../i18n/translations";
import { useAppStore } from "../store/useAppStore";
import { pickQuestionText } from "../utils/questionText";
import { shuffled } from "../utils/shuffle";

export function Test() {
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.lang);
  const userId = useAppStore((s) => s.userId);
  const setLastResultUserId = useAppStore((s) => s.setLastResultUserId);

  const [questions, setQuestions] = useState<MainQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [lock, setLock] = useState(false);
  const [adaptiveIntro, setAdaptiveIntro] = useState(false);
  const [isAdaptiveRound, setIsAdaptiveRound] = useState(false);

  const cooldownUntil = useRef(0);

  const loadQuestions = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const qs = await fetchQuestions(userId);
      setQuestions(shuffled(qs));
      setIdx(0);
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 400) {
        try {
          await fetchResult(userId);
          setLastResultUserId(userId);
          navigate("/result");
          return;
        } catch {
          /* нет завершённого результата — показываем общую ошибку */
        }
      }
      setError(t(useAppStore.getState().lang, "error_generic"));
    } finally {
      setLoading(false);
    }
  }, [userId, navigate, setLastResultUserId]);

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }
    void loadQuestions();
  }, [userId, navigate, loadQuestions]);

  const total = questions.length;
  const current = questions[idx];
  const progress = total ? idx / total : 0;

  const qText = (q: MainQuestion) => pickQuestionText(q, lang);

  const likert = useMemo(() => {
    const labels = [
      { v: 0, l: t(lang, "likert_0") },
      { v: 1, l: t(lang, "likert_1") },
      { v: 2, l: t(lang, "likert_2") },
      { v: 3, l: t(lang, "likert_3") },
      { v: 4, l: t(lang, "likert_4") },
    ];
    return shuffled(labels);
  }, [current?.id, lang]);

  const finalizeBattery = useCallback(async () => {
    if (!userId) return;
    setAnalyzing(true);
    try {
      const res = await submitTest(userId);
      if (res.needs_adaptive && res.status === "adaptive_required") {
        setIsAdaptiveRound(true);
        setAdaptiveIntro(true);
        const qs = await fetchQuestions(userId);
        setQuestions(shuffled(qs));
        setIdx(0);
        setAnalyzing(false);
        return;
      }
      setLastResultUserId(userId);
      navigate("/result");
    } catch {
      setError(t(lang, "error_generic"));
    } finally {
      setAnalyzing(false);
    }
  }, [userId, navigate, setLastResultUserId, lang]);

  const onPick = async (value: number) => {
    if (!userId || !current || lock || analyzing) return;
    const now = Date.now();
    if (now < cooldownUntil.current) return;
    cooldownUntil.current = now + 420;
    setLock(true);
    try {
      const last = idx === questions.length - 1;
      await submitAnswer(userId, current.id, value);
      if (last) {
        setAnalyzing(true);
        await finalizeBattery();
        return;
      }
      setIdx((v) => v + 1);
    } catch {
      setError(t(lang, "error_generic"));
    } finally {
      setLock(false);
    }
  };

  if (!userId) return null;

  if (loading) {
    return (
      <div className="page-shell flex min-h-full flex-col py-8">
        <div className="flex items-center justify-between">
          <div className="h-10 w-44 animate-pulse rounded-2xl bg-white/70 ring-1 ring-slate-200/70" />
          <LanguageSwitcher />
        </div>
        <div className="mt-10 h-56 animate-pulse rounded-3xl bg-white/70 ring-1 ring-slate-200/70" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell max-w-xl py-16 text-center">
        <div className="rounded-3xl bg-white/80 p-8 shadow-soft ring-1 ring-slate-200/70">
          <div className="text-sm font-semibold text-ink-900">{error}</div>
          <button type="button" className="mt-6 text-sm font-extrabold text-indigo-700" onClick={() => void loadQuestions()}>
            {t(lang, "retry_action")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell flex min-h-full flex-col pb-12 pt-6 sm:pt-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-extrabold text-ink-900 sm:text-sm">{t(lang, "test_title")}</div>
          <div className="mt-1 text-sm font-semibold text-ink-600 sm:text-xs">
            {t(lang, "test_counter").replace("{current}", String(Math.min(idx + 1, Math.max(total, 1)))).replace("{total}", String(total))}
            {isAdaptiveRound ? t(lang, "test_adaptive_suffix") : ""}
          </div>
        </div>
        <LanguageSwitcher />
      </header>

      <div className="mt-6">
        <ProgressBar value={progress} />
      </div>

      <AnimatePresence>
        {analyzing ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-10 rounded-3xl bg-white/80 shadow-soft ring-1 ring-slate-200/70"
          >
            <Loader title={t(lang, "analyzing")} subtitle={t(lang, "brand")} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {adaptiveIntro ? (
          <motion.div
            key="adaptive"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-6 backdrop-blur"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-soft ring-1 ring-slate-200/70"
            >
              <div className="text-xs font-black uppercase tracking-wide text-indigo-700">{t(lang, "brand")}</div>
              <div className="mt-2 text-2xl font-extrabold text-ink-900">{t(lang, "adaptive_title")}</div>
              <p className="mt-3 text-sm font-medium leading-relaxed text-ink-700">{t(lang, "adaptive_sub")}</p>
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
                className="mt-8 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-3 text-sm font-extrabold text-white shadow-soft"
                onClick={() => setAdaptiveIntro(false)}
              >
                {t(lang, "adaptive_cta")}
              </motion.button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!analyzing && !adaptiveIntro && current ? (
        <div className="mt-8">
          {!isAdaptiveRound ? (
            <p className="mb-4 text-sm font-medium leading-relaxed text-ink-700">{t(lang, "test_intro")}</p>
          ) : null}
          <AnimatePresence mode="wait">
            <QuestionCard key={current.id}>
              <h2 className="text-pretty text-xl font-extrabold leading-snug text-ink-900 sm:text-2xl lg:text-[1.65rem] lg:leading-tight">
                {qText(current)}
              </h2>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {likert.map((x) => (
                  <AnswerButton key={x.v} disabled={lock} onClick={() => void onPick(x.v)}>
                    {x.l}
                  </AnswerButton>
                ))}
              </div>
            </QuestionCard>
          </AnimatePresence>
        </div>
      ) : null}
    </div>
  );
}
