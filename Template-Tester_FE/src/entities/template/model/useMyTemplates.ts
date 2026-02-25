import { useState } from "react";
import {
  getUserTemplatesByCategory,
  deleteUserTemplate,
} from "../api/template.api";
import type { Category, Template } from "./template.type";

export function useMyTemplates() {
  const [currentCategory] = useState<Category>("algorithm");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await getUserTemplatesByCategory(currentCategory);
      setTemplates(data);
    } catch (error) {
      console.error("템플릿 로드 실패:", error);
      alert("템플릿을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (templateId: string, title: string) => {
    if (!confirm(`"${title}" 템플릿을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteUserTemplate(templateId);
      alert("템플릿이 삭제되었습니다.");
      loadTemplates();
    } catch (error) {
      console.error("템플릿 삭제 실패:", error);
      alert("템플릿 삭제에 실패했습니다.");
    }
  };

  return {
    templates,
    isLoading,
    loadTemplates,
    handleDelete,
  };
}
