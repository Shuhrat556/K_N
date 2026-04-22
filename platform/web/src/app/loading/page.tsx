"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoadingPage() {
  const router = useRouter();
  const [next, setNext] = useState("/result");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setNext(q.get("next") ?? "/result");
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      router.replace(next);
    }, 650);
    return () => window.clearTimeout(t);
  }, [next, router]);

  return (
    <main className="grid min-h-full place-items-center px-4">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <p className="mt-4 text-sm font-semibold text-slate-700">Calculating your profile…</p>
      </div>
    </main>
  );
}
