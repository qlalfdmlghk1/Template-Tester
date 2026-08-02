import { useRef } from "react";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import AppIcon from "@/shared/ui/atoms/AppIcon/AppIcon";
import { cn } from "@/shared/lib/cn";
import { formatSchedule } from "@/entities/job-application/model/schedule";
import { STAGE_LABELS, STAGE_STATUS_LABELS } from "@/entities/job-application/model/stage";
import type { ImportPreviewRow, ResearchPreviewRow } from "../../model/xlsxImport";

interface XlsxImportDialogProps {
  rows: ImportPreviewRow[];
  researchRows: ResearchPreviewRow[];
  includeResearch: boolean;
  onToggleResearch: (checked: boolean) => void;
  selectedIds: Set<string>;
  isReading: boolean;
  isApplying: boolean;
  error: string | null;
  onPickFile: (file: File) => void;
  onToggleRow: (id: string) => void;
  onToggleAll: (ids: string[], checked: boolean) => void;
  onApply: () => void;
  onClose: () => void;
}

/** 행 하나가 담고 있는 전형 상태를 짧게 요약한다 */
function summarizeStages(row: ImportPreviewRow): string {
  const parts: string[] = [];

  for (const [key, entry] of Object.entries(row.stages)) {
    if (entry.status === "PENDING" && !entry.schedule) continue;
    const stageKey = key as keyof typeof STAGE_LABELS;
    const schedule = formatSchedule(entry.schedule);
    const status = entry.status === "PENDING" ? "" : ` ${STAGE_STATUS_LABELS[entry.status]}`;
    parts.push(`${STAGE_LABELS[stageKey]}${schedule ? ` ${schedule}` : ""}${status}`);
  }

  return parts.join(" · ") || "전형 정보 없음";
}

export function XlsxImportDialog({
  rows,
  researchRows,
  includeResearch,
  onToggleResearch,
  selectedIds,
  isReading,
  isApplying,
  error,
  onPickFile,
  onToggleRow,
  onToggleAll,
  onApply,
  onClose,
}: XlsxImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allIds = rows.map((row) => row.id);
  const allChecked = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const warningCount = rows.reduce((sum, row) => sum + row.warnings.length, 0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onPickFile(file);
    // 값을 비워야 같은 파일을 다시 골랐을 때도 change 가 발생한다
    event.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="xlsx-import-title"
        className="relative flex flex-col gap-3 w-full max-w-[560px] md:max-w-[820px] lg:max-w-[1000px] max-h-[90vh] p-5 md:p-6 bg-surface border border-border rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
      >
        <header>
          <h2 id="xlsx-import-title" className="m-0 text-base font-semibold text-text">
            시트에서 가져오기
          </h2>
          <p className="m-0 mt-1 text-sm text-textSecondary">
            구글 시트를 xlsx로 내려받아 올리면 전형 일정과 셀 색상(합격·불합격 등)을 함께 읽습니다.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
          <AppButton
            size="sm"
            variant="outline"
            color="gray"
            loading={isReading}
            onClick={() => fileInputRef.current?.click()}
          >
            xlsx 파일 선택
          </AppButton>

          {rows.length > 0 && (
            <span className="text-sm text-textSecondary">
              {rows.length}건 중 <strong className="text-text">{selectedIds.size}건</strong> 선택
              {warningCount > 0 && ` · 확인 필요 ${warningCount}건`}
            </span>
          )}
        </div>

        {error && (
          <p className="m-0 px-3 py-2 text-sm text-red-800 bg-red-50 border border-red-300 rounded-sm">
            {error}
          </p>
        )}

        {researchRows.length > 0 && (
          <label className="flex items-start gap-2 px-3 py-2 bg-gray-100 rounded-sm cursor-pointer">
            <input
              type="checkbox"
              checked={includeResearch}
              onChange={(event) => onToggleResearch(event.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm text-text">
              기업 조사 내용 {researchRows.length}건도 함께 가져오기
              <span className="block text-xs text-textSecondary">
                직무 설명·자격 요건이 기업에 저장되며, 「기업 조사」 화면에서 볼 수 있습니다.
                이미 등록된 기업이면 조사 내용만 채웁니다.
              </span>
            </span>
          </label>
        )}

        {rows.length > 0 && (
          <div className="flex-1 min-h-0 overflow-auto border border-border rounded-md">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  <th scope="col" className="w-10 px-2 py-2 border-b border-border">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={(event) => onToggleAll(allIds, event.target.checked)}
                      aria-label="전체 선택"
                    />
                  </th>
                  <th scope="col" className="px-2 py-2 text-left font-semibold border-b border-border">
                    기업 / 출처
                  </th>
                  <th scope="col" className="px-2 py-2 text-left font-semibold border-b border-border">
                    반기
                  </th>
                  <th scope="col" className="px-2 py-2 text-left font-semibold border-b border-border">
                    전형
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const checked = selectedIds.has(row.id);

                  return (
                    <tr key={row.id} className={cn(!checked && "opacity-50")}>
                      <td className="px-2 py-2 align-top border-b border-border">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleRow(row.id)}
                          aria-label={`${row.companyName} 가져오기`}
                        />
                      </td>
                      <td className="px-2 py-2 align-top border-b border-border">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-text">{row.companyName}</span>
                          {row.jobTag && (
                            <span className="px-1.5 py-0.5 text-xs bg-gray-100 rounded-sm">
                              {row.jobTag}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-textSecondary">
                          {row.sheetName} {row.rowNumber}행
                        </span>
                      </td>
                      <td className="px-2 py-2 align-top text-textSecondary border-b border-border whitespace-nowrap">
                        {row.halfLabel}
                      </td>
                      <td className="px-2 py-2 align-top border-b border-border">
                        <p className="m-0 text-xs text-textSecondary">{summarizeStages(row)}</p>
                        {row.warnings.map((warning, index) => (
                          <p
                            key={`${row.id}-warning-${index}`}
                            className="m-0 mt-1 flex items-start gap-1 text-xs text-yellow-800"
                          >
                            <AppIcon name="exclamation-triangle" size={12} className="mt-0.5 shrink-0" />
                            {warning}
                          </p>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <footer className="flex justify-end gap-2">
          <AppButton variant="outline" color="gray" size="sm" onClick={onClose}>
            닫기
          </AppButton>
          <AppButton
            size="sm"
            loading={isApplying}
            disabled={selectedIds.size === 0 && !(includeResearch && researchRows.length > 0)}
            onClick={onApply}
          >
            선택한 {selectedIds.size}건 가져오기
          </AppButton>
        </footer>
      </div>
    </div>
  );
}
