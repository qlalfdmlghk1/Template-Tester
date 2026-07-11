import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/widgets/Navbar/Navbar";
import PageHeader from "@/shared/ui/molecules/PageHeader/PageHeader";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import AppFallback from "@/shared/ui/molecules/AppFallback/AppFallback";
import { useDailySubjects } from "@/entities/daily/model/useDailySubjects";
import { useSubjectForm } from "@/entities/daily/model/useSubjectForm";
import { useConceptRecommend } from "@/entities/daily/model/useConceptRecommend";
import { DailyStats } from "@/entities/daily/ui/DailyStats/DailyStats";

const INPUT_CLASS =
  "w-full px-4 py-2 text-sm outline outline-1 outline-border rounded-md bg-surface text-text hover:outline-primary focus:outline-primary focus:ring-2 focus:ring-blue-200 transition-all";
const LABEL_CLASS = "block text-sm font-medium text-text leading-[30px] mb-2";

export default function Daily() {
  const [activeTab, setActiveTab] = useState<"list" | "create" | "stats">("list");
  const navigate = useNavigate();

  const { subjects, conceptCounts, isLoading, createSubjectWithConcepts, removeSubject } = useDailySubjects();

  const form = useSubjectForm({
    onSubmit: async (input) => {
      await createSubjectWithConcepts(input);
      setActiveTab("list");
    },
  });

  const { recommend, isRecommending } = useConceptRecommend();

  const canRecommend =
    form.topic.trim().length > 0 &&
    form.sub.trim().length > 0 &&
    form.detail.trim().length > 0 &&
    !isRecommending;

  const handleConceptKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      form.addConcept();
    }
  };

  const handleRecommend = async () => {
    const names = await recommend({
      topic: form.topic.trim(),
      sub: form.sub.trim(),
      detail: form.detail.trim(),
    });
    if (names.length > 0) {
      form.addConcepts(names);
    }
  };

  const handleDeleteSubject = (subjectId: string) => {
    if (window.confirm("이 주제와 소속된 개념·학습 데이터가 모두 삭제됩니다. 계속할까요?")) {
      removeSubject(subjectId);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <PageHeader title="데일리 학습" />

        {/* 탭 */}
        <div className="flex items-end gap-2 mt-6 border-b border-border">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "list"
                ? "text-primary border-primary"
                : "text-textSecondary border-transparent hover:text-text"
            }`}
          >
            내 주제
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "stats"
                ? "text-primary border-primary"
                : "text-textSecondary border-transparent hover:text-text"
            }`}
          >
            통계
          </button>
          <div className="ml-auto pb-2">
            <AppButton
              variant={activeTab === "create" ? "solid" : "outline"}
              size="sm"
              onClick={() => setActiveTab("create")}
            >
              + 새 주제
            </AppButton>
          </div>
        </div>

        {/* 목록 탭 */}
        {activeTab === "list" && (
          <div className="mt-6">
            {isLoading ? (
              <div className="text-center py-12 text-textSecondary">불러오는 중...</div>
            ) : subjects.length === 0 ? (
              <AppFallback
                type="empty"
                title="아직 등록한 학습 주제가 없습니다."
                description="주제를 만들고 개념을 등록하면 매일 적응형 문제로 복습할 수 있습니다."
                buttonText="첫 주제 만들기"
                buttonIcon={null}
                onAction={() => setActiveTab("create")}
              />
            ) : (
              <div className="space-y-4">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="p-3 sm:p-4 bg-surface border border-border rounded-lg flex justify-between items-start"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-sm text-textSecondary mb-1">
                        <span>{subject.topic}</span>
                        <span>›</span>
                        <span>{subject.sub}</span>
                        <span>›</span>
                        <span className="text-text font-medium">{subject.detail}</span>
                      </div>
                      <p className="text-xs text-textSecondary">개념 {conceptCounts[subject.id] ?? 0}개</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <AppButton
                        variant="solid"
                        size="sm"
                        onClick={() => navigate(`/daily/${subject.id}`)}
                        disabled={(conceptCounts[subject.id] ?? 0) === 0}
                      >
                        학습 시작
                      </AppButton>
                      <button
                        onClick={() => handleDeleteSubject(subject.id)}
                        className="p-2 text-textSecondary hover:text-error transition-colors"
                        title="주제 삭제"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                ))}
              </div>
            )}
          </div>
        )}

        {/* 새 주제 탭 */}
        {activeTab === "create" && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
            {/* 왼쪽: 입력 폼 */}
            <div className="bg-surface border border-border rounded-lg p-5 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={LABEL_CLASS}>대주제</label>
                  <input
                    type="text"
                    value={form.topic}
                    onChange={(e) => form.setTopic(e.target.value)}
                    placeholder="예: 프론트엔드"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>소주제</label>
                  <input
                    type="text"
                    value={form.sub}
                    onChange={(e) => form.setSub(e.target.value)}
                    placeholder="예: JavaScript"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>세부주제</label>
                  <input
                    type="text"
                    value={form.detail}
                    onChange={(e) => form.setDetail(e.target.value)}
                    placeholder="예: 함수"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className={LABEL_CLASS}>개념</label>
                  <button
                    type="button"
                    onClick={handleRecommend}
                    disabled={!canRecommend}
                    title={
                      canRecommend
                        ? "AI가 세부주제로부터 개념 목록을 추천합니다."
                        : "대주제·소주제·세부주제를 먼저 입력하세요."
                    }
                    className="text-xs font-medium text-primary border border-primary rounded-md px-3 py-1.5 transition-colors hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-primary"
                  >
                    {isRecommending ? "추천 중..." : "🤖 AI 개념 추천"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.conceptInput}
                    onChange={(e) => form.setConceptInput(e.target.value)}
                    onKeyDown={handleConceptKeyDown}
                    placeholder="개념명 입력 후 Enter (예: 클로저, 호이스팅)"
                    className={INPUT_CLASS}
                  />
                  <AppButton variant="outline" size="sm" onClick={form.addConcept} disabled={!form.canAddConcept}>
                    추가
                  </AppButton>
                </div>
                <p className="mt-2 text-xs text-textSecondary">
                  추가한 개념은 오른쪽에서 확인·삭제할 수 있어요.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <AppButton variant="ghost" size="lg" onClick={() => setActiveTab("list")}>
                  취소
                </AppButton>
                <AppButton
                  variant="solid"
                  size="lg"
                  onClick={form.handleSubmit}
                  disabled={!form.isValid || form.isSubmitting}
                >
                  {form.isSubmitting ? "저장 중..." : "주제 만들기"}
                </AppButton>
              </div>
            </div>

            {/* 오른쪽: 학습 흐름 안내 + 추가한 개념 미리보기 */}
            <aside className="bg-surface border border-border rounded-lg p-5 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-text mb-3">이렇게 학습해요</h3>
                <ol className="space-y-3">
                  {[
                    { n: "1", t: "주제 지정", d: "대 › 소 › 세부 3단계로 학습 범위를 정합니다." },
                    { n: "2", t: "개념 등록", d: "세부주제 안의 개념을 직접 넣거나 AI 추천으로 채웁니다." },
                    { n: "3", t: "매일 적응형 문제", d: "약한 개념 위주로 매일 문제가 출제됩니다." },
                  ].map((step) => (
                    <li key={step.n} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-50 text-primary text-xs font-semibold">
                        {step.n}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-text">{step.t}</p>
                        <p className="text-xs text-textSecondary">{step.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="border-t border-border pt-5">
                <h4 className="text-sm font-semibold text-text mb-3">
                  추가한 개념 {form.concepts.length > 0 && `(${form.concepts.length})`}
                </h4>
                {form.concepts.length === 0 ? (
                  <p className="text-xs text-textSecondary">
                    아직 추가한 개념이 없습니다. 개념을 등록하면 여기에 표시됩니다.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {form.concepts.map((concept) => (
                      <span
                        key={concept}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-sm bg-blue-50 text-primary rounded-full"
                      >
                        {concept}
                        <button
                          type="button"
                          onClick={() => form.removeConcept(concept)}
                          className="hover:text-error transition-colors"
                          aria-label={`${concept} 삭제`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        {/* 통계 탭 */}
        {activeTab === "stats" && (
          <div className="mt-6">
            <DailyStats />
          </div>
        )}
      </div>
    </div>
  );
}
