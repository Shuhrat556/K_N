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
      setError(e instanceof Error ? e.message : "Could not continue");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col px-4 py-10">
      <h1 className="text-2xl font-extrabold">Quick heads‑up</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Your warmup score is in a middling range. You can still continue, but your answers will be more reliable if you
        minimize distractions.
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
        {busy ? "Continuing…" : "Continue to main test"}
      </button>
    </main>
  );
}
