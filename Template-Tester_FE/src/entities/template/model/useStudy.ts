import { useState, useEffect, useMemo } from "react";
import { getUserTemplatesByCategory } from "../api/template.api";
import type { Template } from "./template.type";

type StudyMode = "hidden" | "visible" | "hint";

export function useStudy(templateId: string | undefined) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [studyMode, setStudyMode] = useState<StudyMode>("hidden");
  const [visibleLineCount, setVisibleLineCount] = useState(0);

  // 같은 카테고리의 다른 템플릿 목록 (네비게이션용)
  const [siblingTemplates, setSiblingTemplates] = useState<Template[]>([]);

  const codeLines = useMemo(() => {
    if (!template?.answer) return [];
    return template.answer.split("\n");
  }, [template?.answer]);

  const totalLines = codeLines.length;

  // 현재 모드에 따라 보여줄 코드 계산
  const displayCode = useMemo(() => {
    if (studyMode === "visible") return template?.answer ?? "";
    if (studyMode === "hidden") return "";
    // hint 모드: visibleLineCount만큼만 보여줌
    return codeLines.slice(0, visibleLineCount).join("\n");
  }, [studyMode, template?.answer, codeLines, visibleLineCount]);

  useEffect(() => {
    if (!templateId) return;
    loadTemplate(templateId);
  }, [templateId]);

  async function loadTemplate(id: string) {
    try {
      setIsLoading(true);
      // 모든 카테고리에서 찾기 위해 algorithm 카테고리부터 조회
      const categories = ["algorithm"] as const;
      for (const category of categories) {
        const templates = await getUserTemplatesByCategory(category);
        setSiblingTemplates(templates);
        const found = templates.find((t) => t.id === id);
        if (found) {
          setTemplate(found);
          resetStudyState();
          return;
        }
      }
      setTemplate(null);
    } catch (error) {
      console.error("템플릿 로드 실패:", error);
      setTemplate(null);
    } finally {
      setIsLoading(false);
    }
  }

  function resetStudyState() {
    setStudyMode("hidden");
    setVisibleLineCount(0);
  }

  function showAllCode() {
    setStudyMode("visible");
  }

  function hideAllCode() {
    setStudyMode("hidden");
    setVisibleLineCount(0);
  }

  function startHintMode() {
    setStudyMode("hint");
    setVisibleLineCount(0);
  }

  function showNextLine() {
    if (visibleLineCount < totalLines) {
      setVisibleLineCount((prev) => prev + 1);
    }
  }

  function showPrevLine() {
    if (visibleLineCount > 0) {
      setVisibleLineCount((prev) => prev - 1);
    }
  }

  // 현재 템플릿의 sibling 내 인덱스
  const currentIndex = siblingTemplates.findIndex((t) => t.id === templateId);
  const prevTemplate = currentIndex > 0 ? siblingTemplates[currentIndex - 1] : null;
  const nextTemplate =
    currentIndex >= 0 && currentIndex < siblingTemplates.length - 1
      ? siblingTemplates[currentIndex + 1]
      : null;

  return {
    template,
    isLoading,
    studyMode,
    displayCode,
    totalLines,
    visibleLineCount,
    showAllCode,
    hideAllCode,
    startHintMode,
    showNextLine,
    showPrevLine,
    prevTemplate,
    nextTemplate,
  };
}
