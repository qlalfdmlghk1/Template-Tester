// DS AppChip(누르는 선택형 칩) — 앱 atoms/AppChip(DS AppBadge 기반 표시용 배지)과 다른 컴포넌트다
import { AppChip } from "@choi/ds";

interface ToggleOption {
  value: string;
  label: string;
}

interface ToggleButtonGroupProps {
  options: ToggleOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  /** 묶음 이름이 되는 바깥 라벨 요소의 id */
  ariaLabelledby?: string;
  /** 화면 라벨이 없을 때 스크린리더가 읽을 묶음 이름 */
  ariaLabel?: string;
}

/**
 * 알약 모양 토글 묶음 — DS `AppChip`(선택형 칩) 기반.
 * 단일 선택은 같은 칩을 다시 누르면 해제되고, multiple이면 여러 개를 켜고 끈다.
 * 각 칩은 aria-pressed로 켜짐 상태를 알리고, 묶음은 role="group"으로 이름을 받는다.
 */
export default function ToggleButtonGroup({
  options,
  value,
  onChange,
  multiple = false,
  ariaLabelledby,
  ariaLabel,
}: ToggleButtonGroupProps) {
  const isSelected = (optionValue: string) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  const handleClick = (optionValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(value === optionValue ? "" : optionValue);
    }
  };

  return (
    <div role="group" aria-labelledby={ariaLabelledby} aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <AppChip key={option.value} selected={isSelected(option.value)} onClick={() => handleClick(option.value)}>
          {option.label}
        </AppChip>
      ))}
    </div>
  );
}
