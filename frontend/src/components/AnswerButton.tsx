import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  variant?: "solid" | "ghost";
};

export function AnswerButton({ children, selected, disabled, onClick, variant = "ghost" }: Props) {
  const base =
    "min-h-[3rem] w-full rounded-2xl px-4 py-3.5 text-left text-base font-semibold leading-snug transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 sm:min-h-0 sm:py-3 sm:text-sm";
  const ghost = selected
    ? "bg-gradient-to-br from-indigo-600 via-sky-500 to-cyan-500 text-white shadow-[0_10px_32px_-10px_rgba(79,70,229,0.45)] ring-1 ring-white/35"
    : "bg-white/92 text-ink-900 shadow-[0_4px_22px_-10px_rgba(15,23,42,0.14)] ring-1 ring-slate-200/85 hover:-translate-y-1 hover:shadow-[0_14px_36px_-14px_rgba(14,165,233,0.2)] hover:ring-sky-300/50 dark:bg-slate-800/95 dark:text-slate-100 dark:ring-slate-600/85 dark:hover:bg-slate-800 dark:hover:ring-sky-500/35";
  const solid =
    "bg-gradient-to-b from-slate-800 to-slate-950 text-white shadow-[0_8px_28px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/10 hover:-translate-y-0.5 hover:brightness-110 dark:from-slate-700 dark:to-slate-900";

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { y: -2, scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className={[base, variant === "solid" ? solid : ghost, disabled ? "opacity-60" : ""].join(" ")}
    >
      {children}
    </motion.button>
  );
}
