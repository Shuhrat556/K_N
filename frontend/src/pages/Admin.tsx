import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  createAdminCluster,
  createAdminGroup,
  createAdminQuestion,
  fetchAdminClusters,
  fetchAdminGroups,
  fetchAdminQuestions,
} from "../api/kasbnoma";
import type { AdminCluster, AdminGroup, AdminQuestion, QuestionPhase, ReadinessKind } from "../api/types";

export function Admin() {
  const [clusters, setClusters] = useState<AdminCluster[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [clusterCode, setClusterCode] = useState("");
  const [clusterName, setClusterName] = useState("");
  const [clusterSort, setClusterSort] = useState(0);

  const [groupClusterId, setGroupClusterId] = useState<number>(0);
  const [groupCode, setGroupCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupSort, setGroupSort] = useState(0);

  const [questionPhase, setQuestionPhase] = useState<QuestionPhase>("readiness");
  const [questionText, setQuestionText] = useState("");
  const [questionTextAlt, setQuestionTextAlt] = useState("");
  const [questionSort, setQuestionSort] = useState(0);
  const [questionReadinessKind, setQuestionReadinessKind] = useState<ReadinessKind>("positive");
  const [questionClusterId, setQuestionClusterId] = useState<number>(0);
  const [questionGroupId, setQuestionGroupId] = useState<number>(0);

  const inputClass =
    "w-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm font-medium text-ink-900 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100";
  const sectionCardClass = "rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-slate-200/70 backdrop-blur";

  const groupsForSelectedCluster = useMemo(
    () => groups.filter((g) => g.cluster_id === questionClusterId),
    [groups, questionClusterId],
  );

  const loadAll = async () => {
    setBusy(true);
    setError(null);
    try {
      const [clustersData, groupsData, questionsData] = await Promise.all([
        fetchAdminClusters(),
        fetchAdminGroups(),
        fetchAdminQuestions(),
      ]);
      setClusters(clustersData);
      setGroups(groupsData);
      setQuestions(questionsData);
      if (clustersData.length > 0) {
        const firstClusterId = clustersData[0].id;
        setGroupClusterId((prev) => prev || firstClusterId);
        setQuestionClusterId((prev) => prev || firstClusterId);
      }
    } catch (e) {
      setError(isAxiosError(e) ? String(e.response?.data?.detail ?? e.message) : "Failed to load admin data");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!groupsForSelectedCluster.some((g) => g.id === questionGroupId)) {
      setQuestionGroupId(groupsForSelectedCluster[0]?.id ?? 0);
    }
  }, [groupsForSelectedCluster, questionGroupId]);

  const onCreateCluster = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await createAdminCluster({
        code: clusterCode.trim(),
        name: clusterName.trim(),
        sort_order: Number(clusterSort) || 0,
      });
      setClusterCode("");
      setClusterName("");
      setClusterSort(0);
      setMessage("Категория добавлена");
      await loadAll();
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Не удалось добавить категорию");
    }
  };

  const onCreateGroup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await createAdminGroup({
        cluster_id: Number(groupClusterId),
        code: groupCode.trim(),
        name: groupName.trim(),
        sort_order: Number(groupSort) || 0,
      });
      setGroupCode("");
      setGroupName("");
      setGroupSort(0);
      setMessage("Подкатегория добавлена");
      await loadAll();
    } catch (err) {
      setError(
        isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Не удалось добавить подкатегорию",
      );
    }
  };

  const onCreateQuestion = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await createAdminQuestion({
        phase: questionPhase,
        text: questionText.trim(),
        text_tj: questionTextAlt.trim() || null,
        readiness_kind: questionPhase === "readiness" ? questionReadinessKind : null,
        cluster_id: questionPhase === "main" ? Number(questionClusterId) : null,
        group_id: questionPhase === "main" ? Number(questionGroupId) : null,
        sort_order: Number(questionSort) || 0,
      });
      setQuestionText("");
      setQuestionTextAlt("");
      setQuestionSort(0);
      setMessage("Вопрос добавлен");
      await loadAll();
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Не удалось добавить вопрос");
    }
  };

  return (
    <div className="page-shell py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-slate-200/70 backdrop-blur"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-300/30 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 -left-10 h-36 w-36 rounded-full bg-sky-300/30 blur-2xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-indigo-700/80">Kasbnoma</div>
            <div className="mt-1 text-2xl font-extrabold text-ink-900">Админ-панель</div>
            <p className="mt-2 text-sm font-medium text-ink-700">Добавляйте категории, подкатегории и вопросы для теста.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadAll()}
            className="rounded-2xl bg-white/90 px-4 py-2 text-xs font-extrabold text-ink-900 ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-card"
          >
            Обновить
          </button>
        </div>

        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          {busy ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-ink-700 ring-1 ring-slate-200/80">
              Загрузка...
            </span>
          ) : null}
          <AnimatePresence mode="wait">
            {message ? (
              <motion.span
                key={`m-${message}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200/80"
              >
                {message}
              </motion.span>
            ) : null}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {error ? (
              <motion.span
                key={`e-${error}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 ring-1 ring-rose-200/80"
              >
                {error}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6 grid gap-6 lg:grid-cols-2"
      >
        <form className={sectionCardClass} onSubmit={onCreateCluster}>
          <h2 className="text-lg font-extrabold text-ink-900">Добавить категорию (кластер)</h2>
          <div className="mt-4 space-y-3">
            <input
              className={inputClass}
              placeholder="Код (например: c6)"
              value={clusterCode}
              onChange={(e) => setClusterCode(e.target.value)}
              required
            />
            <input
              className={inputClass}
              placeholder="Название"
              value={clusterName}
              onChange={(e) => setClusterName(e.target.value)}
              required
            />
            <input
              className={inputClass}
              type="number"
              placeholder="Порядок сортировки"
              value={clusterSort}
              onChange={(e) => setClusterSort(Number(e.target.value))}
            />
          </div>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-soft"
            type="submit"
          >
            Добавить категорию
          </motion.button>
        </form>

        <form className={sectionCardClass} onSubmit={onCreateGroup}>
          <h2 className="text-lg font-extrabold text-ink-900">Добавить подкатегорию (группу)</h2>
          <div className="mt-4 space-y-3">
            <select
              className={inputClass}
              value={groupClusterId || ""}
              onChange={(e) => setGroupClusterId(Number(e.target.value))}
              required
            >
              <option value="" disabled>
                Выберите категорию
              </option>
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            <input
              className={inputClass}
              placeholder="Код группы"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
              required
            />
            <input
              className={inputClass}
              placeholder="Название группы"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
            <input
              className={inputClass}
              type="number"
              placeholder="Порядок сортировки"
              value={groupSort}
              onChange={(e) => setGroupSort(Number(e.target.value))}
            />
          </div>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-soft"
            type="submit"
          >
            Добавить подкатегорию
          </motion.button>
        </form>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6 rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-slate-200/70 backdrop-blur"
        onSubmit={onCreateQuestion}
      >
        <h2 className="text-lg font-extrabold text-ink-900">Добавить вопрос</h2>
        <select className={`mt-4 ${inputClass}`} value={questionPhase} onChange={(e) => setQuestionPhase(e.target.value as QuestionPhase)}>
          <option value="readiness">Готовность</option>
          <option value="main">Основной блок</option>
        </select>

        <textarea
          className={`mt-3 min-h-28 ${inputClass}`}
          placeholder="Текст вопроса (основной)"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          required
        />
        <textarea
          className={`mt-3 min-h-20 ${inputClass}`}
          placeholder="Текст на втором языке (необязательно)"
          value={questionTextAlt}
          onChange={(e) => setQuestionTextAlt(e.target.value)}
        />

        <AnimatePresence mode="wait">
          {questionPhase === "readiness" ? (
            <motion.select
              key="readiness-fields"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mt-3 ${inputClass}`}
              value={questionReadinessKind}
              onChange={(e) => setQuestionReadinessKind(e.target.value as ReadinessKind)}
            >
              <option value="positive">Позитивный</option>
              <option value="negative">Негативный</option>
              <option value="emotional">Эмоциональный</option>
            </motion.select>
          ) : (
            <motion.div
              key="main-fields"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-3 grid gap-3 sm:grid-cols-2"
            >
              <select
                className={inputClass}
                value={questionClusterId || ""}
                onChange={(e) => setQuestionClusterId(Number(e.target.value))}
                required
              >
                <option value="" disabled>
                  Выберите категорию
                </option>
                {clusters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                value={questionGroupId || ""}
                onChange={(e) => setQuestionGroupId(Number(e.target.value))}
                required
              >
                <option value="" disabled>
                  Выберите подкатегорию
                </option>
                {groupsForSelectedCluster.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.code})
                  </option>
                ))}
              </select>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          className={`mt-3 ${inputClass}`}
          type="number"
          placeholder="Порядок сортировки"
          value={questionSort}
          onChange={(e) => setQuestionSort(Number(e.target.value))}
        />

        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.985 }}
          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-soft"
          type="submit"
        >
          Добавить вопрос
        </motion.button>
      </motion.form>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6 rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-slate-200/70 backdrop-blur"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-ink-900">Последние вопросы</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-ink-700 ring-1 ring-slate-200/80">
            {questions.length} всего
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <AnimatePresence initial={false}>
            {questions.slice(0, 20).map((q) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl bg-gradient-to-r from-slate-50 to-white p-3 text-sm text-ink-800 ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="font-bold">
                  #{q.id} · {q.phase}
                </div>
                <div className="mt-1.5 font-medium text-ink-900">{q.text}</div>
                <div className="mt-2 text-xs font-medium text-ink-600">
                  cluster={q.cluster_id ?? "-"}, group={q.group_id ?? "-"}, kind={q.readiness_kind ?? "-"}, sort=
                  {q.sort_order}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
