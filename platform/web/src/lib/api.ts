const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function formatNestMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const b = body as Record<string, unknown>;

  const msg = b.message;
  if (typeof msg === "string") return msg;
  if (Array.isArray(msg)) return msg.map(String).join(", ");

  if (typeof b.error === "string") return b.error;

  const errors = b.errors;
  if (Array.isArray(errors)) {
    const lines = errors.map(String).slice(0, 6);
    const extra = errors.length > 6 ? ` (+${errors.length - 6} more)` : "";
    return `${lines.join("; ")}${extra}`;
  }

  return undefined;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let body: unknown = undefined;
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    const detail = formatNestMessage(body) ?? `Request failed (${res.status})`;
    throw new ApiError(detail, res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type SessionStart = { userId: string; sessionId: string };

export type WarmupQuestion = { id: number; text: string; sortOrder: number };

export type MainQuestion = { id: number; text: string; clusterId: number | null };

export type WarmupSubmitResult = {
  warmupScore: number;
  outcome: "ALLOW" | "WARNING" | "RETRY_LATER";
  canContinue: boolean;
  needsWarningAck: boolean;
};

export type MainCompleteResult =
  | { status: "completed"; needsAdaptive: false }
  | { status: "adaptive_required"; needsAdaptive: true; questionIds: number[] };

export type ResultPayload = {
  sessionId: string;
  topCluster: { id: number; name: string } | null;
  scoreJson: {
    clusters: Record<string, number>;
    ranking: { clusterId: number; score: number }[];
    percentages?: Record<string, number>;
    topTwo?: { clusterId: number; score: number }[];
  };
};

export type FacultyRow = {
  id: number;
  university: string;
  name: string;
  clusterId: number;
  city: string;
  language: string;
  type: "FREE" | "PAID";
  mode: "ONLINE" | "OFFLINE";
  scoreRequirement: number;
  cluster: { id: number; name: string };
};

export const api = {
  startSession: () => apiFetch<SessionStart>("/sessions", { method: "POST" }),

  warmupQuestions: (sessionId: string) =>
    apiFetch<WarmupQuestion[]>(`/sessions/${sessionId}/warmup/questions`),

  submitWarmup: (sessionId: string, answers: { questionId: number; choiceIndex: number }[]) =>
    apiFetch<WarmupSubmitResult>(`/sessions/${sessionId}/warmup/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),

  warmupContinue: (sessionId: string) =>
    apiFetch<{ ok: boolean }>(`/sessions/${sessionId}/warmup/continue`, { method: "POST" }),

  mainQuestions: (sessionId: string) =>
    apiFetch<MainQuestion[]>(`/sessions/${sessionId}/main/questions`),

  mainAnswer: (sessionId: string, questionId: number, value: number) =>
    apiFetch(`/sessions/${sessionId}/main/answer`, {
      method: "POST",
      body: JSON.stringify({ questionId, value }),
    }),

  mainComplete: (sessionId: string) =>
    apiFetch<MainCompleteResult>(`/sessions/${sessionId}/main/complete`, { method: "POST" }),

  adaptiveQuestions: (sessionId: string) =>
    apiFetch<MainQuestion[]>(`/sessions/${sessionId}/adaptive/questions`),

  adaptiveAnswer: (sessionId: string, questionId: number, value: number) =>
    apiFetch(`/sessions/${sessionId}/adaptive/answer`, {
      method: "POST",
      body: JSON.stringify({ questionId, value }),
    }),

  adaptiveComplete: (sessionId: string) =>
    apiFetch<MainCompleteResult>(`/sessions/${sessionId}/adaptive/complete`, { method: "POST" }),

  result: (sessionId: string) => apiFetch<ResultPayload>(`/sessions/${sessionId}/result`),

  faculties: (params: URLSearchParams) =>
    apiFetch<FacultyRow[]>(`/faculties?${params.toString()}`),
};
