import { motion } from "framer-motion";

type Props = {
  title: string;
  subtitle?: string;
};

export function Loader({ title, subtitle }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-6 py-16 text-center">
      <div className="relative h-16 w-16">
        <motion.span
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-400 opacity-30 blur-md"
          animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="absolute inset-1 rounded-full border-2 border-white/70 dark:border-slate-500/80"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className="absolute inset-3 rounded-full bg-gradient-to-br from-indigo-600 to-emerald-400"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div>
        <motion.div
          className="text-lg font-extrabold text-ink-900 dark:text-slate-50"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {title}
        </motion.div>
        {subtitle ? (
          <motion.div
            className="mt-2 text-sm font-medium text-ink-700 dark:text-slate-300"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            {subtitle}
          </motion.div>
        ) : null}
      </div>

      <div className="grid w-full max-w-sm grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 rounded-full bg-slate-200/80 dark:bg-slate-600/80"
            initial={{ opacity: 0.35 }}
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
          />
        ))}
      </div>
    </div>
  );
}
