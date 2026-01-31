import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { logout, getReceivedFriendRequests } from "../firebase/services";

const menuItems = [
  { path: "/", label: "템플릿" },
  { path: "/wrong-notes", label: "오답노트" },
  { path: "/friends", label: "친구" },
];

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 친구 요청 수 가져오기
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
    // 30초마다 새로고침
    const interval = setInterval(loadPendingRequests, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // 드롭다운 외부 클릭 감지
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
          <div className="flex gap-1 sm:gap-2">
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
          {user && (
            <div
              className="flex items-center ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-border relative"
              ref={dropdownRef}
            >
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

              {/* 드롭다운 메뉴 */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.1)] py-1 px-2 z-50 min-w-[120px]">
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
