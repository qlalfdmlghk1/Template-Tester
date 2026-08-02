import { useCallback, useState } from "react";
import { createCompany, updateCompany } from "@/entities/company/api/company.api";
import { UNASSIGNED_HALF_ID } from "@/entities/job-application/model/half";
import { createApplication } from "@/entities/job-application/api/application.api";
import { readImportPreview } from "./xlsxImport";
import type { Company } from "@/entities/company/model/company.type";
import type { ImportPreviewRow, ResearchPreviewRow } from "./xlsxImport";

export interface ImportResult {
  created: number;
  failed: number;
  /** 조사 노트를 채운 기업 수 */
  research: number;
}

interface UseXlsxImportOptions {
  /** 이미 등록된 기업 — 같은 이름이면 새로 만들지 않고 재사용한다 */
  companies: Company[];
  onDone: () => Promise<void> | void;
}

/**
 * xlsx 파일 읽기와 선택 행 반영.
 *
 * 반영은 행 단위로 기업을 먼저 확보한 뒤 지원 건을 만든다.
 * 엔티티 훅의 add* 는 호출마다 목록을 다시 읽어 수십 건을 넣을 때 느리므로
 * 여기서는 API를 직접 부르고 끝에 한 번만 갱신한다.
 */
export function useXlsxImport({ companies, onDone }: UseXlsxImportOptions) {
  const [rows, setRows] = useState<ImportPreviewRow[]>([]);
  const [researchRows, setResearchRows] = useState<ResearchPreviewRow[]>([]);
  const [includeResearch, setIncludeResearch] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isReading, setIsReading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readFile = useCallback(async (file: File) => {
    setIsReading(true);
    setError(null);
    try {
      const preview = await readImportPreview(file);
      setRows(preview.rows);
      setResearchRows(preview.researchRows);
      setSelectedIds(new Set(preview.rows.map((row) => row.id)));
    } catch (cause) {
      console.error("xlsx 읽기 실패:", cause);
      setRows([]);
      setResearchRows([]);
      setSelectedIds(new Set());
      setError("파일을 읽지 못했습니다. xlsx 파일이 맞는지 확인해 주세요.");
    } finally {
      setIsReading(false);
    }
  }, []);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (ids: string[], checked: boolean) => {
      setSelectedIds((current) => {
        const next = new Set(current);
        ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
        return next;
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setRows([]);
    setResearchRows([]);
    setIncludeResearch(true);
    setSelectedIds(new Set());
    setError(null);
  }, []);

  const applySelected = useCallback(async (): Promise<ImportResult> => {
    const targets = rows.filter((row) => selectedIds.has(row.id));

    setIsApplying(true);
    let created = 0;
    let failed = 0;
    let research = 0;

    // 같은 기업이 여러 행에 나오므로 이름 → id 를 캐시해 중복 생성을 막는다
    const companyIdByName = new Map(companies.map((company) => [company.name, company.id]));

    try {
      for (const row of targets) {
        try {
          let companyId = companyIdByName.get(row.companyName);

          if (!companyId) {
            companyId = await createCompany({
              name: row.companyName,
              postingUrl: row.postingUrl,
              location: row.location,
            });
            companyIdByName.set(row.companyName, companyId);
          }

          await createApplication({
            companyId,
            // 같은 기업 복수 지원 건을 구분할 단서.
            // 시트명("상반기")에는 연도가 없어 몇 년도 건인지 알 수 없으므로,
            // 자소서 마감일에서 계산한 반기 라벨("2025 상반기")을 쓴다.
            postingTitle:
              row.halfId === UNASSIGNED_HALF_ID ? row.sheetName : row.halfLabel,
            jobTag: row.jobTag ?? "IT",
            headcount: row.headcount,
            notAppliedReason: row.notAppliedReason,
            stages: row.stages,
          });

          created += 1;
        } catch (cause) {
          console.error(`임포트 실패 (${row.sheetName} ${row.rowNumber}행):`, cause);
          failed += 1;
        }
      }

      // 조사 노트는 기업에 붙는다. 이미 있는 기업이면 노트만 채우고, 없으면 새로 만든다.
      if (includeResearch) {
        for (const note of researchRows) {
          try {
            const patch = {
              targetJob: note.targetJob,
              jobDescription: note.jobDescription,
              requirements: note.requirements,
            };

            const existingId = companyIdByName.get(note.companyName);
            if (existingId) {
              await updateCompany(existingId, patch);
            } else {
              const id = await createCompany({ name: note.companyName, ...patch });
              companyIdByName.set(note.companyName, id);
            }

            research += 1;
          } catch (cause) {
            console.error(`조사 노트 임포트 실패 (${note.companyName}):`, cause);
            failed += 1;
          }
        }
      }
    } finally {
      setIsApplying(false);
      await onDone();
    }

    return { created, failed, research };
  }, [rows, selectedIds, companies, researchRows, includeResearch, onDone]);

  return {
    rows,
    researchRows,
    includeResearch,
    setIncludeResearch,
    selectedIds,
    isReading,
    isApplying,
    error,
    readFile,
    toggleRow,
    toggleAll,
    reset,
    applySelected,
  };
}
