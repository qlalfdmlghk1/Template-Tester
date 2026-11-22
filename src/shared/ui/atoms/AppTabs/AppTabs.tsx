import { AppTabs } from "@choi/ds";
import { cn } from "@/shared/lib/cn";
import type { ReactNode } from "react";

export interface AppTabItem<T extends string = string> {
  value: T;
  label: ReactNode;
  /** 탭 이름 옆 숫자 배지 */
  count?: number | string;
  disabled?: boolean;
}

export interface AppTabsProps<T extends string = string> {
  items: AppTabItem<T>[];
  /** 지금 탭. items에 없는 값(작성 화면 등)이면 선택된 탭이 없다 */
  value: T | string;
  onChange: (value: T) => void;
  /** 탭 목록의 스크린리더 이름 (예: "오답노트 보기") */
  ariaLabel?: string;
  /** 탭 줄 오른쪽 끝에 붙는 버튼 등 (예: "+ 작성") */
  actions?: ReactNode;
  className?: string;
}

/**
 * 밑줄 탭 — DS `AppTabs`(line) 어댑터. 탭 목록만 그리고 패널은 화면이 그린다.
 * 방향키·Home·End로 탭을 옮기고, 지금 탭만 Tab 키로 들어간다.
 * 밑줄 선은 actions까지 이어지도록 래퍼가 그리고 DS 목록의 선은 끈다 (index.css `.app-tabs`).
 */
function AppTabsAdapter<T extends string = string>({
  items,
  value,
  onChange,
  ariaLabel,
  actions,
  className,
}: AppTabsProps<T>) {
  return (
    <div className={cn("flex items-end gap-2 border-b border-border", className)}>
      <AppTabs
        variant="line"
        className="app-tabs min-w-0"
        items={items}
        value={value}
        // DS는 string으로 돌려주지만 items의 value만 오므로 T로 좁혀도 안전하다
        onChange={(next) => onChange(next as T)}
        label={ariaLabel}
      />
      {actions && <div className="ml-auto pb-2 shrink-0">{actions}</div>}
    </div>
  );
}

AppTabsAdapter.displayName = "AppTabs";

export default AppTabsAdapter;
