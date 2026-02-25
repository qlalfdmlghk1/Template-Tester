import { useParams } from "react-router-dom";
import Navbar from "@/widgets/Navbar/Navbar";
import PageHeader from "@/shared/ui/molecules/PageHeader/PageHeader";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import AppChip from "@/shared/ui/atoms/AppChip/AppChip";
import AppSelect from "@/shared/ui/atoms/AppSelect/AppSelect";
import ToggleButtonGroup from "@/shared/ui/atoms/ToggleButtonGroup/ToggleButtonGroup";
import CodeEditor from "@/shared/ui/molecules/CodeEditor/CodeEditor";
import { useWrongNoteDetail } from "@/entities/wrong-note/model/useWrongNoteDetail";
import { useWrongNoteForm } from "@/entities/wrong-note/model/useWrongNoteForm";
import {
  categoryOptions,
  languageOptions,
  platformOptions,
  resultOptions,
  tagOptions,
  getCategoryLabel,
  getGradeLabel,
  getLanguageLabel,
  getPlatformLabel,
  getResultLabel,
  getTagLabels,
} from "@/shared/lib/options";

export default function WrongNoteDetail() {
  const { id } = useParams<{ id: string }>();

  const {
    note,
    isOwner,
    isLoading,
    isEditMode,
    setIsEditMode,
    handleDelete,
    handleCancel,
    handleSaveSuccess,
    noteToFormData,
  } = useWrongNoteDetail(id);

  const {
    formData,
    isSubmitting,
    handleInputChange,
    handlePlatformChange,
    getGradeOptions,
    handleSubmit,
    setInitialData,
  } = useWrongNoteForm({
    initialData: note ? noteToFormData(note) : undefined,
    noteId: note?.id,
    onSuccess: handleSaveSuccess,
  });

  // note가 로드된 후 formData 동기화
  if (note && formData.title === "" && note.title !== "") {
    setInitialData(noteToFormData(note));
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="text-center py-12 text-textSecondary">불러오는 중...</div>
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
            <p className="text-textSecondary mb-4">오답노트를 찾을 수 없습니다.</p>
            <AppButton variant="solid" onClick={() => window.history.back()}>
              목록으로 돌아가기
            </AppButton>
          </div>
        </div>
      </div>
    );
  }

  if (isEditMode) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <PageHeader title="오답노트 수정" />

          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">문제 이름</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="예: 두 수의 합, 타겟 넘버 등"
                  className="w-full px-4 py-2 text-sm outline outline-1 outline-border rounded-md bg-surface text-text
                    hover:outline-primary focus:outline-primary focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">언어</label>
                <AppSelect
                  options={languageOptions}
                  value={formData.language}
                  onChange={(value) => handleInputChange("language", value as string)}
                  placeholder="언어 선택"
                  fullWidth
                  size="sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">문제 링크</label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => handleInputChange("link", e.target.value)}
                placeholder="https://programmers.co.kr/..."
                className="w-full px-4 py-2 text-sm outline outline-1 outline-border rounded-md bg-surface text-text
                  hover:outline-primary focus:outline-primary focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">날짜</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className="w-full px-4 py-2 text-sm outline outline-1 outline-border rounded-md bg-surface text-text
                    hover:outline-primary focus:outline-primary focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">알고리즘</label>
                <AppSelect
                  options={categoryOptions}
                  value={formData.category}
                  onChange={(value) => handleInputChange("category", value as string)}
                  placeholder="알고리즘 선택"
                  fullWidth
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">플랫폼</label>
                <AppSelect
                  options={platformOptions}
                  value={formData.platform}
                  onChange={(value) => handlePlatformChange(value as string)}
                  placeholder="플랫폼 선택"
                  fullWidth
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">등급</label>
                <AppSelect
                  options={getGradeOptions()}
                  value={formData.grade}
                  onChange={(value) => handleInputChange("grade", value as string)}
                  placeholder={formData.platform ? "등급 선택" : "플랫폼을 먼저 선택"}
                  disabled={!formData.platform}
                  fullWidth
                />
              </div>
            </div>

            <div className="flex w-full justify-between items-start">
              <div className="w-[50%]">
                <label className="block text-sm font-medium text-text mb-2">제출 결과</label>
                <ToggleButtonGroup
                  options={resultOptions}
                  value={formData.result}
                  onChange={(value) => handleInputChange("result", value)}
                />
              </div>
              <div className="w-[50%]">
                <label className="block text-sm font-medium text-text mb-2">작성 이유 (복수 선택 가능)</label>
                <ToggleButtonGroup
                  options={tagOptions}
                  value={formData.tags}
                  onChange={(value) => handleInputChange("tags", value)}
                  multiple
                />
              </div>
            </div>

            <div className="flex w-full flex-row gap-2">
              <div className="w-full">
                <label className="block text-sm font-medium text-text mb-2">내 풀이</label>
                <CodeEditor
                  value={formData.myCode}
                  language={formData.language}
                  onChange={(value: string) => handleInputChange("myCode", value)}
                />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-text mb-2">참조한 풀이</label>
                <CodeEditor
                  value={formData.solution}
                  language={formData.language}
                  onChange={(value: string) => handleInputChange("solution", value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">코멘트</label>
              <textarea
                value={formData.comment}
                onChange={(e) => handleInputChange("comment", e.target.value)}
                placeholder="이 문제에서 배운 점, 주의할 점 등을 기록하세요..."
                rows={4}
                className="w-full px-4 py-3 text-sm outline outline-1 outline-border rounded-md bg-surface text-text
                  hover:outline-primary focus:outline-primary focus:ring-2 focus:ring-blue-200 transition-all resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="share"
                checked={formData.share}
                onChange={(e) => handleInputChange("share", e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="share" className="text-sm text-text cursor-pointer">
                다른 사용자에게 공유하기
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <AppButton
                variant="ghost"
                onClick={() => {
                  setInitialData(noteToFormData(note));
                  handleCancel();
                }}
              >
                취소
              </AppButton>
              <AppButton variant="solid" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "저장 중..." : "저장"}
              </AppButton>
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

        <div className="mt-6 p-6 bg-surface border border-border rounded-lg space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex flex-wrap items-center gap-2">
              <AppChip variant="success">{getCategoryLabel(note.category)}</AppChip>
              <AppChip variant="primary">{getPlatformLabel(note.platform)}</AppChip>
              {note.grade && <AppChip variant="secondary">{getGradeLabel(note.platform, note.grade)}</AppChip>}
              <AppChip
                variant={note.result === "correct" ? "success" : note.result === "timeout" ? "warning" : "error"}
              >
                {getResultLabel(note.result)}
              </AppChip>
              <span className="text-xs text-textSecondary ml-2">{note.date}</span>
            </div>
            {isOwner && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsEditMode(true)}
                  className="p-2 text-textSecondary hover:text-primary transition-colors"
                  title="수정"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text">{note.title || "제목 없음"}</h2>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-textSecondary mb-1">문제 링크</h3>
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
                <h3 className="text-sm font-medium text-textSecondary mb-1">언어</h3>
                <AppChip variant="purple">{getLanguageLabel(note.language)}</AppChip>
              </div>
            )}
          </div>

          {note.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-textSecondary mb-2">작성 이유</h3>
              <div className="flex flex-wrap gap-2">
                {getTagLabels(note.tags).map((tag, i) => (
                  <span key={i} className="px-3 py-1 text-sm rounded-full bg-blue-50 text-primary">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {note.comment && (
            <div>
              <h3 className="text-sm font-medium text-textSecondary mb-1">코멘트</h3>
              <p className="text-text whitespace-pre-wrap">{note.comment}</p>
            </div>
          )}
          <div className="flex w-full flex-row gap-2">
            <div className="w-full">
              <label className="block text-sm font-medium text-text mb-2">내 풀이</label>
              <CodeEditor value={note.myCode} language={note.language} onChange={() => {}} readOnly />
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-text mb-2">참조한 풀이</label>
              <CodeEditor value={note.solution} language={note.language} onChange={() => {}} readOnly />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
