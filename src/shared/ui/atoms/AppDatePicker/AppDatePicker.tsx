import { useEffect, useId, useRef, useState } from "react";
import { AppDatepicker as DsDatepicker, AppIconButton as DsIconButton } from "@choi/ds";
import { X } from "lucide-react";
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
  /** 화면에 라벨이 없을 때 스크린리더가 읽을 이름 (예: "시작일"). 트리거는 "이름, 현재 값"으로 읽힌다 */
  ariaLabel?: string;
  /** 이름이 되는 바깥 라벨 요소의 id. ariaLabel보다 우선 — DS 트리거는 버튼이라 `<label htmlFor>`로는 이름이 붙지 않는다 */
  ariaLabelledby?: string;
  /** 값이 있을 때 옆에 지우기 버튼을 둔다. 누르면 onChange("") */
  clearable?: boolean;
  error?: string;
  disabled?: boolean;
  /** 달력을 트리거 오른쪽 끝에 맞춘다 */
  align?: "start" | "end";
  /** 달력을 document.body에 띄운다. 모달 본문처럼 스크롤되는 영역 안에서 달력이 잘릴 때 켠다 */
  portal?: boolean;
  id?: string;
  /** 바깥 래퍼에 붙는다. 기본 w-full이고 너비·배치 클래스로 덮어쓴다 */
  className?: string;
}

/**
 * 날짜 하나를 고르는 입력 — DS `AppDatepicker`(단일 모드) 어댑터.
 * onChange로 받은 값은 value에 반영해야 한다. DS가 빈 값(null)을 비제어로 다뤄, 반영하지 않으면 화면과 상태가 어긋난다.
 * clearable의 지우기 버튼은 트리거 옆에 붙으므로 label prop 대신 바깥 라벨(ariaLabelledby)과 함께 쓴다.
 * 값 형식이 기존 input type="date"와 같은 'YYYY-MM-DD' 문자열이라 저장 데이터는 바뀌지 않는다.
 * 너비는 AppTextInput과 같이 래퍼 div가 받는다.
 */
export default function AppDatePicker({
  value,
  onChange,
  size = "md",
  ariaLabel,
  ariaLabelledby,
  clearable = false,
  disabled,
  id,
  className,
  ...props
}: AppDatePickerProps) {
  // DS는 value가 null·undefined면 비제어로 돌아 마지막으로 고른 날짜를 내부에 들고 있다.
  // 그래서 값이 있다가 비워지면 key를 바꿔 다시 마운트해 빈 칸으로 되돌린다.
  // (빈 값 → 날짜 선택 때는 다시 마운트하지 않아 달력을 닫은 뒤 포커스가 트리거에 남는다)
  const [resetKey, setResetKey] = useState(0);
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    if (prevValue && !value) setResetKey((key) => key + 1);
  }

  // 지우기 버튼이 사라지면 포커스가 body로 빠지므로 날짜 트리거로 옮긴다.
  // DS는 id를 트리거 button에 붙이므로 id로 찾는다. 플래그는 지우기 다음 렌더에서 무조건 내려,
  // 부모가 비우기를 반영하지 않았을 때 나중의 상관없는 비우기에서 포커스를 가져가지 않게 한다.
  const autoId = useId();
  const triggerId = id ?? autoId;
  const focusAfterClear = useRef(false);
  useEffect(() => {
    if (!focusAfterClear.current) return;
    focusAfterClear.current = false;
    if (!value) document.getElementById(triggerId)?.focus();
  });

  const handleClear = () => {
    focusAfterClear.current = true;
    onChange("");
  };

  const showClear = clearable && Boolean(value) && !disabled;

  return (
    <div className={cn("w-full", clearable && "flex items-start gap-1", className)}>
      <DsDatepicker
        key={resetKey}
        mode="single"
        value={value || null}
        // 단일 모드에서는 'YYYY-MM-DD' 문자열만 온다
        onChange={(next) => {
          if (typeof next === "string") onChange(next);
        }}
        id={triggerId}
        size={size}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        fullWidth
        className={clearable ? "flex-1 min-w-0" : undefined}
        {...props}
      />
      {showClear && (
        <DsIconButton
          icon={<X />}
          label={ariaLabel ? `${ariaLabel} 지우기` : "날짜 지우기"}
          size={size}
          tooltip={false}
          onClick={handleClear}
        />
      )}
    </div>
  );
}
