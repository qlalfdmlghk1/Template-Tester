import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { navMenu, isNavMenuGroup, isEntryActive, isPathActive, getEntryItems } from "./model/navMenu";

const TRIGGER_CLASS =
  "flex items-center gap-1 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 border-none bg-transparent text-xs sm:text-sm md:text-base font-medium cursor-pointer rounded-md transition-colors duration-200 whitespace-nowrap hover:text-primary";

/** 펼침 패널 컬럼을 트리거 바로 아래 정렬하기 위한 측정값 */
interface ColumnLayout {
  /** <nav> 좌측 끝 기준 트리거 행의 left 오프셋 (px) */
  left: number;
  /** 각 트리거의 너비 (px) — 컬럼 너비로 그대로 사용 */
  widths: number[];
}

export default function NavMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [columnLayout, setColumnLayout] = useState<ColumnLayout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRowRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  // 트리거 행은 헤더의 justify-between 레이아웃 안에 있어 위치가 고정값이 아니다.
  // 패널은 <nav> 전체 폭이므로, 컬럼을 트리거 아래에 맞추려면 실제 위치를 재야 한다.
  useLayoutEffect(() => {
    if (!isExpanded) return;

    const row = triggerRowRef.current;
    const nav = row?.closest("nav");
    if (!row || !nav) return;

    const measure = () => {
      const navRect = nav.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      setColumnLayout({
        left: rowRect.left - navRect.left,
        widths: Array.from(row.children).map((child) => child.getBoundingClientRect().width),
      });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [isExpanded]);

  // 언마운트 시 예약된 닫힘 타이머 정리
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const cancelScheduledClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    cancelScheduledClose();
    setIsExpanded(true);
  };

  // 트리거 행과 패널 사이에는 <nav> 하단 테두리가 있어, 그 위를 지나는 순간
  // mouseleave 가 뜰 수 있다. 짧은 유예를 두어 이동 중 닫히지 않게 한다.
  const handleMouseLeave = () => {
    cancelScheduledClose();
    closeTimerRef.current = setTimeout(() => setIsExpanded(false), 120);
  };

  const handleNavigate = (path: string) => {
    cancelScheduledClose();
    setIsExpanded(false);
    navigate(path);
  };

  return (
    // 펼침 패널은 화면 전체 폭이라 <nav>(sticky) 기준으로 위치를 잡는다.
    // 이 컨테이너에는 position을 주지 않아야 패널의 absolute 기준이 <nav>가 된다.
    <div
      ref={containerRef}
      // py/-my 로 히트 영역을 헤더 세로 패딩만큼 넓혀 <nav> 하단까지 닿게 한다.
      // (그 패딩은 부모 것이라, 없으면 트리거 → 패널로 내려가는 도중 닫힌다)
      className="shrink-0 mr-2 sm:mr-4 py-3 -my-3 sm:py-4 sm:-my-4"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={triggerRowRef} className="flex flex-nowrap gap-1 sm:gap-2">
        {navMenu.map((entry) => {
          const isActive = isEntryActive(entry, location.pathname);
          const isGroup = isNavMenuGroup(entry);

          return (
            <button
              key={entry.id}
              type="button"
              aria-haspopup={isGroup ? "menu" : undefined}
              aria-expanded={isGroup ? isExpanded : undefined}
              onClick={() => (isGroup ? setIsExpanded((prev) => !prev) : handleNavigate(entry.path))}
              className={cn(TRIGGER_CLASS, isActive ? "text-primary" : "text-textSecondary")}
            >
              {entry.label}
              {isGroup && (
                <svg
                  className={cn("w-3 h-3 shrink-0 transition-transform duration-200", isExpanded && "rotate-180")}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {isExpanded && (
        <div
          role="menu"
          className="absolute top-full left-0 right-0 bg-surface border-b border-border shadow-[0_8px_16px_rgba(0,0,0,0.08)]"
        >
          <div className="flex gap-1 sm:gap-2 py-3" style={{ paddingLeft: columnLayout?.left }}>
            {navMenu.map((entry, index) => (
              <div key={entry.id} className="flex flex-col gap-0.5" style={{ width: columnLayout?.widths[index] }}>
                {getEntryItems(entry).map((item) => {
                  const isItemActive = isPathActive(location.pathname, item.path);

                  return (
                    <button
                      key={item.path}
                      type="button"
                      role="menuitem"
                      onClick={() => handleNavigate(item.path)}
                      className={cn(
                        "w-full px-2 sm:px-3 md:px-4 py-2 text-left text-xs sm:text-sm rounded-md transition-colors hover:bg-blue-50",
                        // 준비 중인 메뉴는 별도 라벨 없이 색만 연하게 두어 구분한다
                        isItemActive ? "text-primary font-medium" : item.comingSoon ? "text-gray-400" : "text-text"
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
