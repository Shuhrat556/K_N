"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useSessionStore } from "@/store/useSessionStore";

export default function WarningPage() {
  const router = useRouter();
  const sessionId = useSessionStore((s) => s.sessionId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onContinue = async () => {
    if (!sessionId) {
      router.replace("/");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.warmupContinue(sessionId);
      router.replace("/test");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось продолжить");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col px-4 py-10">
      <h1 className="text-2xl font-extrabold">Небольшое напоминание</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Результат разминки в среднем диапазоне. Можно продолжить, но ответы будут точнее, если убрать отвлекающие факторы.
      </p>
      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void onContinue()}
        className="mt-6 inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60"
      >
        {busy ? "Переход…" : "К основному тесту"}
      </button>
    </main>
  );
}
