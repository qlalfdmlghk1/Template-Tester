import type { Category } from "../types";

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
  return (
    <nav className="bg-surface border-b border-border sticky top-0 z-[1000]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-primary whitespace-nowrap">템플릿 테스터</span>
        </div>
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
      </div>
    </nav>
  );
}
