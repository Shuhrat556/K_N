import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "../i18n/translations";

export type ReadinessOutcome = "allow" | "allow_warning" | "retry_later" | null;
export type ThemeMode = "light" | "dark";

type AppState = {
  lang: Lang;
  setLang: (lang: Lang) => void;

  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;

  userId: string | null;
  sessionId: string | null;
  setSession: (userId: string, sessionId: string) => void;
  clearSession: () => void;

  readinessOutcome: ReadinessOutcome;
  setReadinessOutcome: (o: ReadinessOutcome) => void;

  lastResultUserId: string | null;
  setLastResultUserId: (id: string | null) => void;

  /** Simple 1-based counter for each new assessment (shown instead of raw session ids). */
  testAttemptNo: number;
  bumpTestAttempt: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      lang: "tg",
      setLang: (lang) => set({ lang }),

      theme: "light",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),

      userId: null,
      sessionId: null,
      setSession: (userId, sessionId) => set({ userId, sessionId }),
      clearSession: () => set({ userId: null, sessionId: null, readinessOutcome: null }),

      readinessOutcome: null,
      setReadinessOutcome: (readinessOutcome) => set({ readinessOutcome }),

      lastResultUserId: null,
      setLastResultUserId: (lastResultUserId) => set({ lastResultUserId }),

      testAttemptNo: 0,
      bumpTestAttempt: () => set((s) => ({ testAttemptNo: s.testAttemptNo + 1 })),
    }),
    {
      name: "kasbnoma-app",
      partialize: (s) => ({
        lang: s.lang,
        theme: s.theme,
        userId: s.userId,
        sessionId: s.sessionId,
        lastResultUserId: s.lastResultUserId,
        testAttemptNo: s.testAttemptNo,
      }),
    },
  ),
);
