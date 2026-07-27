import { useState, useEffect } from "react";
import Navbar from "@/widgets/Navbar/Navbar";
import PageHeader from "@/shared/ui/molecules/PageHeader/PageHeader";
import MonthCalendar from "@/shared/ui/molecules/MonthCalendar/MonthCalendar";
import { getTodayKey, parseDateKey } from "@/shared/lib/date";
import { useSolveLogs } from "@/entities/solve-log/model/useSolveLogs";
import DaySolveBadge from "@/entities/solve-log/ui/DaySolveBadge/DaySolveBadge";
import DayDetailPanel from "@/entities/solve-log/ui/DayDetailPanel/DayDetailPanel";
import { useCalendarSync } from "@/features/calendar-sync/model/useCalendarSync";
import SyncRepoSetting from "@/features/calendar-sync/ui/SyncRepoSetting/SyncRepoSetting";

export default function CodingCalendar() {
  // 모듈 스코프에서 한 번만 계산하면 탭을 켜 둔 채 자정을 넘겼을 때
  // '오늘' 표시와 기본 선택 날짜가 어제에 머문다.
  const [todayKey, setTodayKey] = useState(getTodayKey);
  const [cursor, setCursor] = useState(() => {
    const today = parseDateKey(todayKey);
    return { year: today.year, month: today.month };
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(todayKey);

  // todayKey를 넘겨야 달력의 '오늘' 표시와 연속 학습일이 같은 날짜를 가리킨다
  const { logsByDate, stats, isLoading, error, reload, addManualLog, removeLog } =
    useSolveLogs(todayKey);
  const sync = useCalendarSync({ onSynced: reload });

  // 탭으로 돌아왔을 때 날짜가 바뀌었으면 맞춘다 (밤샘 학습에서 실제로 겪는 상황)
  useEffect(() => {
    const syncToday = () => setTodayKey(getTodayKey());

    window.addEventListener("focus", syncToday);
    document.addEventListener("visibilitychange", syncToday);
    return () => {
      window.removeEventListener("focus", syncToday);
      document.removeEventListener("visibilitychange", syncToday);
    };
  }, []);

  const monthPrefix = `${cursor.year}-${String(cursor.month).padStart(2, "0")}`;
  const monthCount = [...logsByDate.entries()]
    .filter(([dateKey]) => dateKey.startsWith(monthPrefix))
    .reduce((total, [, logs]) => total + logs.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <PageHeader
          title="코테 달력"
          description="BaekjoonHub가 GitHub에 남긴 풀이 커밋을 읽어 훈련 일지를 자동으로 채웁니다."
        />

        <div className="grid grid-cols-3 gap-3 mb-4">
          <SummaryTile label="총 풀이" value={`${stats.total}문제`} />
          <SummaryTile label="이번 달" value={`${monthCount}문제`} />
          <SummaryTile label="연속 학습" value={`${stats.streak}일`} />
        </div>

        <div className="mb-4">
          <SyncRepoSetting
            settings={sync.settings}
            isConnected={sync.isConnected}
            isLoading={sync.isLoading}
            isSyncing={sync.isSyncing}
            error={sync.error}
            lastResult={sync.lastResult}
            onConnect={sync.connectRepo}
            onResync={sync.resync}
            onDisconnect={sync.disconnect}
          />
        </div>

        {error && (
          <p className="mb-4 text-sm text-error" role="alert">
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-textSecondary">불러오는 중...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
            <MonthCalendar
              year={cursor.year}
              month={cursor.month}
              selectedDateKey={selectedDateKey}
              todayKey={todayKey}
              onSelectDate={setSelectedDateKey}
              onChangeMonth={(year, month) => setCursor({ year, month })}
              renderDayContent={(dateKey) => <DaySolveBadge logs={logsByDate.get(dateKey)} />}
            />

            <DayDetailPanel
              dateKey={selectedDateKey}
              logs={selectedDateKey ? (logsByDate.get(selectedDateKey) ?? []) : []}
              onAddManualLog={addManualLog}
              onRemoveLog={removeLog}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3">
      <p className="text-xs text-textSecondary m-0">{label}</p>
      <p className="text-lg sm:text-xl font-semibold text-text mt-1 m-0">{value}</p>
    </div>
  );
}
