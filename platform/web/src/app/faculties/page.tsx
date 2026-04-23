"use client";

import { useEffect, useMemo, useState } from "react";
import { api, type FacultyRow } from "@/lib/api";
import { useSessionStore } from "@/store/useSessionStore";

export default function FacultiesPage() {
  const topClusterId = useSessionStore((s) => s.topClusterId);
  const userClusterScore = useSessionStore((s) => s.userClusterScore);

  const [city, setCity] = useState("");
  const [language, setLanguage] = useState("");
  const [type, setType] = useState<"" | "FREE" | "PAID">("");
  const [mode, setMode] = useState<"" | "ONLINE" | "OFFLINE">("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [margin, setMargin] = useState("10");

  const [rows, setRows] = useState<FacultyRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("take", "200");
    if (topClusterId != null) p.set("clusterId", String(topClusterId));
    if (city.trim()) p.set("city", city.trim());
    if (language.trim()) p.set("language", language.trim());
    if (type) p.set("type", type);
    if (mode) p.set("mode", mode);
    if (minScore.trim()) p.set("minScore", minScore.trim());
    if (maxScore.trim()) p.set("maxScore", maxScore.trim());
    if (userClusterScore != null && margin.trim()) {
      p.set("userScore", String(Math.round(userClusterScore)));
      p.set("margin", margin.trim());
    }
    return p;
  }, [topClusterId, city, language, type, mode, minScore, maxScore, userClusterScore, margin]);

  useEffect(() => {
    void (async () => {
      setError(null);
      try {
        const data = await api.faculties(params);
        setRows(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось загрузить факультеты");
      }
    })();
  }, [params]);

  return (
    <main className="mx-auto flex min-h-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Факультеты</h1>
        <p className="mt-2 text-sm text-slate-600">
          Фильтры действуют на общий каталог. Если вы завершили тест в этом браузере, результаты учитывают ваш ведущий
          кластер автоматически.
        </p>
      </div>

      <section className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <label className="text-xs font-semibold text-slate-600">
          Город
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Душанбе"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Язык
          <input
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="ru"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Тип
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "" | "FREE" | "PAID")}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Любой</option>
            <option value="FREE">Бесплатно</option>
            <option value="PAID">Платно</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Формат
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "" | "ONLINE" | "OFFLINE")}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Любой</option>
            <option value="ONLINE">Онлайн</option>
            <option value="OFFLINE">Очно</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Мин. балл
          <input
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="0"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Макс. балл
          <input
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="100"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Допуск по баллу (если есть результат последнего теста)
          <input
            value={margin}
            onChange={(e) => setMargin(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="10"
          />
        </label>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((f) => (
          <article key={f.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-lg font-extrabold">{f.university}</div>
            <div className="mt-1 text-sm font-semibold text-slate-800">{f.name}</div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-slate-100 px-2 py-1">{f.cluster.name}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">{f.city}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">{f.language}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">{f.type}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">{f.mode}</span>
              <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-800">Балл ≥ {f.scoreRequirement}</span>
            </div>
          </article>
        ))}
      </div>

      {!rows.length && !error ? (
        <div className="text-sm font-medium text-slate-600">Нет факультетов по этим фильтрам.</div>
      ) : null}
    </main>
  );
}
