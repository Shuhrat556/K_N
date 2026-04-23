"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useSessionStore } from "@/store/useSessionStore";

export default function IntroPage() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);
  const reset = useSessionStore((s) => s.reset);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      reset();
      const s = await api.startSession();
      setSession(s.sessionId, s.userId);
      router.push("/warmup");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Не удалось начать");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-full flex-col px-4 py-12 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Профориентация</p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Определите свой сильнейший профессиональный кластер</h1>
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
          Сначала короткая разминка (8 вопросов), затем основной блок (75 вопросов). Если два кластера близки по баллам,
          зададим до 10 уточняющих вопросов для надёжности результата.
        </p>
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            {error}
          </div>
        ) : null}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void start()}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? "Запуск…" : "Начать тест"}
          </button>
          <Link
            href="/faculties"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-900 shadow-sm hover:bg-slate-50"
          >
            Факультеты каталога
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
