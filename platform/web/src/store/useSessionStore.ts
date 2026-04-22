import { create } from "zustand";
import { persist } from "zustand/middleware";

type Phase = "warmup" | "main" | "adaptive" | "done";

type State = {
  sessionId: string | null;
  userId: string | null;
  phase: Phase;
  warmupOutcome: "ALLOW" | "WARNING" | "RETRY_LATER" | null;
  topClusterId: number | null;
  userClusterScore: number | null;
  setSession: (sessionId: string, userId: string) => void;
  setWarmupOutcome: (o: "ALLOW" | "WARNING" | "RETRY_LATER" | null) => void;
  setPhase: (p: Phase) => void;
  setResultMeta: (topClusterId: number | null, userClusterScore: number | null) => void;
  reset: () => void;
};

const initial = {
  sessionId: null as string | null,
  userId: null as string | null,
  phase: "warmup" as Phase,
  warmupOutcome: null as "ALLOW" | "WARNING" | "RETRY_LATER" | null,
  topClusterId: null as number | null,
  userClusterScore: null as number | null,
};

export const useSessionStore = create<State>()(
  persist(
    (set) => ({
      ...initial,
      setSession: (sessionId, userId) => set({ sessionId, userId }),
      setWarmupOutcome: (warmupOutcome) => set({ warmupOutcome }),
      setPhase: (phase) => set({ phase }),
      setResultMeta: (topClusterId, userClusterScore) => set({ topClusterId, userClusterScore }),
      reset: () => set({ ...initial }),
    }),
    { name: "career-platform-session" },
  ),
);
