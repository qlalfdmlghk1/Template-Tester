import { AppSwitch } from "@choi/ds";

export type AppSwitchSize = "sm" | "md";

export interface AppSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** 스위치 왼쪽에 붙는 라벨. 누르면 함께 토글된다 */
  label?: string;
  disabled?: boolean;
  size?: AppSwitchSize;
  id?: string;
}

/**
 * 켜고 끄는 상태를 즉시 반영하는 토글 — DS `AppSwitch` 어댑터.
 *
 * 체크박스와 달리 "제출해야 적용되는 선택"이 아니라 "지금 켜져 있는 상태"를 나타낸다.
 * 목록 필터처럼 누르는 즉시 결과가 바뀌는 곳에 쓴다.
 */
function AppSwitchAdapter({
  checked,
  onChange,
  label,
  disabled = false,
  size = "md",
  id,
}: AppSwitchProps) {
  return (
    <AppSwitch
      id={id}
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      label={label}
      disabled={disabled}
      size={size}
    />
  );
}

AppSwitchAdapter.displayName = "AppSwitch";

export default AppSwitchAdapter;
