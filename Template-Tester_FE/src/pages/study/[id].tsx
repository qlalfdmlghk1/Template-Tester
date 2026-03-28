import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/widgets/Navbar/Navbar";
import PageHeader from "@/shared/ui/molecules/PageHeader/PageHeader";
import CodeEditor from "@/shared/ui/molecules/CodeEditor/CodeEditor";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { useStudy } from "@/entities/template/model/useStudy";

export default function StudyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
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
  } = useStudy(id);

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

  if (!template) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="text-center py-12">
            <p className="text-textSecondary mb-4">템플릿을 찾을 수 없습니다.</p>
            <AppButton variant="solid" onClick={() => navigate("/my-templates")}>
              내 템플릿으로 돌아가기
            </AppButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between mb-4">
          <PageHeader title="코드 학습" description="등록한 코드를 보면서 학습할 수 있습니다." />
          <AppButton variant="ghost" size="sm" onClick={() => navigate("/my-templates")}>
            목록으로
          </AppButton>
        </div>

        {/* 템플릿 정보 */}
        <div className="bg-surface p-4 sm:p-5 md:p-6 rounded-lg border border-border mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-primary m-0">{template.title}</h3>
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
              {template.type === "paragraph" ? "줄글형" : "문제형"}
            </span>
          </div>
          {template.description && <p className="text-xs sm:text-sm text-textSecondary m-0">{template.description}</p>}
        </div>

        {/* 학습 모드 컨트롤 */}
        <div className="bg-surface p-4 rounded-lg border border-border mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <AppButton variant={studyMode === "hidden" ? "solid" : "outline"} size="sm" onClick={hideAllCode}>
                코드 숨기기
              </AppButton>
              <AppButton variant={studyMode === "visible" ? "solid" : "outline"} size="sm" onClick={showAllCode}>
                전체 보기
              </AppButton>
              <AppButton variant={studyMode === "hint" ? "solid" : "outline"} size="sm" onClick={startHintMode}>
                한 줄씩 보기
              </AppButton>
            </div>

            {studyMode === "hint" && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-textSecondary">
                  {visibleLineCount} / {totalLines} 줄
                </span>
                <AppButton variant="outline" size="xs" onClick={showPrevLine} disabled={visibleLineCount <= 0}>
                  이전 줄
                </AppButton>
                <AppButton variant="outline" size="xs" onClick={showNextLine} disabled={visibleLineCount >= totalLines}>
                  다음 줄
                </AppButton>
              </div>
            )}
          </div>
        </div>

        {/* 코드 에디터 */}
        {studyMode === "hidden" ? (
          <div className="border border-border rounded-md overflow-hidden bg-[#1e1e1e] py-12">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-3">🔒</div>
              <p className="text-sm m-0">코드가 숨겨져 있습니다.</p>
              <p className="text-xs text-gray-500 mt-1 m-0">"전체 보기" 또는 "라인별 힌트"를 눌러 코드를 확인하세요.</p>
            </div>
          </div>
        ) : (
          <CodeEditor
            value={displayCode}
            onChange={() => {}}
            language="python"
            readOnly
            height={`${Math.max(200, Math.min(totalLines * 22, 600))}px`}
          />
        )}

        {/* 이전/다음 템플릿 네비게이션 */}
        <div className="flex justify-between items-center mt-6">
          <div>
            {prevTemplate && (
              <AppButton variant="ghost" size="sm" onClick={() => navigate(`/study/${prevTemplate.id}`)}>
                ← {prevTemplate.title}
              </AppButton>
            )}
          </div>
          <div>
            {nextTemplate && (
              <AppButton variant="ghost" size="sm" onClick={() => navigate(`/study/${nextTemplate.id}`)}>
                {nextTemplate.title} →
              </AppButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
