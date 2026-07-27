import { cn } from "@/shared/lib/cn";
import type { SolveLog } from "../../model/solve-log.type";

interface DaySolveBadgeProps {
  logs: SolveLog[] | undefined;
}

/**
 * 달력 날짜 칸에 그 날 푼 문제 수를 표시한다.
 *
 * 색으로 플랫폼 구성을 나타낸다 — 프로그래머스만 파랑, 백준만 초록, 섞였으면 보라.
 * 칸이 좁아 텍스트를 더 넣기 어려우므로 상세는 title 속성으로 넘긴다.
 */
export default function DaySolveBadge({ logs }: DaySolveBadgeProps) {
  if (!logs || logs.length === 0) return null;

  const programmers = logs.filter((log) => log.platform === "programmers").length;
  const boj = logs.length - programmers;

  const tone =
    programmers > 0 && boj > 0
      ? "bg-purple-100 text-purple-700"
      : programmers > 0
        ? "bg-blue-100 text-primary"
        : "bg-green-100 text-green-700";

  const parts = [
    programmers > 0 ? `프로그래머스 ${programmers}` : null,
    boj > 0 ? `백준 ${boj}` : null,
  ].filter(Boolean);

  return (
    <span
      title={parts.join(" · ")}
      className={cn("text-[10px] leading-none px-1.5 py-1 rounded-full font-medium", tone)}
    >
      {logs.length}
    </span>
  );
}
