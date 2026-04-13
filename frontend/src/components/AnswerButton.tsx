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
    "min-h-[3rem] w-full rounded-2xl px-4 py-3.5 text-left text-base font-semibold leading-snug transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 sm:min-h-0 sm:py-3 sm:text-sm";
  const ghost = selected
    ? "bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-soft ring-1 ring-white/30"
    : "bg-white/80 text-ink-900 shadow-card ring-1 ring-slate-200/70 hover:-translate-y-0.5 hover:shadow-soft";
  const solid = "bg-slate-900 text-white shadow-soft hover:-translate-y-0.5 hover:brightness-110";

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
