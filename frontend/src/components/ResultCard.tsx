import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  highlight?: boolean;
  delay?: number;
  badge?: string;
};

export function ResultCard({ title, subtitle, icon, highlight, delay = 0, badge }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={[
        "rounded-3xl p-6 shadow-soft ring-1 backdrop-blur",
        highlight
          ? "bg-gradient-to-br from-indigo-600 via-sky-600 to-emerald-500 text-white ring-white/20"
          : "bg-white/85 text-ink-900 ring-slate-200/70 dark:bg-slate-900/90 dark:text-slate-100 dark:ring-slate-600/80",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div
          className={[
            "grid h-12 w-12 place-items-center rounded-2xl text-lg",
            highlight ? "bg-white/15 ring-1 ring-white/25" : "bg-slate-900 text-white dark:bg-sky-600 dark:text-white",
          ].join(" ")}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={["text-xs font-bold uppercase tracking-wide", highlight ? "text-white/80" : "text-ink-500 dark:text-slate-400"].join(
              " ",
            )}
          >
            {badge ?? (highlight ? "Главный результат" : "Детали")}
          </div>
          <div
            className={[
              "mt-1 text-xl font-extrabold leading-snug sm:text-lg",
              highlight ? "text-white" : "text-ink-900 dark:text-slate-50",
            ].join(" ")}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              className={[
                "mt-2 whitespace-pre-line text-base leading-relaxed sm:text-sm",
                highlight ? "text-white/85" : "text-ink-700 dark:text-slate-300",
              ].join(" ")}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
