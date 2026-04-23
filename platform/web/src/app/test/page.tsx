"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, type MainQuestion } from "@/lib/api";
import { useSessionStore } from "@/store/useSessionStore";

const SCALE = [
  { v: 0, label: "Полностью не согласен" },
  { v: 1, label: "Не согласен" },
  { v: 2, label: "Нейтрально" },
  { v: 3, label: "Согласен" },
  { v: 4, label: "Полностью согласен" },
] as const;

export default function MainTestPage() {
  const router = useRouter();
  const sessionId = useSessionStore((s) => s.sessionId);

  const [mode, setMode] = useState<"main" | "adaptive">("main");
  const [items, setItems] = useState<MainQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      router.replace("/");
      return;
    }
    void (async () => {
      try {
        const qs = await api.mainQuestions(sessionId);
        setItems(qs);
        setMode("main");
        setIdx(0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось загрузить вопросы");
      }
    })();
  }, [sessionId, router]);

  const current = items[idx];
  const total = items.length;
  const progress = useMemo(() => (total ? ((idx + 1) / total) * 100 : 0), [idx, total]);

  const pick = async (value: number) => {
    if (!sessionId || !current) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "main") {
        await api.mainAnswer(sessionId, current.id, value);
      } else {
        await api.adaptiveAnswer(sessionId, current.id, value);
      }

      if (idx + 1 < items.length) {
        setIdx(idx + 1);
        return;
      }

      if (mode === "main") {
        const res = await api.mainComplete(sessionId);
        if (res.status === "adaptive_required") {
          const aqs = await api.adaptiveQuestions(sessionId);
          setMode("adaptive");
          setItems(aqs);
          setIdx(0);
          return;
        }
        router.push("/loading?next=/result");
        return;
      }

      await api.adaptiveComplete(sessionId);
      router.push("/loading?next=/result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить ответ");
    } finally {
      setBusy(false);
    }
  };

  if (!sessionId) return null;

  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {mode === "main" ? "Основной тест" : "Уточнение"}
        </p>
        <p className="text-xs font-bold text-slate-600">
          {total ? `${idx + 1} / ${total}` : ""}
        </p>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {current ? (
          <motion.div
            key={`${mode}-${current.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-8 space-y-4"
          >
            <h2 className="text-xl font-bold text-slate-900">{current.text}</h2>
            <div className="grid gap-2">
              {SCALE.map((s) => (
                <button
                  key={s.v}
                  type="button"
                  disabled={busy}
                  onClick={() => void pick(s.v)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-60"
                >
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-700">
                    {s.v}
                  </span>
                  {s.label}
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
