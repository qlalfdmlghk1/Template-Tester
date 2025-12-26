import { useState } from 'react';
import Navbar from './components/Navbar';
import CodeEditor from './components/CodeEditor';
import GradingResult from './components/GradingResult';
import Button from './components/Button';
import type { Category, GradingResult as GradingResultType } from './types';
import { getTemplatesByCategory } from './data/templates';
import { gradeAnswer } from './utils/grading';

function App() {
  const [currentCategory, setCurrentCategory] = useState<Category>('algorithm');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [userCode, setUserCode] = useState<string>('');
  const [gradingResult, setGradingResult] = useState<GradingResultType | null>(null);

  const templates = getTemplatesByCategory(currentCategory);
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleCategoryChange = (category: Category) => {
    setCurrentCategory(category);
    setSelectedTemplateId('');
    setUserCode('');
    setGradingResult(null);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setUserCode('');
    setGradingResult(null);
  };

  const handleGrade = () => {
    if (!selectedTemplate) {
      alert('템플릿을 먼저 선택해주세요.');
      return;
    }

    const result = gradeAnswer(selectedTemplate.answer, userCode);
    setGradingResult(result);

    // 채점 결과 영역으로 스크롤
    setTimeout(() => {
      const resultElement = document.getElementById('grading-result');
      if (resultElement) {
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleReset = () => {
    setUserCode('');
    setGradingResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentCategory={currentCategory} onCategoryChange={handleCategoryChange} />

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* 템플릿 선택 영역 */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold text-text m-0">템플릿 선택</h2>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="py-2 px-4 text-sm border border-border rounded-md bg-surface text-text cursor-pointer min-w-[300px]"
            >
              <option value="">템플릿을 선택하세요</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
          </div>

          {selectedTemplate && (
            <div className="bg-surface p-6 rounded-lg border border-border">
              <h3 className="text-xl font-semibold text-primary mb-2">{selectedTemplate.title}</h3>
              <p className="text-sm text-textSecondary m-0">{selectedTemplate.description}</p>
            </div>
          )}
        </div>

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

export default App;
