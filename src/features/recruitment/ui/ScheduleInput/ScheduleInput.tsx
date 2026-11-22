import { AppSelect } from "@/shared/ui/atoms/AppSelect";
import { AppTextInput } from "@/shared/ui/atoms/AppTextInput";
import { AppDatePicker } from "@/shared/ui/atoms/AppDatePicker";
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
 * 모달 안 스크롤 영역에서 쓰이므로 목록·달력은 portal로 띄워 잘리지 않게 한다.
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
        portal
        ariaLabel="일정 종류"
        options={KIND_OPTIONS}
        value={kind}
        onChange={(next) => handleKindChange(String(next) as ScheduleKind)}
      />

      {value?.kind === "exact" && (
        <div className="flex gap-2">
          <AppDatePicker
            size="sm"
            placeholder="일자"
            ariaLabel="일자"
            clearable
            portal
            value={splitDateTime(value.at).date}
            onChange={(date) =>
              onChange(
                date
                  ? { ...value, at: joinDateTime(date, splitDateTime(value.at).time) }
                  : // 날짜를 지우면 시각만 남은 "T14:30" 같은 값이 되지 않도록 시각도 함께 비운다
                    { ...value, at: "", hasTime: false },
              )
            }
            className="flex-1 min-w-0"
          />
          <input
            type="time"
            aria-label="시각 (선택)"
            value={splitDateTime(value.at).time}
            // 날짜 없이 시각만 넣으면 "T14:30" 같은 값이 저장되므로 날짜를 고른 뒤에만 입력받는다.
            // 단 예전에 그렇게 저장된 값은 지울 수 있도록 남은 시각이 있으면 열어 둔다
            disabled={!splitDateTime(value.at).date && !splitDateTime(value.at).time}
            onChange={(event) => {
              const { date } = splitDateTime(value.at);
              onChange(
                date
                  ? { ...value, at: joinDateTime(date, event.target.value), hasTime: Boolean(event.target.value) }
                  : // 날짜 없는 예전 시각("T14:30")은 건드리면 지운다 — 날짜 없이 시각만 남기지 않는다
                    { ...value, at: "", hasTime: false },
              );
            }}
            // DS에 시간 입력이 없어 기본 input을 두고, 옆 AppDatePicker(size="sm", 32px)와 높이·테두리를 맞춘다.
            // 너비 128px: 한국어 로캘 표시("오후 03:00" + 시계 아이콘)가 잘리지 않는 최소 폭(125px) 이상
            className="w-32 shrink-0 h-8 px-3 text-sm bg-surface text-text border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      )}

      {value?.kind === "range" && (
        <div className="flex items-center gap-2">
          <AppDatePicker
            size="sm"
            placeholder="시작일"
            ariaLabel="시작일"
            clearable
            portal
            value={value.start}
            onChange={(start) => onChange({ ...value, start })}
            className="flex-1 min-w-0"
          />
          <span className="text-textSecondary">~</span>
          <AppDatePicker
            size="sm"
            placeholder="종료일"
            ariaLabel="종료일"
            clearable
            portal
            value={value.end}
            onChange={(end) => onChange({ ...value, end })}
            className="flex-1 min-w-0"
          />
        </div>
      )}

      {value?.kind === "rough" && (
        <div className="flex gap-2">
          <AppTextInput
            type="number"
            size="sm"
            aria-label="연도"
            value={value.year}
            onChange={(event) => onChange({ ...value, year: Number(event.target.value) })}
            className="w-[90px] shrink-0"
          />
          <AppSelect
            size="sm"
            width="90px"
            portal
            ariaLabel="월"
            options={MONTH_OPTIONS}
            value={value.month}
            onChange={(next) => onChange({ ...value, month: Number(next) })}
          />
          <AppSelect
            size="sm"
            width="110px"
            portal
            ariaLabel="시기"
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
