import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Chip from "../components/ui/Chip";
import SelectBox from "../components/ui/SelectBox";
import ToggleButtonGroup from "../components/ui/ToggleButtonGroup";
import CodeEditor from "../components/CodeEditor";
import {
  getWrongNotes,
  deleteWrongNote,
  updateWrongNote,
  type WrongNote,
} from "../firebase/services";
import {
  categoryOptions,
  languageOptions,
  platformOptions,
  programmersGrades,
  resultOptions,
  tagOptions,
} from "../constants/options.constants";
import type { FormData } from "../types/wrong-notes.types";
import {
  baekjoonGrades,
  getCategoryLabel,
  getGradeLabel,
  getLanguageLabel,
  getPlatformLabel,
  getResultLabel,
  getTagLabels,
} from "../utils/options.utils";

export default function WrongNoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<WrongNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    link: "",
    language: "",
    date: "",
    platform: "",
    grade: "",
    myCode: "",
    category: "",
    solution: "",
    comment: "",
    share: false,
    tags: [],
    result: "",
  });

  useEffect(() => {
    const loadNote = async () => {
      try {
        const notes = await getWrongNotes();
        const found = notes.find((n) => n.id === id);
        setNote(found || null);
        if (found) {
          setFormData({
            link: found.link,
            language: found.language || "",
            date: found.date,
            platform: found.platform,
            grade: found.grade,
            category: found.category,
            myCode: found.myCode,
            solution: found.solution,
            comment: found.comment,
            share: found.share,
            tags: found.tags,
            result: found.result,
          });
        }
      } catch (error) {
        console.error("조회 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNote();
  }, [id]);

  const handleDelete = async () => {
    if (!note?.id || !confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteWrongNote(note.id);
      navigate("/wrong-notes");
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean | string[],
  ) => {
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

  const handleSave = async () => {
    if (!note?.id || isSaving) return;

    try {
      setIsSaving(true);
      await updateWrongNote(note.id, formData);
      setNote({ ...note, ...formData });
      setIsEditMode(false);
      alert("수정되었습니다.");
    } catch (error) {
      console.error("수정 실패:", error);
      alert("수정에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (note) {
      setFormData({
        link: note.link,
        language: note.language || "",
        date: note.date,
        platform: note.platform,
        category: note.category,
        grade: note.grade,
        myCode: note.myCode,
        solution: note.solution,
        comment: note.comment,
        share: note.share,
        tags: note.tags,
        result: note.result,
      });
    }
    setIsEditMode(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="text-center py-12 text-textSecondary">
            불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="text-center py-12">
            <p className="text-textSecondary mb-4">
              오답노트를 찾을 수 없습니다.
            </p>
            <Button variant="primary" onClick={() => navigate("/wrong-notes")}>
              목록으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 수정 모드
  if (isEditMode) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <PageHeader title="오답노트 수정" />

          <div className="mt-6 space-y-6">
            {/* 문제 링크 & 언어 */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  문제 링크
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => handleInputChange("link", e.target.value)}
                  placeholder="https://programmers.co.kr/..."
                  className="w-full px-4 py-2 text-sm outline outline-1 outline-border rounded-md bg-surface text-text
                    hover:outline-primary focus:outline-primary focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  언어
                </label>
                <SelectBox
                  options={languageOptions}
                  value={formData.language}
                  onChange={(e) =>
                    handleInputChange("language", e.target.value)
                  }
                  placeholder="언어 선택"
                  fullWidth
                />
              </div>
            </div>

            {/* 날짜 & 플랫폼 & 등급 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  날짜
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className="w-full px-4 py-2 text-sm outline outline-1 outline-border rounded-md bg-surface text-text
                    hover:outline-primary focus:outline-primary focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  알고리즘
                </label>
                <SelectBox
                  options={categoryOptions}
                  value={formData.category}
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                  placeholder="알고리즘 선택"
                  fullWidth
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  플랫폼
                </label>
                <SelectBox
                  options={platformOptions}
                  value={formData.platform}
                  onChange={(e) => handlePlatformChange(e.target.value)}
                  placeholder="플랫폼 선택"
                  fullWidth
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  등급
                </label>
                <SelectBox
                  options={getGradeOptions()}
                  value={formData.grade}
                  onChange={(e) => handleInputChange("grade", e.target.value)}
                  placeholder={
                    formData.platform ? "등급 선택" : "플랫폼을 먼저 선택"
                  }
                  disabled={!formData.platform}
                  fullWidth
                />
              </div>
            </div>

            {/* 제출 결과 & 작성 이유 */}
            <div className="flex w-full justify-between items-start">
              <div className="w-[50%]">
                <label className="block text-sm font-medium text-text mb-2">
                  제출 결과
                </label>
                <ToggleButtonGroup
                  options={resultOptions}
                  value={formData.result}
                  onChange={(value) => handleInputChange("result", value)}
                />
              </div>
              <div className="w-[50%]">
                <label className="block text-sm font-medium text-text mb-2">
                  작성 이유 (복수 선택 가능)
                </label>
                <ToggleButtonGroup
                  options={tagOptions}
                  value={formData.tags}
                  onChange={(value) => handleInputChange("tags", value)}
                  multiple
                />
              </div>
            </div>

            {/* 내 풀이 */}
            <div className="flex w-full flex-row gap-2">
              <div className="flex flex-col w-full">
                <label className="block text-sm font-medium text-text mb-2">
                  내 풀이
                </label>
                <CodeEditor
                  value={formData.myCode}
                  language={formData.language}
                  onChange={(value) => handleInputChange("myCode", value)}
                />
              </div>

              {/* 참조한 풀이 */}
              <div className="flex flex-col w-full">
                <label className="block text-sm font-medium text-text mb-2">
                  참조한 풀이
                </label>
                <CodeEditor
                  value={formData.solution}
                  language={formData.language}
                  onChange={(value) => handleInputChange("solution", value)}
                />
              </div>
            </div>

            {/* 코멘트 */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                코멘트
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => handleInputChange("comment", e.target.value)}
                placeholder="이 문제에서 배운 점, 주의할 점 등을 기록하세요..."
                rows={4}
                className="w-full px-4 py-3 text-sm outline outline-1 outline-border rounded-md bg-surface text-text
                  hover:outline-primary focus:outline-primary focus:ring-2 focus:ring-blue-200 transition-all resize-none"
              />
            </div>

            {/* 공유하기 */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="share"
                checked={formData.share}
                onChange={(e) => handleInputChange("share", e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <label
                htmlFor="share"
                className="text-sm text-text cursor-pointer"
              >
                다른 사용자에게 공유하기
              </label>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={handleCancel}>
                취소
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 보기 모드
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <PageHeader title="오답노트" />

        {/* 상세 내용 */}
        <div className="mt-6 p-6 bg-surface border border-border rounded-lg space-y-6">
          {/* 헤더 */}
          <div className="flex justify-between items-start">
            <div className="flex flex-wrap items-center gap-2">
              <Chip variant="success">{getCategoryLabel(note.category)}</Chip>
              <Chip variant="primary">{getPlatformLabel(note.platform)}</Chip>
              {note.grade && (
                <Chip variant="secondary">
                  {getGradeLabel(note.platform, note.grade)}
                </Chip>
              )}
              <Chip
                variant={
                  note.result === "correct"
                    ? "success"
                    : note.result === "timeout"
                      ? "warning"
                      : "error"
                }
              >
                {getResultLabel(note.result)}
              </Chip>
              <span className="text-xs text-textSecondary ml-2">
                {note.date}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsEditMode(true)}
                className="p-2 text-textSecondary hover:text-primary transition-colors"
                title="수정"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-textSecondary hover:text-error transition-colors"
                title="삭제"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* 문제 링크 */}
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-textSecondary mb-1">
                문제 링크
              </h3>
              <a
                href={note.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all"
              >
                {note.link}
              </a>
            </div>
            {note.language && (
              <div>
                <h3 className="text-sm font-medium text-textSecondary mb-1">
                  언어
                </h3>
                <Chip variant="purple">{getLanguageLabel(note.language)}</Chip>
              </div>
            )}
          </div>

          {/* 작성 이유 */}
          {note.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-textSecondary mb-2">
                작성 이유
              </h3>
              <div className="flex flex-wrap gap-2">
                {getTagLabels(note.tags).map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-sm rounded-full bg-blue-50 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 코멘트 */}
          {note.comment && (
            <div>
              <h3 className="text-sm font-medium text-textSecondary mb-1">
                코멘트
              </h3>
              <p className="text-text whitespace-pre-wrap">{note.comment}</p>
            </div>
          )}
          <div className="flex w-full flex-row gap-2">
            {/* 내 풀이 */}
            {note.myCode && (
              <CodeEditor
                value={note.myCode}
                language={formData.language}
                onChange={() => {}}
                readOnly
                collapsible
                title="내 풀이"
              />
            )}

            {/* 참조한 풀이 */}
            {note.solution && (
              <CodeEditor
                value={note.solution}
                language={formData.language}
                onChange={() => {}}
                readOnly
                collapsible
                title="참조한 풀이"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
