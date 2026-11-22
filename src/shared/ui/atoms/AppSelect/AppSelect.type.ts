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
  /** 시각적 상태. error는 hint가 있어야 표시된다 */
  state?: SelectState;
  /** 다중 선택 모드 */
  multiple?: boolean;
  /** 셀렉트 너비 (예: "200px", "100%") */
  width?: string;
  /** 전체 너비 모드 */
  fullWidth?: boolean;
  /** 하단 에러 문구 (state가 error일 때만 표시) */
  hint?: string;
  /** HTML id 속성 */
  id?: string;
  /** 화면에 라벨이 없을 때 스크린리더가 읽을 이름 (예: "플랫폼"). 트리거는 "이름, 현재 값"으로 읽힌다 */
  ariaLabel?: string;
  /** 이름이 되는 바깥 라벨 요소의 id. ariaLabel보다 우선 — DS 트리거는 버튼이라 `<label htmlFor>`로는 이름이 붙지 않는다 */
  ariaLabelledby?: string;
  /** 목록을 document.body에 띄운다. 모달 본문처럼 스크롤되는 영역 안에서 목록이 잘릴 때 켠다 */
  portal?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}
