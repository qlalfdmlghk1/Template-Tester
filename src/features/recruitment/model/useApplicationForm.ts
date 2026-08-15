import { useState } from "react";
import { POSTING_FIELDS } from "@/entities/job-application/model/application.type";
import type {
  JobApplication,
  PostingField,
} from "@/entities/job-application/model/application.type";
import { mergePostingSchedules } from "@/entities/job-application/model/posting";
import { formatHalfId, getDraftHalfId } from "@/entities/job-application/model/half";
import type { PostingScheduleDraft } from "@/entities/job-application/model/postingSchedule";
import type { PostingImage } from "@/entities/job-application/api/posting.api";
import { createEmptyStages } from "@/entities/job-application/model/stage";
import type { JobTag } from "@/entities/job-application/model/stage";
import type { Company } from "@/entities/company/model/company.type";
import { useJobPostingExtract } from "./useJobPostingExtract";

/** 폼이 모아서 넘기는 값 — 기업은 기존 선택 또는 신규 등록 둘 중 하나다 */
export interface ApplicationFormValue {
  companyId: string | null;
  newCompany: { name: string; postingUrl?: string; location?: string } | null;
  postingTitle: string;
  /** 이 공고의 링크 — 기업이 아니라 지원 건에 붙는다 */
  postingUrl?: string;
  jobTag: JobTag;
  headcount: number | null;
  notAppliedReason?: string;
  memo?: string;

  // ── 공고 추출로 채운 값 ──────────────────────────────
  jobDescription?: string;
  requirements?: string;
  preferredQualifications?: string;
  extractedAt?: Date;
  /** 공고에서 뽑은 전형 일정을 반영한 단계 맵. 추출을 돌렸을 때만 값이 있다 */
  stages?: JobApplication["stages"];
}

const NEW_COMPANY_VALUE = "__new__";

interface UseApplicationFormOptions {
  /** 수정 대상. null 이면 신규 등록 */
  application: JobApplication | null;
  companies: Company[];
  /** 공고에 연도가 없을 때 채울 기준 연도 */
  referenceYear: number;
}

/**
 * 지원 건 등록·수정 폼 상태.
 *
 * 폼 필드가 많고 공고 추출까지 붙어 컴포넌트에 로직이 쌓이므로 여기로 분리한다
 * (컨벤션: 컴포넌트는 표현·렌더링만, 로직은 model 커스텀 훅).
 */
