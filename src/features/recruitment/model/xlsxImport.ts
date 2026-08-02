/**
 * xlsx 파일을 읽어 임포트 후보 행으로 만든다.
 *
 * exceljs 는 번들이 크므로 임포트 다이얼로그를 열 때만 동적으로 불러온다.
 * SheetJS 커뮤니티 버전은 셀 배경색 읽기를 지원하지 않아 쓸 수 없다 —
 * 이 시트는 상태가 색으로만 표현돼 있어 색을 못 읽으면 임포트 자체가 성립하지 않는다.
 */

import { createEmptyStages, STAGE_KEYS } from "@/entities/job-application/model/stage";
import {
  UNASSIGNED_HALF_ID,
  formatHalfId,
  getHalfOfDate,
  toHalfId,
} from "@/entities/job-application/model/half";
import { getScheduleAnchor } from "@/entities/job-application/model/schedule";
import {
  buildColumnMap,
  buildResearchColumnMap,
  isResearchSheet,
  mapFillToStatus,
  parseHeadcount,
  parseJobTag,
  parseScheduleText,
} from "./xlsxParse";
import type { HalfId } from "@/entities/job-application/model/half";
import type { JobTag, StageKey } from "@/entities/job-application/model/stage";
import type { StageEntry } from "@/entities/job-application/model/application.type";
import type { ResearchColumn } from "./xlsxParse";

export interface ImportPreviewRow {
  /** 시트명 + 행번호 조합 — 미리보기 선택 키 */
  id: string;
  sheetName: string;
  rowNumber: number;
  companyName: string;
  /** 기업명 셀에 걸린 하이퍼링크 — 시트에서 공고 링크를 이렇게 보관하고 있었다 */
  postingUrl?: string;
  jobTag: JobTag | null;
  headcount: number | null;
  location?: string;
  notAppliedReason?: string;
  stages: Record<StageKey, StageEntry>;
  /** 자소서 일정에서 파생한 반기 */
  halfId: HalfId;
  /** 위 반기의 표시값 */
  halfLabel: string;
  /** 사용자에게 알려야 할 사항 (읽지 못한 값 등) */
  warnings: string[];
}

/** "채용 정보" 시트 한 줄 — 지원 여부와 무관한 사전 조사 기록 */
export interface ResearchPreviewRow {
  id: string;
  sheetName: string;
  rowNumber: number;
  companyName: string;
  targetJob?: string;
  jobDescription?: string;
  requirements?: string;
}

export interface ImportPreview {
  rows: ImportPreviewRow[];
  researchRows: ResearchPreviewRow[];
  sheetNames: string[];
}

/**
 * exceljs 의 셀 값에서 표시 문자열을 뽑는다.
 *
 * 하이퍼링크 셀은 `{ text, hyperlink }` 형태인데, 이 `text` 가 다시 서식 있는 문자열
 * (`{ richText: [...] }`)이나 Date 일 수 있다. 한 겹만 벗기면 "[object Object]" 가 되므로
 * 안쪽 값을 같은 규칙으로 재귀 처리한다.
 */
export function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value instanceof Date) return "";

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.richText)) {
      return record.richText
        .map((part) => String((part as { text?: string }).text ?? ""))
        .join("")
        .trim();
    }
    if ("text" in record) return cellText(record.text);
    if ("result" in record) return cellText(record.result);
    if ("hyperlink" in record) return String(record.hyperlink ?? "").trim();
  }

  return "";
}

/** 셀에 걸린 하이퍼링크 주소 */
function cellHyperlink(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const link = (value as { hyperlink?: unknown }).hyperlink;
  return typeof link === "string" && link.trim() ? link.trim() : null;
}

/** 날짜 셀. 수식 결과이거나 링크가 걸린 날짜일 수도 있어 한 겹 안쪽까지 본다 */
export function cellDate(value: unknown): Date | null {
  if (value instanceof Date) return value;

  if (typeof value === "object" && value !== null) {
    const record = value as { result?: unknown; text?: unknown };
    if (record.result instanceof Date) return record.result;
    if (record.text instanceof Date) return record.text;
  }

  return null;
}

/** 셀 배경색 ARGB — 채우기가 없으면 null */
function cellFill(cell: { fill?: unknown }): string | null {
  const fill = cell.fill as
    | { type?: string; pattern?: string; fgColor?: { argb?: string } }
    | undefined;

  if (!fill || fill.type !== "pattern" || fill.pattern !== "solid") return null;
  return fill.fgColor?.argb ?? null;
}

function toIsoLocal(date: Date, withTime: boolean): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return withTime ? `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}` : day;
}

interface RawCell {
  text: string;
  date: Date | null;
  fill: string | null;
  hyperlink: string | null;
}

/** 시트에서 헤더 행 번호를 찾는다 — 시트마다 위쪽 여백·집계 행 수가 달라 고정할 수 없다 */
function findHeaderRow(rows: RawCell[][]): number {
  return rows.findIndex((cells) =>
    cells.some((cell) => cell.text === "기업명" || cell.text === "자소서"),
  );
}

/** 시트의 기준 연도 — 날짜 셀들이 가리키는 연도 중 가장 많은 것 */
function detectBaseYear(rows: RawCell[][]): number {
  const counts = new Map<number, number>();

  for (const cells of rows) {
    for (const cell of cells) {
      if (!cell.date) continue;
      const year = cell.date.getFullYear();
      counts.set(year, (counts.get(year) ?? 0) + 1);
    }
  }

  let best = new Date().getFullYear();
  let bestCount = 0;
  for (const [year, count] of counts) {
    if (count > bestCount) {
      best = year;
      bestCount = count;
    }
  }

  return best;
}

