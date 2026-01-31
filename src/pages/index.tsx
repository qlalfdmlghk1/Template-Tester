import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import CodeEditor from "../components/CodeEditor";
import GradingResult from "../components/GradingResult";
import Button from "../components/ui/Button";
import SelectBox from "../components/ui/SelectBox";
import type { Category, GradingResult as GradingResultType, Template } from "../types";
import { gradeAnswer } from "../utils/grading";
import { saveSubmission, getUserTemplatesByCategory } from "../firebase/services";

const categories: { value: Category; label: string }[] = [
  { value: "algorithm", label: "알고리즘" },
  { value: "english", label: "영어" },
  { value: "cs", label: "CS" },
  { value: "interview", label: "면접 대비" },
];

export default function IndexPage() {
  const navigate = useNavigate();
  const [currentCategory, setCurrentCategory] = useState<Category>("algorithm");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [userCode, setUserCode] = useState<string>("");
  const [gradingResult, setGradingResult] = useState<GradingResultType | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // 사용자 템플릿 불러오기
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

    // Firebase에 제출 기록 저장
    try {
      await saveSubmission(selectedTemplate.id, selectedTemplate.title, currentCategory, userCode, result);
      console.log("✅ 제출 기록이 Firebase에 저장되었습니다!");
    } catch (error) {
      console.error("❌ Firebase 저장 실패:", error);
      // 저장 실패해도 채점 결과는 보여줌
    }

    // 채점 결과 영역으로 스크롤
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* 템플릿 선택 영역 */}
        <PageHeader
          title="템플릿 선택"
          actions={
            <div className="flex gap-3">
              <SelectBox
                value={currentCategory}
                onChange={(e) => handleCategoryChange(e.target.value as Category)}
                options={categories.map((cat) => ({
                  value: cat.value,
                  label: cat.label,
                }))}
                placeholder="카테고리 선택"
              />
              <SelectBox
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                options={templates.map((template) => ({
                  value: template.id,
                  label: template.title,
                }))}
                placeholder="템플릿을 선택하세요"
              />
              <Button onClick={() => navigate("/template-registration")} variant="secondary">
                템플릿 생성하기
              </Button>
            </div>
          }
        />

        {selectedTemplate && (
          <div className="bg-surface p-4 sm:p-5 md:p-6 rounded-lg border border-border mb-6">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-primary mb-2">
              {selectedTemplate.title}
            </h3>
            <p className="text-xs sm:text-sm text-textSecondary m-0">{selectedTemplate.description}</p>
          </div>
        )}

        {/* 코드 입력 영역 */}
        {selectedTemplate && (
          <>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-text m-0">코드 입력</h3>
                <div className="flex gap-2">
                  <Button onClick={handleReset} variant="secondary">
                    초기화
                  </Button>
                  <Button onClick={handleGrade} variant="primary">
                    채점하기
                  </Button>
                </div>
              </div>
              <CodeEditor value={userCode} onChange={setUserCode} language="python" />
            </div>

            {/* 채점 결과 영역 */}
            {gradingResult && <GradingResult result={gradingResult} />}
          </>
        )}

        {/* 템플릿 미선택 상태 */}
        {!selectedTemplate && (
          <div className="text-center px-6 py-8 mt-[100px]">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-semibold text-text mb-2">템플릿을 선택해주세요</h3>
            <p className="text-base text-textSecondary">
              상단에서 카테고리를 선택하고, 학습하고 싶은 템플릿을 골라보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
