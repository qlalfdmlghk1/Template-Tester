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
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-xl font-bold text-primary">템플릿 테스터</span>
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={`px-4 py-2 border-none bg-transparent text-sm font-medium cursor-pointer rounded-md transition-all duration-200 ${
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
