import { Datepicker } from "@choi/ds";
import { cn } from "@/shared/lib/cn";

export type AppDatePickerSize = "sm" | "md" | "lg";

export interface AppDatePickerProps {
  /** 'YYYY-MM-DD'. 빈 문자열이면 선택 안 됨 (기존 input type="date"와 같은 형식) */
  value: string;
  onChange: (value: string) => void;
  /** 높이. sm 32 · md 40 · lg 48px — AppSelect·AppTextInput과 같은 기준 */
  size?: AppDatePickerSize;
  placeholder?: string;
  /** 고를 수 있는 가장 이른 날짜 ('YYYY-MM-DD') */
  min?: string;
  /** 고를 수 있는 가장 늦은 날짜 ('YYYY-MM-DD') */
  max?: string;
  label?: string;
  /** 화면에 라벨이 없을 때 스크린리더용 이름. DS 트리거가 aria-label을 받지 않아 래퍼(role="group")에 붙인다 */
  ariaLabel?: string;
  error?: string;
  disabled?: boolean;
  /** 달력을 트리거 오른쪽 끝에 맞춘다 */
  align?: "start" | "end";
  id?: string;
  /** 바깥 래퍼에 붙는다. 기본 w-full이고 너비·배치 클래스로 덮어쓴다 */
  className?: string;
}

/**
 * 날짜 하나를 고르는 입력 — DS `Datepicker`(단일 모드) 어댑터.
 * 값 형식이 기존 input type="date"와 같은 'YYYY-MM-DD' 문자열이라 저장 데이터는 바뀌지 않는다.
 * 달력은 portal 없이 트리거 아래에 붙으므로, 스크롤 영역 안에서는 그 영역 안에 그려진다.
 * 너비는 AppTextInput과 같이 래퍼 div가 받는다.
 */
export default function AppDatePicker({
  value,
  onChange,
  size = "md",
  ariaLabel,
  className,
  ...props
}: AppDatePickerProps) {
  return (
    <div
      className={cn("w-full", className)}
      role={ariaLabel ? "group" : undefined}
      aria-label={ariaLabel}
    >
      <Datepicker
        mode="single"
        // undefined면 DS가 비제어로 전환되므로 빈 값은 null로 넘겨 제어 상태를 유지한다
        value={value || null}
        // 단일 모드에서는 'YYYY-MM-DD' 문자열만 온다
        onChange={(next) => {
          if (typeof next === "string") onChange(next);
        }}
        size={size}
        fullWidth
        {...props}
      />
    </div>
  );
}
