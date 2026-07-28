import { useState, useEffect } from "react";
import type { Category, Template } from "@/entities/template/model/template.type";
import type { GradingResult } from "@/entities/submission/model/submission.type";
import { gradeAnswer } from "./grading";
import { saveSubmission } from "@/entities/submission/api/submission.api";
import { getUserTemplatesByCategory } from "@/entities/template/api/template.api";

export function useGrading() {
  const [currentCategory, setCurrentCategory] = useState<Category>("algorithm");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [userCode, setUserCode] = useState("");
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const userTemplates = await getUserTemplatesByCategory(currentCategory);
        setTemplates(userTemplates);
      } catch (error) {
        console.error("템플릿 로드 실패:", error);
      }
    };
    loadTemplates();
  }, [currentCategory]);

  const handleCategoryChange = (category: Category) => {
    setCurrentCategory(category);
    setSelectedTemplateId("");
    setUserCode("");
    setGradingResult(null);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setUserCode("");
    setGradingResult(null);
  };

  const handleGrade = async () => {
    if (!selectedTemplate) {
      alert("템플릿을 먼저 선택해주세요.");
      return;
    }

    const result = gradeAnswer(selectedTemplate.answer, userCode);
    setGradingResult(result);

    try {
      await saveSubmission(
        selectedTemplate.id,
        selectedTemplate.title,
        currentCategory,
        userCode,
        result,
      );
    } catch (error) {
      console.error("Firebase 저장 실패:", error);
    }

    setTimeout(() => {
      const resultElement = document.getElementById("grading-result");
      if (resultElement) {
        resultElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleReset = () => {
    setUserCode("");
    setGradingResult(null);
  };

  return {
    currentCategory,
    templates,
    selectedTemplateId,
    selectedTemplate,
    userCode,
    setUserCode,
    gradingResult,
    handleCategoryChange,
    handleTemplateChange,
    handleGrade,
    handleReset,
  };
}
