import { api } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/api.type";
import type { Submission, GradingResult } from "../model/submission.type";

export async function saveSubmission(
  templateId: string,
  templateTitle: string,
  category: string,
  userCode: string,
  gradingResult: GradingResult,
): Promise<string> {
  try {
    const { data } = await api.post<ApiResponse<{ id: string }>>("/submissions", {
      templateId,
      templateTitle,
      category,
      userCode,
      score: gradingResult.accuracy,
      totalLines: gradingResult.totalLines,
      correctLines: gradingResult.correctLines,
    });
    return data.data.id;
  } catch (error) {
    console.error("제출 기록 저장 실패:", error);
    throw error;
  }
}

export async function getRecentSubmissions(
  limitCount: number = 10,
): Promise<Submission[]> {
  try {
    const { data } = await api.get<ApiResponse<Submission[]>>("/submissions", {
      params: { limit: limitCount },
    });
    return data.data;
  } catch (error) {
    console.error("제출 기록 조회 실패:", error);
    throw error;
  }
}

export async function getSubmissionsByCategory(
  category: string,
): Promise<Submission[]> {
  try {
    const { data } = await api.get<ApiResponse<Submission[]>>("/submissions", {
      params: { category },
    });
    return data.data;
  } catch (error) {
    console.error("카테고리별 제출 기록 조회 실패:", error);
    throw error;
  }
}

export async function getStatistics() {
  try {
    const { data } = await api.get<
      ApiResponse<{
        totalSubmissions: number;
        averageScore: number;
        bestScore: number;
        worstScore: number;
      }>
    >("/submissions/statistics");
    return data.data;
  } catch (error) {
    console.error("통계 조회 실패:", error);
    throw error;
  }
}
