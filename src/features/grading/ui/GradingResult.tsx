import type { GradingResult as GradingResultType } from "@/entities/submission/model/submission.type";

interface GradingResultProps {
  result: GradingResultType;
}

export default function GradingResult({ result }: GradingResultProps) {
  const { totalLines, correctLines, accuracy, lineDiffs } = result;

  return (
    <div id="grading-result" className="mt-6">
      {/* 점수 요약 */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-surface p-6 rounded-lg border border-border text-center">
          <div className="text-sm text-textSecondary mb-2">정확도</div>
          <div className="text-[32px] font-bold text-primary">{accuracy.toFixed(2)}%</div>
        </div>
        <div className="flex-1 bg-surface p-6 rounded-lg border border-border text-center">
          <div className="text-sm text-textSecondary mb-2">정답 라인</div>
          <div className="text-[32px] font-bold text-primary">
            {correctLines} / {totalLines}
          </div>
        </div>
      </div>

      {/* 라인별 결과 */}
      <div className="bg-surface p-6 rounded-lg border border-border">
        <h3 className="text-lg font-semibold text-text mb-4">라인별 상세 결과</h3>
        <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
          {lineDiffs.map((lineDiff) => (
            <div
              key={lineDiff.lineNumber}
              className={`flex gap-4 p-4 rounded-md border ${
                lineDiff.isCorrect
                  ? 'bg-green-50 border-success'
                  : 'bg-red-50 border-error'
              }`}
            >
              <div className="min-w-[40px] font-semibold text-textSecondary text-sm">
                {lineDiff.lineNumber}
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex gap-2 items-start">
                  <span className="min-w-[50px] text-[13px] font-medium text-textSecondary">정답:</span>
                  <code className="flex-1 text-[13px] font-mono whitespace-pre-wrap break-all">
                    {lineDiff.expected || "(빈 줄)"}
                  </code>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="min-w-[50px] text-[13px] font-medium text-textSecondary">입력:</span>
                  <code className="flex-1 text-[13px] font-mono whitespace-pre-wrap break-all">
                    {lineDiff.actual || "(빈 줄)"}
                  </code>
                </div>

                {!lineDiff.isCorrect && lineDiff.wordDiffs && lineDiff.wordDiffs.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="text-xs font-semibold text-textSecondary mb-1">단어 단위 차이:</div>
                    <div className="flex flex-col gap-1">
                      {lineDiff.wordDiffs.slice(0, 5).map((wordDiff, idx) => (
                        <div key={idx} className="text-xs text-text font-mono">
                          위치 {wordDiff.index + 1}:
                          <span className="text-success font-semibold"> '{wordDiff.expected}'</span>
                          →
                          <span className="text-error font-semibold"> '{wordDiff.actual}'</span>
                        </div>
                      ))}
                      {lineDiff.wordDiffs.length > 5 && (
                        <div className="text-[11px] text-textSecondary italic">
                          외 {lineDiff.wordDiffs.length - 5}개 차이점...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
