import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "../i18n/translations";

export type ReadinessOutcome = "allow" | "allow_warning" | "retry_later" | null;

type AppState = {
  lang: Lang;
  setLang: (lang: Lang) => void;

  userId: string | null;
  sessionId: string | null;
  setSession: (userId: string, sessionId: string) => void;
  clearSession: () => void;

  readinessOutcome: ReadinessOutcome;
  setReadinessOutcome: (o: ReadinessOutcome) => void;

  lastResultUserId: string | null;
  setLastResultUserId: (id: string | null) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      lang: "ru",
      setLang: (lang) => set({ lang }),

      userId: null,
      sessionId: null,
      setSession: (userId, sessionId) => set({ userId, sessionId }),
      clearSession: () => set({ userId: null, sessionId: null, readinessOutcome: null }),

      readinessOutcome: null,
      setReadinessOutcome: (readinessOutcome) => set({ readinessOutcome }),

      lastResultUserId: null,
      setLastResultUserId: (lastResultUserId) => set({ lastResultUserId }),
    }),
    {
      name: "kasbnoma-app",
      partialize: (s) => ({
        lang: s.lang,
        userId: s.userId,
        sessionId: s.sessionId,
        lastResultUserId: s.lastResultUserId,
      }),
    },
  ),
);
