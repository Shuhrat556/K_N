"use client";

import Link from "next/link";
import { useSessionStore } from "@/store/useSessionStore";

export default function WarmupRetryPage() {
  const reset = useSessionStore((s) => s.reset);

  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col px-4 py-10">
      <h1 className="text-2xl font-extrabold">Сделайте паузу</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        По разминке видно, что вы устали или отвлекаетесь. Для более точного результата вернитесь позже, когда сможете
        сосредоточиться примерно на 25 минут.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white"
        >
          На главную
        </Link>
      </div>
    </main>
  );
}
