"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, type WarmupQuestion } from "@/lib/api";
import { useSessionStore } from "@/store/useSessionStore";

const LABELS = ["Первый вариант", "Второй вариант", "Третий вариант"];

export default function WarmupPage() {
  const router = useRouter();
  const sessionId = useSessionStore((s) => s.sessionId);
  const setWarmupOutcome = useSessionStore((s) => s.setWarmupOutcome);

  const [questions, setQuestions] = useState<WarmupQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: number; choiceIndex: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      router.replace("/");
      return;
    }
    void (async () => {
      try {
        const qs = await api.warmupQuestions(sessionId);
        setQuestions(qs);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось загрузить разминку");
      }
    })();
  }, [sessionId, router]);

  const current = questions[idx];
  const progress = useMemo(() => (questions.length ? ((idx + 1) / questions.length) * 100 : 0), [idx, questions.length]);

  const choose = async (choiceIndex: number) => {
    if (!sessionId || !current) return;
    const nextAnswers = [...answers, { questionId: current.id, choiceIndex }];
    setAnswers(nextAnswers);
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.submitWarmup(sessionId, nextAnswers);
      setWarmupOutcome(res.outcome);
      if (res.outcome === "RETRY_LATER") {
        router.replace("/warmup/retry");
        return;
      }
      if (res.outcome === "WARNING") {
        router.replace("/warning");
        return;
      }
      router.replace("/test");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить ответы");
    } finally {
      setBusy(false);
    }
  };

  if (!sessionId) return null;

  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col px-4 py-8">
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Разминка</p>
      {error ? (
        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {current ? (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="mt-6 space-y-4"
          >
            <h2 className="text-xl font-bold text-slate-900">{current.text}</h2>
            <div className="grid gap-2">
              {LABELS.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={busy}
                  onClick={() => void choose(i)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-60"
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="mt-10 text-sm font-medium text-slate-600">Загрузка…</div>
        )}
      </AnimatePresence>
    </main>
  );
}
