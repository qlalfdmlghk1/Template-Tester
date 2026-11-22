import { AppRadioGroup } from "@choi/ds";
import type { ReactNode } from "react";

export interface AppRadioOption<T extends string = string> {
  value: T;
  label: ReactNode;
  /** 문구 아래 작은 설명 */
  description?: ReactNode;
  disabled?: boolean;
}

export interface AppRadioGroupProps<T extends string = string> {
  options: AppRadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 그룹 이름(legend). 화면에 따로 라벨이 있으면 비우고 ariaLabel을 준다 */
  label?: string;
  /** 화면 라벨이 그룹 밖에 있을 때 스크린리더가 읽을 그룹 이름 */
  ariaLabel?: string;
  /** 기본 vertical */
  direction?: "vertical" | "horizontal";
  name?: string;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  className?: string;
}

/**
 * 하나만 고르는 선택지 묶음 — DS `AppRadioGroup` 어댑터.
 * fieldset + legend로 묶여 방향키로 선택지를 옮긴다. 값은 문자열 유니온을 그대로 돌려준다.
 * DS가 그룹 aria-label을 받지 않아, 바깥 라벨만 있을 때는 fieldset을 role="group" 래퍼로 감싸 이름을 붙인다.
 */
function AppRadioGroupAdapter<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel,
  ...props
}: AppRadioGroupProps<T>) {
  const group = (
    <AppRadioGroup
      {...props}
      options={options}
      value={value}
      // DS는 string으로 돌려주지만 options의 value만 오므로 T로 좁혀도 안전하다
      onChange={(next) => onChange(next as T)}
    />
  );

  if (!ariaLabel || props.label) return group;
  return (
    <div role="group" aria-label={ariaLabel}>
      {group}
    </div>
  );
}

AppRadioGroupAdapter.displayName = "AppRadioGroup";

export default AppRadioGroupAdapter;
