import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/model/useAuth";
import { logout } from "@/features/auth/api/auth.api";
import { usePendingRequestCount } from "@/entities/friend/model/usePendingRequestCount";
import { useTheme } from "@/shared/lib/useTheme";
import NavMenu from "./NavMenu";

export default function Navbar() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { pendingRequestCount } = usePendingRequestCount(!!user);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃에 실패했습니다.");
    }
    setIsDropdownOpen(false);
  };

  const handleMyTemplates = () => {
    navigate("/templates/my");
    setIsDropdownOpen(false);
  };

  const handleFriends = () => {
    navigate("/friends");
    setIsDropdownOpen(false);
  };

  return (
    <nav className="bg-surface border-b border-border sticky top-0 z-[1000]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex w-full justify-between items-center gap-6">
          <div onClick={() => navigate("/")} className="flex items-center gap-2 shrink-0 cursor-pointer">
            {/* 모바일은 가로 공간이 빠듯해 로고 아이콘을 숨기고 서비스명 텍스트만 남긴다 */}
            <img
              src="/template-tester.svg"
              alt="템플릿 테스터 로고"
              className="hidden sm:block w-8 h-8 shrink-0"
              style={{ filter: isDark ? "invert(1)" : undefined }}
            />
            <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-primary leading-tight">
              <span className="hidden sm:inline whitespace-nowrap">템플릿 테스터</span>
              <span className="sm:hidden flex flex-col">
                <span>템플릿</span>
                <span>테스터</span>
              </span>
            </span>
          </div>
          <NavMenu />
        </div>
        <div className="flex items-center gap-0 sm:gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-textSecondary hover:bg-blue-50 transition-colors"
            aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
          {user && (
            <div className="flex items-center pl-2 sm:pl-4 border-l border-border relative" ref={dropdownRef}>
              <div
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity relative"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full"
                  />
                )}
                {!isDropdownOpen && pendingRequestCount > 0 && (
                  <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                    {pendingRequestCount}
                  </span>
                )}
                <span className="hidden sm:block text-xs sm:text-sm text-textSecondary max-w-[100px] truncate">
                  {user.displayName || user.email}
                </span>
                <svg className="w-4 h-4 text-textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 bg-surface rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-border py-1 px-2 z-50 min-w-[120px] whitespace-nowrap">
                  <button
                    onClick={handleMyTemplates}
                    className="w-full px-3 py-2.5 text-left text-sm text-text hover:bg-blue-50 transition-colors rounded-md"
                  >
                    내 템플릿
                  </button>
                  <button
                    onClick={handleFriends}
                    className="w-full px-3 py-2.5 text-left text-sm text-text hover:bg-blue-50 transition-colors rounded-md flex items-center justify-between gap-2"
                  >
                    <span>친구</span>
                    {pendingRequestCount > 0 && (
                      <span className="bg-red-500 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                        {pendingRequestCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2.5 text-left text-sm text-text hover:bg-blue-50 transition-colors rounded-md"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
