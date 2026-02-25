import { useSearchParams } from "react-router-dom";
import Navbar from "@/widgets/Navbar/Navbar";
import PageHeader from "@/shared/ui/molecules/PageHeader/PageHeader";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import AppSelect from "@/shared/ui/atoms/AppSelect/AppSelect";
import CodeEditor from "@/shared/ui/molecules/CodeEditor/CodeEditor";
import { useTemplateForm } from "@/entities/template/model/useTemplateForm";
import type { Category, TemplateType } from "@/entities/template/model/template.type";

export default function TemplateRegistration() {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("id");

  const {
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
  } = useTemplateForm(templateId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text">템플릿 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <PageHeader
          title={isEditMode ? "템플릿 수정" : "템플릿 등록"}
          description={isEditMode ? "등록한 템플릿을 수정합니다." : "나만의 템플릿을 등록하고 연습해보세요."}
        />

        <div className="bg-surface p-6 rounded-lg border border-border mb-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-text mb-2">카테고리</label>
            <AppSelect
              value={currentCategory}
              onChange={(value) => setCurrentCategory(value as Category)}
              options={[
                { value: "algorithm", label: "알고리즘" },
                { value: "cs", label: "CS" },
                { value: "english", label: "영어" },
                { value: "interview", label: "면접" },
              ]}
              fullWidth
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-text mb-2">템플릿 제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 이분 탐색 알고리즘"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-text mb-2">템플릿 설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 정렬되어 있는 리스트에서 탐색 범위를 절반씩 좁혀가며 데이터를 탐색하는 알고리즘"
              rows={3}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-text mb-3">템플릿 형태</label>
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="templateType"
                  value="paragraph"
                  checked={templateType === "paragraph"}
                  onChange={(e) => setTemplateType(e.target.value as TemplateType)}
                  className="w-4 h-4 text-primary bg-background border-border focus:ring-primary focus:ring-2"
                />
                <span className="ml-2 text-text">줄글형</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="templateType"
                  value="problem"
                  checked={templateType === "problem"}
                  onChange={(e) => setTemplateType(e.target.value as TemplateType)}
                  className="w-4 h-4 text-primary bg-background border-border focus:ring-primary focus:ring-2"
                />
                <span className="ml-2 text-text">문제형</span>
              </label>
            </div>
            {templateType === "problem" && (
              <p className="mt-2 text-xs text-textSecondary">
                문제형은 서술형으로 입력하되, "1. ~~~" / "2. ~~~" 형식으로 입력해주세요.
              </p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-text m-0">정답 입력</h3>
            <div className="flex gap-2">
              <AppButton onClick={handleReset} variant="outline">
                초기화
              </AppButton>
              <AppButton onClick={handleSubmit} variant="solid" disabled={isSubmitting}>
                {isSubmitting
                  ? (isEditMode ? "수정 중..." : "등록 중...")
                  : (isEditMode ? "템플릿 수정" : "템플릿 등록")}
              </AppButton>
            </div>
          </div>
          <CodeEditor value={answer} onChange={setAnswer} language="python" />
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border">
          <h4 className="text-sm font-semibold text-text mb-2">입력 가이드</h4>
          <ul className="text-xs text-textSecondary space-y-1 list-disc list-inside">
            <li>템플릿 제목은 간결하고 명확하게 작성해주세요.</li>
            <li>정답 내용은 나중에 테스트할 때 기준이 되는 정답입니다.</li>
            <li>채점 시 주석, 띄어쓰기, 줄 바꿈은 무시됩니다.</li>
            <li>문제형은 "1. 첫 번째 답", "2. 두 번째 답" 형식으로 입력하면 좋습니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
