import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

type Props = {
  value: number; // 0..1
  label?: string;
  /** Secondary line (e.g. question counter). */
  detail?: string;
};

export function ProgressBar({ value, label, detail }: Props) {
  const spring = useSpring(0, { stiffness: 220, damping: 28, mass: 0.35 });
  const width = useTransform(spring, (v) => `${Math.round(v * 100)}%`);

  useEffect(() => {
    spring.set(Math.min(1, Math.max(0, value)));
  }, [value, spring]);

  return (
    <div className="w-full">
      {label || detail ? (
        <div className="mb-2 space-y-0.5 text-xs font-semibold text-ink-700 dark:text-slate-300">
          {label ? <div>{label}</div> : null}
          {detail ? <div className="text-[11px] font-bold text-ink-600 dark:text-slate-400">{detail}</div> : null}
        </div>
      ) : null}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/70 ring-1 ring-slate-200/70 dark:bg-slate-800/90 dark:ring-slate-600/80">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-400" style={{ width }} />
      </div>
    </div>
  );
}
