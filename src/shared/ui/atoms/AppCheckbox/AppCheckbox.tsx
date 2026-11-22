import { forwardRef } from "react";
import { AppCheckbox } from "@choi/ds";
import type { InputHTMLAttributes, ReactNode } from "react";

export interface AppCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** 상자 옆 문구. 링크·배지 등 노드도 넣을 수 있다. 비우면 aria-label로 이름을 준다 (표의 행 선택 등) */
  label?: ReactNode;
  /** 문구 아래 작은 설명 */
  description?: ReactNode;
  /** 일부만 선택됨(–) 표시. 전체 선택 체크박스에 쓴다 */
  indeterminate?: boolean;
}

/**
 * 체크박스 — DS `AppCheckbox` 어댑터.
 * checked·onChange(네이티브 change 이벤트)·disabled·id·aria-label 등 input 속성은 그대로 전달된다.
 * 상자와 문구를 label 하나로 감싸 문구를 눌러도 토글된다.
 */
const AppCheckboxAdapter = forwardRef<HTMLInputElement, AppCheckboxProps>(function AppCheckboxAdapter(props, ref) {
  return <AppCheckbox ref={ref} {...props} />;
});

AppCheckboxAdapter.displayName = "AppCheckbox";

export default AppCheckboxAdapter;
