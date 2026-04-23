"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSessionStore } from "@/store/useSessionStore";

export default function ResultPage() {
  const router = useRouter();
  const sessionId = useSessionStore((s) => s.sessionId);
  const setResultMeta = useSessionStore((s) => s.setResultMeta);

  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<Awaited<ReturnType<typeof api.result>> | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.replace("/");
      return;
    }
    void (async () => {
      try {
        const r = await api.result(sessionId);
        setPayload(r);
        const topScore = r.scoreJson.ranking?.[0]?.score ?? null;
        setResultMeta(r.topCluster?.id ?? null, topScore);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось загрузить результат");
      }
    })();
  }, [sessionId, router, setResultMeta]);

  if (!sessionId) return null;

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Ваш ведущий кластер</h1>
      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      {payload?.topCluster ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Лидер</p>
          <p className="mt-2 text-2xl font-extrabold">{payload.topCluster.name}</p>
          <p className="mt-2 text-sm text-slate-600">
            Баллы суммируются по ответам. Если два кластера были близки, использовались уточняющие вопросы.
          </p>
        </div>
      ) : (
        <div className="mt-6 text-sm text-slate-600">Загрузка…</div>
      )}

      {payload?.scoreJson?.topTwo && payload.scoreJson.topTwo.length >= 2 ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Два лидера (сырые баллы)</p>
          <ul className="mt-3 space-y-2 text-sm font-semibold">
            {payload.scoreJson.topTwo.map((t) => (
              <li key={t.clusterId} className="flex justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
                <span>Кластер №{t.clusterId}</span>
                <span className="tabular-nums text-slate-600">{t.score}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {payload?.scoreJson?.percentages ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Приблизительное распределение</p>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.entries(payload.scoreJson.percentages)
              .sort((a, b) => b[1] - a[1])
              .map(([id, pct]) => (
                <li key={id} className="flex justify-between gap-3">
                  <span className="font-semibold">Кластер №{id}</span>
                  <span className="tabular-nums text-slate-600">{pct}%</span>
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/faculties"
          className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white"
        >
          Подходящие факультеты
        </Link>
        <Link href="/" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold">
          Начать сначала
        </Link>
      </div>
    </main>
  );
}
