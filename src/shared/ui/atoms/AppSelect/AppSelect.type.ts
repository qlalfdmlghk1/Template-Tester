export type SelectValue = string | number;

export interface SelectOption {
  value: SelectValue;
  label: string;
  disabled?: boolean;
}

export type SelectSize = "sm" | "md" | "lg";
export type SelectState = "default" | "error";

export interface AppSelectProps {
  /** 선택 옵션 목록 */
  options: SelectOption[];
  /** 현재 선택된 값 (controlled) */
  value?: SelectValue | SelectValue[];
  /** 값 변경 핸들러 - 직접 값 전달 */
  onChange?: (value: SelectValue | SelectValue[]) => void;
  /** 셀렉트 크기 */
  size?: SelectSize;
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 시각적 상태 */
  state?: SelectState;
  /** 다중 선택 모드 */
  multiple?: boolean;
  /** 다중 선택 시 "전체 선택" 옵션 표시 여부 */
  showSelectAll?: boolean;
  /** 셀렉트 너비 (예: "200px", "100%") */
  width?: string;
  /** 전체 너비 모드 */
  fullWidth?: boolean;
  /** 하단 힌트 텍스트 (error 상태일 때만 표시) */
  hint?: string;
  /** HTML id 속성 */
  id?: string;
  /** aria-describedby 참조 */
  ariaDescribedby?: string;
  /** 추가 CSS 클래스 */
  className?: string;
}
