import { useState } from "react";
import {
  saveWrongNote,
  updateWrongNote,
} from "../api/wrong-note.api";
import type { FormData, SolutionItem } from "./wrong-note.type";
import { programmersGrades, baekjoonGrades } from "@/shared/lib/options";

const MAX_SOLUTIONS = 3;

const INITIAL_FORM_DATA: FormData = {
  title: "",
  link: "",
  language: "",
  date: "",
  platform: "",
  category: "",
  grade: "",
  myCode: "",
  myCodeLabel: "",
  solutions: [{ label: "", code: "" }],
  comment: "",
  share: false,
  tags: [],
  result: "",
};

interface UseWrongNoteFormOptions {
  initialData?: FormData;
  noteId?: string;
  onSuccess?: () => void;
}

export function useWrongNoteForm(options?: UseWrongNoteFormOptions) {
  const [formData, setFormData] = useState<FormData>(
    options?.initialData ?? { ...INITIAL_FORM_DATA, solutions: [{ label: "", code: "" }] },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlatformChange = (value: string) => {
    setFormData((prev) => ({ ...prev, platform: value, grade: "" }));
  };

  const getGradeOptions = () => {
    if (formData.platform === "programmers") return programmersGrades;
    if (formData.platform === "baekjoon") return baekjoonGrades;
    return [];
  };

  // === solutions 배열 관리 ===
  const canAddSolution = formData.solutions.length < MAX_SOLUTIONS;

  const addSolution = () => {
    if (!canAddSolution) return;
    setFormData((prev) => ({
      ...prev,
      solutions: [...prev.solutions, { label: "", code: "" }],
    }));
  };

  const removeSolution = (index: number) => {
    if (formData.solutions.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      solutions: prev.solutions.filter((_, i) => i !== index),
    }));
  };

  const updateSolution = (index: number, field: keyof SolutionItem, value: string) => {
    setFormData((prev) => ({
      ...prev,
      solutions: prev.solutions.map((s, i) =>
        i === index ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const resetForm = () => {
    setFormData(options?.initialData ?? { ...INITIAL_FORM_DATA, solutions: [{ label: "", code: "" }] });
  };

  const setInitialData = (data: FormData) => {
    setFormData(data);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (options?.noteId) {
        await updateWrongNote(options.noteId, formData);
      } else {
        await saveWrongNote(formData);
      }

      options?.onSuccess?.();
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    isSubmitting,
    handleInputChange,
    handlePlatformChange,
    getGradeOptions,
    handleSubmit,
    resetForm,
    setInitialData,
    canAddSolution,
    addSolution,
    removeSolution,
    updateSolution,
  };
}
