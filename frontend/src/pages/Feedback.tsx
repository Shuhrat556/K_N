import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnswerButton } from "../components/AnswerButton";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { t } from "../i18n/translations";
import { useAppStore } from "../store/useAppStore";

type Q1 = "simple" | "tips" | "speed" | "design";
type Q2 = "many" | "unclear" | "mismatch" | "tech";

export function Feedback() {
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.lang);

  const [q1, setQ1] = useState<Q1 | null>(null);
  const [q2, setQ2] = useState<Q2 | null>(null);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  const q1opts = useMemo(
    () =>
      [
        { id: "simple" as const, l: t(lang, "feedback_q1_o1") },
        { id: "tips" as const, l: t(lang, "feedback_q1_o2") },
        { id: "speed" as const, l: t(lang, "feedback_q1_o3") },
        { id: "design" as const, l: t(lang, "feedback_q1_o4") },
      ],
    [lang],
  );

  const q2opts = useMemo(
    () =>
      [
        { id: "many" as const, l: t(lang, "feedback_q2_o1") },
        { id: "unclear" as const, l: t(lang, "feedback_q2_o2") },
        { id: "mismatch" as const, l: t(lang, "feedback_q2_o3") },
        { id: "tech" as const, l: t(lang, "feedback_q2_o4") },
      ],
    [lang],
  );

  const submit = () => {
    const payload = { q1, q2, text, lang, at: new Date().toISOString() };
    localStorage.setItem("kasbnoma_feedback_v2", JSON.stringify(payload));
    setSent(true);
  };

  return (
    <div className="page-shell flex min-h-full flex-col pb-16 pt-6 sm:pt-8">
      <header className="flex items-center justify-between gap-4">
        <div className="text-sm font-extrabold text-ink-900 dark:text-slate-50">{t(lang, "feedback_title")}</div>
        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.985 }}
            onClick={() => navigate(-1)}
            className="rounded-2xl bg-white/80 dark:bg-slate-900/90 px-4 py-2 text-xs font-extrabold text-ink-900 dark:text-slate-50 shadow-card ring-1 ring-slate-200/70 dark:ring-slate-700/80"
          >
            {t(lang, "back")}
          </motion.button>
          <LanguageSwitcher />
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-3xl bg-white/85 dark:bg-slate-900/92 p-6 shadow-soft ring-1 ring-slate-200/70 dark:ring-slate-700/80 sm:p-8">
        <h1 className="text-lg font-extrabold text-ink-900 dark:text-slate-50">{t(lang, "feedback_form_title")}</h1>
        <p className="mt-2 text-sm font-medium text-ink-600 dark:text-slate-300">{t(lang, "feedback_sub")}</p>

        <div className="mt-8 text-xs font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">1</div>
        <div className="mt-2 text-sm font-bold text-ink-900 dark:text-slate-50">{t(lang, "feedback_q1")}</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {q1opts.map((o) => (
            <AnswerButton key={o.id} selected={q1 === o.id} onClick={() => setQ1(o.id)}>
              {o.l}
            </AnswerButton>
          ))}
        </div>

        <div className="mt-10 text-xs font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">2</div>
        <div className="mt-2 text-sm font-bold text-ink-900 dark:text-slate-50">{t(lang, "feedback_q2")}</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {q2opts.map((o) => (
            <AnswerButton key={o.id} selected={q2 === o.id} onClick={() => setQ2(o.id)}>
              {o.l}
            </AnswerButton>
          ))}
        </div>

        <label className="mt-10 block">
          <div className="text-xs font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">3</div>
          <div className="mt-2 text-sm font-bold text-ink-900 dark:text-slate-50">{t(lang, "feedback_q3")}</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="mt-3 w-full resize-none rounded-2xl bg-white/90 dark:bg-slate-900/95 px-4 py-3 text-sm font-medium text-ink-900 dark:text-slate-50 shadow-card ring-1 ring-slate-200/70 dark:ring-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </label>

        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.985 }}
          onClick={submit}
          className="mt-8 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-3 text-sm font-extrabold text-white shadow-soft"
        >
          {t(lang, "feedback_send")}
        </motion.button>

        {sent ? <div className="mt-4 text-sm font-semibold text-emerald-700">{t(lang, "feedback_sent")}</div> : null}
      </motion.div>
    </div>
  );
}
