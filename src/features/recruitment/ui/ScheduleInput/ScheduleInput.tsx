import { AppSelect } from "@/shared/ui/atoms/AppSelect";
import { ROUGH_PARTS, ROUGH_PART_LABELS } from "@/entities/job-application/model/schedule";
import type { RoughPart, Schedule } from "@/entities/job-application/model/schedule";

type ScheduleKind = "none" | "exact" | "range" | "rough";

interface ScheduleInputProps {
  value: Schedule | null;
  /** 러프 표기에 쓸 기본 연도 — 보통 선택된 반기의 연도 */
  defaultYear: number;
  onChange: (schedule: Schedule | null) => void;
}

const KIND_OPTIONS: { value: ScheduleKind; label: string }[] = [
  { value: "none", label: "일정 없음" },
  { value: "exact", label: "정확한 일시" },
  { value: "range", label: "기간" },
  { value: "rough", label: "러프 (○월 초·중순·말)" },
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: `${index + 1}월`,
}));

/** "YYYY-MM-DDTHH:mm" → date/time 입력값 분리 */
function splitDateTime(value: string): { date: string; time: string } {
  const [date, time] = value.split("T");
  return { date: date ?? "", time: time ?? "" };
}

function joinDateTime(date: string, time: string): string {
  return time ? `${date}T${time}` : date;
}

/**
 * 전형 일정 입력.
 *
 * 시트에 정확한 일시·기간·러프 표기가 섞여 있어 한 가지 입력 위젯으로는 담기지 않는다.
 * 종류를 먼저 고르고 그에 맞는 입력만 보여준다.
 */
export function ScheduleInput({ value, defaultYear, onChange }: ScheduleInputProps) {
  const kind: ScheduleKind = value?.kind ?? "none";

  const handleKindChange = (nextKind: ScheduleKind) => {
    if (nextKind === "none") return onChange(null);
    if (nextKind === "exact") return onChange({ kind: "exact", at: "", hasTime: false });
    if (nextKind === "range") {
      return onChange({ kind: "range", start: "", end: "", hasTime: false });
    }
    onChange({ kind: "rough", year: defaultYear, month: 1, part: "whole" });
  };

  return (
    <div className="flex flex-col gap-2">
      <AppSelect
        size="sm"
        fullWidth
        options={KIND_OPTIONS}
        value={kind}
        onChange={(next) => handleKindChange(String(next) as ScheduleKind)}
      />

      {value?.kind === "exact" && (
        <div className="flex gap-2">
          <input
            type="date"
            aria-label="일자"
            value={splitDateTime(value.at).date}
            onChange={(event) =>
              onChange({
                ...value,
                at: joinDateTime(event.target.value, splitDateTime(value.at).time),
              })
            }
            className="flex-1 px-2 py-1.5 text-sm bg-surface text-text border border-border rounded-sm"
          />
          <input
            type="time"
            aria-label="시각 (선택)"
            value={splitDateTime(value.at).time}
            onChange={(event) =>
              onChange({
                ...value,
                at: joinDateTime(splitDateTime(value.at).date, event.target.value),
                hasTime: Boolean(event.target.value),
              })
            }
            className="w-[110px] px-2 py-1.5 text-sm bg-surface text-text border border-border rounded-sm"
          />
        </div>
      )}

      {value?.kind === "range" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="시작일"
            value={value.start}
            onChange={(event) => onChange({ ...value, start: event.target.value })}
            className="flex-1 px-2 py-1.5 text-sm bg-surface text-text border border-border rounded-sm"
          />
          <span className="text-textSecondary">~</span>
          <input
            type="date"
            aria-label="종료일"
            value={value.end}
            onChange={(event) => onChange({ ...value, end: event.target.value })}
            className="flex-1 px-2 py-1.5 text-sm bg-surface text-text border border-border rounded-sm"
          />
        </div>
      )}

      {value?.kind === "rough" && (
        <div className="flex gap-2">
          <input
            type="number"
            aria-label="연도"
            value={value.year}
            onChange={(event) => onChange({ ...value, year: Number(event.target.value) })}
            className="w-[90px] px-2 py-1.5 text-sm bg-surface text-text border border-border rounded-sm"
          />
          <AppSelect
            size="sm"
            width="90px"
            options={MONTH_OPTIONS}
            value={value.month}
            onChange={(next) => onChange({ ...value, month: Number(next) })}
          />
          <AppSelect
            size="sm"
            width="110px"
            options={ROUGH_PARTS.map((part) => ({
              value: part,
              label: ROUGH_PART_LABELS[part],
            }))}
            value={value.part}
            onChange={(next) => onChange({ ...value, part: String(next) as RoughPart })}
          />
        </div>
      )}
    </div>
  );
}
