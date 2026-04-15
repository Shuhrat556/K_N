import { api } from "./client";
import type {
  AdminCluster,
  AdminGroup,
  AdminQuestion,
  AdminQuestionUpdate,
  MainQuestion,
  ReadinessQuestion,
  ReadinessKind,
  ResultApiResponse,
  StartTestResponse,
  SubmitReadinessResponse,
  SubmitTestResponse,
  QuestionPhase,
} from "./types";

export async function startTest(existingUserId?: string | null): Promise<StartTestResponse> {
  const { data } = await api.post<StartTestResponse>("/start-test", { user_id: existingUserId ?? null });
  return data;
}

export async function fetchReadinessQuestions(userId: string): Promise<ReadinessQuestion[]> {
  const { data } = await api.get<ReadinessQuestion[]>("/readiness-questions", { params: { user_id: userId } });
  return data;
}

export async function submitReadiness(
  userId: string,
  answers: { question_id: number; choice_index: number }[],
): Promise<SubmitReadinessResponse> {
  const { data } = await api.post<SubmitReadinessResponse>("/submit-readiness", { user_id: userId, answers });
  return data;
}

export async function fetchQuestions(userId: string): Promise<MainQuestion[]> {
  const { data } = await api.get<MainQuestion[]>("/questions", { params: { user_id: userId } });
  return data;
}

export async function submitAnswer(userId: string, questionId: number, value: number): Promise<unknown> {
  const { data } = await api.post("/submit-answer", { user_id: userId, question_id: questionId, value });
  return data;
}

export async function submitTest(userId: string): Promise<SubmitTestResponse> {
  const { data } = await api.post<SubmitTestResponse>("/submit-test", { user_id: userId });
  return data;
}

export async function fetchResult(userId: string): Promise<ResultApiResponse> {
  const { data } = await api.get<ResultApiResponse>(`/result/${userId}`);
  return data;
}

export async function fetchAdminClusters(): Promise<AdminCluster[]> {
  const { data } = await api.get<AdminCluster[]>("/admin/clusters");
  return data;
}

export async function createAdminCluster(payload: {
  code: string;
  name: string;
  sort_order: number;
}): Promise<AdminCluster> {
  const { data } = await api.post<AdminCluster>("/admin/clusters", payload);
  return data;
}

export async function fetchAdminGroups(clusterId?: number): Promise<AdminGroup[]> {
  const { data } = await api.get<AdminGroup[]>("/admin/groups", {
    params: clusterId ? { cluster_id: clusterId } : undefined,
  });
  return data;
}

export async function createAdminGroup(payload: {
  cluster_id: number;
  code: string;
  name: string;
  sort_order: number;
}): Promise<AdminGroup> {
  const { data } = await api.post<AdminGroup>("/admin/groups", payload);
  return data;
}

export async function fetchAdminQuestions(phase?: QuestionPhase): Promise<AdminQuestion[]> {
  const { data } = await api.get<AdminQuestion[]>("/admin/questions", {
    params: { limit: 500, ...(phase ? { phase } : {}) },
  });
  return data;
}

export async function createAdminQuestion(payload: {
  phase: QuestionPhase;
  text: string;
  text_tj?: string | null;
  readiness_kind?: ReadinessKind | null;
  cluster_id?: number | null;
  group_id?: number | null;
  sort_order: number;
  option_labels?: string[] | null;
  option_labels_tj?: string[] | null;
}): Promise<AdminQuestion> {
  const { data } = await api.post<AdminQuestion>("/admin/questions", payload);
  return data;
}

export async function updateAdminQuestion(id: number, payload: AdminQuestionUpdate): Promise<AdminQuestion> {
  const { data } = await api.patch<AdminQuestion>(`/admin/questions/${id}`, payload);
  return data;
}
