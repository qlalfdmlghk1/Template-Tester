import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/widgets/Navbar/Navbar";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { cn } from "@/shared/lib/cn";
import { useDailySession } from "@/entities/daily/model/useDailySession";

const INPUT_CLASS =
  "w-full px-4 py-3 text-sm outline outline-1 outline-border rounded-md bg-surface text-text hover:outline-primary focus:outline-primary focus:ring-2 focus:ring-blue-200 transition-all resize-none";

export default function DailySession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = useDailySession(id);

  const {
    phase,
    subject,
    current,
    isMcq,
    index,
    total,
    correctCount,
    questionState,
    result,
    selectedChoice,
    setSelectedChoice,
    textAnswer,
    setTextAnswer,
    submitChoice,
    revealShort,
    selfGrade,
    next,
  } = session;

  const revealed = questionState === "revealed";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[760px] mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="min-w-0">
            <button
              onClick={() => navigate("/daily")}
              className="text-sm text-textSecondary hover:text-primary transition-colors"
            >
              ← 데일리 학습
            </button>
            {subject && (
              <p className="mt-1 text-sm text-text font-medium truncate">
                {subject.topic} › {subject.sub} › {subject.detail}
              </p>
            )}
          </div>
          {phase === "playing" && (
            <span className="flex-shrink-0 text-sm text-textSecondary">
              {index + 1} / {total}
            </span>
          )}
        </div>

        {/* 로딩 */}
        {phase === "loading" && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🧠</div>
            <p className="text-text font-medium">오늘의 문제를 만들고 있어요...</p>
            <p className="mt-1 text-sm text-textSecondary">AI가 약한 개념 위주로 출제 중입니다.</p>
          </div>
        )}

        {/* 에러 */}
        {phase === "error" && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-text font-medium">문제를 불러오지 못했습니다.</p>
            <p className="mt-1 text-sm text-textSecondary">
              잠시 후 다시 시도하거나, 개발 환경이라면 Functions 에뮬레이터가 켜져 있는지 확인해 주세요.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <AppButton variant="outline" size="md" onClick={() => window.location.reload()}>
                다시 시도
              </AppButton>
              <AppButton variant="solid" size="md" onClick={() => navigate("/daily")}>
                목록으로
              </AppButton>
            </div>
          </div>
        )}

        {/* 학습할 개념 없음 */}
        {phase === "empty" && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-text font-medium">오늘 학습할 개념이 없습니다.</p>
            <p className="mt-1 text-sm text-textSecondary">개념을 추가하면 문제가 출제됩니다.</p>
            <div className="mt-6">
              <AppButton variant="solid" size="md" onClick={() => navigate("/daily")}>
                주제 관리로
              </AppButton>
            </div>
          </div>
        )}

        {/* 완료 */}
        {phase === "done" && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-text">오늘 학습 완료!</h2>
            <p className="mt-2 text-textSecondary">
              총 {total}문제 중 <span className="text-primary font-semibold">{correctCount}개</span> 정답
            </p>
            <p className="mt-1 text-sm text-textSecondary">
              틀린 개념은 더 자주, 맞힌 개념은 복습 간격이 늘어나 다시 출제됩니다.
            </p>
            <div className="mt-8">
              <AppButton variant="solid" size="lg" onClick={() => navigate("/daily")}>
                목록으로 돌아가기
              </AppButton>
            </div>
          </div>
        )}

        {/* 풀이 */}
        {phase === "playing" && current && (
          <div className="space-y-6">
            {/* 진행바 */}
            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(index / total) * 100}%` }}
              />
            </div>

            {/* 문제 카드 */}
            <div className="bg-surface border border-border rounded-lg p-5 sm:p-6">
              <p className="text-base text-text font-medium whitespace-pre-wrap">{current.question}</p>

              {/* 객관식 */}
              {isMcq ? (
                <div className="mt-5 space-y-2">
                  {current.choices?.map((choice) => {
                    const selected = selectedChoice === choice;
                    const isAnswer = choice === current.answer;
                    const showState = revealed && (isAnswer || selected);
                    return (
                      <button
                        key={choice}
                        type="button"
                        disabled={revealed}
                        onClick={() => setSelectedChoice(choice)}
                        className={cn(
                          "w-full text-left px-4 py-3 text-sm rounded-md border transition-colors",
                          !revealed && selected && "border-primary bg-blue-50 text-primary",
                          !revealed && !selected && "border-border text-text hover:border-primary",
                          showState && isAnswer && "border-green-500 bg-green-50 text-green-700",
                          revealed && selected && !isAnswer && "border-error bg-red-50 text-error",
                          revealed && !isAnswer && !selected && "border-border text-textSecondary",
                        )}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* 서술형 */
                <div className="mt-5">
                  <textarea
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    disabled={revealed}
                    rows={4}
                    placeholder="답을 서술해 보세요..."
                    className={INPUT_CLASS}
                  />
                </div>
              )}

              {/* 정답·해설 (공개 후) */}
              {revealed && (
                <div className="mt-5 border-t border-border pt-4 space-y-2">
                  {!isMcq && (
                    <p className="text-sm text-text">
                      <span className="font-semibold">모범답안</span> · {current.answer}
                    </p>
                  )}
                  <p className="text-sm text-textSecondary whitespace-pre-wrap">{current.explanation}</p>
                </div>
              )}
            </div>

            {/* 액션 */}
            <div className="flex justify-end gap-2">
              {!revealed && isMcq && (
                <AppButton variant="solid" size="lg" onClick={submitChoice} disabled={selectedChoice === null}>
                  제출
                </AppButton>
              )}
              {!revealed && !isMcq && (
                <AppButton variant="solid" size="lg" onClick={revealShort} disabled={textAnswer.trim().length === 0}>
                  제출
                </AppButton>
              )}

              {/* 서술형: 자기평가 (아직 채점 전) */}
              {revealed && !isMcq && result === null && (
                <>
                  <AppButton variant="outline" size="lg" onClick={() => selfGrade(false)}>
                    아쉬웠어요
                  </AppButton>
                  <AppButton variant="solid" size="lg" onClick={() => selfGrade(true)}>
                    맞았어요
                  </AppButton>
                </>
              )}

              {/* 채점 완료 → 다음 */}
              {revealed && result !== null && (
                <AppButton variant="solid" size="lg" onClick={next}>
                  {index + 1 >= total ? "결과 보기" : "다음 문제"}
                </AppButton>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
