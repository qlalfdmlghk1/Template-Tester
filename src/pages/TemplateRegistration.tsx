import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import SelectBox from "../components/ui/SelectBox";
import CodeEditor from "../components/CodeEditor";
import { saveUserTemplate, updateUserTemplate, getUserTemplates } from "../firebase/services";
import type { Category, TemplateType } from "../types";

function TemplateRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("id");
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

  const handleCategoryChange = (category: Category) => {
    setCurrentCategory(category);
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
          templateType
        );
        alert("템플릿이 성공적으로 수정되었습니다!");
      } else {
        await saveUserTemplate(
          currentCategory,
          title,
          description,
          answer,
          templateType
        );
        alert("템플릿이 성공적으로 등록되었습니다!");
      }

      navigate("/my-templates");
    } catch (error: any) {
      console.error("템플릿 저장 실패:", error);
      alert(error.message || "템플릿 저장에 실패했습니다.");
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text">템플릿 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentCategory={currentCategory} onCategoryChange={handleCategoryChange} />

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <PageHeader
          title={isEditMode ? "템플릿 수정" : "템플릿 등록"}
          description={isEditMode ? "등록한 템플릿을 수정합니다." : "나만의 템플릿을 등록하고 연습해보세요."}
        />

        {/* 템플릿 정보 입력 */}
        <div className="bg-surface p-6 rounded-lg border border-border mb-6">
          {/* 카테고리 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-text mb-2">
              카테고리
            </label>
            <SelectBox
              value={currentCategory}
              onChange={(e) => setCurrentCategory(e.target.value as Category)}
              options={[
                { value: "algorithm", label: "알고리즘" },
                { value: "cs", label: "CS" },
                { value: "english", label: "영어" },
                { value: "interview", label: "면접" },
              ]}
              fullWidth
            />
          </div>

          {/* 템플릿 제목 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-text mb-2">
              템플릿 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 이분 탐색 알고리즘"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 템플릿 설명 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-text mb-2">
              템플릿 설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 정렬되어 있는 리스트에서 탐색 범위를 절반씩 좁혀가며 데이터를 탐색하는 알고리즘"
              rows={3}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* 템플릿 형태 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-text mb-3">
              템플릿 형태
            </label>
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

        {/* 정답 입력 영역 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-text m-0">정답 입력</h3>
            <div className="flex gap-2">
              <Button onClick={handleReset} variant="secondary">
                초기화
              </Button>
              <Button onClick={handleSubmit} variant="primary" disabled={isSubmitting}>
                {isSubmitting
                  ? (isEditMode ? "수정 중..." : "등록 중...")
                  : (isEditMode ? "템플릿 수정" : "템플릿 등록")}
              </Button>
            </div>
          </div>
          <CodeEditor value={answer} onChange={setAnswer} language="python" />
        </div>

        {/* 안내 메시지 */}
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

export default TemplateRegistration;
