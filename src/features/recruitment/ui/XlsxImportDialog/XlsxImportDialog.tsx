import { useRef } from "react";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import AppIcon from "@/shared/ui/atoms/AppIcon/AppIcon";
import { AppCheckbox } from "@/shared/ui/atoms/AppCheckbox";
import { AppModal } from "@/shared/ui/molecules/AppModal";
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
  // 일부만 고르면 전체 선택 상자에 – 표시
  const someChecked = allIds.some((id) => selectedIds.has(id));
  const warningCount = rows.reduce((sum, row) => sum + row.warnings.length, 0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onPickFile(file);
    // 값을 비워야 같은 파일을 다시 골랐을 때도 change 가 발생한다
    event.target.value = "";
  };

  return (
    <AppModal
      size="xl"
      title="시트에서 가져오기"
      description="구글 시트를 xlsx로 내려받아 올리면 전형 일정과 셀 색상(합격·불합격 등)을 함께 읽습니다."
      onClose={onClose}
      footer={
        <>
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
        </>
      }
    >
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
          // DS 모달은 본문 첫 입력에 포커스를 주는데 그게 숨긴 file input이라 포커스가 밖에 남는다 — 이 버튼으로 받는다
          data-autofocus
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
        <AppCheckbox
          checked={includeResearch}
          onChange={(event) => onToggleResearch(event.target.checked)}
          className="w-full px-3 py-2 bg-gray-100 rounded-sm"
          label={`기업 조사 내용 ${researchRows.length}건도 함께 가져오기`}
          description="직무 설명·자격 요건이 기업에 저장되며, 「기업 조사」 화면에서 볼 수 있습니다. 이미 등록된 기업이면 조사 내용만 채웁니다."
        />
      )}

      {rows.length > 0 && (
        <div className="max-h-96 overflow-auto border border-border rounded-md">
          {/* 표 안에서 스크롤해야 머리줄(sticky)이 붙어 있다 — 모달 본문 스크롤에 맡기면 머리줄이 함께 밀려 올라간다 */}
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-gray-100">
              <tr>
                <th scope="col" className="w-10 px-2 py-2 border-b border-border">
                  <AppCheckbox
                    checked={allChecked}
                    indeterminate={!allChecked && someChecked}
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
                      <AppCheckbox
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
    </AppModal>
  );
}
