import { type ReactNode } from "react";
import AppButton from "../../atoms/AppButton/AppButton";
import AppIcon from "../../atoms/AppIcon/AppIcon";

export type FallbackType = "error" | "empty";

export interface AppFallbackProps {
  /** Fallback 타입 */
  type: FallbackType;
  /** 제목 (기본값: 타입별 기본 텍스트) */
  title?: string;
  /** 설명 (기본값: 타입별 기본 텍스트) */
  description?: string;
  /** 버튼 텍스트 (기본값: 타입별 기본 텍스트) */
  buttonText?: string;
  /** 버튼 아이콘 (기본: arrow-path, null로 아이콘 숨김) */
  buttonIcon?: ReactNode | null;
  /** 버튼 숨김 여부 */
  hideButton?: boolean;
  /** 버튼 클릭 시 콜백 */
  onAction?: () => void;
}

const defaults: Record<FallbackType, { icon: string; title: string; description: string; buttonText: string }> = {
  error: {
    icon: "exclamation-triangle",
    title: "데이터를 불러오는 중 문제가 발생했습니다.",
    description: "새로고침 하거나 다시 시도해 주세요.",
    buttonText: "재시도",
  },
  empty: {
    icon: "exclamation-circle",
    title: "검색 결과가 없습니다.",
    description: "검색 조건 변경 후 다시 시도해 주세요.",
    buttonText: "검색 조건 초기화",
  },
};

const defaultButtonIcon = <AppIcon name="arrow-path" size={16} />;

export default function AppFallback({
  type,
  title,
  description,
  buttonText,
  buttonIcon,
  hideButton = false,
  onAction,
}: AppFallbackProps) {
  const d = defaults[type];
  const displayTitle = title ?? d.title;
  const displayDescription = description ?? d.description;
  const displayButtonText = buttonText ?? d.buttonText;
  const displayIcon = buttonIcon === undefined ? defaultButtonIcon : (buttonIcon ?? undefined);

  return (
    <div
      className="flex flex-col items-center justify-center px-6 py-12 bg-gray-100 rounded-md text-center"
      role="status"
    >
      <div className="text-gray-800 mb-4">
        <AppIcon name={d.icon} size={40} />
      </div>
      <p className="m-0 mb-2 text-base font-semibold text-gray-700">{displayTitle}</p>
      <p className="m-0 text-sm leading-[140%] text-gray-500">{displayDescription}</p>
      {!hideButton && (
        <AppButton className="mt-6" variant="outline" color="gray" size="sm" iconLeft={displayIcon} onClick={onAction}>
          {displayButtonText}
        </AppButton>
      )}
    </div>
  );
}
