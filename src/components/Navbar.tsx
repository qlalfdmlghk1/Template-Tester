import { useNavigate } from "react-router-dom";
import type { Category } from "../types";
import { useAuth } from "../contexts/useAuth";
import { logout } from "../firebase/services";

interface NavbarProps {
  currentCategory: Category;
  onCategoryChange: (category: Category) => void;
}

const categories: { value: Category; label: string }[] = [
  { value: "algorithm", label: "알고리즘" },
  { value: "english", label: "영어" },
  { value: "cs", label: "CS" },
  { value: "interview", label: "면접 대비" },
];

export default function Navbar({ currentCategory, onCategoryChange }: NavbarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃에 실패했습니다.");
    }
  };

  return (
    <nav className="bg-surface border-b border-border sticky top-0 z-[1000]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center">
          <span
            onClick={() => navigate("/")}
            className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-primary whitespace-nowrap cursor-pointer"
          >
            템플릿 테스터
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex gap-1 sm:gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => onCategoryChange(cat.value)}
                className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 border-none bg-transparent text-xs sm:text-sm md:text-base font-medium cursor-pointer rounded-md transition-all duration-200 ${
                  currentCategory === cat.value ? "bg-blue-50 text-primary" : "text-textSecondary hover:bg-blue-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {user && (
            <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-border">
              <div className="hidden sm:flex items-center gap-2">
                {user.photoURL && (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="w-7 h-7 rounded-full" />
                )}
                <span className="text-xs sm:text-sm text-textSecondary max-w-[100px] truncate">
                  {user.displayName || user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
