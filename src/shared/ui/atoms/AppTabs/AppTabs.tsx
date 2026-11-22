import { useLayoutEffect, useRef } from "react";
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
 * value가 items에 없으면(작성 화면 등) DS가 모든 탭을 tabIndex=-1로 그려 키보드로 탭 줄에 못 들어가므로,
 * 그때는 첫 번째 활성 탭이 Tab을 받게 보정한다 (DS에 옵션이 생기면 제거).
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hasSelection = items.some((item) => item.value === value);

  // 매 렌더 뒤 tabIndex를 맞춘다 — 선택이 없으면 첫 활성 탭만 0, 있으면 선택된 탭만 0
  // (DS는 선택 탭만 0으로 그리지만, 앞서 보정한 값이 React 갱신에서 빠질 수 있어 함께 정리한다)
  useLayoutEffect(() => {
    const tabs = Array.from(wrapperRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);
    const firstEnabled = tabs.find((tab) => !tab.disabled);
    for (const tab of tabs) {
      const tabbable = hasSelection ? tab.getAttribute("aria-selected") === "true" : tab === firstEnabled;
      tab.tabIndex = tabbable ? 0 : -1;
    }
  });

  return (
    <div ref={wrapperRef} className={cn("flex items-end gap-2 border-b border-border", className)}>
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
