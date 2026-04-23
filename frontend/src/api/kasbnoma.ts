import { api } from "./client";
import type {
  AcademicFaculty,
  AcademicImportResult,
  AcademicSpecialty,
  AcademicUniversity,
  AdminCluster,
  AdminGroup,
  AdminQuestion,
  AdminQuestionUpdate,
  AdminStats,
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

export async function updateAdminCluster(
  id: number,
  payload: { code?: string; name?: string; sort_order?: number },
): Promise<AdminCluster> {
  const { data } = await api.patch<AdminCluster>(`/admin/clusters/${id}`, payload);
  return data;
}

export async function deleteAdminCluster(id: number): Promise<void> {
  await api.delete(`/admin/clusters/${id}`);
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

export async function updateAdminGroup(
  id: number,
  payload: { cluster_id?: number; code?: string; name?: string; sort_order?: number },
): Promise<AdminGroup> {
  const { data } = await api.patch<AdminGroup>(`/admin/groups/${id}`, payload);
  return data;
}

export async function deleteAdminGroup(id: number): Promise<void> {
  await api.delete(`/admin/groups/${id}`);
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>("/admin/stats");
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

export async function deleteAdminQuestion(id: number): Promise<void> {
  await api.delete(`/admin/questions/${id}`);
}

export async function fetchAcademicUniversities(): Promise<AcademicUniversity[]> {
  const { data } = await api.get<AcademicUniversity[]>("/admin/academic/universities");
  return data;
}

export async function createAcademicUniversity(payload: {
  name: string;
  city?: string | null;
  district?: string | null;
}): Promise<AcademicUniversity> {
  const { data } = await api.post<AcademicUniversity>("/admin/academic/universities", payload);
  return data;
}

export async function updateAcademicUniversity(
  id: number,
  payload: { name?: string; city?: string | null; district?: string | null },
): Promise<AcademicUniversity> {
  const { data } = await api.patch<AcademicUniversity>(`/admin/academic/universities/${id}`, payload);
  return data;
}

export async function deleteAcademicUniversity(id: number): Promise<void> {
  await api.delete(`/admin/academic/universities/${id}`);
}

export async function fetchAcademicFaculties(universityId?: number): Promise<AcademicFaculty[]> {
  const { data } = await api.get<AcademicFaculty[]>("/admin/academic/faculties", {
    params: universityId ? { university_id: universityId } : undefined,
  });
  return data;
}

export async function createAcademicFaculty(payload: { university_id: number; name: string }): Promise<AcademicFaculty> {
  const { data } = await api.post<AcademicFaculty>("/admin/academic/faculties", payload);
  return data;
}

export async function updateAcademicFaculty(
  id: number,
  payload: { university_id?: number; name?: string },
): Promise<AcademicFaculty> {
  const { data } = await api.patch<AcademicFaculty>(`/admin/academic/faculties/${id}`, payload);
  return data;
}

export async function deleteAcademicFaculty(id: number): Promise<void> {
  await api.delete(`/admin/academic/faculties/${id}`);
}

export async function fetchAcademicSpecialties(params?: {
  university_id?: number;
  faculty_id?: number;
  specialty_id?: number;
  samt?: string;
  university?: string;
  makon?: string;
  code_name?: string;
  study_mode?: string;
  tuition?: string;
  language?: string;
  admission_quota?: string;
  q?: string;
}): Promise<AcademicSpecialty[]> {
  const { data } = await api.get<AcademicSpecialty[]>("/academic/specialties", { params });
  return data;
}

export async function fetchAdminAcademicSpecialties(params?: {
  university_id?: number;
  faculty_id?: number;
  specialty_id?: number;
  samt?: string;
  university?: string;
  makon?: string;
  code_name?: string;
  study_mode?: string;
  tuition?: string;
  language?: string;
  admission_quota?: string;
  q?: string;
}): Promise<AcademicSpecialty[]> {
  const { data } = await api.get<AcademicSpecialty[]>("/admin/academic/specialties", { params });
  return data;
}

export async function createAcademicSpecialty(payload: {
  faculty_id: number;
  code?: string | null;
  name: string;
  study_mode?: string | null;
  language?: string | null;
  tuition?: string | null;
  admission_quota?: string | null;
  source_sheet?: string | null;
}): Promise<void> {
  await api.post("/admin/academic/specialties", payload);
}

export async function updateAcademicSpecialty(
  id: number,
  payload: {
    faculty_id?: number;
    code?: string | null;
    name?: string;
    study_mode?: string | null;
    language?: string | null;
    tuition?: string | null;
    admission_quota?: string | null;
    source_sheet?: string | null;
  },
): Promise<void> {
  await api.patch(`/admin/academic/specialties/${id}`, payload);
}

export async function deleteAcademicSpecialty(id: number): Promise<void> {
  await api.delete(`/admin/academic/specialties/${id}`);
}

export async function importAcademicExcel(file: File, clearExisting: boolean): Promise<AcademicImportResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("clear_existing", String(clearExisting));
  const { data } = await api.post<AcademicImportResult>("/admin/academic/import", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
