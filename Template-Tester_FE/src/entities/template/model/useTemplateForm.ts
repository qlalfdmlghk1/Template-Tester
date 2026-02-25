import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveUserTemplate,
  updateUserTemplate,
  getUserTemplates,
} from "../api/template.api";
import type { Category, TemplateType } from "./template.type";

export function useTemplateForm(templateId?: string | null) {
  const navigate = useNavigate();
  const isEditMode = !!templateId;

  const [currentCategory, setCurrentCategory] = useState<Category>("algorithm");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [templateType, setTemplateType] = useState<TemplateType>("paragraph");
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && templateId) {
      loadTemplateData(templateId);
    }
  }, [isEditMode, templateId]);

  const loadTemplateData = async (id: string) => {
    try {
      setIsLoading(true);
      const templates = await getUserTemplates();
      const template = templates.find((t) => t.id === id);

      if (!template) {
        alert("템플릿을 찾을 수 없습니다.");
        navigate("/");
        return;
      }

      setCurrentCategory(template.category);
      setTitle(template.title);
      setDescription(template.description || "");
      setAnswer(template.answer);
      setTemplateType(template.type || "paragraph");
    } catch (error) {
      console.error("템플릿 로드 실패:", error);
      alert("템플릿을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("템플릿 제목을 입력해주세요.");
      return;
    }

    if (!answer.trim()) {
      alert("정답 내용을 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (isEditMode && templateId) {
        await updateUserTemplate(
          templateId,
          currentCategory,
          title,
          description,
          answer,
          templateType,
        );
        alert("템플릿이 성공적으로 수정되었습니다!");
      } else {
        await saveUserTemplate(
          currentCategory,
          title,
          description,
          answer,
          templateType,
        );
        alert("템플릿이 성공적으로 등록되었습니다!");
      }

      navigate("/my-templates");
    } catch (error: unknown) {
      console.error("템플릿 저장 실패:", error);
      const message = error instanceof Error ? error.message : "템플릿 저장에 실패했습니다.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle("");
    setDescription("");
    setAnswer("");
    setTemplateType("paragraph");
  };

  return {
    currentCategory,
    setCurrentCategory,
    title,
    setTitle,
    description,
    setDescription,
    templateType,
    setTemplateType,
    answer,
    setAnswer,
    isSubmitting,
    isLoading,
    isEditMode,
    handleSubmit,
    handleReset,
  };
}
