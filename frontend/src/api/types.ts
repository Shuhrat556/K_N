export type ReadinessKind = "negative" | "positive" | "emotional";
export type QuestionPhase = "readiness" | "main";

export type ReadinessQuestion = {
  id: number;
  text: string;
  text_tj?: string | null;
  kind: ReadinessKind;
};

export type MainQuestion = {
  id: number;
  text: string;
  text_tj?: string | null;
};

export type StartTestResponse = {
  user_id: string;
  session_id: string;
  status: string;
};

export type SubmitReadinessResponse = {
  readiness_score: number;
  outcome: "allow" | "allow_warning" | "retry_later" | string;
  allowed: boolean;
  warning?: boolean | null;
  /** Server text (RU) for outcome details when provided */
  message?: string | null;
};

export type SubmitTestResponse = {
  status: string;
  needs_adaptive: boolean;
  question_ids?: number[] | null;
  reason?: string | null;
  preliminary?: {
    cluster_scores: Record<string, number>;
    group_scores: Record<string, number>;
    top_cluster_id: number | null;
    top_group_ids: number[];
  } | null;
  result?: {
    cluster_scores: Record<string, number>;
    group_scores: Record<string, number>;
    top_cluster_id: number | null;
    top_group_ids: number[];
  } | null;
};

export type ResultApiResponse = {
  user_id: string;
  session_id: string;
  completed_at: string | null;
  readiness_score: number | null;
  readiness_outcome: string | null;
  readiness_warning: boolean | null;
  adaptive_completed: boolean;
  breakdown: {
    cluster_scores: Record<string, number>;
    group_scores: Record<string, number>;
    top_cluster_id: number | null;
    top_group_ids: number[];
  };
  top_cluster_name?: string | null;
  specializations?: { id: number; name: string }[];
};

export type AdminCluster = {
  id: number;
  code: string;
  name: string;
  sort_order: number;
};

export type AdminGroup = {
  id: number;
  cluster_id: number;
  code: string;
  name: string;
  sort_order: number;
};

export type AdminQuestion = {
  id: number;
  phase: QuestionPhase;
  text: string;
  text_tj?: string | null;
  readiness_kind?: ReadinessKind | null;
  cluster_id?: number | null;
  group_id?: number | null;
  sort_order: number;
};
