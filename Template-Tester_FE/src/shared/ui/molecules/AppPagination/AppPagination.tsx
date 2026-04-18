import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import AppSelect from "@/shared/ui/atoms/AppSelect/AppSelect";

interface AppPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  const delta = 2;
  const pages: (number | "...")[] = [];
  const start = Math.max(1, currentPage - delta);
  const end = Math.min(totalPages, currentPage + delta);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("...");
  }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }
  return pages;
}

export default function AppPagination({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}: AppPaginationProps) {
  if (totalPages <= 1 && !onPageSizeChange) return null;

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
      {onPageSizeChange && (
        <div className="flex items-center gap-2 text-xs text-textSecondary sm:absolute sm:left-0">
          <span>페이지당</span>
          <AppSelect
            options={pageSizeOptions.map((n) => ({ value: String(n), label: `${n}개` }))}
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value))}
            width="90px"
            size="sm"
          />
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <AppButton
            variant="outline"
            color="gray"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            이전
          </AppButton>
          {pageNumbers.map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 text-textSecondary text-sm">
                ...
              </span>
            ) : (
              <AppButton
                key={p}
                variant={p === currentPage ? "solid" : "ghost"}
                color="primary"
                size="sm"
                onClick={() => onPageChange(p)}
              >
                {p}
              </AppButton>
            ),
          )}
          <AppButton
            variant="outline"
            color="gray"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            다음
          </AppButton>
        </div>
      )}
    </div>
  );
}