function buildRow(
  cells: RawCell[],
  rowNumber: number,
  sheetName: string,
  columnMap: ReturnType<typeof buildColumnMap>,
  sheetYear: number,
): ImportPreviewRow | null {
  const meta: Partial<Record<string, string>> = {};
  let postingUrl: string | null = null;

  for (const [index, key] of columnMap.meta) {
    meta[key] = cells[index]?.text ?? "";
    if (key === "companyName") postingUrl = cells[index]?.hyperlink ?? null;
  }

  const companyName = (meta.companyName ?? "").trim();
  if (!companyName) return null;

  // 같은 행 안의 날짜 셀이 있으면 그 연도를 우선한다 (시트에 여러 해가 섞여 있을 수 있다)
  const rowYear =
    cells.find((cell) => cell.date)?.date?.getFullYear() ?? sheetYear;

  const warnings: string[] = [];
  const stages = createEmptyStages() as Record<StageKey, StageEntry>;

  for (const [index, stageKey] of columnMap.stages) {
    const cell = cells[index];
    if (!cell) continue;

    const status = mapFillToStatus(cell.fill);
    const memoParts: string[] = [];
    let schedule: StageEntry["schedule"] = null;

    if (cell.date) {
      const hasTime = cell.date.getHours() !== 0 || cell.date.getMinutes() !== 0;
      schedule = { kind: "exact", at: toIsoLocal(cell.date, hasTime), hasTime };
    } else if (cell.text) {
      const parsed = parseScheduleText(cell.text, rowYear);
      schedule = parsed.schedule;
      if (parsed.memo) memoParts.push(parsed.memo);
      if (!parsed.schedule) {
        warnings.push(`${cell.text} — 일정 형식을 읽지 못해 메모로 옮겼습니다`);
      }
    }

    stages[stageKey] = {
      status,
      schedule,
      memo: memoParts.length > 0 ? memoParts.join(" / ") : undefined,
    };
  }

  const jobTag = parseJobTag(meta.jobTag);
  if (meta.jobTag && !jobTag) {
    warnings.push(`직무 "${meta.jobTag}" 는 정해진 태그가 아니라 비워둡니다`);
  }

  const anchor = getScheduleAnchor(stages.resume?.schedule ?? null);
  const halfId = anchor ? toHalfId(getHalfOfDate(anchor)) : UNASSIGNED_HALF_ID;

  return {
    id: `${sheetName}:${rowNumber}`,
    sheetName,
    rowNumber,
    companyName,
    postingUrl: postingUrl ?? undefined,
    jobTag,
    headcount: parseHeadcount(meta.headcount),
    location: meta.location || undefined,
    notAppliedReason: meta.notAppliedReason || undefined,
    stages,
    halfId,
    halfLabel: formatHalfId(halfId),
    warnings,
  };
}

/** 파일을 읽어 미리보기 행 목록을 만든다 */
export async function readImportPreview(file: File): Promise<ImportPreview> {
  const ExcelJS = (await import("exceljs")).default;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const rows: ImportPreviewRow[] = [];
  const researchRows: ResearchPreviewRow[] = [];
  const sheetNames: string[] = [];

  workbook.eachSheet((worksheet) => {
    const rawRows: RawCell[][] = [];

    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const cells: RawCell[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cells[colNumber - 1] = {
          text: cellText(cell.value),
          date: cellDate(cell.value),
          fill: cellFill(cell),
          hyperlink: cellHyperlink(cell.value),
        };
      });
      rawRows.push(cells);
    });

    const headerIndex = findHeaderRow(rawRows);
    if (headerIndex === -1) return;

    const headerTexts = rawRows[headerIndex].map((cell) => cell?.text ?? null);

    // "채용 정보" 시트는 전형 컬럼 없이 직무 설명·자격 요건을 담는다 — 조사 노트로 따로 모은다
    if (isResearchSheet(headerTexts)) {
      const researchMap = buildResearchColumnMap(headerTexts);
      sheetNames.push(worksheet.name);

      rawRows.slice(headerIndex + 1).forEach((cells, offset) => {
        const values: Partial<Record<ResearchColumn, string>> = {};
        for (const [index, key] of researchMap) {
          values[key] = cells[index]?.text ?? "";
        }

        const companyName = (values.companyName ?? "").trim();
        if (!companyName) return;

        researchRows.push({
          id: `${worksheet.name}:${headerIndex + 2 + offset}`,
          sheetName: worksheet.name,
          rowNumber: headerIndex + 2 + offset,
          companyName,
          targetJob: values.targetJob?.trim() || undefined,
          jobDescription: values.jobDescription?.trim() || undefined,
          requirements: values.requirements?.trim() || undefined,
        });
      });

      return;
    }

    const columnMap = buildColumnMap(headerTexts);

    // 전형 컬럼도 조사 컬럼도 없으면 다룰 수 있는 시트가 아니다
    if (columnMap.stages.size === 0) return;

    sheetNames.push(worksheet.name);
    const sheetYear = detectBaseYear(rawRows.slice(headerIndex + 1));

    rawRows.slice(headerIndex + 1).forEach((cells, offset) => {
      const built = buildRow(
        cells,
        headerIndex + 2 + offset,
        worksheet.name,
        columnMap,
        sheetYear,
      );
      if (built) rows.push(built);
    });
  });

  return { rows, researchRows, sheetNames };
}

/** 전형 단계가 하나라도 채워졌는지 — 기업명만 있고 비어 있는 행을 걸러낼 때 쓴다 */
export function hasAnyStageValue(row: ImportPreviewRow): boolean {
  return STAGE_KEYS.some((key) => {
    const entry = row.stages[key];
    return entry.schedule !== null || entry.status !== "PENDING" || Boolean(entry.memo);
  });
}
