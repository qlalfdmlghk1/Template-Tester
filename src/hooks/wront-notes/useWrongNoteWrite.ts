import { programmersGrades } from "@/constants/options.constants";
import { saveWrongNote } from "@/firebase/services";
import type { FormData } from "@/types/wrong-notes.types";
import { baekjoonGrades } from "@/utils/options.utils";
import { useState } from "react";

export function useWrongNoteWrite(cb: () => void) {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    link: "",
    language: "",
    date: new Date().toISOString().split("T")[0],
    platform: "",
    category: "",
    grade: "",
    myCode: "",
    solution: "",
    comment: "",
    share: false,
    tags: [],
    result: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      title: "",
      link: "",
      language: "",
      date: new Date().toISOString().split("T")[0],
      platform: "",
      grade: "",
      category: "",
      myCode: "",
      solution: "",
      comment: "",
      share: false,
      tags: [],
      result: "",
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await saveWrongNote(formData);
      alert("오답노트가 저장되었습니다.");
      resetForm();
      cb();
    } catch (error) {
      console.error("저장 실패:", error);
      alert(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGradeOptions = () => {
    if (formData.platform === "programmers") return programmersGrades;
    if (formData.platform === "baekjoon") return baekjoonGrades;
    return [];
  };

  const handlePlatformChange = (value: string) => {
    setFormData((prev) => ({ ...prev, platform: value, grade: "" }));
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    formData,
    resetForm,
    handleSubmit,
    handleInputChange,
    handlePlatformChange,
    getGradeOptions,
    isSubmitting,
  };
}
