import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function QuestionCard({ children, className }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.985, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -12, scale: 0.99, filter: "blur(6px)" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={[
        "relative overflow-hidden rounded-3xl bg-white/80 p-5 shadow-soft ring-1 ring-slate-200/70 backdrop-blur dark:bg-slate-900/88 dark:ring-slate-600/70 sm:p-8 lg:p-10",
        className ?? "",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-200/30 blur-2xl dark:bg-indigo-500/15" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
