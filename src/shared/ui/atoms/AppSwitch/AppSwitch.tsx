import { useId } from "react";
import { cn } from "@/shared/lib/cn";

export type AppSwitchSize = "sm" | "md";

export interface AppSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** 스위치 옆에 붙는 라벨. 누르면 함께 토글된다 */
  label?: string;
  disabled?: boolean;
  size?: AppSwitchSize;
  id?: string;
}

const trackSize: Record<AppSwitchSize, string> = {
  sm: "w-8 h-[18px]",
  md: "w-11 h-6",
};

const knobSize: Record<AppSwitchSize, string> = {
  sm: "w-3.5 h-3.5",
  md: "w-5 h-5",
};

const knobShift: Record<AppSwitchSize, string> = {
  sm: "translate-x-[14px]",
  md: "translate-x-5",
};

/**
 * 켜고 끄는 상태를 즉시 반영하는 토글.
 *
 * 체크박스와 달리 "제출해야 적용되는 선택"이 아니라 "지금 켜져 있는 상태"를 나타낸다.
 * 목록 필터처럼 누르는 즉시 결과가 바뀌는 곳에 쓴다.
 */
export default function AppSwitch({
  checked,
  onChange,
  label,
  disabled = false,
  size = "md",
  id: propId,
}: AppSwitchProps) {
  const reactId = useId();
  const id = propId || `app-switch-${reactId}`;
  const labelId = label ? `${id}-label` : undefined;

  const handleToggle = () => {
    if (!disabled) onChange(!checked);
  };

  return (
    <span className={cn("inline-flex items-center gap-2", disabled && "opacity-50")}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          "relative shrink-0 rounded-full border-none p-0 transition-colors duration-200",
          "outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
          trackSize[size],
          checked ? "bg-blue-500" : "bg-gray-300",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1/2 left-0.5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-200",
            knobSize[size],
            checked && knobShift[size],
          )}
        />
      </button>

      {label && (
        <label
          id={labelId}
          htmlFor={id}
          className={cn("text-sm text-text select-none", !disabled && "cursor-pointer")}
        >
          {label}
        </label>
      )}
    </span>
  );
}
