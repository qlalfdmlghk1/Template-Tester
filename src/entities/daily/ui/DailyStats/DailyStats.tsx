import { useDailyStats } from "@/entities/daily/model/useDailyStats";
import type { ConceptStat } from "@/entities/daily/model/stats";

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

interface StatTileProps {
  label: string;
  value: string;
  sub?: string;
}

function StatTile({ label, value, sub }: StatTileProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <p className="text-xs text-textSecondary">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text">{value}</p>
      {sub && <p className="text-xs text-textSecondary">{sub}</p>}
    </div>
  );
}

function WeakConceptRow({ stat }: { stat: ConceptStat }) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text truncate">{stat.name}</p>
          <p className="text-xs text-textSecondary truncate">{stat.subjectLabel}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className="text-sm font-semibold text-text">{pct(stat.accuracy)}</span>
          <p className="text-xs text-textSecondary">
            {stat.correctCount}○ / {stat.wrongCount}✕
          </p>
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: pct(stat.accuracy) }}
        />
      </div>
    </div>
  );
}

export function DailyStats() {
  const { stats, isLoading } = useDailyStats();

  if (isLoading) {
    return <div className="text-center py-12 text-textSecondary">불러오는 중...</div>;
  }

  if (!stats || stats.totalConcepts === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-text font-medium">아직 통계가 없습니다.</p>
        <p className="mt-1 text-sm text-textSecondary">주제를 만들고 학습을 시작하면 여기에 기록이 쌓입니다.</p>
      </div>
    );
  }

  const maxDay = Math.max(1, ...stats.history.map((d) => d.correct + d.wrong));

  return (
    <div className="space-y-8">
      {/* 요약 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile label="전체 정답률" value={pct(stats.overallAccuracy)} sub={`${stats.totalAttempts}회 풀이`} />
        <StatTile
          label="학습한 개념"
          value={`${stats.studiedConcepts}`}
          sub={`전체 ${stats.totalConcepts}개 중`}
        />
        <StatTile label="오늘 복습 대상" value={`${stats.dueToday}`} sub="개념" />
        <StatTile label="총 풀이 수" value={`${stats.totalAttempts}`} sub="문제" />
      </div>

      {/* 약점 개념 */}
      <section>
        <h3 className="text-sm font-semibold text-text mb-2">약점 개념 (정답률 낮은 순)</h3>
        {stats.weakConcepts.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-5 text-sm text-textSecondary">
            아직 풀이 기록이 없어 약점을 계산할 수 없어요.
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-lg px-5 divide-y divide-border">
            {stats.weakConcepts.map((stat) => (
              <WeakConceptRow key={stat.conceptId} stat={stat} />
            ))}
          </div>
        )}
      </section>

      {/* 복습 이력 */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-text">최근 14일 학습 이력</h3>
          <div className="flex items-center gap-3 text-xs text-textSecondary">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />
              정답
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />
              오답
            </span>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-end justify-between gap-1 h-36">
            {stats.history.map((day) => {
              const total = day.correct + day.wrong;
              return (
                <div key={day.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div
                    className="w-full max-w-[24px] flex flex-col justify-end rounded-sm overflow-hidden"
                    style={{ height: "100%" }}
                    title={`${day.label} · 정답 ${day.correct} / 오답 ${day.wrong}`}
                  >
                    {total > 0 && (
                      <>
                        <div
                          className="w-full bg-red-500"
                          style={{ height: `${(day.wrong / maxDay) * 100}%` }}
                        />
                        <div
                          className="w-full bg-green-500"
                          style={{ height: `${(day.correct / maxDay) * 100}%` }}
                        />
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-textSecondary truncate w-full text-center">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