export function useApplicationForm({
  application,
  companies,
  referenceYear,
}: UseApplicationFormOptions) {
  const isEdit = application !== null;

  const [companyId, setCompanyId] = useState<string>(
    application?.companyId ?? companies[0]?.id ?? NEW_COMPANY_VALUE,
  );
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");

  const [postingTitle, setPostingTitle] = useState(application?.postingTitle ?? "");
  const [postingUrl, setPostingUrl] = useState(application?.postingUrl ?? "");
  const [jobTag, setJobTag] = useState<JobTag>(application?.jobTag ?? "IT");
  // 빈 문자열은 "미정"을 뜻한다 — 공고에 "00명"처럼 인원이 없는 경우가 있다
  const [headcount, setHeadcount] = useState(
    application?.headcount === null || application?.headcount === undefined
      ? ""
      : String(application.headcount),
  );
  const [notAppliedReason, setNotAppliedReason] = useState(
    application?.notAppliedReason ?? "",
  );
  const [memo, setMemo] = useState(application?.memo ?? "");

  // ── 공고 추출 ────────────────────────────────────────
  const [posting, setPosting] = useState<Record<PostingField, string>>({
    jobDescription: application?.jobDescription ?? "",
    requirements: application?.requirements ?? "",
    preferredQualifications: application?.preferredQualifications ?? "",
  });
  const [extractedAt, setExtractedAt] = useState(application?.extractedAt);
  const [schedules, setSchedules] = useState<PostingScheduleDraft[]>([]);
  const [pasteOpen, setPasteOpen] = useState(false);

  const extract = useJobPostingExtract({ application, referenceYear });

  const selectedCompanyName =
    companies.find((company) => company.id === companyId)?.name ?? companyName.trim();

  const isNewCompany = !isEdit && companyId === NEW_COMPANY_VALUE;
  const canSubmit = isNewCompany
    ? companyName.trim().length > 0
    : companyId !== NEW_COMPANY_VALUE;

  const setPostingField = (field: PostingField, value: string) =>
    setPosting((current) => ({ ...current, [field]: value }));

  /**
   * 추출 결과를 폼에 채운다.
   *
   * 항목별 체크 단계를 두지 않는다 — 저장 전이라 폼 자체가 미리보기이고,
   * 값이 마음에 안 들면 그 자리에서 고치거나 지우면 된다.
   *
   * **사용자가 이미 적어 둔 칸은 덮지 않는다.** 한 번의 실행으로 직접 쓴 내용을
   * 통째로 날려버리지 않기 위해서다.
   */
  const runExtract = async (source?: {
    pastedText?: string;
    images?: PostingImage[];
  }) => {
    const outcome = await extract.run({
      url: source ? undefined : postingUrl.trim() || undefined,
      ...source,
      companyName: selectedCompanyName || undefined,
      postingTitle: postingTitle.trim() || undefined,
    });
    if (!outcome) return;

    const { result, scheduleDrafts } = outcome;

    const applied = POSTING_FIELDS.filter(
      (field) => result[field]?.trim() && !posting[field].trim(),
    );

    if (applied.length > 0) {
      setPosting((current) => ({
        ...current,
        ...Object.fromEntries(
          applied.map((field) => [field, result[field]?.trim() ?? ""]),
        ),
      }));
      setExtractedAt(new Date());
    }

    setSchedules(scheduleDrafts);
    setPasteOpen(false);
    // 결과는 폼으로 옮겼으므로 훅의 미리보기 상태는 비운다
    extract.dismiss();
  };

  const removeSchedule = (draft: PostingScheduleDraft) =>
    setSchedules((current) => current.filter((item) => item.stage !== draft.stage));

  /**
   * 공고명을 비워 둔 채 저장하면 그 건이 귀속될 반기 이름을 대신 넣는다 (예: "2026 하반기").
   *
   * 같은 기업에 여러 번 지원하면 목록에서 서로 구분되지 않는데, 실제로 가장 자주 적는
   * 구분이 반기다. 빈 값을 그대로 두는 대신 그 값을 채워 준다.
   */
  const defaultPostingTitle = (stages?: JobApplication["stages"]) =>
    formatHalfId(getDraftHalfId(stages ?? application?.stages ?? null, application));

  /** 저장 버튼이 넘길 값 */
  const buildValue = (): ApplicationFormValue => {
    // 일정은 단계 맵으로 옮겨 담는다. 기존 건이면 손대지 않은 칸에만 들어간다
    const stages = schedules.length
      ? mergePostingSchedules(
          application ?? { stages: createEmptyStages() },
          schedules,
          schedules.map((draft) => draft.stage),
        ).stages
      : undefined;

    return {
      companyId: isNewCompany ? null : companyId,
      newCompany: isNewCompany
        ? {
            name: companyName.trim(),
            // 새 기업의 대표 링크는 이 공고 링크로 시작한다 — 기업 조사 화면에서도 바로 열 수 있게
            postingUrl: postingUrl.trim() || undefined,
            location: location.trim() || undefined,
          }
        : null,
      postingTitle: postingTitle.trim() || defaultPostingTitle(stages),
      postingUrl: postingUrl.trim() || undefined,
      jobTag,
      headcount: headcount.trim() === "" ? null : Number(headcount),
      notAppliedReason: notAppliedReason.trim() || undefined,
      memo: memo.trim() || undefined,

      jobDescription: posting.jobDescription.trim() || undefined,
      requirements: posting.requirements.trim() || undefined,
      preferredQualifications: posting.preferredQualifications.trim() || undefined,
      extractedAt,
      stages,
    };
  };

  return {
    isEdit,
    isNewCompany,
    canSubmit,
    newCompanyValue: NEW_COMPANY_VALUE,
    selectedCompanyName,

    companyId,
    setCompanyId,
    companyName,
    setCompanyName,
    location,
    setLocation,
    postingTitle,
    setPostingTitle,
    postingUrl,
    setPostingUrl,
    jobTag,
    setJobTag,
    headcount,
    setHeadcount,
    notAppliedReason,
    setNotAppliedReason,
    memo,
    setMemo,

    posting,
    setPostingField,
    extractedAt,
    schedules,
    removeSchedule,
    pasteOpen,
    setPasteOpen,

    extract,
    runExtract,
    buildValue,
  };
}
