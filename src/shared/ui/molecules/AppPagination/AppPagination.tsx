import { AppPagination } from "@choi/ds";
import AppSelect from "@/shared/ui/atoms/AppSelect/AppSelect";

interface AppPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

function AppPaginationAdapter({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}: AppPaginationProps) {
  if (totalPages <= 1 && !onPageSizeChange) return null;

  return (
    <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
      {onPageSizeChange && (
        <div className="flex items-center gap-2 text-xs text-textSecondary sm:absolute sm:left-0">
          <span>페이지당</span>
          <AppSelect
            ariaLabel="페이지당 개수"
            options={pageSizeOptions.map((n) => ({ value: String(n), label: `${n}개` }))}
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value))}
            width="90px"
            size="sm"
          />
        </div>
      )}

      {totalPages > 1 && (
        <AppPagination
          pageCount={totalPages}
          page={currentPage}
          onChange={onPageChange}
          siblingCount={2}
          size="sm"
        />
      )}
    </div>
  );
}

AppPaginationAdapter.displayName = "AppPagination";

export default AppPaginationAdapter;
