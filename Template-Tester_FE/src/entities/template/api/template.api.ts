import { api } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/api.type";
import type { Template, Category, TemplateType } from "../model/template.type";

export async function saveUserTemplate(
  category: Category,
  title: string,
  description: string,
  answer: string,
  type: TemplateType,
): Promise<string> {
  try {
    const { data } = await api.post<ApiResponse<{ id: string }>>("/templates", {
      category,
      title,
      description,
      answer,
      type,
    });
    return data.data.id;
  } catch (error) {
    console.error("템플릿 저장 실패:", error);
    throw error;
  }
}

export async function getUserTemplates(): Promise<Template[]> {
  try {
    const { data } = await api.get<ApiResponse<Template[]>>("/templates");
    return data.data;
  } catch (error) {
    console.error("사용자 템플릿 조회 실패:", error);
    throw error;
  }
}

export async function getUserTemplatesByCategory(
  category: Category,
): Promise<Template[]> {
  try {
    const { data } = await api.get<ApiResponse<Template[]>>("/templates", {
      params: { category },
    });
    return data.data;
  } catch (error) {
    console.error("카테고리별 사용자 템플릿 조회 실패:", error);
    throw error;
  }
}

export async function updateUserTemplate(
  templateId: string,
  category: Category,
  title: string,
  description: string,
  answer: string,
  type: TemplateType,
): Promise<void> {
  try {
    await api.put(`/templates/${templateId}`, {
      category,
      title,
      description,
      answer,
      type,
    });
  } catch (error) {
    console.error("템플릿 수정 실패:", error);
    throw error;
  }
}

export async function deleteUserTemplate(templateId: string): Promise<void> {
  try {
    await api.delete(`/templates/${templateId}`);
  } catch (error) {
    console.error("템플릿 삭제 실패:", error);
    throw error;
  }
}
