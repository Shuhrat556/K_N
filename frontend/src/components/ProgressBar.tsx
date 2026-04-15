import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

type Props = {
  value: number; // 0..1
  label?: string;
};

export function ProgressBar({ value, label }: Props) {
  const spring = useSpring(0, { stiffness: 220, damping: 28, mass: 0.35 });
  const width = useTransform(spring, (v) => `${Math.round(v * 100)}%`);

  useEffect(() => {
    spring.set(Math.min(1, Math.max(0, value)));
  }, [value, spring]);

  return (
    <div className="w-full">
      {label ? (
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-ink-700 dark:text-slate-300">{label}</div>
      ) : null}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/70 ring-1 ring-slate-200/70 dark:bg-slate-800/90 dark:ring-slate-600/80">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-400" style={{ width }} />
      </div>
    </div>
  );
}
