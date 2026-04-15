import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Link } from "react-router-dom";
import { ThemeToggle } from "../components/ThemeToggle";
import {
  createAdminCluster,
  createAdminGroup,
  createAdminQuestion,
  fetchAdminClusters,
  fetchAdminGroups,
  fetchAdminQuestions,
  updateAdminQuestion,
} from "../api/kasbnoma";
import type { AdminCluster, AdminGroup, AdminQuestion, QuestionPhase, ReadinessKind } from "../api/types";

type EditorState = {
  question: AdminQuestion;
  text: string;
  text_tj: string;
  sort_order: number;
  readiness_kind: ReadinessKind;
  cluster_id: number;
  group_id: number;
  labels_ru: string[];
  labels_tj: string[];
};

function padLabels(src: string[] | null | undefined, n: number): string[] {
  const a = [...(src ?? [])].slice(0, n);
  while (a.length < n) a.push("");
  return a;
}

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

  const [listPhase, setListPhase] = useState<"all" | QuestionPhase>("all");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);

  const inputClass =
    "w-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm font-medium text-ink-900 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-950/60";
  const sectionCardClass =
    "rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-slate-200/70 backdrop-blur dark:bg-slate-900/90 dark:ring-slate-700/80";

  const groupsForSelectedCluster = useMemo(
    () => groups.filter((g) => g.cluster_id === questionClusterId),
    [groups, questionClusterId],
  );

  const groupsForEditorCluster = useMemo(
    () => (editor ? groups.filter((g) => g.cluster_id === editor.cluster_id) : []),
    [groups, editor],
  );

  const filteredQuestions = useMemo(() => {
    const qn = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (listPhase !== "all" && q.phase !== listPhase) return false;
      if (!qn) return true;
      return (
        q.text.toLowerCase().includes(qn) ||
        (q.text_tj ?? "").toLowerCase().includes(qn) ||
        String(q.id).includes(qn)
      );
    });
  }, [questions, listPhase, search]);

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

  useEffect(() => {
    if (!editor) return;
    if (!groupsForEditorCluster.some((g) => g.id === editor.group_id)) {
      setEditor((prev) =>
        prev ? { ...prev, group_id: groupsForEditorCluster[0]?.id ?? prev.group_id } : prev,
      );
    }
  }, [editor, groupsForEditorCluster]);

  const openEditor = (q: AdminQuestion) => {
    const n = q.phase === "readiness" ? 3 : 5;
    setEditor({
      question: q,
      text: q.text,
      text_tj: q.text_tj ?? "",
      sort_order: q.sort_order,
      readiness_kind: (q.readiness_kind ?? "positive") as ReadinessKind,
      cluster_id: q.cluster_id ?? clusters[0]?.id ?? 0,
      group_id: q.group_id ?? 0,
      labels_ru: padLabels(q.option_labels, n),
      labels_tj: padLabels(q.option_labels_tj, n),
    });
    setError(null);
    setMessage(null);
  };

  const saveEditor = async () => {
    if (!editor) return;
    const n = editor.question.phase === "readiness" ? 3 : 5;
    const ru = editor.labels_ru.map((s) => s.trim());
    const tj = editor.labels_tj.map((s) => s.trim());

    let option_labels: string[] | null = null;
    let option_labels_tj: string[] | null = null;
    if (ru.some(Boolean)) {
      if (ru.some((x) => !x)) {
        setError(`Нужно заполнить все ${n} варианта (RU) или очистите все поля для стандартных подписей.`);
        return;
      }
      option_labels = ru;
      if (tj.some(Boolean)) {
        if (tj.some((x) => !x)) {
          setError(`Нужно заполнить все ${n} вариантов (TJ) или оставьте пустым для одного языка.`);
          return;
        }
        option_labels_tj = tj;
      }
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateAdminQuestion(editor.question.id, {
        text: editor.text.trim(),
        text_tj: editor.text_tj.trim() || null,
        sort_order: editor.sort_order,
        ...(editor.question.phase === "readiness" ? { readiness_kind: editor.readiness_kind } : {}),
        ...(editor.question.phase === "main"
          ? { cluster_id: editor.cluster_id, group_id: editor.group_id }
          : {}),
        option_labels,
        option_labels_tj,
      });
      setMessage("Сохранено");
      setEditor(null);
      await loadAll();
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

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

  const labelSlots = editor ? (editor.question.phase === "readiness" ? 3 : 5) : 0;
  const readinessHint =
    editor?.question.phase === "readiness"
      ? "Порядок: 0 — да / радость, 1 — отчасти / неуверенность, 2 — нет / страх (как в стандартных подписях)."
      : "Порядок: значения шкалы 0 … 4 слева направо в форме ответа.";

  return (
    <div className="page-shell py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-slate-200/70 backdrop-blur dark:bg-slate-900/90 dark:ring-slate-700/80"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-300/30 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 -left-10 h-36 w-36 rounded-full bg-sky-300/30 blur-2xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-indigo-700/80 dark:text-indigo-300/90">Kasbnoma</div>
            <div className="mt-1 text-2xl font-extrabold text-ink-900 dark:text-slate-50">Админ-панель</div>
            <p className="mt-2 text-sm font-medium text-ink-700 dark:text-slate-300">
              Откройте по адресу <span className="font-mono text-ink-900 dark:text-slate-100">/admin</span>. Категории, подкатегории, вопросы
              и подписи вариантов.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <Link
              to="/"
              className="rounded-2xl bg-white/90 px-4 py-2 text-xs font-extrabold text-indigo-800 ring-1 ring-indigo-200/80 transition hover:-translate-y-0.5 hover:shadow-card dark:bg-indigo-950/50 dark:text-indigo-100 dark:ring-indigo-800/60"
            >
              На главную
            </Link>
            <button
              type="button"
              onClick={() => void loadAll()}
              className="rounded-2xl bg-white/90 px-4 py-2 text-xs font-extrabold text-ink-900 ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-card dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
            >
              Обновить
            </button>
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          {busy ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-ink-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600">
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
                className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-800/50"
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
                className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-900/50"
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
        transition={{ delay: 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={`mt-6 ${sectionCardClass}`}
      >
        <h2 className="text-lg font-extrabold text-ink-900 dark:text-slate-50">Категории и подкатегории (просмотр)</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-slate-400">Кластеры</div>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm font-medium text-ink-800 dark:text-slate-200">
              {clusters.map((c) => (
                <li key={c.id} className="rounded-xl bg-slate-50/90 px-3 py-2 ring-1 ring-slate-200/70 dark:bg-slate-800/80 dark:ring-slate-600">
                  <span className="font-mono text-xs text-ink-500 dark:text-slate-400">{c.code}</span> · {c.name}{" "}
                  <span className="text-ink-500 dark:text-slate-400">sort {c.sort_order}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-slate-400">Группы</div>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm font-medium text-ink-800 dark:text-slate-200">
              {groups.map((g) => (
                <li key={g.id} className="rounded-xl bg-slate-50/90 px-3 py-2 ring-1 ring-slate-200/70 dark:bg-slate-800/80 dark:ring-slate-600">
                  <span className="font-mono text-xs text-ink-500 dark:text-slate-400">{g.code}</span> · {g.name}{" "}
                  <span className="text-ink-500 dark:text-slate-400">cluster {g.cluster_id}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6 grid gap-6 lg:grid-cols-2"
      >
        <form className={sectionCardClass} onSubmit={onCreateCluster}>
          <h2 className="text-lg font-extrabold text-ink-900 dark:text-slate-50">Добавить категорию (кластер)</h2>
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
          <h2 className="text-lg font-extrabold text-ink-900 dark:text-slate-50">Добавить подкатегорию (группу)</h2>
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
        transition={{ delay: 0.1, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6 rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-slate-200/70 backdrop-blur dark:bg-slate-900/90 dark:ring-slate-700/80"
        onSubmit={onCreateQuestion}
      >
        <h2 className="text-lg font-extrabold text-ink-900 dark:text-slate-50">Добавить вопрос</h2>
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
        transition={{ delay: 0.14, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={`mt-6 ${sectionCardClass}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-ink-900 dark:text-slate-50">Вопросы</h2>
            <p className="mt-1 text-sm font-medium text-ink-600 dark:text-slate-300">Редактирование текста, привязки и подписей кнопок.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select className={inputClass + " sm:max-w-xs"} value={listPhase} onChange={(e) => setListPhase(e.target.value as typeof listPhase)}>
              <option value="all">Все фазы</option>
              <option value="readiness">Готовность</option>
              <option value="main">Основной блок</option>
            </select>
            <input
              className={inputClass + " sm:max-w-xs"}
              placeholder="Поиск по тексту или id"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {filteredQuestions.map((q) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex flex-col gap-2 rounded-2xl bg-gradient-to-r from-slate-50 to-white p-3 ring-1 ring-slate-200/70 dark:from-slate-800/90 dark:to-slate-900/90 dark:ring-slate-600 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-indigo-700">
                    #{q.id} · {q.phase}
                    {q.readiness_kind ? ` · ${q.readiness_kind}` : ""}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm font-semibold text-ink-900 dark:text-slate-100">{q.text}</div>
                  <div className="mt-1 text-xs font-medium text-ink-500 dark:text-slate-400">
                    cluster={q.cluster_id ?? "—"} · group={q.group_id ?? "—"} · sort {q.sort_order}
                    {q.option_labels?.length ? ` · варианты: ${q.option_labels.length}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openEditor(q)}
                  className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-xs font-extrabold text-white shadow-card transition hover:brightness-110"
                >
                  Изменить
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {!filteredQuestions.length ? (
            <div className="py-8 text-center text-sm font-medium text-ink-500 dark:text-slate-400">Ничего не найдено.</div>
          ) : null}
        </div>
      </motion.div>

      <AnimatePresence>
        {editor ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-editor-title"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-soft ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-600"
            >
              <div id="admin-editor-title" className="text-lg font-extrabold text-ink-900 dark:text-slate-50">
                Вопрос #{editor.question.id}
              </div>
              <p className="mt-1 text-xs font-medium text-ink-600 dark:text-slate-300">{readinessHint}</p>

              <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-slate-400">Текст</label>
              <textarea
                className={`mt-1 min-h-24 ${inputClass}`}
                value={editor.text}
                onChange={(e) => setEditor({ ...editor, text: e.target.value })}
              />
              <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-slate-400">Второй язык</label>
              <textarea
                className={`mt-1 min-h-16 ${inputClass}`}
                value={editor.text_tj}
                onChange={(e) => setEditor({ ...editor, text_tj: e.target.value })}
              />
              <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-slate-400">Сортировка</label>
              <input
                className={`mt-1 ${inputClass}`}
                type="number"
                value={editor.sort_order}
                onChange={(e) => setEditor({ ...editor, sort_order: Number(e.target.value) || 0 })}
              />

              {editor.question.phase === "readiness" ? (
                <select
                  className={`mt-3 ${inputClass}`}
                  value={editor.readiness_kind}
                  onChange={(e) => setEditor({ ...editor, readiness_kind: e.target.value as ReadinessKind })}
                >
                  <option value="positive">Позитивный</option>
                  <option value="negative">Негативный</option>
                  <option value="emotional">Эмоциональный</option>
                </select>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <select
                    className={inputClass}
                    value={editor.cluster_id || ""}
                    onChange={(e) => setEditor({ ...editor, cluster_id: Number(e.target.value), group_id: 0 })}
                  >
                    {clusters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className={inputClass}
                    value={editor.group_id || ""}
                    onChange={(e) => setEditor({ ...editor, group_id: Number(e.target.value) })}
                  >
                    {groupsForEditorCluster.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-4 text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-slate-400">
                Варианты ответа (RU) — оставьте пустыми для стандартных
              </div>
              <div className="mt-2 grid gap-2">
                {Array.from({ length: labelSlots }, (_, i) => (
                  <input
                    key={`ru-${i}`}
                    className={inputClass}
                    placeholder={`Вариант ${i + 1}`}
                    value={editor.labels_ru[i] ?? ""}
                    onChange={(e) => {
                      const next = [...editor.labels_ru];
                      next[i] = e.target.value;
                      setEditor({ ...editor, labels_ru: next });
                    }}
                  />
                ))}
              </div>
              <div className="mt-3 text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-slate-400">Варианты (TJ), необязательно</div>
              <div className="mt-2 grid gap-2">
                {Array.from({ length: labelSlots }, (_, i) => (
                  <input
                    key={`tj-${i}`}
                    className={inputClass}
                    placeholder={`TJ ${i + 1}`}
                    value={editor.labels_tj[i] ?? ""}
                    onChange={(e) => {
                      const next = [...editor.labels_tj];
                      next[i] = e.target.value;
                      setEditor({ ...editor, labels_tj: next });
                    }}
                  />
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveEditor()}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-soft disabled:opacity-60"
                >
                  {saving ? "Сохранение…" : "Сохранить"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditor(null)}
                  className="rounded-2xl bg-white px-4 py-2.5 text-sm font-extrabold text-ink-900 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
