import { useState } from 'react';
import Navbar from './components/Navbar';
import CodeEditor from './components/CodeEditor';
import GradingResult from './components/GradingResult';
import Button from './components/Button';
import type { Category, GradingResult as GradingResultType } from './types';
import { getTemplatesByCategory } from './data/templates';
import { gradeAnswer } from './utils/grading';
import { theme } from './styles/theme';

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
  };

  const handleReset = () => {
    setUserCode('');
    setGradingResult(null);
  };

  return (
    <div style={styles.app}>
      <Navbar currentCategory={currentCategory} onCategoryChange={handleCategoryChange} />

      <div style={styles.container}>
        {/* 템플릿 선택 영역 */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h2 style={styles.title}>템플릿 선택</h2>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              style={styles.select}
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
            <div style={styles.templateInfo}>
              <h3 style={styles.templateTitle}>{selectedTemplate.title}</h3>
              <p style={styles.templateDesc}>{selectedTemplate.description}</p>
            </div>
          )}
        </div>

        {/* 코드 입력 영역 */}
        {selectedTemplate && (
          <>
            <div style={styles.editorSection}>
              <div style={styles.editorHeader}>
                <h3 style={styles.sectionTitle}>코드 입력</h3>
                <div style={styles.buttonGroup}>
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
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📝</div>
            <h3 style={styles.emptyTitle}>템플릿을 선택해주세요</h3>
            <p style={styles.emptyDesc}>
              상단에서 카테고리를 선택하고, 학습하고 싶은 템플릿을 골라보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  app: {
    minHeight: '100vh',
    backgroundColor: theme.colors.background,
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: theme.colors.text,
    margin: 0,
  },
  select: {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    fontSize: '14px',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    cursor: 'pointer',
    minWidth: '300px',
  },
  templateInfo: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.border}`,
  },
  templateTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  templateDesc: {
    fontSize: '14px',
    color: theme.colors.textSecondary,
    margin: 0,
  },
  editorSection: {
    marginBottom: theme.spacing.lg,
  },
  editorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: theme.colors.text,
    margin: 0,
  },
  buttonGroup: {
    display: 'flex',
    gap: theme.spacing.sm,
  },
  emptyState: {
    textAlign: 'center',
    padding: `${theme.spacing.xl} ${theme.spacing.lg}`,
    marginTop: '100px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyDesc: {
    fontSize: '16px',
    color: theme.colors.textSecondary,
  },
};

export default App;
