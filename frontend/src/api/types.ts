export type ReadinessKind = "negative" | "positive" | "emotional";
export type QuestionPhase = "readiness" | "main";

export type ReadinessQuestion = {
  id: number;
  text: string;
  text_tj?: string | null;
  kind: ReadinessKind;
  option_labels?: string[] | null;
  option_labels_tj?: string[] | null;
};

export type MainQuestion = {
  id: number;
  text: string;
  text_tj?: string | null;
  option_labels?: string[] | null;
  option_labels_tj?: string[] | null;
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
  option_labels?: string[] | null;
  option_labels_tj?: string[] | null;
};

export type AdminQuestionUpdate = {
  text?: string;
  text_tj?: string | null;
  readiness_kind?: ReadinessKind | null;
  cluster_id?: number | null;
  group_id?: number | null;
  sort_order?: number;
  option_labels?: string[] | null;
  option_labels_tj?: string[] | null;
};

export type AdminStats = {
  total_users: number;
  total_results: number;
  results_by_status: Record<string, number>;
  completed_results: number;
  results_updated_last_24h: number;
  active_users_last_24h: number;
  users_created_last_7_days: number;
  total_questions: number;
  total_answers: number;
};

export type AcademicUniversity = {
  id: number;
  name: string;
  city?: string | null;
  district?: string | null;
};

export type AcademicFaculty = {
  id: number;
  university_id: number;
  name: string;
};

export type AcademicSpecialty = {
  id: number;
  faculty_id: number;
  code?: string | null;
  name: string;
  study_mode?: string | null;
  language?: string | null;
  tuition?: string | null;
  admission_quota?: string | null;
  source_sheet?: string | null;
  faculty_name: string;
  university_id: number;
  university_name: string;
  city?: string | null;
  district?: string | null;
};

export type AcademicImportResult = {
  sheets_read: number;
  rows_seen: number;
  rows_imported: number;
  universities_created: number;
  faculties_created: number;
  specialties_created: number;
  specialties_updated: number;
  skipped_rows: number;
};

// New Express backend Specialty types
export type Specialty = {
  id: number;
  code: string;
  name: string;
  university: string;
  location: string | null;
  studyForm: string | null;
  studyType: string | null;
  price: number;
  language: string | null;
  quota: number | null;
  degree: string | null;
  createdAt: string;
};

export type SpecialtyFilters = {
  locations: string[];
  languages: string[];
  studyTypes: string[];
  universities: string[];
};

export type SpecialtyListResponse = {
  data: Specialty[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalCount: number;
    avgPrice: number;
    maxPrice: number;
    minPrice: number;
  };
};

export type SpecialtyUploadResponse = {
  ok: boolean;
  filename: string;
  parsed: number;
  inserted: number;
  skipped: number;
};
