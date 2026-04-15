import { motion } from "framer-motion";

type Props = {
  className?: string;
};

export function Illustration({ className }: Props) {
  return (
    <motion.svg
      viewBox="0 0 560 420"
      className={className ?? "w-full max-w-xl"}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="g2" x1="0" x2="1" y1="1" y2="0">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="18" result="b" />
        </filter>
      </defs>

      <circle cx="120" cy="120" r="90" fill="url(#g1)" opacity="0.25" filter="url(#blur)" />
      <circle cx="430" cy="120" r="110" fill="url(#g2)" opacity="0.22" filter="url(#blur)" />

      <motion.rect
        x="120"
        y="120"
        width="320"
        height="210"
        rx="28"
        fill="white"
        stroke="#e2e8f0"
        strokeWidth="1.5"
        initial={{ opacity: 0, rotate: -1.5, y: 18 }}
        animate={{ opacity: 1, rotate: -1.2, y: 0 }}
        transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.path
        d="M170 190h240"
        stroke="#cbd5e1"
        strokeWidth="10"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: "easeInOut", delay: 0.15 }}
      />
      <motion.path
        d="M170 235h190"
        stroke="#e2e8f0"
        strokeWidth="10"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: "easeInOut", delay: 0.25 }}
      />
      <motion.path
        d="M170 280h210"
        stroke="#e2e8f0"
        strokeWidth="10"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: "easeInOut", delay: 0.35 }}
      />

      <motion.circle
        cx="420"
        cy="210"
        r="44"
        fill="url(#g1)"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.25 }}
      />
      <motion.path
        d="M404 214c10 10 22 10 32 0"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.55 }}
      />

      <motion.rect
        x="150"
        y="150"
        width="64"
        height="64"
        rx="16"
        fill="#0f172a"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.55 }}
      />
      <motion.path
        d="M168 184h28"
        stroke="white"
        strokeOpacity="0.9"
        strokeWidth="6"
        strokeLinecap="round"
        initial={{ x: -6, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.35 }}
      />
    </motion.svg>
  );
}
