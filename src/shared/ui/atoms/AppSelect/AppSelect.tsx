import { MultiSelect, Select } from "@choi/ds";
import { cn } from "@/shared/lib/cn";
import type { AppSelectProps, SelectOption, SelectValue } from "./AppSelect.type";

/** DS는 string value만 받으므로 문자열 키로 바꿔 넘기고, 돌려받을 때 원래 값(number 포함)으로 복원한다 */
function toKey(value: SelectValue): string {
  return String(value);
}

function fromKey(options: SelectOption[], key: string): SelectValue {
  return options.find((option) => toKey(option.value) === key)?.value ?? key;
}

/**
 * 단일·다중 선택 셀렉트 — DS `Select` / `MultiSelect` 어댑터.
 *
 * `width`도 `fullWidth`도 없으면 부모 너비를 채운다 (DS 기본 280px 대신 기존 동작 유지).
 * 드롭다운 목록은 portal 없이 트리거 아래에 붙으므로, 스크롤 영역 안에서는 그 영역 안에 그려진다.
 */
export default function AppSelect({
  options = [],
  value,
  onChange,
  size = "md",
  placeholder = "선택해주세요",
  disabled = false,
  state = "default",
  multiple = false,
  width,
  fullWidth = false,
  hint,
  id,
  className = "",
}: AppSelectProps) {
  const dsOptions = options.map((option) => ({
    value: toKey(option.value),
    label: option.label,
    disabled: option.disabled,
  }));
  // DS는 error 문자열이 있을 때만 에러 스타일과 문구를 함께 그린다
  const error = state === "error" ? hint : undefined;

  const common = {
    id,
    options: dsOptions,
    placeholder,
    size,
    disabled,
    error,
    fullWidth: true,
  };

  return (
    <div
      className={cn("inline-flex", (fullWidth || !width) && "w-full", className)}
      style={width && !fullWidth ? { width, flexShrink: 0 } : undefined}
    >
      {multiple ? (
        <MultiSelect
          {...common}
          // 좁은 필터 칸에서 태그가 넘치지 않도록 하나만 보이고 나머지는 +N
          maxTagCount={1}
          value={Array.isArray(value) ? value.map(toKey) : []}
          onChange={(keys) => onChange?.(keys.map((key) => fromKey(options, key)))}
        />
      ) : (
        <Select
          {...common}
          // undefined면 DS가 비제어로 전환되므로 빈 문자열로 제어 상태를 유지한다
          value={value === undefined || value === null || Array.isArray(value) ? "" : toKey(value)}
          onChange={(key) => onChange?.(fromKey(options, key))}
        />
      )}
    </div>
  );
}
