import Button from "@/components/ui/Button";
import SelectBox from "@/components/ui/SelectBox";
import {
  categoryOptions,
  languageOptions,
  platformOptions,
  resultOptions,
  tagOptions,
} from "@/constants/options.constants";
import type { Filters } from "@/types/wrong-notes.types";

interface FriendOption {
  value: string;
  label: string;
}

interface WrongNoteFilterProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;

  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;

  hasActiveFilters: boolean;
  onClearFilters: () => void;

  // 친구탭에서만 필요한 옵션
  friendOptions?: FriendOption[];
  friendFilter?: string;
  setFriendFilter?: (value: string) => void;
}

export default function WrongNoteFilter({
  searchQuery,
  setSearchQuery,
  filters,
  onFilterChange,
  hasActiveFilters,
  onClearFilters,
  friendOptions,
  friendFilter,
  setFriendFilter,
}: WrongNoteFilterProps) {
  const showFriendFilter = friendOptions && setFriendFilter;

  return (
    <div className="flex flex-col mb-4 p-4 bg-surface border border-border rounded-lg gap-4">
      {/* 검색 */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="문제 이름으로 검색..."
          className="w-full px-4 py-2 pl-10 text-sm outline outline-1 outline-border rounded-md bg-surface text-text
            hover:outline-primary focus:outline-primary focus:ring-2 focus:ring-blue-200 transition-all"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* 필터 */}
      <div className="grid grid-cols-5 gap-3">
        {showFriendFilter && (
          <SelectBox
            options={friendOptions}
            value={friendFilter}
            onChange={(e) => setFriendFilter(e.target.value)}
            placeholder="모든 친구"
            selectSize="sm"
          />
        )}

        <SelectBox
          options={platformOptions}
          value={filters.platform}
          onChange={(e) => onFilterChange("platform", e.target.value)}
          placeholder="플랫폼"
          selectSize="sm"
        />

        <SelectBox
          options={categoryOptions}
          value={filters.category}
          onChange={(e) => onFilterChange("category", e.target.value)}
          placeholder="알고리즘"
          selectSize="sm"
        />

        <SelectBox
          options={languageOptions}
          value={filters.language}
          onChange={(e) => onFilterChange("language", e.target.value)}
          placeholder="언어"
          selectSize="sm"
        />

        <SelectBox
          options={resultOptions}
          value={filters.result}
          onChange={(e) => onFilterChange("result", e.target.value)}
          placeholder="결과"
          selectSize="sm"
        />

        <SelectBox
          options={tagOptions}
          value={filters.tag}
          onChange={(e) => onFilterChange("tag", e.target.value)}
          placeholder="작성 이유"
          selectSize="sm"
        />

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            초기화
          </Button>
        )}
      </div>
    </div>
  );
}
