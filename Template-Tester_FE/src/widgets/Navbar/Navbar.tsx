import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/model/useAuth";
import { logout } from "@/features/auth/api/auth.api";
import { getReceivedFriendRequests } from "@/entities/friend/api/friend.api";
import { useTheme } from "@/shared/lib/useTheme";

const menuItems = [
  { path: "/", label: "템플릿" },
  { path: "/wrong-notes", label: "오답노트" },
  { path: "/friends", label: "친구" },
];

export default function Navbar() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const loadPendingRequests = async () => {
      try {
        const requests = await getReceivedFriendRequests();
        setPendingRequestCount(requests.length);
      } catch (error) {
        console.error("친구 요청 수 로드 실패:", error);
      }
    };

    loadPendingRequests();
    const interval = setInterval(loadPendingRequests, 30000);
    return () => clearInterval(interval);
  }, [user]);

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
    navigate("/my-templates");
    setIsDropdownOpen(false);
  };

  return (
    <nav className="bg-surface border-b border-border sticky top-0 z-[1000]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex w-full justify-between items-center gap-6">
          <span
            onClick={() => navigate("/")}
            className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-primary whitespace-nowrap cursor-pointer"
          >
            템플릿 테스터
          </span>
          <div className="flex gap-1 sm:gap-2 mr-2 sm:mr-4">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 border-none bg-transparent text-xs sm:text-sm md:text-base font-medium cursor-pointer rounded-md transition-all duration-200 relative ${
                  location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path))
                    ? "bg-blue-50 text-primary"
                    : "text-textSecondary hover:bg-blue-50"
                }`}
              >
                {item.label}
                {item.path === "/friends" && pendingRequestCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                    {pendingRequestCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
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
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full"
                  />
                )}
                <span className="hidden sm:block text-xs sm:text-sm text-textSecondary max-w-[100px] truncate">
                  {user.displayName || user.email}
                </span>
                <svg className="w-4 h-4 text-textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-border py-1 px-2 z-50 min-w-[120px]">
                  <button
                    onClick={handleMyTemplates}
                    className="w-full px-3 py-2.5 text-left text-sm text-text hover:bg-blue-50 transition-colors rounded-md"
                  >
                    내 템플릿
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
